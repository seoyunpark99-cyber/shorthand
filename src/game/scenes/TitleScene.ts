import Phaser from 'phaser';
import { input, type UiKey } from '../input';
import { SZ_UI, t, uiStyle } from '../tokens';
import { Menu, SettingsPanel } from '../ui';
import { saveError } from '../save';
import { unlockAudio } from '../audio';

const VERSION = '1.0';

export class TitleScene extends Phaser.Scene {
  private menu!: Menu;
  private settings: SettingsPanel | null = null;
  constructor() {
    super('title');
  }

  create() {
    input.combatInput = false;
    this.add.text(640, 200, t('title.name'), uiStyle(SZ_UI.title, 'text.primary', { fontStyle: '600' })).setOrigin(0.5);
    this.add.text(640, 250, t('title.tagline'), uiStyle(SZ_UI.body, 'text.muted')).setOrigin(0.5);
    this.menu = new Menu(this, 640, 320, [
      { label: t('title.start'), onSelect: () => this.startRun() },
      { label: t('title.settings'), onSelect: () => this.openSettings() },
      { label: t('title.records'), onSelect: () => this.scene.start('records') },
      { label: t('title.quit'), onSelect: () => this.quit() },
    ]);
    this.add.text(1248, 700, t('title.version', { version: VERSION }), uiStyle(SZ_UI.small, 'text.muted')).setOrigin(1, 1);
    this.add.text(640, 600, '영문 입력 · 명령 예: slash left.  ·  m 6  ·  guard up.', uiStyle(SZ_UI.small, 'text.muted')).setOrigin(0.5);
    if (saveError) this.add.text(640, 660, t('error.save'), uiStyle(SZ_UI.small, 'warn.red')).setOrigin(0.5);

    input.onUiKey = (k) => this.onKey(k);
    input.onAnyKey = () => unlockAudio();
    this.input.once('pointerdown', () => unlockAudio());
    this.events.once('shutdown', () => {
      input.onUiKey = null;
      this.settings?.destroy();
      this.settings = null;
    });
  }

  private onKey(k: UiKey) {
    if (this.settings) {
      this.settings.handleKey(k);
      return;
    }
    this.menu.handleKey(k);
  }

  private startRun() {
    const seed = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
    this.scene.start('run', { seed });
  }

  private openSettings() {
    this.settings = new SettingsPanel(this, () => {
      this.settings?.destroy();
      this.settings = null;
      this.menu.redraw();
    });
  }

  private quit() {
    // 웹에서는 창을 닫을 수 없으므로 안내만
    const tx = this.add.text(640, 560, '브라우저 탭을 닫으면 종료됩니다', uiStyle(SZ_UI.small, 'text.muted')).setOrigin(0.5);
    this.time.delayedCall(2000, () => tx.destroy());
  }
}
