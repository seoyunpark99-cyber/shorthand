// 가상 플레이어(WPM·반응·정책) 헤드리스 실행. GAME_SPEC 6절 난이도 표·T-SIM-BOT.
import { Sim, addDir, cheb, isWall } from './core';
import { CARD_BY_ID, DIR_ORDER, dirFromVector, type ActionId, type DirId } from './data';
import { shortestCommand } from './parser';
import type { Enemy, InputEvent } from './types';

export type Policy = 'abbr-first' | 'perf-first' | 'dodge-only';

export interface BotParams {
  wpm: number;
  reactionS: number;
  policy: Policy;
  seed: number;
  maxSteps?: number;
  trace?: (line: string) => void;
}

export interface BotResult {
  seed: number;
  result: 'clear' | 'death' | 'timeout';
  survivedS: number;
  level: number;
  kills: number;
  cards: string[];
  lastHit: string | null;
  bossReached: boolean;
  hits: { t: number; text: string }[];
}

const ABBR_PRIORITY = ['A01', 'A03', 'A04', 'A05', 'A18', 'A02', 'A16', 'A17', 'A11'];

function chooseCard(sim: Sim, policy: Policy): number {
  const offer = sim.state.offer!;
  if (offer.emergency) return 0;
  const ids = offer.cards.map((c) => c.id);
  if (policy === 'perf-first') {
    const i = ids.findIndex((id) => CARD_BY_ID[id]?.category === 'performance');
    return i >= 0 ? i : 0;
  }
  if (policy === 'abbr-first') {
    for (const pid of ABBR_PRIORITY) {
      const i = ids.indexOf(pid);
      if (i >= 0) return i;
    }
    const i = ids.findIndex((id) => CARD_BY_ID[id]?.category === 'abbreviation');
    return i >= 0 ? i : 0;
  }
  return 0;
}

function threatens(e: Enemy, cell: [number, number]): boolean {
  return e.state === 'cast' && e.telegraphCells.some((c) => c[0] === cell[0] && c[1] === cell[1]);
}

/** 위협 칸이 아닌 빈 인접 칸으로 이동 방향. 명령이 짧은 방향을 우선, 그다음 인접 적이 적은 칸 */
function dodgeDir(sim: Sim): DirId | null {
  const st = sim.state;
  const p = st.player.cell;
  let best: { d: DirId; len: number; score: number } | null = null;
  for (const d of DIR_ORDER) {
    const c = addDir(p, d);
    if (isWall(c)) continue;
    if (st.enemies.some((e) => e.cell[0] === c[0] && e.cell[1] === c[1])) continue;
    if (st.spawnTelegraphs.some((t) => t.cell[0] === c[0] && t.cell[1] === c[1])) continue;
    if (st.enemies.some((e) => threatens(e, c))) continue;
    const adj = st.enemies.filter((e) => cheb(e.cell, c) === 1).length;
    const len = shortestCommand(sim.vocab, 'move', d).length;
    const score = -adj * 10 - cheb(c, [5, 5]);
    if (!best || len < best.len || (len === best.len && score > best.score)) best = { d, len, score };
  }
  return best?.d ?? null;
}

function decide(sim: Sim, policy: Policy, secPerChar: number, reactionS: number): { cmd: string; targetKey: string } | null {
  const st = sim.state;
  const cost = (c: string) => reactionS + (c.length + 1) * secPerChar; // +1 Enter
  const p = st.player.cell;
  const enemies = st.enemies;
  const dirTo = (e: Enemy) => dirFromVector(e.cell[0] - p[0], e.cell[1] - p[1]);
  const cmd = (a: ActionId, d: DirId) => shortestCommand(sim.vocab, a, d);
  const out = (c: string | null, key: string) => (c ? { cmd: c, targetKey: key } : null);

  if (policy === 'dodge-only') {
    const threat = enemies.find((e) => threatens(e, p));
    if (!threat) return null;
    const d = dodgeDir(sim);
    return out(d ? cmd('move', d) : null, `dodge:${threat.id}`);
  }

  const adjacent = enemies.filter((e) => cheb(e.cell, p) === 1 && e.type !== 'boss_executor');
  const threats = adjacent.filter((e) => threatens(e, p)).sort((a, b) => a.castRemaining - b.castRemaining);
  const target = threats[0] ?? adjacent.sort((a, b) => a.hp - b.hp)[0];
  if (target) {
    const d = dirTo(target)!;
    let attack = cmd('slash', d);
    // 회전베기: 인접 적 2 이상이고 준비됨
    if (st.player.skills.includes('spin') && (st.player.cooldowns.spin ?? 0) <= 0 && adjacent.length >= 2) {
      const sp = cmd('spin', d);
      if (sp.length <= attack.length + 2) attack = sp;
    }
    if (threats[0]) {
      const budget = threats[0].castRemaining;
      if (cost(attack) > budget) {
        // 못 맞추면 비켜서기(짧으면) 또는 막기
        const dd = dodgeDir(sim);
        const mv = dd ? cmd('move', dd) : null;
        if (mv && cost(mv) <= budget && mv.length < attack.length) return out(mv, `dodge:${threats[0].id}`);
        const gd = cmd('guard', d);
        if (!st.player.guard && cost(gd) <= budget && gd.length < attack.length) return out(gd, `guard:${threats[0].id}`);
      }
    }
    return out(attack, `atk:${target.id}`);
  }
  const boss = enemies.find((e) => e.type === 'boss_executor');
  if (boss) {
    const aligned = boss.cell[0] === p[0] || boss.cell[1] === p[1];
    const dist = cheb(boss.cell, p);
    if (threatens(boss, p)) {
      // 찌르기 후에도 피할 시간이 남으면 찌르고, 아니면 지금 피한다
      const dd = dodgeDir(sim);
      const mv = dd ? cmd('move', dd) : null;
      const th = aligned && dist <= 3 ? cmd('thrust', dirTo(boss)!) : null;
      if (mv && th && boss.castRemaining >= cost(th) + cost(mv) + 0.2) return out(th, `atk:boss`);
      if (mv) return out(mv, `dodge:boss:${boss.bossStep}`);
    }
    if (aligned && dist <= 3) return out(cmd('thrust', dirTo(boss)!), `atk:boss`);
    // 정렬을 위해 보스 쪽으로 이동 (보스 예고 칸 피함)
    const d = dodgeDirToward(sim, boss.cell);
    if (d) return out(cmd('move', d), `approach:boss`);
    return null;
  }
  // 조각 수집
  if (st.shards.length > 0 && enemies.every((e) => cheb(e.cell, p) > 2)) {
    const nearest = st.shards.slice().sort((a, b) => cheb(a.cell, p) - cheb(b.cell, p))[0];
    const d = dodgeDirToward(sim, nearest.cell);
    if (d) return out(cmd('move', d), `shard`);
  }
  return null;
}

