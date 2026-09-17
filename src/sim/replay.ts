// 입력·시각 기록과 재생. T-SIM-01. 키는 sim.step() 호출 순번(정지 중 호출 포함).
import { Sim } from './core';
import { SPEC_VERSION } from './data';
import type { InputEvent } from './types';

export interface ReplayFile {
  seed: number;
  spec_version: string;
  inputs: { call: number; input: InputEvent }[];
  total_calls: number;
  final_hash?: string;
}

export class Recorder {
  readonly file: ReplayFile;
  private calls = 0;
  constructor(seed: number) {
    this.file = { seed, spec_version: SPEC_VERSION, inputs: [], total_calls: 0 };
  }
  /** sim.step 호출 직전에 부른다 */
  record(inputs: InputEvent[]) {
    for (const input of inputs) this.file.inputs.push({ call: this.calls, input });
    this.calls++;
    this.file.total_calls = this.calls;
  }
  finish(sim: Sim) {
    this.file.final_hash = sim.hash();
  }
}

export function replay(file: ReplayFile): { hash: string; match: boolean | null; specMismatch: boolean } {
  const sim = new Sim(file.seed);
  const byCall = new Map<number, InputEvent[]>();
  for (const { call, input } of file.inputs) {
    if (!byCall.has(call)) byCall.set(call, []);
    byCall.get(call)!.push(input);
  }
  for (let c = 0; c < file.total_calls; c++) sim.step(byCall.get(c) ?? []);
  const hash = sim.hash();
  return { hash, match: file.final_hash ? hash === file.final_hash : null, specMismatch: file.spec_version !== SPEC_VERSION };
}
