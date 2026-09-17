// 50ms 고정 스텝 시뮬레이션. GAME_SPEC 2절 전체. 렌더·오디오·DOM 의존 없음.
import {
  ACTION_BY_ID,
  DIR_BY_ID,
  DIR_KO,
  DIR_ORDER,
  ENEMIES,
  ENEMY_BY_ID,
  SPAWN,
  STEP_S,
  bandAt,
  difficultyMultiplier,
  dirFromVector,
  dirRotate,
  xpNext,
  type ActionId,
  type DirId,
} from './data';
import { applyCard, makeOffer } from './growth';
import { statValue } from './growth';
import { buildVocabulary, isValidChar, MAX_BUFFER, parse, shortestCommand, type Vocabulary } from './parser';
import { Rng } from './rng';
import type { Cell, Enemy, InputEvent, RunState, SimEvent } from './types';

const EPS = 1e-9;
const BOARD_W = SPAWN.board.width;
const BOARD_H = SPAWN.board.height;
const FIRST_ENEMY_CAST_S = 8.0;

export function cellEq(a: Cell, b: Cell): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
export function cheb(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}
export function isWall(c: Cell): boolean {
  return c[0] <= 0 || c[1] <= 0 || c[0] >= BOARD_W - 1 || c[1] >= BOARD_H - 1;
}
export function addDir(c: Cell, d: DirId, k = 1): Cell {
  const v = DIR_BY_ID[d].vector;
  return [c[0] + v[0] * k, c[1] + v[1] * k];
}

export interface SimOptions {
  /** 힌트 표시 등 렌더 전용 값은 sim에 없음. 파라미터 덮어쓰기(봇 튜닝용) */
  paramOverrides?: Partial<{ decay: number; floor: number; stepS: number }>;
}

export class Sim {
  readonly state: RunState;
  vocab: Vocabulary;
  private cardRng: Rng;
  private spawnRng: Rng;
  private offersMade = 0;
  private events: SimEvent[] = [];
  private pausedFrom: RunState['phase'] = 'combat';
  private guardSetStep = -1;
  private cooldownSetStep: Partial<Record<ActionId, number>> = {};

  constructor(seed: number) {
    const s = (seed >>> 0) || 1;
    this.cardRng = new Rng(s ^ 0x9e3779b9);
    this.spawnRng = new Rng(s);
    const start = SPAWN.player.start_cell;
    this.state = {
      seed: s,
      clock: 0,
      step: 0,
      phase: 'waiting_first_input',
      pauseReason: null,
      player: {
        cell: [start[0], start[1]],
        hp: SPAWN.player.hp,
        hpMax: SPAWN.player.hp,
        level: 1,
        xp: 0,
        cards: [],
        skills: [],
        guard: null,
        cooldowns: {},
        buffer: '',
        guardConsumedThisStep: false,
      },
      enemies: [],
      shards: [],
      levelupQueue: 0,
      offer: null,
      spawnNextAt: SPAWN.spawn.bands[0].interval_s,
      spawnTelegraphs: [],
      spawnRetryAt: null,
      nextEnemyId: 1,
      bossSpawned: false,
      result: null,
      kills: 0,
      cardHistory: [],
      hits: [],
      log: [],
    };
    this.vocab = buildVocabulary([], []);
    // 첫 적: (4,5)에 예고 없이 배치, 시전 8.0초, 세계 정지
    const first = this.makeEnemy('grunt', [start[0] - 1, start[1]]);
    first.state = 'cast';
    first.castRemaining = FIRST_ENEMY_CAST_S;
    first.castTotal = FIRST_ENEMY_CAST_S;
    first.castStartedStep = -1;
    first.castDir = 'left';
    first.telegraphCells = [[start[0], start[1]]];
    this.state.enemies.push(first);
  }

  // ───────────────────────── 공개 API ─────────────────────────

