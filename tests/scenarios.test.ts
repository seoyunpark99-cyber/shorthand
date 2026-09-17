import { describe, expect, it } from 'vitest';
import { Sim, cheb } from '../src/sim/core';
import { difficultyMultiplier, SPAWN } from '../src/sim/data';
import { buildVocabulary } from '../src/sim/parser';
import type { Enemy } from '../src/sim/types';
import { ids, runSteps, typeSlowly } from './helpers';

function firstGrunt(sim: Sim): Enemy {
  return sim.state.enemies[0];
}

/** 시계를 시작시키고 버퍼를 비운 combat 상태로 만든다 */
function combatSim(seed = 1): Sim {
  const sim = new Sim(seed);
  sim.step([{ kind: 'char', ch: 'x' }]); // 유효 문자('x'는 a-z)이지만 명령 접두어가 아님
  sim.step([{ kind: 'escape' }]);
  expect(sim.state.phase).toBe('combat');
  expect(sim.state.player.buffer).toBe('');
  return sim;
}

describe('시작 상태', () => {
  it('첫 적 (4,5) 시전 8.0, 첫 입력 전 세계 정지', () => {
    const sim = new Sim(1);
    expect(sim.state.phase).toBe('waiting_first_input');
    expect(firstGrunt(sim).cell).toEqual([4, 5]);
    expect(firstGrunt(sim).castRemaining).toBe(8.0);
    runSteps(sim, 40);
    expect(sim.state.clock).toBe(0);
    expect(firstGrunt(sim).castRemaining).toBe(8.0);
  });
  it('첫 문자에 런 시계 시작', () => {
    const sim = new Sim(1);
    const ev = sim.step([{ kind: 'char', ch: 's' }]);
    expect(ids(ev)).toContain('ev.clock_started');
    expect(sim.state.phase).toBe('combat');
    expect(sim.state.clock).toBeCloseTo(0.05);
  });
  it('대표 플레이: slash left. 로 첫 잔병 처치 → 조각 즉시 흡수', () => {
    const sim = new Sim(1);
    const ev = typeSlowly(sim, 'slash left.');
    expect(ids(ev)).toContain('ev.command_complete');
    expect(ids(ev)).toContain('ev.kill');
    expect(ids(ev)).toContain('ev.shard_picked');
    expect(sim.state.player.xp).toBe(1);
    expect(sim.state.enemies.length).toBe(0);
  });
});

describe('S-01 / S-02 동시 도착', () => {
  it('S-01 완성과 만료가 같은 스텝이면 플레이어 우선', () => {
    const sim = combatSim();
    const g = firstGrunt(sim);
    typeSlowly(sim, 'slash left', false);
    g.castRemaining = 0.05;
    g.castStartedStep = -1;
    const ev = sim.step([{ kind: 'enter' }]);
    const list = ids(ev);
    expect(list.indexOf('ev.command_complete')).toBeLessThan(list.indexOf('ev.kill'));
    expect(list).not.toContain('ev.player_hit');
    expect(sim.state.player.hp).toBe(5);
  });
  it('S-02 한 글자 늦음: HP 4, 버퍼 유지, 원인 문구', () => {
    const sim = combatSim();
    const g = firstGrunt(sim);
    typeSlowly(sim, 'slash le', false);
    g.castRemaining = 0.0;
    g.castStartedStep = -1;
    const ev = sim.step([{ kind: 'char', ch: 'f' }]);
    const hit = ev.find((e) => e.id === 'ev.player_hit');
    expect(hit).toBeDefined();
    expect(sim.state.player.hp).toBe(4);
    expect(sim.state.player.buffer).toBe('slash lef');
    expect((hit as { reasonText: string }).reasonText).toBe('왼쪽 잔병, 명령 미완성(9/10자)');
    expect(g.state).toBe('recovery');
  });
});

describe('S-03 이동으로 취소', () => {
  it('m right. 완성 → (6,5), 시전 취소, recovery 1.5초', () => {
    const sim = combatSim();
    const g = firstGrunt(sim);
    const ev = typeSlowly(sim, 'm right.');
    expect(sim.state.player.cell).toEqual([6, 5]);
    const list = ids(ev);
    expect(list.indexOf('ev.move')).toBeLessThan(list.indexOf('ev.cast_cancelled'));
    expect(g.state).toBe('recovery');
    expect(g.recoveryTimer).toBeCloseTo(1.5);
    expect(sim.state.player.hp).toBe(5);
    runSteps(sim, 31);
    expect(g.state).toBe('approach');
  });
});

