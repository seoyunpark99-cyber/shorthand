import { Sim } from '../src/sim/core';
import type { InputEvent, SimEvent } from '../src/sim/types';

export function chars(s: string): InputEvent[] {
  return [...s].map((ch) => ({ kind: 'char', ch }));
}

/** 문자열을 한 스텝에 한 글자씩 입력 */
export function typeSlowly(sim: Sim, s: string): SimEvent[] {
  const all: SimEvent[] = [];
  for (const ch of s) all.push(...sim.step([{ kind: 'char', ch }]));
  return all;
}

export function runSteps(sim: Sim, n: number): SimEvent[] {
  const all: SimEvent[] = [];
  for (let i = 0; i < n; i++) all.push(...sim.step([]));
  return all;
}

export function ids(events: SimEvent[]): string[] {
  return events.map((e) => e.id);
}

/** 첫 입력 전 세계 정지 상태에서 시작. 시계를 굴리려면 첫 문자를 넣는다 */
export function started(seed = 1): Sim {
  const sim = new Sim(seed);
  return sim;
}