  /** 한 스텝 진행. 입력은 도착 순서대로 처리. 이벤트 목록 반환 */
  step(inputs: InputEvent[]): SimEvent[] {
    this.events = [];
    const st = this.state;
    st.player.guardConsumedThisStep = false;

    // 0. 상태 전이 입력(일시정지·재개·카드)은 정지 중에도 처리
    for (const inp of inputs) {
      if (inp.kind === 'pause') this.doPause(inp.reason);
      else if (inp.kind === 'resume') this.doResume();
      else if (inp.kind === 'card') this.doCardSelect(inp.index);
    }

    // 1. 정지 상태면 아무것도 하지 않는다
    if (st.phase === 'paused' || st.phase === 'levelup' || st.phase === 'result') {
      return this.events;
    }

    // 2. 입력 반영·파싱·즉시 행동
    for (const inp of inputs) {
      if (st.phase !== 'combat' && st.phase !== 'waiting_first_input') break;
      if (inp.kind === 'char') this.doChar(inp.ch);
      else if (inp.kind === 'backspace') this.doBackspace();
      else if (inp.kind === 'escape') this.doEscape();
    }
    if ((st.phase as string) === 'paused') return this.events;
    if ((st.phase as string) === 'waiting_first_input') return this.events; // 세계 정지

    // 4. 적 갱신 (스텝 시작 시 살아 있던 적, ID 순)
    const aliveAtStart = st.enemies.filter((e) => e.id < st.nextEnemyId).map((e) => e.id);
    for (const id of aliveAtStart) {
      const e = st.enemies.find((x) => x.id === id);
      if (!e) continue;
      this.updateEnemy(e);
    }

    // 5. 공격 판정
    for (const id of aliveAtStart) {
      const e = st.enemies.find((x) => x.id === id);
      if (!e) continue;
      if (e.state === 'cast' && e.castRemaining <= EPS && e.castStartedStep < st.step) {
        this.resolveAttack(e);
        if ((st.phase as string) === 'result') {
          st.step++;
          return this.events;
        }
      }
    }

    // 6. 타이머 감소
    this.tickTimers();

    // 7. 흡수·레벨업·스폰·보스·클리어
    this.pickupShards();
    this.trySpawn();
    this.tryBoss();
    if (this.checkClear()) {
      st.step++;
      return this.events;
    }

    // 8. 레벨업 대기열
    if (st.levelupQueue > 0) {
      st.phase = 'levelup';
      st.offer = makeOffer(st.player, this.cardRng, this.offersMade === 0);
      this.offersMade++;
    }
    st.step++;
    return this.events;
  }

