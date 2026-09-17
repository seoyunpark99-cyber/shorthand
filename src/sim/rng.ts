// xorshift32 (shift 13,17,5). 시드 0은 1로 대체. cards.json offer_rules.prng 참조.
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = (seed >>> 0) || 1;
  }
  /** 다음 uint32 */
  nextU32(): number {
    let x = this.s;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    this.s = x;
    return x;
  }
  /** 0..n-1, 인덱스 = floor(value / 2^32 * n) */
  index(n: number): number {
    return Math.floor((this.nextU32() / 4294967296) * n);
  }
  /** 0..1 */
  float(): number {
    return this.nextU32() / 4294967296;
  }
  get state(): number {
    return this.s;
  }
}
