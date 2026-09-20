// npm run assets:build — design/svg_sources.ts 의 벡터 원본을 PNG 로 굽고 규격을 검사해 manifest 를 쓴다.
// 출력: design/svg/*.svg (원본), public/assets/delivery/** (납품 PNG), public/assets/manifest.json (런타임),
//       public/assets/delivery/manifest.json (납품·검사 기록), design/preview/*.png (실제 크기 프리뷰)
import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ASSETS, ICON_SHEET_SVG, TILE_SHEET_SVG, type SvgAsset } from '../design/svg_sources';
import contract from '../shared/asset_contract.json';

const DELIVERY = 'public/assets/delivery';
const SVG_DIR = 'design/svg';
const PREVIEW = 'design/preview';
for (const d of [DELIVERY, SVG_DIR, PREVIEW]) mkdirSync(d, { recursive: true });

interface Check {
  asset: string;
  ok: boolean;
  detail: string;
}
const checks: Check[] = [];
const artifacts: { asset_id: string; clip_id?: string; frame_id?: string; state?: string; relative_path: string; sha256: string; size: [number, number]; pixels?: Buffer; w?: number; h?: number }[] = [];

function render(svgText: string): { png: Buffer; pixels: Buffer; w: number; h: number } {
  const r = new Resvg(svgText, { fitTo: { mode: 'original' } });
  const img = r.render();
  return { png: Buffer.from(img.asPng()), pixels: Buffer.from(img.pixels), w: img.width, h: img.height };
}

