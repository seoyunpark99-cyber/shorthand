import Phaser from 'phaser';
// assets.resolver: binding_key/asset_id → 텍스처 키. manifest 에 파일이 있으면 로드·검사, 없거나 실패하면 placeholder.
// placeholder 는 asset_contract.placeholder_policy 대로 같은 캔버스·피벗의 단색 도형이다.
import contract from '../../shared/asset_contract.json';
import { col } from './tokens';

type Contract = typeof contract;
export const CONTRACT = contract as Contract;
const CS = CONTRACT.coordinate_system;

export interface ManifestArtifact {
  asset_id: string;
  clip_id?: string; // visual.player.body.idle
  frame_id?: string; // f0001
  state?: string; // ui.panel.card: normal | selected
  relative_path: string;
}
export interface Manifest {
  project_id: string;
  contract_version: string;
  artifacts: ManifestArtifact[];
}

export interface ImportReport {
  manifest_ok: boolean;
  reason?: string;
  loaded: string[];
  failed: { key: string; reason: string }[];
}

export const importReport: ImportReport = { manifest_ok: false, loaded: [], failed: [] };

/** 텍스처 키 규칙 */
export function texKey(assetId: string, clip?: string, frame?: string | number): string {
  if (clip === undefined) return assetId;
  const f = typeof frame === 'number' ? `f${String(frame + 1).padStart(4, '0')}` : frame ?? 'f0001';
  return `${assetId}:${clip}:${f}`;
}

const realKeys = new Set<string>();
export function isPlaceholder(key: string): boolean {
  return !realKeys.has(key);
}

/** manifest 검사 후 로드 큐에 넣는다 (BootScene preload 에서 호출) */
export function queueManifest(scene: Phaser.Scene, manifest: Manifest | null) {
  if (!manifest) {
    importReport.manifest_ok = false;
    importReport.reason = 'manifest 없음 → placeholder';
    return;
  }
  if (manifest.project_id !== CONTRACT.project_id || manifest.contract_version !== CONTRACT.contract_version) {
    importReport.manifest_ok = false;
    importReport.reason = `버전 불일치 ${manifest.project_id}/${manifest.contract_version} ≠ ${CONTRACT.project_id}/${CONTRACT.contract_version}`;
    return;
  }
  importReport.manifest_ok = true;
  const known = new Set(CONTRACT.assets.map((a) => a.asset_id));
  for (const a of manifest.artifacts ?? []) {
    if (!known.has(a.asset_id) && !a.asset_id.startsWith('icon.')) {
      importReport.failed.push({ key: a.asset_id, reason: '계약에 없는 asset_id' });
      continue;
    }
    const key = a.state ? `${a.asset_id}:${a.state}` : texKey(a.asset_id, a.clip_id?.split('.').pop(), a.frame_id);
    scene.load.image(key, a.relative_path);
    scene.load.once(`filecomplete-image-${key}`, () => {
      const tex = scene.textures.get(key).getSourceImage() as HTMLImageElement;
      const expect = expectedSize(a.asset_id);
      if (expect && (tex.width !== expect[0] || tex.height !== expect[1])) {
        importReport.failed.push({ key, reason: `크기 ${tex.width}x${tex.height} ≠ ${expect[0]}x${expect[1]}` });
        scene.textures.remove(key);
        return;
      }
      realKeys.add(key);
      importReport.loaded.push(key);
    });
    scene.load.once(`loaderror`, (file: { key: string }) => {
      if (file.key === key) importReport.failed.push({ key, reason: '파일 로드 실패' });
    });
  }
}

function expectedSize(assetId: string): [number, number] | null {
  if (assetId.startsWith('visual.boss')) return [CS.boss_source_canvas_px[0], CS.boss_source_canvas_px[1]];
  if (assetId.startsWith('visual.') || assetId.startsWith('tile.')) return [CS.body_source_canvas_px[0], CS.body_source_canvas_px[1]];
  if (assetId.startsWith('icon.')) return [CS.icon_source_canvas_px[0], CS.icon_source_canvas_px[1]];
  if (assetId === 'ui.panel.card') return [240, 320];
  return null;
}

// ───────────────────────── placeholder 생성 ─────────────────────────