describe('S-04 추적자 마지막 1초', () => {
  it('locked 상태에서 이동해도 예고 칸이 따라오지 않고 빗나간다', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    const chaser: Enemy = {
      id: 10,
      type: 'chaser',
      cell: [4, 5],
      hp: 2,
      hpMax: 2,
      state: 'cast',
      moveTimer: 0.8,
      castRemaining: 0.9,
      castTotal: 6,
      castStartedStep: -1,
      recoveryTimer: 0,
      recoverySetStep: -1,
      telegraphCells: [[5, 5]],
      castDir: 'left',
      warned: true,
      locked: true,
    };
    sim.state.enemies.push(chaser);
    sim.state.nextEnemyId = 11;
    typeSlowly(sim, 'm right.');
    expect(chaser.telegraphCells).toEqual([[5, 5]]);
    const ev = runSteps(sim, 20);
    const atk = ev.find((e) => e.id === 'ev.enemy_attack') as { hit: boolean } | undefined;
    expect(atk?.hit).toBe(false);
    expect(sim.state.player.hp).toBe(5);
  });
  it('locked 전 인접 안 이동은 예고 칸 갱신', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    const chaser: Enemy = {
      id: 10, type: 'chaser', cell: [4, 5], hp: 2, hpMax: 2, state: 'cast', moveTimer: 0.8,
      castRemaining: 3.0, castTotal: 6, castStartedStep: -1, recoveryTimer: 0, recoverySetStep: -1,
      telegraphCells: [[5, 5]], castDir: 'left', warned: false, locked: false,
    };
    sim.state.enemies.push(chaser);
    sim.state.nextEnemyId = 11;
    typeSlowly(sim, 'm up.');
    expect(sim.state.player.cell).toEqual([5, 4]);
    expect(chaser.telegraphCells).toEqual([[5, 4]]);
    expect(chaser.state).toBe('cast');
    // 인접 밖으로 나가면 취소
    typeSlowly(sim, 'm up.');
    expect(cheb(sim.state.player.cell, chaser.cell)).toBe(2);
    expect(chaser.state).toBe('recovery');
  });
});

describe('S-05 막기 1회', () => {
  it('왼쪽 막기: 첫 공격 막힘, 두 번째 HP -1', () => {
    const sim = combatSim();
    const g1 = firstGrunt(sim);
    const g2: Enemy = { ...g1, id: 2, cell: [4, 4], castDir: 'upleft', telegraphCells: [[5, 5]] };
    sim.state.enemies.push(g2);
    sim.state.nextEnemyId = 3;
    typeSlowly(sim, 'guard left.');
    expect(sim.state.player.guard?.dir).toBe('left');
    g1.castRemaining = 0.05;
    g2.castRemaining = 0.05;
    g1.castStartedStep = g2.castStartedStep = -1;
    // g2 는 왼쪽 위에서 오므로 막기 방향 불일치 → 피격
    const ev = runSteps(sim, 2);
    const list = ids(ev);
    expect(list).toContain('ev.guard_consumed');
    expect(list.indexOf('ev.guard_consumed')).toBeLessThan(list.indexOf('ev.player_hit'));
    expect(sim.state.player.hp).toBe(4);
    const hit = ev.find((e) => e.id === 'ev.player_hit') as { reasonText: string };
    expect(hit.reasonText).toContain('두 번째 공격');
  });
  it('같은 방향 두 공격도 막기는 1회만', () => {
    const sim = combatSim();
    const g1 = firstGrunt(sim);
    const g2: Enemy = { ...g1, id: 2, cell: [4, 5] };
    sim.state.enemies.push(g2);
    sim.state.nextEnemyId = 3;
    typeSlowly(sim, 'guard left.');
    g1.castRemaining = g2.castRemaining = 0.05;
    g1.castStartedStep = g2.castStartedStep = -1;
    runSteps(sim, 2);
    expect(sim.state.player.hp).toBe(4);
  });
});

