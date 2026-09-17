import Phaser from 'phaser';
import type { RunState } from '../../sim/types';
import { input, type UiKey } from '../input';
import { fmtClock, SZ_MONO, SZ_UI, monoStyle, t, uiStyle, colHex } from '../tokens';
import { Menu, panelBg } from '../ui';
import { cardNameKo } from '../../sim/parser';
import { playCue } from '../audio';
import { addRecord, saveError } from '../save';

export interface ResultData {
  state: RunState;
}

export class ResultScene extends Phaser.Scene {
  private menu!: Menu;
  private logRows: Phaser.GameObjects.Text[] = [];
  private scroll = 0;
  constructor() {
    super('result');
  }

  create(data: ResultData) {
    input.combatInput = false;
    const st = data.state;
    const result = st.result ?? 'death';
    playCue(result === 'clear' ? 'audio.clear' : 'audio.death');
    addRecord({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result,
      survived_s: st.clock,
      level: st.player.level,
      kills: st.kills,
      seed: st.seed,
      cards: st.cardHistory,
    });

    // 좌: 요약
    panelBg(this, 32, 32, 560, 656);
    const { mm, ss } = fmtClock(st.clock);
    const lines = [
      t(result === 'clear' ? 'result.clear' : 'result.death'),
      t('result.time', { mm, ss }),
      t('result.level', { level: st.player.level }),
      t('result.kills', { n: st.kills }),
      `seed ${st.seed}`,
    ];
    this.add.text(64, 56, lines[0], uiStyle(SZ_UI.title, result === 'clear' ? 'ally.teal' : 'warn.red', { fontStyle: '600' }));
    lines.slice(1).forEach((l, i) => this.add.text(64, 130 + i * 32, l, uiStyle(SZ_UI.body)));
    const cardsList = st.cardHistory.map((id) => `${id} ${cardNameKo(id)}`).join(', ') || '—';
    this.add.text(64, 280, t('result.cards', { list: cardsList }), uiStyle(SZ_UI.body, 'text.primary', { wordWrap: { width: 500 } }));
    const hitsList = st.hits.length ? st.hits.map((h) => `${h.t.toFixed(1)}s ${h.text}`).slice(0, 20).join('\n') : '없음';
    this.add.text(64, 380, t('result.hits', { list: '' }), uiStyle(SZ_UI.body, 'threat.orange'));
    this.add.text(64, 410, hitsList, monoStyle(SZ_MONO.result_log, 'text.primary', { wordWrap: { width: 500 } }));

    // 우: 마지막 10초 로그
    panelBg(this, 624, 32, 624, 480);
    this.add.text(648, 52, t('result.last_seconds'), uiStyle(SZ_UI.body, 'text.muted'));
    const cutoff = st.clock - 10;
    const log = st.log.filter((l) => l.t >= cutoff);
    log.forEach((l, i) => {
      const tx = this.add.text(648, 84 + i * 22, `${l.t.toFixed(2).padStart(6)}  ${l.text}`, monoStyle(SZ_MONO.result_log, l.text.startsWith('✕') ? 'warn.red' : 'text.primary'));
      this.logRows.push(tx);
    });
    if (log.length === 0) this.add.text(648, 84, '—', monoStyle(SZ_MONO.result_log, 'text.muted'));
    this.redrawLog();

    this.menu = new Menu(this, 936, 540, [
      { label: t('result.retry_same'), onSelect: () => this.scene.start('run', { seed: st.seed }) },
      { label: t('result.retry_new'), onSelect: () => this.scene.start('run', { seed: (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1 }) },
      { label: t('result.to_title'), onSelect: () => this.scene.start('title') },
    ], { w: 300, h: 40, gap: 8 });
    if (saveError) this.add.text(936, 700, t('error.save'), uiStyle(SZ_UI.small, 'warn.red')).setOrigin(0.5, 1);
    this.add.text(936, 690, '1 같은 시드 · 2 새 시드 · Enter 확정', uiStyle(SZ_UI.small, 'text.muted')).setOrigin(0.5, 1);

    input.onUiKey = (k) => this.onKey(k);
    this.events.once('shutdown', () => (input.onUiKey = null));
    void colHex;
  }

  private redrawLog() {
    const maxVisible = 17;
    this.logRows.forEach((r, i) => {
      const vis = i >= this.scroll && i < this.scroll + maxVisible;
      r.setVisible(vis);
      r.setY(84 + (i - this.scroll) * 22);
    });
  }

  private onKey(k: UiKey) {
    if (k === 'digit1') {
      this.menu.focus = 0;
      this.menu.select();
      return;
    }
    if (k === 'digit2') {
      this.menu.focus = 1;
      this.menu.select();
      return;
    }
    if (k === 'left' || k === 'right') {
      this.scroll = Phaser.Math.Clamp(this.scroll + (k === 'right' ? 5 : -5), 0, Math.max(0, this.logRows.length - 17));
      this.redrawLog();
      return;
    }
    if (k === 'escape') {
      this.scene.start('title');
      return;
    }
    this.menu.handleKey(k);
  }
}