function body(g: Phaser.GameObjects.Graphics, fill: number, shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hex', canvas: number, pivotY: number, tip: number | null, cast: boolean) {
  const cx = canvas / 2;
  const h = canvas === 160 ? 92 : 64;
  const w = canvas === 160 ? 80 : 40;
  const top = pivotY - h;
  const lift = cast ? -6 : 0;
  g.lineStyle(3, col('bg.panel'), 1);
  g.fillStyle(fill, 1);
  switch (shape) {
    case 'circle':
      g.fillRoundedRect(cx - w / 2, top + 14 + lift, w, h - 14 - lift, 8);
      g.strokeRoundedRect(cx - w / 2, top + 14 + lift, w, h - 14 - lift, 8);
      g.fillCircle(cx, top + 10 + lift, 11);
      g.strokeCircle(cx, top + 10 + lift, 11);
      break;
    case 'square':
      g.fillRect(cx - w / 2, top + lift, w, h - lift);
      g.strokeRect(cx - w / 2, top + lift, w, h - lift);
      break;
    case 'triangle':
      g.fillTriangle(cx, top + lift, cx - w / 2 + 6, pivotY, cx + w / 2 - 6, pivotY);
      g.strokeTriangle(cx, top + lift, cx - w / 2 + 6, pivotY, cx + w / 2 - 6, pivotY);
      break;
    case 'diamond':
      g.fillPoints([{ x: cx, y: top + lift }, { x: cx + w / 2, y: top + h / 2 }, { x: cx, y: pivotY }, { x: cx - w / 2, y: top + h / 2 }] as Phaser.Math.Vector2[], true);
      g.strokePoints([{ x: cx, y: top + lift }, { x: cx + w / 2, y: top + h / 2 }, { x: cx, y: pivotY }, { x: cx - w / 2, y: top + h / 2 }] as Phaser.Math.Vector2[], true);
      break;
    case 'hex': {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts.push({ x: cx + Math.cos(a) * (w / 2), y: top + h / 2 + Math.sin(a) * (h / 2) + lift / 2 });
      }
      g.fillPoints(pts as Phaser.Math.Vector2[], true);
      g.strokePoints(pts as Phaser.Math.Vector2[], true);
      g.lineStyle(4, col('boss.gold'), 1);
      g.strokeCircle(cx - w / 2 + 6, top + h / 2, 12);
      break;
    }
  }
  if (tip !== null) {
    g.fillStyle(tip, 1);
    if (cast) g.fillTriangle(cx + w / 2 + 2, top - 6 + lift, cx + w / 2 + 10, top - 6 + lift, cx + w / 2 + 6, top - 18 + lift);
    else g.fillTriangle(cx + w / 2 + 2, pivotY - 8, cx + w / 2 + 10, pivotY - 8, cx + w / 2 + 6, pivotY + 2);
  }
}

