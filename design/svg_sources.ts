// 벡터 에셋 원본(vector_authored). briefs/pilot·phase3 의 좌표·색을 따른다. 색값은 ui_tokens.json.
// 규격: 몸체 112×112 발 피벗 (56,96) / 보스 160×160 피벗 (80,136) / 아이콘 64×64 / 타일 112 / 카드 240×320.
import tokens from '../shared/ui_tokens.json';

const C = (tokens as { colors: Record<string, string> }).colors;
const INK = C['bg.ink'];
const SLATE = C['bg.slate'];
const PANEL = C['bg.panel'];
const TILE_LINE = C['bg.tile_line'];
const WALL_MARK = C['bg.wall_mark'];
const IVORY = C['player.ivory'];
const ORANGE = C['threat.orange'];
const BLUE = C['xp.blue'];
const GOLD = C['boss.gold'];
const LINE_STRONG = C['line.strong'];
const TEAL = C['ally.teal'];

const OUTLINE = 3; // 원본 기준 외곽선
const FOOT = 96; // 발 접지 y (외곽선 바깥 끝이 정확히 96 에 닿게 도형은 94.5 까지)
const FOOT_IN = FOOT - OUTLINE / 2;

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">\n${body}\n</svg>\n`;
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const orect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, sw = OUTLINE, stroke = PANEL) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const circle = (cx: number, cy: number, r: number, fill: string, sw = OUTLINE, stroke = PANEL) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const poly = (pts: [number, number][], fill: string, sw = OUTLINE, stroke = PANEL) =>
  `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number, cap: 'round' | 'butt' = 'round') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>`;
const g = (tf: string, body: string) => `<g transform="${tf}">\n${body}\n</g>`;

export interface SvgAsset {
  asset_id: string;
  /** clip 짧은 이름(idle/act/cast) 과 frame_id, 또는 state, 또는 없음 */
  clip?: string;
  frame?: string;
  state?: string;
  relative_path: string; // delivery 루트 기준
  size: [number, number];
  pivot?: [number, number];
  safe?: [number, number, number, number]; // x0,y0,x1,y1
  opaque?: boolean;
  singleColor?: string;
  svg: string;
}

const A: SvgAsset[] = [];
function body(asset_id: string, clip: string, frame: string, size: [number, number], pivot: [number, number], safe: [number, number, number, number], inner: string) {
  A.push({ asset_id, clip, frame, relative_path: `${asset_id}/${clip}/${frame}.png`, size, pivot, safe, svg: svg(size[0], size[1], inner) });
}
const SAFE_BODY: [number, number, number, number] = [20, 12, 92, 100];
const SAFE_BOSS: [number, number, number, number] = [24, 16, 136, 144];

// ───────────── 플레이어 ─────────────
function player(pose: 'idle1' | 'idle2' | 'act'): string {
  const breathe = pose === 'idle2' ? -2 : 0;
  const act = pose === 'act';
  const headCy = (act ? 16 : 24) + breathe;
  const bodyTop = (act ? 22 : 30) + breathe;
  const scabX = act ? 8 : 14;
  const parts = [
    // 어깨 천 (몸 뒤)
    poly([[70, 34 + breathe], [86, 41 + breathe], [72, 52 + breathe]], IVORY),
    // 칼집
    orect(scabX, 62 + breathe, 26, 8, SLATE, 4, 2),
    // 몸체 (발은 항상 96)
    orect(38, bodyTop, 36, FOOT_IN - bodyTop, IVORY, 10),
    // 허리띠·어깨선·옷깃 (내부 선 2~3개)
    line(40, 66 + breathe, 72, 66 + breathe, SLATE, 3, 'butt'),
    line(44, 38 + breathe, 68, 38 + breathe, SLATE, 2, 'butt'),
    line(56, 40 + breathe, 56, 62 + breathe, SLATE, 2, 'butt'),
    // 머리
    circle(56, headCy, 11, IVORY),
  ];
  return parts.join('\n');
}
body('visual.player.body', 'idle', 'f0001', [112, 112], [56, 96], SAFE_BODY, player('idle1'));
body('visual.player.body', 'idle', 'f0002', [112, 112], [56, 96], SAFE_BODY, player('idle2'));
body('visual.player.body', 'act', 'f0001', [112, 112], [56, 96], SAFE_BODY, player('act'));