describe('S-09 사망 우선, S-10 다중 레벨업', () => {
  it('S-09 HP1 피격과 레벨업 조건 동시 → 사망, 레벨업 없음', () => {
    const sim = combatSim();
    sim.state.player.hp = 1;
    const g = firstGrunt(sim);
    g.castRemaining = 0.05;
    g.castStartedStep = -1;
    sim.state.shards.push({ cell: [6, 6], xp: 5 });
    const ev = runSteps(sim, 2);
    expect(sim.state.phase).toBe('result');
    expect(sim.state.result).toBe('death');
    expect(ids(ev)).not.toContain('ev.levelup');
    expect(sim.state.player.level).toBe(1);
  });
  it('S-10 XP 2/3 + 조각 9 → L3, 대기열 2, 초과 4 보존', () => {
    const sim = combatSim();
    sim.state.player.xp = 2;
    sim.state.shards.push({ cell: [6, 6], xp: 9 });
    const ev = runSteps(sim, 1);
    expect(ids(ev).filter((x) => x === 'ev.levelup').length).toBe(2);
    expect(sim.state.player.level).toBe(3);
    expect(sim.state.player.xp).toBe(4);
    expect(sim.state.phase).toBe('levelup');
    expect(sim.state.offer?.cards.map((c) => c.id)).toEqual(['A01', 'A03', 'A06']);
    // 카드 확정 2회 → combat 복귀
    sim.step([{ kind: 'card', index: 0 }]);
    expect(sim.state.phase).toBe('levelup');
    expect(sim.state.player.cards).toEqual([{ id: 'A01', rank: 1 }]);
    expect(sim.state.offer?.cards.length).toBe(3);
    sim.step([{ kind: 'card', index: 2 }]);
    expect(sim.state.phase).toBe('combat');
    expect(sim.state.player.xp).toBe(4);
  });
  it('축약 카드 후 축약 토큰이 실행된다', () => {
    const sim = combatSim();
    sim.state.player.xp = 3;
    sim.state.shards.push({ cell: [5, 6], xp: 0 });
    runSteps(sim, 1);
    expect(sim.state.phase).toBe('levelup');
    sim.step([{ kind: 'card', index: 0 }]); // A01 → sl
    const ev = typeSlowly(sim, 'sl left.');
    expect(ids(ev)).toContain('ev.kill');
  });
});

describe('S-11 회전베기 쿨다운', () => {
  it('Enter 전 완성 상태에서 피격 → "Enter 누르기 전", 잘못된 Enter 는 실패·버퍼 유지', () => {
    const sim = combatSim();
    const g = firstGrunt(sim);
    typeSlowly(sim, 'slash left', false);
    g.castRemaining = 0.0;
    g.castStartedStep = -1;
    const ev = runSteps(sim, 1);
    expect((ev.find((e) => e.id === 'ev.player_hit') as { reasonText: string }).reasonText).toBe('왼쪽 잔병, Enter 누르기 전');
    expect(sim.state.player.buffer).toBe('slash left');
    // 잘못된 명령에 Enter
    sim.step([{ kind: 'escape' }]);
    const ev2 = typeSlowly(sim, 'slash lef');
    expect(ev2.find((e) => e.id === 'ev.command_fail')).toMatchObject({ reason: 'invalid' });
    expect(sim.state.player.buffer).toBe('slash lef');
  });
  it('쿨다운 중 완성 → 실패, 쿨다운 유지, 버퍼 비움', () => {
    const sim = combatSim();
    sim.state.player.skills.push('spin');
    sim.vocab = buildVocabulary([], ['spin']);
    sim.state.player.cooldowns.spin = 2.0;
    const ev = typeSlowly(sim, 'spin left.');
    expect(ev.find((e) => e.id === 'ev.command_fail')).toMatchObject({ reason: 'cooldown' });
    expect(sim.state.player.buffer).toBe('');
    expect(sim.state.player.cooldowns.spin).toBeCloseTo(2.0 - 0.05 * 11);
    expect(sim.state.enemies.length).toBe(1);
  });
  it('쿨다운 0이면 3칸 판정, 쿨다운 4초 시작', () => {
    const sim = combatSim();
    sim.state.player.skills.push('spin');
    sim.vocab = buildVocabulary([], ['spin']);
    const g1 = firstGrunt(sim);
    sim.state.enemies.push({ ...g1, id: 2, cell: [4, 4], castDir: 'upleft' });
    sim.state.enemies.push({ ...g1, id: 3, cell: [4, 6], castDir: 'downleft' });
    sim.state.nextEnemyId = 4;
    const ev = typeSlowly(sim, 'spin left.');
    expect(ids(ev).filter((x) => x === 'ev.kill').length).toBe(3);
    expect(sim.state.player.cooldowns.spin).toBeCloseTo(4.0);
  });
});

