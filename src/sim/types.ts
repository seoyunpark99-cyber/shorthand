import type { ActionId, DirId } from './data';

export type Cell = [number, number];

export type Phase = 'waiting_first_input' | 'combat' | 'levelup' | 'paused' | 'result';

export type EnemyState = 'approach' | 'cast' | 'recovery' | 'waiting';

export interface Enemy {
  id: number;
  type: string; // grunt | rapid | chaser | boss_executor
  cell: Cell;
  hp: number;
  hpMax: number;
  state: EnemyState;
  /** approach 이동 타이머 */
  moveTimer: number;
  /** cast remaining 초 */
  castRemaining: number;
  castTotal: number;
  /** 시전 시작 스텝 (이번 스텝에 시작한 시전은 줄이지 않기 위해) */
  castStartedStep: number;
  recoveryTimer: number;
  /** recovery 로 바뀐 스텝 (그 스텝에는 줄이지 않음) */
  recoverySetStep: number;
  telegraphCells: Cell[];
  /** 플레이어 기준 적의 방향 (시전 방향) */
  castDir: DirId | null;
  warned: boolean;
  /** 추적자: 마지막 1초 고정 여부 */
  locked: boolean;
  // 보스 전용
  bossStep?: 0 | 1 | 2 | 'gap' | 'recovery';
  bossGapTimer?: number;
  bossLineDir?: DirId;
}

export interface Shard {
  cell: Cell;
  xp: number;
}

export interface Guard {
  dir: DirId;
  remaining: number;
}

export interface OwnedCard {
  id: string;
  rank: number;
}

export interface PlayerState {
  cell: Cell;
  hp: number;
  hpMax: number;
  level: number;
  xp: number;
  cards: OwnedCard[];
  skills: ActionId[];
  guard: Guard | null;
  cooldowns: Partial<Record<ActionId, number>>;
  buffer: string;
  /** 이번 스텝에 막기를 소모했는가 (피격 원인 문구용) */
  guardConsumedThisStep: boolean;
}

export interface SpawnTelegraph {
  cell: Cell;
  type: string;
  remaining: number;
}

export interface CardOffer {
  cards: { id: string; rank: number }[]; // rank = 적용될 랭크(1-based)
  emergency: boolean;
}

export interface RunState {
  seed: number;
  clock: number; // 초
  step: number;
  phase: Phase;
  pauseReason: 'user' | 'ime' | 'focus' | null;
  player: PlayerState;
  enemies: Enemy[];
  shards: Shard[];
  levelupQueue: number;
  offer: CardOffer | null;
  spawnNextAt: number;
  spawnTelegraphs: SpawnTelegraph[];
  spawnRetryAt: number | null;
  nextEnemyId: number;
  bossSpawned: boolean;
  result: 'clear' | 'death' | null;
  kills: number;
  cardHistory: string[];
  hits: { t: number; text: string }[];
  /** 마지막 10초 기록 (명령·피격) */
  log: { t: number; text: string }[];
}

export type InputEvent =
  | { kind: 'char'; ch: string }
  | { kind: 'backspace' }
  | { kind: 'escape' }
  | { kind: 'card'; index: number } // 0..2 확정
  | { kind: 'pause'; reason: 'user' | 'ime' | 'focus' }
  | { kind: 'resume' };

export type SimEvent =
  | { id: 'ev.buffer_changed'; buffer: string; validPrefix: boolean; candidates: string[]; remainingChars: number | null; failText: string | null }
  | { id: 'ev.command_complete'; action: ActionId; dir: DirId; chars: number }
  | { id: 'ev.command_fail'; reason: 'no_target' | 'cooldown' | 'blocked' }
  | { id: 'ev.hit'; enemyId: number; damage: number; interrupted: boolean; action: ActionId; cell: Cell }
  | { id: 'ev.miss'; action: ActionId; cell: Cell; dir: DirId }
  | { id: 'ev.kill'; enemyId: number; type: string; cell: Cell }
  | { id: 'ev.move'; from: Cell; to: Cell }
  | { id: 'ev.guard_set'; dir: DirId }
  | { id: 'ev.guard_consumed'; dir: DirId }
  | { id: 'ev.cast_started'; enemyId: number; dir: DirId | null; remaining: number }
  | { id: 'ev.cast_cancelled'; enemyId: number }
  | { id: 'ev.cast_warning'; enemyId: number }
  | { id: 'ev.enemy_attack'; enemyId: number; cells: Cell[]; hit: boolean }
  | { id: 'ev.player_hit'; enemyId: number; damage: number; reasonText: string }
  | { id: 'ev.shard_dropped'; cell: Cell; xp: number }
  | { id: 'ev.shard_picked'; cell: Cell; xp: number }
  | { id: 'ev.levelup'; level: number }
  | { id: 'ev.card_applied'; cardId: string; rank: number }
  | { id: 'ev.spawn_telegraph'; cell: Cell; type: string }
  | { id: 'ev.spawned'; enemyId: number; type: string; cell: Cell }
  | { id: 'ev.boss_appear'; enemyId: number; cell: Cell }
  | { id: 'ev.boss_telegraph'; step: 1 | 2; cells: Cell[] }
  | { id: 'ev.boss_recovery' }
  | { id: 'ev.run_end'; result: 'clear' | 'death' }
  | { id: 'ev.pause'; reason: 'user' | 'ime' | 'focus' }
  | { id: 'ev.resume' }
  | { id: 'ev.clock_started' };