  /** 재현성 검사용 상태 해시 (FNV-1a 32bit) */
  hash(): string {
    const st = this.state;
    const snapshot = JSON.stringify({
      clock: Math.round(st.clock * 1000),
      step: st.step,
      phase: st.phase,
      player: st.player,
      enemies: st.enemies,
      shards: st.shards,
      kills: st.kills,
      result: st.result,
      cardHistory: st.cardHistory,
    });
    let h = 0x811c9dc5;
    for (let i = 0; i < snapshot.length; i++) {
      h ^= snapshot.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  // ───────────────────────── 입력 처리 ─────────────────────────

  private emit(e: SimEvent) {
    this.events.push(e);
  }

  private log(text: string) {
    this.state.log.push({ t: this.state.clock, text });
  }

  private doPause(reason: 'user' | 'ime' | 'focus') {
    const st = this.state;
    if (st.phase === 'paused' || st.phase === 'result') return;
    if (st.phase === 'levelup') return; // 레벨업 중 무시 (이미 정지)
    this.pausedFrom = st.phase;
    st.phase = 'paused';
    st.pauseReason = reason;
    this.emit({ id: 'ev.pause', reason });
  }

  private doResume() {
    const st = this.state;
    if (st.phase !== 'paused') return;
    st.phase = this.pausedFrom;
    st.pauseReason = null;
    this.emit({ id: 'ev.resume' });
  }

  private doCardSelect(index: number) {
    const st = this.state;
    if (st.phase !== 'levelup' || !st.offer) return;
    const pick = st.offer.cards[index];
    if (!pick) return;
    const applied = applyCard(st.player, pick.id);
    st.cardHistory.push(applied.id);
    this.vocab = buildVocabulary(st.player.cards, st.player.skills);
    this.emit({ id: 'ev.card_applied', cardId: applied.id, rank: applied.rank });
    st.levelupQueue = Math.max(0, st.levelupQueue - 1);
    if (st.levelupQueue > 0) {
      st.offer = makeOffer(st.player, this.cardRng, this.offersMade === 0);
      this.offersMade++;
    } else {
      st.offer = null;
      st.phase = 'combat';
    }
  }

  private emitBuffer() {
    const st = this.state;
    const r = parse(st.player.buffer, this.vocab);
    this.emit({
      id: 'ev.buffer_changed',
      buffer: st.player.buffer,
      validPrefix: r.validPrefix,
      candidates: r.candidates,
      remainingChars: r.remainingChars,
      failText: r.failText,
    });
  }

  private doChar(chRaw: string) {
    const st = this.state;
    const ch = chRaw.toLowerCase();
    if (!isValidChar(ch)) return;
    if (st.player.buffer.length >= MAX_BUFFER) {
      this.emit({ id: 'ev.buffer_changed', buffer: st.player.buffer, validPrefix: false, candidates: [], remainingChars: null, failText: 'overflow' });
      return;
    }
    if (st.phase === 'waiting_first_input') {
      st.phase = 'combat';
      this.emit({ id: 'ev.clock_started' });
    }
    st.player.buffer += ch;
    const r = parse(st.player.buffer, this.vocab);
    if (r.complete) {
      const chars = st.player.buffer.length;
      const cmd = st.player.buffer;
      st.player.buffer = '';
      this.emit({ id: 'ev.command_complete', action: r.complete.action, dir: r.complete.dir, chars });
      this.log(`> ${cmd}`);
      this.execute(r.complete.action, r.complete.dir);
      this.emitBuffer();
    } else {
      this.emitBuffer();
    }
  }

  private doBackspace() {
    const st = this.state;
    if (st.player.buffer.length === 0) return;
    st.player.buffer = st.player.buffer.slice(0, -1);
    this.emitBuffer();
  }

  private doEscape() {
    const st = this.state;
    if (st.player.buffer.length === 0) {
      if (st.phase === 'combat') this.doPause('user');
      return;
    }
    st.player.buffer = '';
    this.emitBuffer();
  }

  // ───────────────────────── 플레이어 행동 ─────────────────────────

  private enemyAt(c: Cell): Enemy | undefined {
    return this.state.enemies.find((e) => cellEq(e.cell, c));
  }

  private isReserved(c: Cell): boolean {
    return this.state.spawnTelegraphs.some((t) => cellEq(t.cell, c));
  }

  private execute(action: ActionId, dir: DirId) {
    const st = this.state;
    const p = st.player;
    switch (action) {
      case 'slash': {
        const target = addDir(p.cell, dir);
        const e = this.enemyAt(target);
        if (!e) {
          this.emit({ id: 'ev.miss', action, cell: target, dir });
          this.emit({ id: 'ev.command_fail', reason: 'no_target' });
          return;
        }
        this.damageEnemy(e, statValue(p, 'slash.damage', ACTION_BY_ID.slash.damage_base!), 'slash');
        return;
      }
      case 'thrust': {
        for (let k = 1; k <= ACTION_BY_ID.thrust.range!; k++) {
          const c = addDir(p.cell, dir, k);
          if (isWall(c)) break;
          const e = this.enemyAt(c);
          if (e) {
            this.damageEnemy(e, ACTION_BY_ID.thrust.damage_base!, 'thrust');
            return;
          }
        }
        this.emit({ id: 'ev.miss', action, cell: addDir(p.cell, dir, ACTION_BY_ID.thrust.range!), dir });
        this.emit({ id: 'ev.command_fail', reason: 'no_target' });
        return;
      }
      case 'guard': {
        const dur = statValue(p, 'guard.duration_s', ACTION_BY_ID.guard.duration_s_base!);
        p.guard = { dir, remaining: dur };
        this.guardSetStep = st.step;
        this.emit({ id: 'ev.guard_set', dir });
        return;
      }
      case 'move': {
        const dest = addDir(p.cell, dir);
        if (isWall(dest) || this.enemyAt(dest) || this.isReserved(dest)) {
          this.emit({ id: 'ev.command_fail', reason: 'blocked' });
          return;
        }
        const from: Cell = [p.cell[0], p.cell[1]];
        p.cell = dest;
        this.emit({ id: 'ev.move', from, to: dest });
        this.afterPlayerMove();
        return;
      }
      case 'spin': {
        const cd = p.cooldowns.spin ?? 0;
        if (cd > EPS) {
          this.emit({ id: 'ev.command_fail', reason: 'cooldown' });
          return;
        }
        p.cooldowns.spin = ACTION_BY_ID.spin.cooldown_s;
        this.cooldownSetStep.spin = st.step;
        const cells = [addDir(p.cell, dirRotate(dir, -1)), addDir(p.cell, dir), addDir(p.cell, dirRotate(dir, 1))];
        const targets = st.enemies.filter((e) => cells.some((c) => cellEq(c, e.cell))).sort((a, b) => a.id - b.id);
        if (targets.length === 0) this.emit({ id: 'ev.miss', action, cell: addDir(p.cell, dir), dir });
        for (const e of targets) this.damageEnemy(e, ACTION_BY_ID.spin.damage_base!, 'spin');
        return;
      }
    }
  }

  /** 3단계: 플레이어 이동 후 고정형 예고 이탈·추적형 갱신 */
  private afterPlayerMove() {
    const st = this.state;
    const p = st.player;
    for (const e of st.enemies) {
      if (e.state !== 'cast') continue;
      const def = ENEMY_BY_ID[e.type];
      if (e.type === 'boss_executor') continue; // 직선 고정
      if (def.targeting === 'tracks_player_until_lock') {
        if (e.locked) continue;
        if (cheb(e.cell, p.cell) === 1) {
          e.telegraphCells = [[p.cell[0], p.cell[1]]];
          e.castDir = dirFromVector(e.cell[0] - p.cell[0], e.cell[1] - p.cell[1]);
        } else {
          this.cancelCast(e);
        }
      } else if (!e.telegraphCells.some((c) => cellEq(c, p.cell))) {
        this.cancelCast(e);
      }
    }
  }

  private cancelCast(e: Enemy) {
    e.state = 'recovery';
    e.recoveryTimer = ENEMIES.common.recovery_s;
    e.recoverySetStep = this.state.step;
    e.telegraphCells = [];
    e.castRemaining = 0;
    e.locked = false;
    this.emit({ id: 'ev.cast_cancelled', enemyId: e.id });
  }

  private damageEnemy(e: Enemy, dmg: number, action: ActionId) {
    const st = this.state;
    e.hp -= dmg;
    const def = ENEMY_BY_ID[e.type];
    if (e.hp <= 0) {
      this.emit({ id: 'ev.hit', enemyId: e.id, damage: dmg, interrupted: false, action, cell: e.cell });
      st.enemies = st.enemies.filter((x) => x.id !== e.id);
      st.kills++;
      this.emit({ id: 'ev.kill', enemyId: e.id, type: e.type, cell: e.cell });
      if (def.xp > 0) this.dropShard(e.cell, def.xp);
      return;
    }
    let interrupted = false;
    if (e.state === 'cast' && ACTION_BY_ID[action].interrupts_cast && !def.interrupt_immune) {
      this.cancelCast(e);
      interrupted = true;
    }
    this.emit({ id: 'ev.hit', enemyId: e.id, damage: dmg, interrupted, action, cell: e.cell });
  }

  private dropShard(cell: Cell, xp: number) {
    const st = this.state;
    let c: Cell = [cell[0], cell[1]];
    if (isWall(c)) c = [Math.min(Math.max(c[0], 1), BOARD_W - 2), Math.min(Math.max(c[1], 1), BOARD_H - 2)];
    const existing = st.shards.find((s) => cellEq(s.cell, c));
    if (existing) existing.xp += xp;
    else st.shards.push({ cell: c, xp });
    this.emit({ id: 'ev.shard_dropped', cell: c, xp });
  }

  // ───────────────────────── 적 ─────────────────────────

  private makeEnemy(type: string, cell: Cell): Enemy {
    const def = ENEMY_BY_ID[type];
    return {
      id: this.state.nextEnemyId++,
      type,
      cell: [cell[0], cell[1]],
      hp: def.hp,
      hpMax: def.hp,
      state: 'approach',
      moveTimer: type === 'boss_executor' ? def.behavior!.move_interval_s : ENEMIES.common.move_interval_s,
      castRemaining: 0,
      castTotal: 0,
      castStartedStep: -1,
      recoveryTimer: 0,
      recoverySetStep: -1,
      telegraphCells: [],
      castDir: null,
      warned: false,
      locked: false,
    };
  }

  private occupiedForPath(c: Cell, self: Enemy): boolean {
    if (isWall(c)) return true;
    if (cellEq(c, this.state.player.cell)) return true;
    if (this.isReserved(c)) return true;
    return this.state.enemies.some((e) => e.id !== self.id && cellEq(e.cell, c));
  }

  /** BFS 8방향 최단 경로의 첫 걸음. 목적지 술어를 만족하는 가장 가까운 칸. 동률은 위부터 시계방향 */
  private firstStepToward(e: Enemy, isGoal: (c: Cell) => boolean): Cell | null {
    const key = (c: Cell) => c[0] * 100 + c[1];
    const start = e.cell;
    if (isGoal(start)) return null;
    const prev = new Map<number, number>();
    const queue: Cell[] = [start];
    prev.set(key(start), -1);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const d of DIR_ORDER) {
        const n = addDir(cur, d);
        const k = key(n);
        if (prev.has(k)) continue;
        if (this.occupiedForPath(n, e)) continue;
        prev.set(k, key(cur));
        if (isGoal(n)) {
          // 역추적
          let c = k;
          let p = prev.get(c)!;
          while (p !== key(start)) {
            c = p;
            p = prev.get(c)!;
          }
          return [Math.floor(c / 100), c % 100];
        }
        queue.push(n);
      }
    }
    return null;
  }