// ───────────── 잔병 (사각 갑옷 보초) ─────────────
function grunt(pose: 'idle1' | 'idle2' | 'cast'): string {
  const b = pose === 'idle2' ? -2 : 0;
  const cast = pose === 'cast';
  const parts = [
    // 어깨
    orect(30, 42 + b, 8, 12, SLATE, 2, 2),
    orect(74, 42 + b, 8, 12, SLATE, 2, 2),
    // 몸통
    orect(36, 40 + b, 40, FOOT_IN - (40 + b), SLATE, 4),
    // 가슴 판 선
    line(46, 58 + b, 66, 58 + b, LINE_STRONG, 2, 'butt'),
    line(56, 58 + b, 56, 84 + b, LINE_STRONG, 2, 'butt'),
    // 투구 (얼굴 없음, 슬릿)
    orect(42, 18 + b, 28, 26, SLATE, 3),
    line(46, 31 + b, 66, 31 + b, LINE_STRONG, 3, 'butt'),
  ];
  if (cast) {
    // 칼을 어깨 위로 수직에 가깝게
    parts.push(line(78, 48 + b, 87, 44 + b, SLATE, 4));
    parts.push(orect(84, 14 + b, 6, 30, SLATE, 1, 2));
    parts.push(poly([[84, 14 + b], [90, 14 + b], [87, 4 + b]], ORANGE, 2));
  } else {
    // 짧은 한손 칼, 아래로
    parts.push(orect(78, 66 + b, 6, 24, SLATE, 1, 2));
    parts.push(poly([[78, 90 + b], [84, 90 + b], [81, FOOT - 1]], ORANGE, 2));
  }
  return parts.join('\n');
}
body('visual.enemy.grunt.body', 'idle', 'f0001', [112, 112], [56, 96], SAFE_BODY, grunt('idle1'));
body('visual.enemy.grunt.body', 'idle', 'f0002', [112, 112], [56, 96], SAFE_BODY, grunt('idle2'));
body('visual.enemy.grunt.body', 'cast', 'f0001', [112, 112], [56, 96], SAFE_BODY, grunt('cast'));

// ───────────── 속사병 (가는 바늘 서기) ─────────────
function rapid(pose: 'idle1' | 'idle2' | 'cast'): string {
  const b = pose === 'idle2' ? -2 : 0;
  const cast = pose === 'cast';
  const drop = cast ? 10 : 0;
  const parts: string[] = [];
  // 다리 (가늘게, 발 96)
  if (cast) {
    parts.push(line(51, 84, 46, FOOT - 0.6, SLATE, 4, 'butt'));
    parts.push(line(61, 84, 66, FOOT - 0.6, SLATE, 4, 'butt'));
  } else {
    parts.push(line(52, 78 + b, 50, FOOT - 0.6, SLATE, 4, 'butt'));
    parts.push(line(60, 78 + b, 62, FOOT - 0.6, SLATE, 4, 'butt'));
  }
  // 몸통 세로로 가늘게
  parts.push(orect(48, 36 + b + drop, 16, 46, SLATE, 6));
  parts.push(line(56, 44 + b + drop, 56, 74 + b + drop, LINE_STRONG, 2, 'butt'));
  // 새부리 가면
  parts.push(circle(56, 26 + b + drop, 8, SLATE));
  parts.push(poly([[49, 24 + b + drop], [36, 28 + b + drop], [49, 31 + b + drop]], SLATE, 2));
  // 바늘
  if (cast) {
    parts.push(line(62, 70, 32, 70, SLATE, 3, 'butt'));
    parts.push(poly([[33, 68], [33, 72], [24, 70]], ORANGE, 1.5));
  } else {
    parts.push(line(68, 62 + b, 68, 36 + b, SLATE, 3, 'butt'));
    parts.push(poly([[66, 37 + b], [70, 37 + b], [68, 28 + b]], ORANGE, 1.5));
  }
  return parts.join('\n');
}
body('visual.enemy.rapid.body', 'idle', 'f0001', [112, 112], [56, 96], SAFE_BODY, rapid('idle1'));
body('visual.enemy.rapid.body', 'idle', 'f0002', [112, 112], [56, 96], SAFE_BODY, rapid('idle2'));
body('visual.enemy.rapid.body', 'cast', 'f0001', [112, 112], [56, 96], SAFE_BODY, rapid('cast'));

