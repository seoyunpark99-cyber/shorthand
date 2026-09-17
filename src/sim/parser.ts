// 버퍼 → 명령 파싱. 보유 축약을 반영하고 후보·남은 글자를 계산한다. GAME_SPEC 2.3, commands.json parsing_rules.
import { ACTION_BY_ID, CARD_BY_ID, COMMANDS, DIRS, type ActionId, type DirId } from './data';
import type { OwnedCard } from './types';

export interface ParseResult {
  complete: { action: ActionId; dir: DirId } | null;
  validPrefix: boolean;
  candidates: string[];
  remainingChars: number | null;
  /** 미보유 축약 등 실패 안내 */
  failText: string | null;
}

export interface Vocabulary {
  /** action id → 허용 토큰들 */
  actionTokens: Map<ActionId, string[]>;
  /** dir id → 허용 토큰들 */
  dirTokens: Map<DirId, string[]>;
  optionalSpace: boolean;
  /** 모든 완성 문자열 → (action, dir) */
  patterns: Map<string, { action: ActionId; dir: DirId }>;
}

function cardRank(cards: OwnedCard[], id: string): number {
  return cards.find((c) => c.id === id)?.rank ?? 0;
}

export function buildVocabulary(cards: OwnedCard[], skills: ActionId[]): Vocabulary {
  const actionTokens = new Map<ActionId, string[]>();
  for (const a of COMMANDS.actions) {
    if (a.unlock_card && !skills.includes(a.id)) continue;
    const toks = [a.tokens_by_rank[0]];
    if (a.abbr_card) {
      const r = cardRank(cards, a.abbr_card);
      for (let i = 1; i <= r && i < a.tokens_by_rank.length; i++) toks.push(a.tokens_by_rank[i]);
    }
    actionTokens.set(a.id, toks);
  }
  const dirTokens = new Map<DirId, string[]>();
  for (const d of DIRS) {
    // CR-05: 마침표는 선택 (Enter 확정). 짧은 쪽을 먼저 두어 shortest 계산이 마침표 없는 형태를 고르게 한다
    const bare = d.long_token.endsWith('.') ? d.long_token.slice(0, -1) : d.long_token;
    const toks = [bare, d.long_token];
    if (cardRank(cards, d.abbr_card) >= 1) toks.push(d.short_token);
    dirTokens.set(d.id, toks);
  }
  const optionalSpace = cardRank(cards, 'A05') >= 1;
  const patterns = new Map<string, { action: ActionId; dir: DirId }>();
  for (const [aid, atoks] of actionTokens)
    for (const [did, dtoks] of dirTokens)
      for (const at of atoks)
        for (const dt of dtoks) {
          patterns.set(`${at} ${dt}`, { action: aid, dir: did });
          if (optionalSpace) patterns.set(`${at}${dt}`, { action: aid, dir: did });
        }
  return { actionTokens, dirTokens, optionalSpace, patterns };
}

/** 현재 보유로 가장 짧은 명령 문자열 */
export function shortestCommand(vocab: Vocabulary, action: ActionId, dir: DirId): string {
  let best: string | null = null;
  for (const [p, v] of vocab.patterns) {
    if (v.action !== action || v.dir !== dir) continue;
    if (best === null || p.length < best.length || (p.length === best.length && p < best)) best = p;
  }
  return best ?? '';
}

/** 현재 보유로 가장 짧은 동작 토큰 */
export function shortestActionToken(vocab: Vocabulary, action: ActionId): string | null {
  const toks = vocab.actionTokens.get(action);
  if (!toks) return null;
  return toks.reduce((a, b) => (b.length < a.length ? b : a));
}
export function shortestDirToken(vocab: Vocabulary, dir: DirId): string {
  const toks = vocab.dirTokens.get(dir)!;
  return toks.reduce((a, b) => (b.length < a.length ? b : a));
}

/** 미보유 축약 토큰인지 검사 → 안내 문구 */
function unknownAbbrText(buffer: string, vocab: Vocabulary): string | null {
  const first = buffer.split(' ')[0];
  if (!first) return null;
  for (const a of COMMANDS.actions) {
    const owned = vocab.actionTokens.get(a.id) ?? [];
    if (a.tokens_by_rank.includes(first) && !owned.includes(first)) return `${first}: 미보유 축약`;
  }
  // 방향 축약 (동작 뒤 공백 후)
  const parts = buffer.split(' ');
  if (parts.length === 2) {
    const dt = parts[1];
    for (const d of DIRS) {
      if (d.short_token === dt && !(vocab.dirTokens.get(d.id) ?? []).includes(dt)) return `${dt}: 미보유 축약`;
    }
  }
  return null;
}

export function parse(buffer: string, vocab: Vocabulary): ParseResult {
  const exact = vocab.patterns.get(buffer);
  if (exact) {
    return { complete: exact, validPrefix: true, candidates: [buffer], remainingChars: 0, failText: null };
  }
  const cands: string[] = [];
  for (const p of vocab.patterns.keys()) if (p.startsWith(buffer)) cands.push(p);
  cands.sort((a, b) => a.length - b.length || a.localeCompare(b));
  if (cands.length > 0) {
    return {
      complete: null,
      validPrefix: true,
      candidates: cands.slice(0, 3),
      remainingChars: cands[0].length - buffer.length,
      failText: null,
    };
  }
  return { complete: null, validPrefix: buffer.length === 0, candidates: [], remainingChars: null, failText: unknownAbbrText(buffer, vocab) };
}

export function isValidChar(ch: string): boolean {
  return /^[a-z1-9 .]$/.test(ch);
}

export const MAX_BUFFER = COMMANDS.grammar.max_buffer_chars;

export function actionDisplayKo(action: ActionId): string {
  return ACTION_BY_ID[action].display_ko;
}
export function cardNameKo(id: string): string {
  return CARD_BY_ID[id]?.name_ko ?? id;
}