  private countCastingFrom(dir: DirId, except: Enemy): number {
    return this.state.enemies.filter((x) => x.id !== except.id && x.state === 'cast' && x.castDir === dir && x.type !== 'boss_executor').length;
  }

  private updateEnemy(e: Enemy) {
    const st = this.state;
    const p = st.player;
    if (e.type === 'boss_executor') {
      this.updateBoss(e);
      return;
    }
    const def = ENEMY_BY_ID[e.type];
    switch (e.state) {
      case 'approach':
      case 'waiting': {
        if (cheb(e.cell, p.cell) === 1) {
          const dir = dirFromVector(e.cell[0] - p.cell[0], e.cell[1] - p.cell[1])!;
          if (this.countCastingFrom(dir, e) >= ENEMIES.common.cast_cap_same_direction) {
            e.state = 'waiting';
            return;
          }
          e.state = 'cast';
          e.castTotal = def.cast_s_base! * difficultyMultiplier(st.clock);
          e.castRemaining = e.castTotal;
          e.castStartedStep = st.step;
          e.castDir = dir;
          e.telegraphCells = [[p.cell[0], p.cell[1]]];
          e.warned = false;
          e.locked = false;
          this.emit({ id: 'ev.cast_started', enemyId: e.id, dir, remaining: e.castRemaining });
          return;
        }
        e.state = 'approach';
        e.moveTimer -= STEP_S;
        if (e.moveTimer <= EPS) {
          e.moveTimer = ENEMIES.common.move_interval_s;
          const next = this.firstStepToward(e, (c) => cheb(c, p.cell) === 1 && !isWall(c));
          if (next) e.cell = next;
        }
        return;
      }
      case 'cast': {
        if (e.castStartedStep >= st.step) return; // 이번 스텝에 시작
        e.castRemaining -= STEP_S;
        if (!e.warned && e.castRemaining <= 1.0 + EPS) {
          e.warned = true;
          this.emit({ id: 'ev.cast_warning', enemyId: e.id });
        }
        if (def.lock_last_s !== undefined && !e.locked && e.castRemaining <= def.lock_last_s + EPS) e.locked = true;
        return;
      }
      case 'recovery': {
        if (e.recoverySetStep >= st.step) return;
        e.recoveryTimer -= STEP_S;
        if (e.recoveryTimer <= EPS) {
          e.state = 'approach';
          e.moveTimer = ENEMIES.common.move_interval_s;
        }
        return;
      }
    }
  }