// ───────────── 추적자 (찢어진 망토, 마름모) ─────────────
function chaser(pose: 'idle1' | 'idle2' | 'cast'): string {
  const sway = pose === 'idle2' ? 2 : 0;
  const cast = pose === 'cast';
  const topX = cast ? 50 : 56;
  const bottom = FOOT_IN;
  // 마름모 + 아래 세 갈래 찢김
  const pts: [number, number][] = [
    [topX, 20],
    [84, 58],
    [72 + sway, 80],
    [68 + sway, bottom],
    [62, 84],
    [56 - sway, bottom],
    [50, 84],
    [44 - sway, bottom],
    [40 - sway, 80],
    [28, 58],
  ];
  const parts = [
    poly(pts, SLATE),
    // 망토 주름 내부 선
    line(topX + 4, 36, 62, 70, LINE_STRONG, 2, 'butt'),
    line(topX - 6, 44, 46, 72, LINE_STRONG, 2, 'butt'),
    // 갈래 하나 주황
    poly([[64, 86], [68 + sway, bottom], [71 + sway, 84]], ORANGE, 1.5),
    // 작은 머리
    circle(topX, 16, 6, SLATE),
  ];
  if (cast) {
    parts.push(orect(24, 56, 10, 4, SLATE, 1, 1.5));
    parts.push(poly([[24, 56], [24, 60], [16, 58]], ORANGE, 1.5));
  }
  return parts.join('\n');
}
body('visual.enemy.chaser.body', 'idle', 'f0001', [112, 112], [56, 96], SAFE_BODY, chaser('idle1'));
body('visual.enemy.chaser.body', 'idle', 'f0002', [112, 112], [56, 96], SAFE_BODY, chaser('idle2'));
body('visual.enemy.chaser.body', 'cast', 'f0001', [112, 112], [56, 96], SAFE_BODY, chaser('cast'));

// ───────────── 보스 기억의 집행자 (육각, 큰 검, 금색 인장) ─────────────
function boss(pose: 'idle1' | 'idle2' | 'cast'): string {
  const b = pose === 'idle2' ? -2 : 0;
  const cast = pose === 'cast';
  const foot = 136 - OUTLINE / 2;
  const hex: [number, number][] = [
    [80, 44 + b],
    [120, 67 + b],
    [120, 113],
    [80, foot],
    [40, 113],
    [40, 67 + b],
  ];
  const parts: string[] = [];
  if (!cast) {
    // 큰 검 (몸 뒤, 세로)
    parts.push(orect(118, 20 + b, 12, 100, SLATE, 2, 2));
    parts.push(poly([[118, 20 + b], [130, 20 + b], [124, 6 + b]], ORANGE, 2));
    parts.push(line(112, 62 + b, 136, 62 + b, PANEL, 4, 'butt'));
  }
  parts.push(poly(hex, SLATE));
  // 갑주 내부 선
  parts.push(line(80, 60 + b, 80, 120, LINE_STRONG, 3, 'butt'));
  parts.push(line(56, 84 + b, 104, 84 + b, LINE_STRONG, 2, 'butt'));
  parts.push(line(60, 104, 100, 104, LINE_STRONG, 2, 'butt'));
  // 원형 인장판 (왼쪽, 유일한 금색)
  parts.push(circle(44, 74 + b, 18, SLATE, 4, GOLD));
  parts.push(circle(44, 74 + b, 6, GOLD, 0, 'none'));
  if (cast) {
    // 검을 수평으로
    parts.push(orect(60, 60, 90, 12, SLATE, 2, 2));
    parts.push(poly([[150, 60], [150, 72], [158, 66]], ORANGE, 2));
    parts.push(line(70, 54, 70, 78, PANEL, 4, 'butt'));
  }
  return parts.join('\n');
}
body('visual.boss.executor.body', 'idle', 'f0001', [160, 160], [80, 136], SAFE_BOSS, boss('idle1'));
body('visual.boss.executor.body', 'idle', 'f0002', [160, 160], [80, 136], SAFE_BOSS, boss('idle2'));
body('visual.boss.executor.body', 'cast', 'f0001', [160, 160], [80, 136], SAFE_BOSS, boss('cast'));