describe('S-12 스폰 상한', () => {
  it('max_alive 도달 시 스폰 없음, 다음 interval 재시도, 누적 없음', () => {
    const sim = combatSim();
    const g1 = firstGrunt(sim);
    sim.state.enemies.push({ ...g1, id: 2, cell: [8, 8], state: 'approach', telegraphCells: [] });
    sim.state.nextEnemyId = 3;
    // band0: interval 6, max 2. 6초까지 진행
    const ev = runSteps(sim, 125);
    expect(ids(ev)).not.toContain('ev.spawn_telegraph');
    expect(sim.state.spawnNextAt).toBeCloseTo(12.0, 1);
  });
  it('여유가 있으면 interval 에 예고 1초 후 등장', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    const ev = runSteps(sim, 145); // ~7.3초
    const list = ids(ev);
    expect(list).toContain('ev.spawn_telegraph');
    expect(list).toContain('ev.spawned');
    const tele = ev.find((e) => e.id === 'ev.spawn_telegraph') as { cell: [number, number] };
    expect(cheb(tele.cell, sim.state.player.cell)).toBe(4);
  });
});

describe('S-13/14 보스', () => {
  it('S-13 270초 이후 잔병이 있어도 285초에 등장', () => {
    const sim = combatSim();
    sim.state.clock = 269.9;
    sim.state.spawnNextAt = 270;
    const g = firstGrunt(sim);
    g.state = 'approach';
    g.telegraphCells = [];
    g.cell = [9, 9];
    // 잔병이 접근하지 못하게 멀리 두고 플레이어와 붙어 있을 수 있으니 처치 안 함
    let bossAt = -1;
    for (let i = 0; i < 400; i++) {
      const ev = sim.step([]);
      if (ids(ev).includes('ev.boss_appear')) {
        bossAt = sim.state.clock;
        break;
      }
      // 잔병이 시전하면 빗나가게 플레이어를 움직이지 않고 피격 허용
      if (sim.state.phase === 'levelup') sim.step([{ kind: 'card', index: 0 }]);
      if (sim.state.phase === 'result') break;
    }
    expect(bossAt).toBeGreaterThanOrEqual(284.9);
    expect(bossAt).toBeLessThan(285.2);
    expect(sim.state.enemies.some((e) => e.type === 'grunt')).toBe(true);
  });
  it('일반 적 0이면 270초 직후 등장, 오른쪽 거리 3', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    sim.state.clock = 270;
    sim.state.spawnNextAt = Infinity;
    const ev = runSteps(sim, 1);
    expect(ids(ev)).toContain('ev.boss_appear');
    expect(sim.state.enemies[0].cell).toEqual([8, 5]);
  });
  it('S-14 회복 창에서 thrust 는 피해만, 중단 없음, 회복 유지', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    sim.state.clock = 270;
    sim.state.spawnNextAt = Infinity;
    runSteps(sim, 1);
    const boss = sim.state.enemies[0];
    // 정렬 상태 (8,5) vs (5,5): 거리 3 → 패턴 시작
    const ev = runSteps(sim, 1);
    expect(ids(ev)).toContain('ev.boss_telegraph');
    expect(boss.telegraphCells).toEqual([[7, 5], [6, 5], [5, 5]]);
    // 명중 중단 면역
    const hitEv = typeSlowly(sim, 'thrust right.');
    const hit = hitEv.find((e) => e.id === 'ev.hit') as { interrupted: boolean };
    expect(hit.interrupted).toBe(false);
    expect(boss.hp).toBe(13);
    expect(boss.state).toBe('cast');
    // 회복 창까지 진행: step1 만료 → gap → step2 → recovery
    boss.castRemaining = 0.05;
    let sawRecovery = false;
    for (let i = 0; i < 100; i++) {
      const e = sim.step([]);
      if (ids(e).includes('ev.boss_recovery')) {
        sawRecovery = true;
        break;
      }
      if (boss.state === 'cast' && boss.bossStep === 2 && boss.castRemaining > 0.1) boss.castRemaining = 0.05;
    }
    expect(sawRecovery).toBe(true);
    expect(boss.state).toBe('recovery');
    const before = boss.recoveryTimer;
    typeSlowly(sim, 'thrust right.');
    expect(boss.hp).toBe(12);
    expect(boss.state).toBe('recovery');
    expect(boss.recoveryTimer).toBeCloseTo(before - 0.05 * 14, 5);
  });
  it('보스 처치 → 클리어, 조각 회수, 레벨업 화면 없음', () => {
    const sim = combatSim();
    sim.state.enemies = [];
    sim.state.clock = 270;
    sim.state.spawnNextAt = Infinity;
    runSteps(sim, 1);
    const boss = sim.state.enemies[0];
    boss.hp = 1;
    sim.state.shards.push({ cell: [1, 1], xp: 10 });
    const ev = typeSlowly(sim, 'thrust right.');
    expect(ids(ev)).toContain('ev.run_end');
    expect(sim.state.result).toBe('clear');
    expect(sim.state.player.xp).toBe(10);
    expect(sim.state.phase).toBe('result');
  });
});