  private updateBoss(e: Enemy) {
    const st = this.state;
    const p = st.player;
    const beh = ENEMY_BY_ID.boss_executor.behavior!;
    const pat = beh.pattern_deletion_line;
    const bossM = Math.max(difficultyMultiplier(st.clock), beh.difficulty_floor ?? 0);
    const aligned = (c: Cell) => (c[0] === p.cell[0] || c[1] === p.cell[1]) && cheb(c, p.cell) >= 1 && cheb(c, p.cell) <= 3;
    switch (e.state) {
      case 'approach':
      case 'waiting': {
        if (aligned(e.cell)) {
          // step1: 보스→플레이어 직선 3칸
          const dir = dirFromVector(p.cell[0] - e.cell[0], p.cell[1] - e.cell[1])!;
          e.state = 'cast';
          e.bossStep = 1;
          e.bossLineDir = dir;
          e.castTotal = pat.step1.cast_s_base * bossM;
          e.castRemaining = e.castTotal;
          e.castStartedStep = st.step;
          e.castDir = dirFromVector(e.cell[0] - p.cell[0], e.cell[1] - p.cell[1]);
          e.telegraphCells = [1, 2, 3].map((k) => addDir(e.cell, dir, k)).filter((c) => !isWall(c)) as Cell[];
          e.warned = false;
          this.emit({ id: 'ev.boss_telegraph', step: 1, cells: e.telegraphCells });
          this.emit({ id: 'ev.cast_started', enemyId: e.id, dir: e.castDir, remaining: e.castRemaining });
          return;
        }
        e.state = 'approach';
        e.moveTimer -= STEP_S;
        if (e.moveTimer <= EPS) {
          e.moveTimer = beh.move_interval_s;
          const goals: Cell[] = ([
            [p.cell[0] + 2, p.cell[1]],
            [p.cell[0], p.cell[1] + 2],
            [p.cell[0] - 2, p.cell[1]],
            [p.cell[0], p.cell[1] - 2],
          ] as Cell[]).filter((c) => !isWall(c));
          const next = this.firstStepToward(e, (c) => goals.some((g) => cellEq(g, c)));
          if (next) e.cell = next;
        }
        return;
      }
      case 'cast': {
        if (e.castStartedStep >= st.step) return;
        e.castRemaining -= STEP_S;
        if (!e.warned && e.castRemaining <= 1.0 + EPS) {
          e.warned = true;
          this.emit({ id: 'ev.cast_warning', enemyId: e.id });
        }
        return;
      }
      case 'recovery': {
        if (e.bossStep === 'gap') {
          e.bossGapTimer! -= STEP_S;
          if (e.bossGapTimer! <= EPS) {
            // step2: step1과 직교, 플레이어 현재 칸 중심 3칸
            const perp = dirRotate(e.bossLineDir!, 2);
            const cells: Cell[] = ([addDir(p.cell, perp, -1), [p.cell[0], p.cell[1]] as Cell, addDir(p.cell, perp, 1)] as Cell[]).filter((c) => !isWall(c));
            e.state = 'cast';
            e.bossStep = 2;
            e.castTotal = pat.step2.cast_s_base * bossM;
            e.castRemaining = e.castTotal;
            e.castStartedStep = st.step;
            e.castDir = dirFromVector(e.cell[0] - p.cell[0], e.cell[1] - p.cell[1]);
            e.telegraphCells = cells;
            e.warned = false;
            this.emit({ id: 'ev.boss_telegraph', step: 2, cells });
            this.emit({ id: 'ev.cast_started', enemyId: e.id, dir: e.castDir, remaining: e.castRemaining });
          }
          return;
        }
        if (e.recoverySetStep >= st.step) return;
        e.recoveryTimer -= STEP_S; // 회복에는 난도 미적용
        if (e.recoveryTimer <= EPS) {
          e.state = 'approach';
          e.bossStep = 0;
          e.moveTimer = beh.move_interval_s;
        }
        return;
      }
    }
  }