// ───────────── 조각 ─────────────
A.push({
  asset_id: 'visual.shard',
  relative_path: 'visual.shard/base.png',
  size: [112, 112],
  pivot: [56, 56],
  safe: [32, 24, 80, 88],
  svg: svg(112, 112, [poly([[56, 26], [78, 56], [56, 86], [34, 56]], BLUE, 2), poly([[56, 48], [62, 56], [56, 64], [50, 56]], IVORY, 0, 'none')].join('\n')),
});

// ───────────── 타일 묶음 (batch.tiles.yard) ─────────────
const floorBase = (marks: string) =>
  [rect(0, 0, 112, 112, INK), `<rect x="4.5" y="4.5" width="103" height="103" fill="none" stroke="${TILE_LINE}" stroke-width="1"/>`, marks].join('\n');
A.push({ asset_id: 'tile.floor', relative_path: 'tile.floor/base.png', size: [112, 112], opaque: true, svg: svg(112, 112, floorBase([line(30, 50, 70, 50, PANEL, 2), line(40, 64, 84, 64, PANEL, 2)].join('\n'))) });
A.push({ asset_id: 'tile.floor_alt', relative_path: 'tile.floor_alt/base.png', size: [112, 112], opaque: true, svg: svg(112, 112, floorBase([line(52, 34, 52, 70, PANEL, 2), line(66, 44, 66, 80, PANEL, 2)].join('\n'))) });
A.push({
  asset_id: 'tile.wall',
  relative_path: 'tile.wall/base.png',
  size: [112, 112],
  opaque: true,
  svg: svg(112, 112, [rect(0, 0, 112, 112, SLATE), `<rect x="9" y="9" width="94" height="94" fill="none" stroke="${PANEL}" stroke-width="2"/>`, line(56, 40, 56, 72, WALL_MARK, 3, 'butt'), line(40, 56, 72, 56, WALL_MARK, 3, 'butt')].join('\n')),
});

// ───────────── 카드 패널 (9-slice inset 24) ─────────────
function card(selected: boolean): string {
  const parts: string[] = [];
  if (selected) parts.push(`<rect x="2" y="2" width="236" height="316" rx="12" fill="none" stroke="${TEAL}" stroke-opacity="0.35" stroke-width="6"/>`);
  parts.push(`<rect x="2" y="2" width="236" height="316" rx="12" fill="${PANEL}"/>`);
  // 상단 띠 (아래 모서리 각지게)
  parts.push(`<path d="M2 14 a12 12 0 0 1 12 -12 h212 a12 12 0 0 1 12 12 v44 h-236 z" fill="${SLATE}"/>`);
  parts.push(`<rect x="2" y="2" width="236" height="316" rx="12" fill="none" stroke="${selected ? TEAL : LINE_STRONG}" stroke-width="${selected ? 3 : 2}"/>`);
  return parts.join('\n');
}
A.push({ asset_id: 'ui.panel.card', state: 'normal', relative_path: 'ui.panel.card/normal.png', size: [240, 320], svg: svg(240, 320, card(false)) });
A.push({ asset_id: 'ui.panel.card', state: 'selected', relative_path: 'ui.panel.card/selected.png', size: [240, 320], svg: svg(240, 320, card(true)) });

