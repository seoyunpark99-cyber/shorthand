// 데이터 파일의 단일 원본을 타입과 함께 노출한다. 수치는 여기서만 읽는다.
import commandsJson from '../../data/commands.json';
import cardsJson from '../../data/cards.json';
import enemiesJson from '../../data/enemies.json';
import spawnJson from '../../data/gauge_and_spawn.json';

export type ActionId = 'slash' | 'thrust' | 'guard' | 'move' | 'spin';
export type DirId = 'up' | 'upright' | 'right' | 'downright' | 'down' | 'downleft' | 'left' | 'upleft';

export interface ActionDef {
  id: ActionId;
  display_ko: string;
  tokens_by_rank: string[];
  abbr_card: string | null;
  unlock_card?: string;
  shape: string;
  range?: number;
  damage_base?: number;
  duration_s_base?: number;
  cooldown_s: number;
  interrupts_cast?: boolean;
}
export interface DirDef {
  id: DirId;
  vector: [number, number];
  long_token: string;
  short_token: string;
  abbr_card: string;
}
export interface CardDef {
  id: string;
  name_ko: string;
  category: 'abbreviation' | 'performance';
  subgroup: string;
  max_rank: number;
  effect_type: string;
  target: string;
  rank_values: unknown[];
  requires: string[][];
  requires_skill_absent?: string;
}
export interface EnemyDef {
  id: string;
  name_ko: string;
  visual_name_ko: string;
  hp: number;
  damage: number;
  cast_s_base?: number;
  attack_shape?: string;
  targeting?: string;
  lock_last_s?: number;
  xp: number;
  first_appear_s: number;
  interrupt_immune?: boolean;
  behavior?: {
    keep_distance: number;
    move_interval_s: number;
    difficulty_floor?: number;
    pattern_deletion_line: {
      step1: { cast_s_base: number; damage: number };
      gap_s: number;
      step2: { cast_s_base: number; damage: number };
      recovery_s: number;
    };
  };
}
export interface Band {
  from_s: number;
  to_s: number;
  interval_s: number;
  max_alive: number;
  pool: [string, number][];
}

export const COMMANDS = commandsJson as unknown as {
  grammar: { max_buffer_chars: number; valid_chars: string };
  actions: ActionDef[];
  directions: DirDef[];
};
export const CARDS = cardsJson as unknown as {
  offer_rules: { cards_per_offer: number; first_offer_fixed: string[] };
  cards: CardDef[];
};
export const ENEMIES = enemiesJson as unknown as {
  common: { move_interval_s: number; recovery_s: number; cast_cap_same_direction: number };
  enemies: EnemyDef[];
};
export const SPAWN = spawnJson as unknown as {
  simulation: { step_ms: number };
  difficulty: { decay: number; step_s: number; floor_value: number; table_reference: { t_s: number; M: number }[] };
  spawn: { telegraph_s: number; distance_chebyshev: number; fallback_distance: number; bands: Band[] };
  xp: { pickup_radius_base: number };
  player: { hp: number; start_cell: [number, number]; skills_slots: number };
  board: { width: number; height: number };
};

export const STEP_S = SPAWN.simulation.step_ms / 1000;
export const SPEC_VERSION = (commandsJson as { spec_version: string }).spec_version;

export const DIRS: DirDef[] = COMMANDS.directions;
export const DIR_BY_ID: Record<DirId, DirDef> = Object.fromEntries(DIRS.map((d) => [d.id, d])) as Record<DirId, DirDef>;
export const ACTION_BY_ID: Record<ActionId, ActionDef> = Object.fromEntries(
  COMMANDS.actions.map((a) => [a.id, a]),
) as Record<ActionId, ActionDef>;
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.cards.map((c) => [c.id, c]));
export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.enemies.map((e) => [e.id, e]));

export const DIR_KO: Record<DirId, string> = {
  up: '위',
  upright: '오른쪽 위',
  right: '오른쪽',
  downright: '오른쪽 아래',
  down: '아래',
  downleft: '왼쪽 아래',
  left: '왼쪽',
  upleft: '왼쪽 위',
};

/** 벡터 → 방향 ID (인접 8방향만). 아니면 null */
export function dirFromVector(dx: number, dy: number): DirId | null {
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  for (const d of DIRS) if (d.vector[0] === sx && d.vector[1] === sy) return d.id;
  return null;
}

/** 시계방향 순서 (위부터) */
export const DIR_ORDER: DirId[] = ['up', 'upright', 'right', 'downright', 'down', 'downleft', 'left', 'upleft'];

export function dirRotate(d: DirId, stepsCw: number): DirId {
  const i = DIR_ORDER.indexOf(d);
  return DIR_ORDER[(i + stepsCw + 8) % 8];
}
export function dirOpposite(d: DirId): DirId {
  return dirRotate(d, 4);
}

/** 난도 배율 M(t) = max(floor, decay^floor(t/step)) */
export function difficultyMultiplier(t: number): number {
  const { decay, step_s, floor_value } = SPAWN.difficulty;
  return Math.max(floor_value, Math.pow(decay, Math.floor(t / step_s)));
}

export function xpNext(level: number): number {
  return 3 + (level - 1);
}

export function bandAt(t: number): Band | null {
  for (const b of SPAWN.spawn.bands) if (t >= b.from_s && t < b.to_s) return b;
  return null;
}