  // ───────────────────────── 공격 판정 ─────────────────────────

  private resolveAttack(e: Enemy) {
    const st = this.state;
    const p = st.player;
    const def = ENEMY_BY_ID[e.type];
    const isBoss = e.type === 'boss_executor';
    const cells = e.telegraphCells;
    const hit = cells.some((c) => cellEq(c, p.cell));
    const dmg = isBoss ? (e.bossStep === 1 ? def.behavior!.pattern_deletion_line.step1.damage : def.behavior!.pattern_deletion_line.step2.damage) : def.damage;
    const attackDir = e.castDir;
    this.emit({ id: 'ev.enemy_attack', enemyId: e.id, cells, hit });
    if (hit) {
      let blocked = false;
      if (p.guard && attackDir) {
        const guardOk = isBoss && e.bossStep === 2
          ? p.guard.dir === e.bossLineDir || p.guard.dir === dirRotate(e.bossLineDir!, 4) || p.guard.dir === attackDir
          : p.guard.dir === attackDir;
        if (guardOk) {
          blocked = true;
          this.emit({ id: 'ev.guard_consumed', dir: p.guard.dir });
          p.guard = null;
          p.guardConsumedThisStep = true;
        }
      }
      if (!blocked) {
        p.hp = Math.max(0, p.hp - dmg);
        const reason = this.hitReason(e, isBoss);
        st.hits.push({ t: st.clock, text: reason });
        this.log(`✕ ${reason}`);
        this.emit({ id: 'ev.player_hit', enemyId: e.id, damage: dmg, reasonText: reason });
        if (p.hp <= 0) {
          st.result = 'death';
          st.phase = 'result';
          this.emit({ id: 'ev.run_end', result: 'death' });
          return;
        }
      }
    }
    // 공격 후 회복
    e.telegraphCells = [];
    e.locked = false;
    if (isBoss) {
      const pat = def.behavior!.pattern_deletion_line;
      if (e.bossStep === 1) {
        e.state = 'recovery';
        e.bossStep = 'gap';
        e.bossGapTimer = pat.gap_s;
      } else {
        e.state = 'recovery';
        e.bossStep = 'recovery';
        e.recoveryTimer = pat.recovery_s;
        e.recoverySetStep = st.step;
        this.emit({ id: 'ev.boss_recovery' });
      }
    } else {
      e.state = 'recovery';
      e.recoveryTimer = ENEMIES.common.recovery_s;
      e.recoverySetStep = st.step;
    }
  }