// ───────────── 아이콘 묶음 (batch.icons.main, 6×3 시트) ─────────────
const IC = IVORY;
const st = `fill="none" stroke="${IC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
const ICONS: [string, string][] = [
  ['icon.enemy.grunt', `<rect x="18" y="16" width="26" height="36" rx="3" fill="${IC}"/><rect x="24" y="8" width="14" height="12" rx="2" fill="${IC}"/><line x1="50" y1="22" x2="50" y2="46" stroke="${IC}" stroke-width="4" stroke-linecap="round"/>`],
  ['icon.enemy.rapid', `<rect x="26" y="14" width="12" height="40" rx="5" fill="${IC}"/><circle cx="32" cy="12" r="5" fill="${IC}"/><line x1="44" y1="16" x2="44" y2="46" stroke="${IC}" stroke-width="4" stroke-linecap="round"/>`],
  ['icon.enemy.chaser', `<polygon points="32,8 52,30 44,54 38,44 32,54 26,44 20,54 12,30" fill="${IC}"/>`],
  ['icon.enemy.boss', `<path fill-rule="evenodd" fill="${IC}" d="M32 8 L54 21 V43 L32 56 L10 43 V21 Z M22 26 a7 7 0 1 0 0.01 0 Z"/><line x1="52" y1="10" x2="52" y2="30" stroke="${IC}" stroke-width="4" stroke-linecap="round"/>`],
  ['icon.card.abbr_action', `<line x1="12" y1="24" x2="52" y2="24" ${st}/><line x1="12" y1="42" x2="28" y2="42" ${st}/>`],
  ['icon.card.abbr_direction', `<line x1="32" y1="10" x2="32" y2="54" ${st}/><line x1="10" y1="32" x2="54" y2="32" ${st}/><rect x="25" y="25" width="14" height="14" ${st}/>`],
  ['icon.card.abbr_grammar', `<line x1="22" y1="14" x2="22" y2="50" ${st}/><line x1="42" y1="14" x2="42" y2="50" ${st}/><circle cx="32" cy="32" r="3.5" fill="${IC}"/>`],
  ['icon.card.offense', `<line x1="14" y1="50" x2="46" y2="18" ${st}/><line x1="44" y1="12" x2="52" y2="20" ${st}/><line x1="22" y1="34" x2="30" y2="42" ${st}/>`],
  ['icon.card.survival', `<path d="M32 10 L52 18 V34 C52 44 42 52 32 55 C22 52 12 44 12 34 V18 Z" ${st}/>`],
  ['icon.card.skill', `<path d="M14 18 h34 a4 4 0 0 1 4 4 v28 a4 4 0 0 1 -4 4 h-30 a6 6 0 0 1 -6 -6 v-24 a6 6 0 0 1 6 -6 z" ${st}/><line x1="22" y1="30" x2="42" y2="30" ${st}/><line x1="22" y1="40" x2="36" y2="40" ${st}/>`],
  ['icon.card.utility', `<polygon points="32,10 50,32 32,54 14,32" ${st}/>`],
  ['icon.status.guard', `<path d="M12 36 A20 20 0 0 1 52 36" ${st}/><line x1="12" y1="36" x2="12" y2="44" ${st}/><line x1="52" y1="36" x2="52" y2="44" ${st}/>`],
  ['icon.status.cooldown', `<polygon points="16,12 48,12 22,32 48,52 16,52 42,32" ${st}/>`],
  ['icon.status.wait', `<circle cx="18" cy="32" r="4" fill="${IC}"/><circle cx="32" cy="32" r="4" fill="${IC}"/><circle cx="46" cy="32" r="4" fill="${IC}"/>`],
  ['icon.ui.pause', `<rect x="18" y="14" width="10" height="36" rx="2" ${st}/><rect x="36" y="14" width="10" height="36" rx="2" ${st}/>`],
  ['icon.ui.settings', `<circle cx="32" cy="32" r="11" ${st}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${(32 + Math.cos(r) * 15).toFixed(1)}" y1="${(32 + Math.sin(r) * 15).toFixed(1)}" x2="${(32 + Math.cos(r) * 21).toFixed(1)}" y2="${(32 + Math.sin(r) * 21).toFixed(1)}" ${st}/>`; }).join('')}`],
  ['icon.ui.close', `<line x1="16" y1="16" x2="48" y2="48" ${st}/><line x1="48" y1="16" x2="16" y2="48" ${st}/>`],
];
const fit = (inner: string) => `<g transform="translate(32 32) scale(0.88) translate(-32 -32)">${inner}</g>`;
for (const [id, inner] of ICONS) {
  A.push({ asset_id: id, relative_path: `icons/${id}.png`, size: [64, 64], safe: [8, 8, 56, 56], singleColor: IC, svg: svg(64, 64, fit(inner)) });
}
/** 시트 원본 (384×192, 6열 3행, 행 우선) */
export const ICON_SHEET_SVG = svg(
  384,
  192,
  ICONS.map(([, inner], i) => g(`translate(${(i % 6) * 64},${Math.floor(i / 6) * 64})`, inner)).join('\n'),
);
/** 타일 시트 원본 (336×112) */
export const TILE_SHEET_SVG = svg(
  336,
  112,
  ['tile.floor', 'tile.floor_alt', 'tile.wall'].map((id, i) => g(`translate(${i * 112},0)`, A.find((a) => a.asset_id === id)!.svg.replace(/^<svg[^>]*>\n?/, '').replace(/\n?<\/svg>\n?$/, ''))).join('\n'),
);

export const ASSETS = A;
