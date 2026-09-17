import Phaser from 'phaser';
import { input, type UiKey } from '../input';
import { fmtClock, SZ_MONO, SZ_UI, col, colHex, monoStyle, t, uiStyle } from '../tokens';
import { getRecords } from '../save';
import { panelBg } from '../ui';

export class RecordsScene extends Phaser.Scene {
  private focus = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private scrollTop = 0;
  private readonly visible = 20;
  constructor() {
    super('records');
  }

  create() {
    input.combatInput = false;
    this.add.text(640, 48, t('records.title'), uiStyle(SZ_UI.h1)).setOrigin(0.5);
    panelBg(this, 160, 90, 960, 560);
    const records = getRecords();
    if (records.length === 0) {
      this.add.text(640, 360, t('records.empty'), uiStyle(SZ_UI.body, 'text.muted')).setOrigin(0.5);
    } else {
      records.forEach((r, i) => {
        const { mm, ss } = fmtClock(r.survived_s);
        const line = t('records.row', { date: r.date, result: t(r.result === 'clear' ? 'result.clear' : 'result.death'), mm, ss, level: r.level });
        const tx = this.add.text(192, 110 + i * 26, `${line}  · 처치 ${r.kills} · seed ${r.seed}`, monoStyle(SZ_MONO.result_log)).setOrigin(0, 0);
        this.rows.push(tx);
      });
    }
    this.add.text(640, 680, 'Esc 뒤로 · 위/아래 스크롤', uiStyle(SZ_UI.small, 'text.muted')).setOrigin(0.5);
    this.redraw();
    input.onUiKey = (k) => this.onKey(k);
    this.input.on('pointerdown', () => this.scene.start('title'));
    this.events.once('shutdown', () => (input.onUiKey = null));
  }

  private redraw() {
    this.rows.forEach((r, i) => {
      const vis = i >= this.scrollTop && i < this.scrollTop + this.visible;
      r.setVisible(vis);
      r.setY(110 + (i - this.scrollTop) * 26);
      r.setColor(colHex(i === this.focus ? 'ally.teal' : 'text.primary'));
    });
    void col;
  }

  private onKey(k: UiKey) {
    if (k === 'escape' || k === 'enter') {
      this.scene.start('title');
      return;
    }
    if (k === 'up' || k === 'down') {
      const n = this.rows.length;
      if (n === 0) return;
      this.focus = Phaser.Math.Clamp(this.focus + (k === 'up' ? -1 : 1), 0, n - 1);
      if (this.focus < this.scrollTop) this.scrollTop = this.focus;
      if (this.focus >= this.scrollTop + this.visible) this.scrollTop = this.focus - this.visible + 1;
      this.redraw();
    }
  }
}
