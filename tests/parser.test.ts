import { describe, expect, it } from 'vitest';
import { buildVocabulary, parse, shortestCommand } from '../src/sim/parser';

describe('parser (T-PARSE)', () => {
  it('완성 명령: slash left. 11자', () => {
    const v = buildVocabulary([], []);
    const r = parse('slash left.', v);
    expect(r.complete).toEqual({ action: 'slash', dir: 'left' });
  });
  it('S-06 미보유 축약 sl left. 은 실행되지 않고 안내', () => {
    const v = buildVocabulary([], []);
    const r = parse('sl left.', v);
    expect(r.complete).toBeNull();
    expect(r.validPrefix).toBe(false);
    expect(r.failText).toBe('sl: 미보유 축약');
  });
  it('S-07 접두어: slash up 은 up. 필요, upleft. 대기', () => {
    const v = buildVocabulary([], []);
    const r = parse('slash up', v);
    expect(r.complete).toBeNull();
    expect(r.validPrefix).toBe(true);
    expect(r.candidates).toContain('slash up.');
    expect(r.candidates).toContain('slash upleft.');
    expect(parse('slash up.', v).complete).toEqual({ action: 'slash', dir: 'up' });
  });
  it('S-08 공백 생략: A05+A01r2+A03 → s4 실행 (2자)', () => {
    const v = buildVocabulary([{ id: 'A01', rank: 2 }, { id: 'A03', rank: 1 }, { id: 'A05', rank: 1 }], []);
    expect(parse('s4', v).complete).toEqual({ action: 'slash', dir: 'left' });
    expect(parse('s 4', v).complete).toEqual({ action: 'slash', dir: 'left' });
    expect(parse('sl left.', v).complete).toEqual({ action: 'slash', dir: 'left' });
  });
  it('A05 미보유 시 공백 필수', () => {
    const v = buildVocabulary([{ id: 'A01', rank: 2 }, { id: 'A03', rank: 1 }], []);
    expect(parse('s4', v).complete).toBeNull();
    expect(parse('s 4', v).complete).toEqual({ action: 'slash', dir: 'left' });
  });
  it('방향 숫자 단독은 명령이 아니다', () => {
    const v = buildVocabulary([{ id: 'A03', rank: 1 }], []);
    expect(parse('4', v).complete).toBeNull();
    expect(parse('m 4', v).complete).toEqual({ action: 'move', dir: 'left' });
  });
  it('spin 은 A10 없으면 어휘에 없음', () => {
    expect(parse('spin left.', buildVocabulary([], [])).complete).toBeNull();
    expect(parse('spin left.', buildVocabulary([], ['spin'])).complete).toEqual({ action: 'spin', dir: 'left' });
  });
  it('남은 글자 계산', () => {
    const v = buildVocabulary([], []);
    expect(parse('slash lef', v).remainingChars).toBe(2);
    expect(shortestCommand(v, 'slash', 'left')).toBe('slash left.');
  });
});