describe('S-15 IME / 일시정지', () => {
  it('pause(ime) 중 타이머 정지, 조합 문자 미반영, resume 시 유예 없음', () => {
    const sim = combatSim();
    const g = firstGrunt(sim);
    const before = g.castRemaining;
    sim.step([{ kind: 'pause', reason: 'ime' }]);
    expect(sim.state.phase).toBe('paused');
    runSteps(sim, 20);
    sim.step([{ kind: 'char', ch: 's' }]);
    expect(sim.state.player.buffer).toBe('');
    expect(g.castRemaining).toBeCloseTo(before);
    sim.step([{ kind: 'resume' }]);
    expect(sim.state.phase).toBe('combat');
    sim.step([]);
    expect(g.castRemaining).toBeCloseTo(before - 0.1); // 재개 스텝 + 1스텝, 유예 없음
  });
  it('빈 버퍼 Esc → 일시정지', () => {
    const sim = combatSim();
    sim.step([{ kind: 'escape' }]);
    expect(sim.state.phase).toBe('paused');
    expect(sim.state.pauseReason).toBe('user');
  });
});

describe('S-16 재현성 (T-SIM-01)', () => {
  it('같은 시드·같은 입력 → 같은 해시', () => {
    const run = (seed: number) => {
      const sim = new Sim(seed);
      const script = 'slash left|m right|slash up|guard left|thrust down|';
      let i = 0;
      for (let s = 0; s < 6000 && sim.state.phase !== 'result'; s++) {
        const inputs = s % 6 === 0 && i < script.length ? [script[i] === '|' ? { kind: 'enter' as const } : { kind: 'char' as const, ch: script[i] }] : [];
        if (inputs.length) i++;
        if (sim.state.phase === 'levelup') sim.step([{ kind: 'card', index: s % 3 }]);
        else sim.step(inputs);
      }
      return sim.hash();
    };
    expect(run(12345)).toBe(run(12345));
    expect(run(12345)).not.toBe(run(99999));
  });
});

describe('R-DIFFICULTY (T-DIFF-01)', () => {
  it('M(t) 표 일치', () => {
    // 데이터 파일의 table_reference 와 공식이 일치해야 한다
    for (const row of SPAWN.difficulty.table_reference) expect(difficultyMultiplier(row.t_s)).toBeCloseTo(row.M, 2);
    expect(difficultyMultiplier(0)).toBe(1.0);
    expect(difficultyMultiplier(300)).toBeGreaterThanOrEqual(SPAWN.difficulty.floor_value);
    expect(SPAWN.difficulty.floor_value).toBe(0.3);
  });
});