function dodgeDirToward(sim: Sim, goal: [number, number]): DirId | null {
  const st = sim.state;
  const p = st.player.cell;
  let best: { d: DirId; dist: number } | null = null;
  for (const d of DIR_ORDER) {
    const c = addDir(p, d);
    if (isWall(c)) continue;
    if (st.enemies.some((e) => e.cell[0] === c[0] && e.cell[1] === c[1])) continue;
    if (st.spawnTelegraphs.some((t) => t.cell[0] === c[0] && t.cell[1] === c[1])) continue;
    if (st.enemies.some((e) => threatens(e, c))) continue;
    const dist = cheb(c, goal);
    if (!best || dist < best.dist) best = { d, dist };
  }
  return best && best.dist < cheb(p, goal) ? best.d : null;
}

export function runBot(params: BotParams): BotResult {
  const sim = new Sim(params.seed);
  const secPerChar = 60 / (params.wpm * 5);
  const ENTER = '\n'; // CR-05: 명령 끝에 Enter (1타 비용)
  const maxSteps = params.maxSteps ?? 8000;
  let queue: string[] = [];
  let nextKeyAt = 0; // 시뮬 시계 기준
  let lastHit: string | null = null;
  let bossReached = false;
  let idleUntil = 0;
  // 첫 입력 전에는 시계가 0이므로 봇 자체 시계를 스텝으로 관리
  let botClock = 0;
  let lastKey = '';
  for (let s = 0; s < maxSteps; s++) {
    const st = sim.state;
    if (st.phase === 'result') break;
    if (st.phase === 'levelup') {
      sim.step([{ kind: 'card', index: chooseCard(sim, params.policy) }]);
      continue;
    }
    const inputs: InputEvent[] = [];
    if (queue.length === 0 && botClock >= idleUntil) {
      const c = decide(sim, params.policy, secPerChar, params.reactionS);
      if (c) {
        params.trace?.(`${botClock.toFixed(2)} decide ${c.cmd} (${c.targetKey}) p=${st.player.cell} clock=${st.clock.toFixed(1)}`);
        queue = [...c.cmd, ENTER];
        // 반응 시간은 새 상황(대상 변경)에만 적용. 같은 대상에 대한 연속 입력은 즉시
        nextKeyAt = botClock + (c.targetKey === lastKey ? secPerChar : params.reactionS);
        lastKey = c.targetKey;
      } else {
        idleUntil = botClock + 0.1;
      }
    }
    if (queue.length > 0 && botClock + 1e-9 >= nextKeyAt) {
      const k = queue.shift()!;
      inputs.push(k === ENTER ? { kind: 'enter' } : { kind: 'char', ch: k });
      nextKeyAt = botClock + secPerChar;
    }
    const ev = sim.step(inputs);
    for (const e of ev) {
      if (e.id === 'ev.player_hit') lastHit = e.reasonText;
      if (e.id === 'ev.boss_appear') bossReached = true;
      if (e.id === 'ev.command_fail' || e.id === 'ev.cast_cancelled') {
        // 상황이 바뀌면 남은 입력을 버리고 다시 판단
        queue = [];
      }
    }
    if (st.phase === 'combat') botClock += 0.05;
    else if (st.phase === 'waiting_first_input') botClock += 0.05;
  }
  const st = sim.state;
  return {
    seed: params.seed,
    result: st.result ?? 'timeout',
    survivedS: st.clock,
    level: st.player.level,
    kills: st.kills,
    cards: st.cardHistory,
    lastHit,
    bossReached,
    hits: st.hits,
  };
}

export interface BotSummary {
  wpm: number;
  reactionS: number;
  policy: Policy;
  runs: number;
  clearRate: number;
  survive3minRate: number;
  avgSurvivedS: number;
  avgLevel: number;
  avgKills: number;
  bossReachedRate: number;
  results: BotResult[];
}

export function runBotBatch(wpm: number, reactionS: number, policy: Policy, seeds: number[]): BotSummary {
  const results = seeds.map((seed) => runBot({ wpm, reactionS, policy, seed }));
  const n = results.length;
  return {
    wpm,
    reactionS,
    policy,
    runs: n,
    clearRate: results.filter((r) => r.result === 'clear').length / n,
    survive3minRate: results.filter((r) => r.survivedS >= 180 || r.result === 'clear').length / n,
    avgSurvivedS: results.reduce((a, r) => a + r.survivedS, 0) / n,
    avgLevel: results.reduce((a, r) => a + r.level, 0) / n,
    avgKills: results.reduce((a, r) => a + r.kills, 0) / n,
    bossReachedRate: results.filter((r) => r.bossReached).length / n,
    results,
  };
}
