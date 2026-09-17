// XP·레벨·카드 후보·적용. cards.json offer_rules, GAME_SPEC R-OFFER.
import { CARDS, CARD_BY_ID, type CardDef } from './data';
import { Rng } from './rng';
import type { CardOffer, PlayerState } from './types';

const EMERGENCY_ID = 'EMERGENCY';

function rankOf(p: PlayerState, id: string): number {
  return p.cards.find((c) => c.id === id)?.rank ?? 0;
}

function requiresMet(p: PlayerState, card: CardDef): boolean {
  for (const group of card.requires) {
    if (!group.some((id) => rankOf(p, id) >= 1)) return false;
  }
  return true;
}

export function eligible(p: PlayerState, card: CardDef): boolean {
  if (rankOf(p, card.id) >= card.max_rank) return false;
  if (!requiresMet(p, card)) return false;
  if (card.requires_skill_absent && p.skills.includes(card.requires_skill_absent as never)) return false;
  if (card.effect_type === 'unlock' && p.skills.length >= 1) return false; // 슬롯 1
  return true;
}

function pick(rng: Rng, pool: CardDef[]): CardDef | null {
  if (pool.length === 0) return null;
  return pool[rng.index(pool.length)];
}

export function makeOffer(p: PlayerState, rng: Rng, isFirst: boolean): CardOffer {
  if (isFirst) {
    const ids = CARDS.offer_rules.first_offer_fixed;
    return { cards: ids.map((id) => ({ id, rank: rankOf(p, id) + 1 })), emergency: false };
  }
  const all = CARDS.cards.filter((c) => eligible(p, c));
  const chosen: CardDef[] = [];
  const take = (filter: (c: CardDef) => boolean, fallback: (c: CardDef) => boolean) => {
    const notChosen = (c: CardDef) => !chosen.includes(c);
    let pool = all.filter((c) => notChosen(c) && filter(c));
    if (pool.length === 0) pool = all.filter((c) => notChosen(c) && fallback(c));
    if (pool.length === 0) pool = all.filter(notChosen);
    const c = pick(rng, pool);
    if (c) chosen.push(c);
  };
  const abbr = (c: CardDef) => c.category === 'abbreviation';
  const perf = (c: CardDef) => c.category === 'performance';
  // 슬롯 1: 축약(동작 또는 문법 선호)
  take((c) => abbr(c) && (c.subgroup === 'action' || c.subgroup === 'grammar'), abbr);
  // 슬롯 2: 축약(방향 또는 문법 선호), 슬롯 1과 다르게
  const s1 = chosen[0];
  take((c) => abbr(c) && (c.subgroup === 'direction' || c.subgroup === 'grammar') && c.subgroup !== s1?.subgroup, abbr);
  // 슬롯 3: 성능
  take(perf, perf);
  if (chosen.length === 0) {
    return { cards: [{ id: EMERGENCY_ID, rank: 1 }], emergency: true };
  }
  return { cards: chosen.map((c) => ({ id: c.id, rank: rankOf(p, c.id) + 1 })), emergency: false };
}

export function applyCard(p: PlayerState, id: string): { id: string; rank: number } {
  if (id === EMERGENCY_ID) {
    p.hp = Math.min(p.hpMax, p.hp + 1);
    return { id, rank: 1 };
  }
  const card = CARD_BY_ID[id];
  const existing = p.cards.find((c) => c.id === id);
  const rank = (existing?.rank ?? 0) + 1;
  if (existing) existing.rank = rank;
  else p.cards.push({ id, rank });
  if (card.effect_type === 'unlock') {
    if (!p.skills.includes(card.target as never)) p.skills.push(card.target as never);
  } else if (card.effect_type === 'max_hp_plus_heal') {
    const v = card.rank_values[rank - 1] as number;
    p.hpMax = v;
    p.hp = Math.min(p.hpMax, p.hp + 1);
  }
  return { id, rank };
}

/** 성능 카드의 현재 절대값 (없으면 base) */
export function statValue(p: PlayerState, target: string, base: number): number {
  for (const c of CARDS.cards) {
    if (c.effect_type !== 'absolute_stat' || c.target !== target) continue;
    const r = rankOf(p, c.id);
    if (r >= 1) return c.rank_values[r - 1] as number;
  }
  return base;
}

export { EMERGENCY_ID };