  private hitReason(e: Enemy, isBoss: boolean): string {
    const st = this.state;
    const p = st.player;
    if (isBoss) return `집행자 삭제선 ${e.bossStep}`;
    const dirKo = e.castDir ? DIR_KO[e.castDir] : '';
    const enemyKo = ENEMY_BY_ID[e.type].name_ko;
    if (p.guardConsumedThisStep) return `${dirKo} 두 번째 공격, 막기 소모 뒤 도착`;
    if (p.guard) return `${dirKo} ${enemyKo}, 막기 방향 불일치`;
    const r = parse(p.buffer, this.vocab);
    let total: number;
    if (p.buffer.length > 0 && r.validPrefix && r.candidates.length > 0) total = r.candidates[0].length;
    else total = shortestCommand(this.vocab, 'slash', e.castDir ?? 'left').length;
    return `${dirKo} ${enemyKo}, 명령 미완성(${p.buffer.length}/${total}자)`;
  }

  // ───────────────────────── 타이머·스폰·흡수 ─────────────────────────

  private tickTimers() {
    const st = this.state;
    const p = st.player;
    if (p.guard && this.guardSetStep < st.step) {
      p.guard.remaining -= STEP_S;
      if (p.guard.remaining <= EPS) p.guard = null;
    }
    for (const k of Object.keys(p.cooldowns) as ActionId[]) {
      if ((this.cooldownSetStep[k] ?? -1) >= st.step) continue;
      p.cooldowns[k] = Math.max(0, (p.cooldowns[k] ?? 0) - STEP_S);
    }
    for (const t of st.spawnTelegraphs) t.remaining -= STEP_S;
    st.clock += STEP_S;
  }

  private pickupShards() {
    const st = this.state;
    const p = st.player;
    const radius = statValue(p, 'pickup.radius', SPAWN.xp.pickup_radius_base);
    const picked = st.shards.filter((s) => cheb(s.cell, p.cell) <= radius);
    if (picked.length === 0) return;
    st.shards = st.shards.filter((s) => !picked.includes(s));
    for (const s of picked) {
      p.xp += s.xp;
      this.emit({ id: 'ev.shard_picked', cell: s.cell, xp: s.xp });
    }
    this.checkLevelups();
  }

  private checkLevelups() {
    const p = this.state.player;
    while (p.xp >= xpNext(p.level)) {
      p.xp -= xpNext(p.level);
      p.level++;
      this.state.levelupQueue++;
      this.emit({ id: 'ev.levelup', level: p.level });
    }
  }

  private ringCells(center: Cell, d: number): Cell[] {
    // 왼쪽 위부터 시계방향
    const cells: Cell[] = [];
    for (let x = -d; x <= d; x++) cells.push([center[0] + x, center[1] - d]);
    for (let y = -d + 1; y <= d; y++) cells.push([center[0] + d, center[1] + y]);
    for (let x = d - 1; x >= -d; x--) cells.push([center[0] + x, center[1] + d]);
    for (let y = d - 1; y >= -d + 1; y--) cells.push([center[0] - d, center[1] + y]);
    return cells;
  }