function gen(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** 계약의 모든 스프라이트·타일·패널 placeholder 를 만든다. 실제 파일이 로드된 키는 건너뛴다 */
export function generatePlaceholders(scene: Phaser.Scene) {
  const S = CS.body_source_canvas_px[0];
  const B = CS.boss_source_canvas_px[0];
  const pivot = CS.body_pivot_source_px[1];
  const bpivot = CS.boss_pivot_source_px[1];
  const bodies: [string, 'circle' | 'square' | 'triangle' | 'diamond' | 'hex', number, number | null, string][] = [
    ['visual.player.body', 'circle', col('player.ivory'), null, 'act'],
    ['visual.enemy.grunt.body', 'square', col('bg.slate'), col('threat.orange'), 'cast'],
    ['visual.enemy.rapid.body', 'triangle', col('bg.slate'), col('threat.orange'), 'cast'],
    ['visual.enemy.chaser.body', 'diamond', col('bg.slate'), col('threat.orange'), 'cast'],
  ];
  for (const [id, shape, fill, tip, actClip] of bodies) {
    gen(scene, texKey(id, 'idle', 0), S, S, (g) => body(g, fill, shape, S, pivot, tip, false));
    gen(scene, texKey(id, 'idle', 1), S, S, (g) => {
      body(g, fill, shape, S, pivot, tip, false);
    });
    gen(scene, texKey(id, actClip, 0), S, S, (g) => body(g, fill, shape, S, pivot, tip, true));
  }
  gen(scene, texKey('visual.boss.executor.body', 'idle', 0), B, B, (g) => body(g, col('bg.slate'), 'hex', B, bpivot, col('threat.orange'), false));
  gen(scene, texKey('visual.boss.executor.body', 'idle', 1), B, B, (g) => body(g, col('bg.slate'), 'hex', B, bpivot, col('threat.orange'), false));
  gen(scene, texKey('visual.boss.executor.body', 'cast', 0), B, B, (g) => body(g, col('bg.slate'), 'hex', B, bpivot, col('threat.orange'), true));
  // 조각: 중앙 48px 마름모
  gen(scene, 'visual.shard', S, S, (g) => {
    g.lineStyle(2, col('bg.panel'), 1);
    g.fillStyle(col('xp.blue'), 1);
    const pts = [{ x: 56, y: 26 }, { x: 78, y: 56 }, { x: 56, y: 86 }, { x: 34, y: 56 }];
    g.fillPoints(pts as Phaser.Math.Vector2[], true);
    g.strokePoints(pts as Phaser.Math.Vector2[], true);
    g.fillStyle(col('player.ivory'), 1);
    g.fillPoints([{ x: 56, y: 48 }, { x: 62, y: 56 }, { x: 56, y: 64 }, { x: 50, y: 56 }] as Phaser.Math.Vector2[], true);
  });
  // 타일
  gen(scene, 'tile.floor', S, S, (g) => {
    g.fillStyle(col('bg.ink'), 1);
    g.fillRect(0, 0, S, S);
    g.lineStyle(1, col('bg.tile_line'), 1);
    g.strokeRect(4, 4, S - 8, S - 8);
    g.lineStyle(2, col('bg.panel'), 1);
    g.lineBetween(30, 50, 70, 50);
    g.lineBetween(40, 64, 84, 64);
  });
  gen(scene, 'tile.floor_alt', S, S, (g) => {
    g.fillStyle(col('bg.ink'), 1);
    g.fillRect(0, 0, S, S);
    g.lineStyle(1, col('bg.tile_line'), 1);
    g.strokeRect(4, 4, S - 8, S - 8);
    g.lineStyle(2, col('bg.panel'), 1);
    g.lineBetween(52, 34, 52, 70);
    g.lineBetween(66, 44, 66, 80);
  });
  gen(scene, 'tile.wall', S, S, (g) => {
    g.fillStyle(col('bg.slate'), 1);
    g.fillRect(0, 0, S, S);
    g.lineStyle(2, col('bg.panel'), 1);
    g.strokeRect(8, 8, S - 16, S - 16);
    g.lineStyle(3, col('bg.wall_mark'), 1);
    g.lineBetween(56, 40, 56, 72);
    g.lineBetween(40, 56, 72, 56);
  });
  // 카드 패널 240×320 (9-slice inset 24)
  for (const state of ['normal', 'selected'] as const) {
    gen(scene, `ui.panel.card:${state}`, 240, 320, (g) => {
      if (state === 'selected') {
        g.lineStyle(6, col('ally.teal'), 0.35);
        g.strokeRoundedRect(2, 2, 236, 316, 12);
      }
      g.fillStyle(col('bg.panel'), 1);
      g.fillRoundedRect(2, 2, 236, 316, 12);
      g.fillStyle(col('bg.slate'), 1);
      g.fillRoundedRect(2, 2, 236, 56, { tl: 12, tr: 12, bl: 0, br: 0 });
      g.lineStyle(state === 'selected' ? 3 : 2, col(state === 'selected' ? 'ally.teal' : 'line.strong'), 1);
      g.strokeRoundedRect(2, 2, 236, 316, 12);
    });
  }
}

/** 몸체 표시용 스프라이트 설정(피벗·스케일) */
export function setupBodySprite(sprite: Phaser.GameObjects.Sprite, assetId: string) {
  const boss = assetId.startsWith('visual.boss');
  const canvas = boss ? CS.boss_source_canvas_px[0] : CS.body_source_canvas_px[0];
  const pivotY = boss ? CS.boss_pivot_source_px[1] : CS.body_pivot_source_px[1];
  sprite.setOrigin(0.5, pivotY / canvas);
  sprite.setScale(0.5);
}

export const ENEMY_ASSET: Record<string, string> = {
  grunt: 'visual.enemy.grunt.body',
  rapid: 'visual.enemy.rapid.body',
  chaser: 'visual.enemy.chaser.body',
  boss_executor: 'visual.boss.executor.body',
};