function alphaBounds(pixels: Buffer, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** resvg 픽셀은 premultiplied alpha → 원래 색으로 되돌린다 */
function hexOf(pixels: Buffer, i: number): string {
  const a = pixels[i + 3] || 255;
  return '#' + [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => Math.min(255, Math.round((v * 255) / a)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

for (const a of ASSETS) {
  const svgPath = join(SVG_DIR, a.relative_path.replace(/\.png$/, '.svg'));
  mkdirSync(dirname(svgPath), { recursive: true });
  writeFileSync(svgPath, a.svg);
  const { png, pixels, w, h } = render(a.svg);
  const out = join(DELIVERY, a.relative_path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  const sha = createHash('sha256').update(png).digest('hex');
  const label = a.frame ? `${a.asset_id}/${a.clip}/${a.frame}` : a.state ? `${a.asset_id}/${a.state}` : a.asset_id;
  // 규격 검사
  const sizeOk = w === a.size[0] && h === a.size[1];
  checks.push({ asset: label, ok: sizeOk, detail: `canvas ${w}x${h} (expect ${a.size.join('x')})` });
  const b = alphaBounds(pixels, w, h);
  if (a.pivot && a.clip) {
    const footOk = !!b && b.y1 === a.pivot[1];
    checks.push({ asset: label, ok: footOk, detail: `foot bottom y=${b?.y1} (expect ${a.pivot[1]})` });
  }
  if (a.safe && b) {
    const [sx0, sy0, sx1, sy1] = a.safe;
    const inside = b.x0 >= sx0 && b.y0 >= sy0 && b.x1 <= sx1 && b.y1 <= sy1;
    const inCanvas = b.x0 >= 0 && b.y0 >= 0 && b.x1 <= w && b.y1 <= h;
    // 안전영역 밖이라도 캔버스 안이면 경고(브리프: 무기·칼집·머리 끝은 초과 허용)
    checks.push({ asset: label, ok: inCanvas, detail: `opaque bbox ${b.x0},${b.y0}..${b.x1},${b.y1} safe ${a.safe.join(',')}` + (inside ? '' : inCanvas ? ' (warn: 안전영역 초과, 캔버스 안)' : ' (캔버스 밖)') });
  }
  if (a.opaque) {
    let minA = 255;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < minA) minA = pixels[i];
    checks.push({ asset: label, ok: minA === 255, detail: `min alpha ${minA}` });
  }
  if (a.singleColor) {
    const colors = new Set<string>();
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] >= 250) colors.add(hexOf(pixels, i));
    const want = a.singleColor.toUpperCase();
    const near = (c: string) => [1, 3, 5].every((k) => Math.abs(parseInt(c.slice(k, k + 2), 16) - parseInt(want.slice(k, k + 2), 16)) <= 2);
    const ok = colors.size >= 1 && [...colors].every(near);
    checks.push({ asset: label, ok, detail: `colors ${[...colors].join(',')}` });
  }
  artifacts.push({
    asset_id: a.asset_id,
    clip_id: a.clip ? `${a.asset_id}.${a.clip}` : undefined,
    frame_id: a.frame,
    state: a.state,
    relative_path: a.relative_path,
    sha256: sha,
    size: [w, h],
    pixels,
    w,
    h,
  });
}

// idle 두 프레임 외곽 차이 ≤ 2px
for (const id of ['visual.player.body', 'visual.enemy.grunt.body', 'visual.enemy.rapid.body', 'visual.enemy.chaser.body', 'visual.boss.executor.body']) {
  const f1 = artifacts.find((x) => x.asset_id === id && x.frame_id === 'f0001' && x.clip_id?.endsWith('.idle'));
  const f2 = artifacts.find((x) => x.asset_id === id && x.frame_id === 'f0002');
  if (f1 && f2) {
    const b1 = alphaBounds(f1.pixels!, f1.w!, f1.h!)!;
    const b2 = alphaBounds(f2.pixels!, f2.w!, f2.h!)!;
    const d = Math.max(Math.abs(b1.x0 - b2.x0), Math.abs(b1.x1 - b2.x1), Math.abs(b1.y0 - b2.y0), Math.abs(b1.y1 - b2.y1));
    checks.push({ asset: `${id} idle f0001↔f0002`, ok: d <= 2, detail: `outline diff ${d}px` });
  }
}

// 시트 원본
writeFileSync(join(SVG_DIR, 'batch.icons.main.source.svg'), ICON_SHEET_SVG);
writeFileSync(join(SVG_DIR, 'batch.tiles.yard.source.svg'), TILE_SHEET_SVG);

// ───────── 프리뷰 (실제 표시 크기) ─────────
const dataUri = (rel: string) => `data:image/png;base64,${readFileSync(join(DELIVERY, rel)).toString('base64')}`;
const img = (rel: string, x: number, y: number, w: number, h: number) => `<image href="${dataUri(rel)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const svgWrap = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;

// 56px: 바닥 타일 위에 플레이어·잔병·속사병·추적자·조각, 보스 80px
{
  const cells = 7;
  let body = '';
  for (let i = 0; i < cells; i++) for (let j = 0; j < 3; j++) body += img(i === 0 || i === cells - 1 || j === 0 || j === 2 ? 'tile.wall/base.png' : 'tile.floor/base.png', i * 56, j * 56, 56, 56);
  const put = (rel: string, cell: number, size = 56) => {
    const cx = cell * 56 + 28;
    const foot = 56 + 56 - 4;
    body += img(rel, cx - size / 2, foot - size * (size === 80 ? 136 / 160 : 96 / 112), size, size);
  };
  put('visual.player.body/idle/f0001.png', 1);
  put('visual.enemy.grunt.body/idle/f0001.png', 2);
  put('visual.enemy.grunt.body/cast/f0001.png', 3);
  put('visual.enemy.rapid.body/idle/f0001.png', 4);
  put('visual.enemy.chaser.body/idle/f0001.png', 5);
  put('visual.boss.executor.body/idle/f0001.png', 6, 80);
  body += img('visual.shard/base.png', 4 * 56, 2 * 56 - 28, 56, 56);
  writeFileSync(join(PREVIEW, 'preview_56px.png'), render(svgWrap(cells * 56, 168, body)).png);
}
// 아이콘 연락판 20px / 32px
for (const size of [20, 32]) {
  const ids = ASSETS.filter((a) => a.asset_id.startsWith('icon.'));
  const gap = 8;
  let body = `<rect width="${ids.length * (size + gap) + gap}" height="${size + gap * 2}" fill="#151A21"/>`;
  ids.forEach((a, i) => (body += img(a.relative_path, gap + i * (size + gap), gap, size, size)));
  writeFileSync(join(PREVIEW, `icons_${size}px.png`), render(svgWrap(ids.length * (size + gap) + gap, size + gap * 2, body)).png);
}
// 11×11 보드 합성 + 위험 칸
{
  let body = '';
  let s = 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < 11; y++)
    for (let x = 0; x < 11; x++) {
      const wall = x === 0 || y === 0 || x === 10 || y === 10;
      body += img(wall ? 'tile.wall/base.png' : rnd() < 0.2 ? 'tile.floor_alt/base.png' : 'tile.floor/base.png', x * 56, y * 56, 56, 56);
    }
  writeFileSync(join(PREVIEW, 'preview_board.png'), render(svgWrap(616, 616, body)).png);
  let hatch = '';
  for (let k = -56; k < 56; k += 4) hatch += `<line x1="${4 * 56 + Math.max(0, k)}" y1="${5 * 56 + Math.max(0, -k)}" x2="${4 * 56 + Math.min(56, 56 + k)}" y2="${5 * 56 + Math.min(56, 56 - k)}" stroke="#FF9B54" stroke-width="1"/>`;
  writeFileSync(join(PREVIEW, 'preview_danger.png'), render(svgWrap(616, 616, body + hatch + `<rect x="${4 * 56 + 1}" y="${5 * 56 + 1}" width="54" height="54" fill="none" stroke="#FF9B54" stroke-width="2"/>`)).png);
}
// 카드 패널 9-slice 늘림 프리뷰 (200×280 / 240×320 / 280×360) — 단순 중앙 늘림 검증용
{
  let body = `<rect width="800" height="400" fill="#151A21"/>`;
  const sizes: [number, number][] = [[200, 280], [240, 320], [280, 360]];
  sizes.forEach(([w, h], i) => (body += img(`ui.panel.card/${i === 1 ? 'selected' : 'normal'}.png`, 20 + i * 260, 20, w, h)));
  writeFileSync(join(PREVIEW, 'card_panel_sizes.png'), render(svgWrap(800, 400, body)).png);
}

// ───────── manifest ─────────
const runtime = {
  project_id: contract.project_id,
  contract_version: contract.contract_version,
  note: 'vector_authored 파일럿+3단계 몸체. 경로는 public/ 기준. 없는 항목은 placeholder.',
  artifacts: artifacts.map((x) => ({ asset_id: x.asset_id, clip_id: x.clip_id, frame_id: x.frame_id, state: x.state, relative_path: `assets/delivery/${x.relative_path}` })),
};
writeFileSync('public/assets/manifest.json', JSON.stringify(runtime, null, 2));

const delivery = {
  schema_version: 'workflow-asset-1',
  project_id: contract.project_id,
  delivery_id: `delivery.vector.${new Date().toISOString().slice(0, 10)}`,
  delivery_role: 'pilot+phase3_bodies',
  contract_version: contract.contract_version,
  contract_hash: readFileSync('shared/CONTRACT_HASH.txt', 'utf-8').match(/sha256 = ([0-9a-f]+)/)?.[1] ?? null,
  supplier: 'dev session (vector_authored, resvg-js)',
  created_at: new Date().toISOString(),
  tool: { svg: 'design/svg_sources.ts (hand-authored)', raster: `@resvg/resvg-js` },
  artifacts: artifacts.map((x) => ({ asset_id: x.asset_id, clip_id: x.clip_id, frame_id: x.frame_id, state: x.state, relative_path: x.relative_path, sha256: x.sha256, size_px: x.size, media_type: 'image/png', origin: { method: 'vector_authored', source: `design/svg/${x.relative_path.replace(/\.png$/, '.svg')}` } })),
  checks: checks.map((c) => ({ target: c.asset, status: c.ok ? 'pass' : 'fail', observed: c.detail })),
  previews: ['design/preview/preview_56px.png', 'design/preview/icons_20px.png', 'design/preview/icons_32px.png', 'design/preview/preview_board.png', 'design/preview/preview_danger.png', 'design/preview/card_panel_sizes.png'],
  missing_target_ids: ['ref.shot.hud (raster_generated: 사용자 도구 필요)', 'font.mono, font.ui (CDN 로드로 대체)', 'audio.* 16 (audio_generated: ElevenLabs 필요)', 'screen.layout.* (검토 자료)'],
};
writeFileSync(join(DELIVERY, 'manifest.json'), JSON.stringify(delivery, null, 2));

const fails = checks.filter((c) => !c.ok);
console.log(`artifacts: ${artifacts.length}, checks: ${checks.length}, fail: ${fails.length}`);
for (const f of fails) console.log(`  FAIL ${f.asset}: ${f.detail}`);