  private freeSpawnCell(c: Cell): boolean {
    if (isWall(c)) return false;
    if (cellEq(c, this.state.player.cell)) return false;
    if (this.enemyAt(c)) return false;
    if (this.isReserved(c)) return false;
    return true;
  }

  private pickSpawnCell(): Cell | null {
    const p = this.state.player.cell;
    for (const d of [SPAWN.spawn.distance_chebyshev, SPAWN.spawn.fallback_distance]) {
      const ring = this.ringCells(p, d);
      const start = this.spawnRng.index(ring.length);
      for (let i = 0; i < ring.length; i++) {
        const c = ring[(start + i) % ring.length];
        if (this.freeSpawnCell(c)) return c;
      }
    }
    return null;
  }

  private normalAliveCount(): number {
    return this.state.enemies.filter((e) => e.type !== 'boss_executor').length + this.state.spawnTelegraphs.length;
  }

  private trySpawn() {
    const st = this.state;
    // 예고 완료 → 등장
    const due = st.spawnTelegraphs.filter((t) => t.remaining <= EPS);
    for (const t of due) {
      st.spawnTelegraphs = st.spawnTelegraphs.filter((x) => x !== t);
      const e = this.makeEnemy(t.type, t.cell);
      st.enemies.push(e);
      this.emit({ id: 'ev.spawned', enemyId: e.id, type: t.type, cell: t.cell });
    }
    // 새 시도
    const band = bandAt(st.clock);
    const attemptDue = st.clock + EPS >= st.spawnNextAt || (st.spawnRetryAt !== null && st.clock + EPS >= st.spawnRetryAt);
    if (!attemptDue) return;
    st.spawnRetryAt = null;
    if (!band || band.max_alive === 0 || band.interval_s <= 0) {
      st.spawnNextAt = Infinity;
      return;
    }
    if (st.clock + EPS >= st.spawnNextAt) st.spawnNextAt = st.clock + band.interval_s;
    if (this.normalAliveCount() >= band.max_alive) return; // 건너뜀, 누적 없음
    // 종류
    const r = this.spawnRng.float();
    let acc = 0;
    let type = band.pool[band.pool.length - 1][0];
    for (const [t, w] of band.pool) {
      acc += w;
      if (r < acc) {
        type = t;
        break;
      }
    }
    const cell = this.pickSpawnCell();
    if (!cell) {
      st.spawnRetryAt = st.clock + 0.5;
      return;
    }
    st.spawnTelegraphs.push({ cell, type, remaining: SPAWN.spawn.telegraph_s });
    this.emit({ id: 'ev.spawn_telegraph', cell, type });
  }

  private tryBoss() {
    const st = this.state;
    const def = ENEMY_BY_ID.boss_executor;
    if (st.bossSpawned || st.clock + EPS < def.first_appear_s) return;
    const normals = this.normalAliveCount();
    if (normals > 0 && st.clock + EPS < 285) return;
    // 위치: 플레이어 오른쪽 거리 3, 막히면 시계방향 다음 방향
    const p = st.player.cell;
    let cell: Cell | null = null;
    let d: DirId = 'right';
    for (let i = 0; i < 8; i++) {
      const c = addDir(p, d, 3);
      if (this.freeSpawnCell(c)) {
        cell = c;
        break;
      }
      d = dirRotate(d, 1);
    }
    if (!cell) cell = this.pickSpawnCell() ?? addDir(p, 'right', 2);
    const boss = this.makeEnemy('boss_executor', cell);
    boss.bossStep = 0;
    st.enemies.push(boss);
    st.bossSpawned = true;
    st.spawnTelegraphs = [];
    this.emit({ id: 'ev.boss_appear', enemyId: boss.id, cell });
  }

  private checkClear(): boolean {
    const st = this.state;
    if (!st.bossSpawned) return false;
    if (st.enemies.some((e) => e.type === 'boss_executor')) return false;
    // 남은 조각 일괄 회수, 레벨업 화면 없음
    for (const s of st.shards) {
      st.player.xp += s.xp;
      this.emit({ id: 'ev.shard_picked', cell: s.cell, xp: s.xp });
    }
    st.shards = [];
    st.levelupQueue = 0;
    st.result = 'clear';
    st.phase = 'result';
    this.emit({ id: 'ev.run_end', result: 'clear' });
    return true;
  }
}
