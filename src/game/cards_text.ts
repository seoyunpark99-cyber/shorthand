// 레벨업 카드 본문: cards.json display_template 규칙. 미보유 축약은 예시에 쓰지 않는다.
import cardsJson from '../../data/cards.json';
import { ACTION_BY_ID, CARD_BY_ID, DIR_BY_ID, type ActionId, type DirId } from '../sim/data';
import { EMERGENCY_ID } from '../sim/growth';
import { buildVocabulary, shortestCommand, type Vocabulary } from '../sim/parser';
import type { PlayerState } from '../sim/types';
import { t } from './tokens';

const TPL = (cardsJson as { display_template: Record<string, string> }).display_template;

function fill(tpl: string, vars: Record<string, string | number>): string {
  let s = tpl;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export interface CardText {
  title: string;
  rank: string;
  body: string;
  iconKey: string;
  category: 'abbreviation' | 'performance';
}

const STAT_KO: Record<string, string> = {
  'slash.damage': '베기 피해',
  'hp.max': '최대 HP',
  'guard.duration_s': '막기 지속(초)',
  'pickup.radius': '흡수 반경',
};

export function cardText(cardId: string, rank: number, p: PlayerState, vocab: Vocabulary): CardText {
  if (cardId === EMERGENCY_ID) {
    return { title: t('card.emergency'), rank: '', body: t('card.emergency_body'), iconKey: 'icon.card.survival', category: 'performance' };
  }
  const c = CARD_BY_ID[cardId];
  const rankText = t('card.rank', { rank, max_rank: c.max_rank });
  const iconKey = c.category === 'abbreviation' ? `icon.card.abbr_${c.subgroup}` : `icon.card.${c.subgroup}`;
  let body = '';
  if (c.effect_type === 'alias') {
    const action = c.target as ActionId;
    const before = shortestCommand(vocab, action, 'left') || `${ACTION_BY_ID[action].tokens_by_rank[0]} left.`;
    const newVocab = buildVocabulary([...p.cards.filter((x) => x.id !== cardId), { id: cardId, rank }], p.skills.includes(action) ? p.skills : [...p.skills, action]);
    const after = shortestCommand(newVocab, action, 'left');
    body = fill(TPL.abbreviation_alias, {
      action_ko: ACTION_BY_ID[action].display_ko,
      before,
      after,
      before_len: before.length,
      after_len: after.length,
    });
  } else if (c.effect_type === 'direction') {
    const pair = c.rank_values[0] as [string, string];
    const dirs = Object.values(DIR_BY_ID).filter((d) => d.abbr_card === cardId) as { id: DirId; long_token: string; short_token: string }[];
    const a = dirs.find((d) => d.short_token === pair[0])!;
    const b = dirs.find((d) => d.short_token === pair[1])!;
    const pairKo: Record<string, string> = { horizontal: '가로', vertical: '세로', diag_upleft: '왼쪽 위·오른쪽 아래', diag_upright: '오른쪽 위·왼쪽 아래' };
    body = fill(TPL.abbreviation_direction, { dir_pair_ko: pairKo[c.target] ?? c.target, before_a: a.long_token, before_b: b.long_token, after_a: a.short_token, after_b: b.short_token });
  } else if (c.effect_type === 'optional_space') {
    const before = shortestCommand(vocab, 'slash', 'left');
    const after = before.replace(' ', '');
    body = fill(TPL.abbreviation_grammar, { example_before: before, example_after: after });
  } else if (c.effect_type === 'unlock') {
    body = `회전베기 해금: spin 방향. 정면과 양옆 45도 3칸을 한 번에. 재사용 대기 ${ACTION_BY_ID.spin.cooldown_s}초.`;
  } else if (c.effect_type === 'max_hp_plus_heal') {
    const after = c.rank_values[rank - 1] as number;
    body = fill(TPL.performance, { stat_ko: STAT_KO[c.target], before: p.hpMax, after }) + ' 선택 시 HP +1.';
  } else {
    const after = c.rank_values[rank - 1] as number;
    const base: Record<string, number> = { 'slash.damage': ACTION_BY_ID.slash.damage_base!, 'guard.duration_s': ACTION_BY_ID.guard.duration_s_base!, 'pickup.radius': 1 };
    const cur = rank > 1 ? (c.rank_values[rank - 2] as number) : base[c.target];
    body = fill(TPL.performance, { stat_ko: STAT_KO[c.target] ?? c.target, before: cur, after });
  }
  return { title: c.name_ko, rank: rankText, body, iconKey, category: c.category };
}
