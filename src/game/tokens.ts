import Phaser from 'phaser';
// ui_tokens.json · strings.json 을 런타임에 읽어 색·타이포·레이아웃·카피를 제공한다. 하드코딩 금지.
import tokensJson from '../../shared/ui_tokens.json';
import stringsJson from '../../shared/strings.json';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TOKENS = tokensJson as unknown as {
  colors: Record<string, string>;
  typography: {
    'font.mono': { family: string; sizes_px: Record<string, number> };
    'font.ui': { family: string; weights: number[]; sizes_px: Record<string, number> };
    line_height: number;
  };
  spacing_px: { unit: number; panel_padding: number; card_gap: number; hud_gutter: number };
  layout_1280x720: {
    board: Rect;
    command_bar: Rect;
    side_panel: Rect;
    side_panel_rows: Record<string, { y: number; h: number }>;
    top_strip: Rect;
    ring: { radius_px: number; segment_gap_deg: number; gauge_arc_width_px: number; text_offset_px: number; icon_offset_px: number };
    levelup_overlay: { dim: string; cards: { x: number; y: number }[]; card_size: [number, number]; footer: { y: number; h: number } };
  };
  component_states: Record<string, Record<string, Record<string, string | number>>>;
};

const STR = (stringsJson as { strings: Record<string, string> }).strings;

/** 카피 조회 + {변수} 치환 */
export function t(key: string, vars: Record<string, string | number> = {}): string {
  let s = STR[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** '#RRGGBB' → 0xRRGGBB */
export function col(name: string): number {
  const hex = TOKENS.colors[name];
  if (!hex) throw new Error(`unknown color token ${name}`);
  return parseInt(hex.slice(1), 16);
}
export function colHex(name: string): string {
  return TOKENS.colors[name];
}

export const FONT_MONO = `"${TOKENS.typography['font.mono'].family}", monospace`;
export const FONT_UI = `"${TOKENS.typography['font.ui'].family}", "Noto Sans KR", sans-serif`;
export const SZ_MONO = TOKENS.typography['font.mono'].sizes_px;
export const SZ_UI = TOKENS.typography['font.ui'].sizes_px;
export const L = TOKENS.layout_1280x720;

export const TILE = 56;
export const DESIGN_W = 1280;
export const DESIGN_H = 720;

export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export function monoStyle(size: number, color = 'text.primary', extra: Partial<TextStyle> = {}): TextStyle {
  return { fontFamily: FONT_MONO, fontSize: `${size}px`, color: colHex(color), ...extra };
}
export function uiStyle(size: number, color = 'text.primary', extra: Partial<TextStyle> = {}): TextStyle {
  return { fontFamily: FONT_UI, fontSize: `${size}px`, color: colHex(color), ...extra };
}

export function fmtClock(sec: number): { mm: string; ss: string } {
  const s = Math.max(0, Math.floor(sec));
  return { mm: String(Math.floor(s / 60)).padStart(2, '0'), ss: String(s % 60).padStart(2, '0') };
}

/** 보드 셀 중심 픽셀 좌표 */
export function cellCenter(cx: number, cy: number): [number, number] {
  return [L.board.x + (cx + 0.5) * TILE, L.board.y + (cy + 0.5) * TILE];
}
