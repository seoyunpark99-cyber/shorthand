import Phaser from 'phaser';
// 코드 렌더링 UI 부품: 버튼 메뉴(키보드 탐색), 설정 패널, 확인 대화. 색·크기는 ui_tokens.
import { col, colHex, SZ_UI, t, TOKENS, uiStyle } from './tokens';
import { getSettings, updateSettings, saveError, type Settings } from './save';
import { playCue } from './audio';
import type { UiKey } from './input';

const BTN = TOKENS.component_states['ui.button'];
const BTN_W = (BTN.min_size_px as unknown as [number, number])[0];
const BTN_H = (BTN.min_size_px as unknown as [number, number])[1];

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

/** 세로 버튼 메뉴. 위/아래·Enter·클릭 */
export class Menu {
  readonly container: Phaser.GameObjects.Container;
  private buttons: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; item: MenuItem }[] = [];
  focus = 0;
  private w: number;
  private h: number;
  private gap: number;

  constructor(scene: Phaser.Scene, x: number, y: number, items: MenuItem[], opts: { w?: number; h?: number; gap?: number } = {}) {
    this.w = opts.w ?? BTN_W;
    this.h = opts.h ?? BTN_H;
    this.gap = opts.gap ?? 12;
    this.container = scene.add.container(x, y);
    items.forEach((item, i) => {
      const bg = scene.add.graphics();
      const text = scene.add.text(0, i * (this.h + this.gap) + this.h / 2, item.label, uiStyle(SZ_UI.body)).setOrigin(0.5);
      bg.setInteractive(new Phaser.Geom.Rectangle(-this.w / 2, i * (this.h + this.gap), this.w, this.h), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerover', () => {
        if (!item.disabled) {
          this.focus = i;
          this.redraw();
        }
      });
      bg.on('pointerdown', () => {
        if (!item.disabled) {
          this.focus = i;
          this.select();
        }
      });
      this.container.add([bg, text]);
      this.buttons.push({ bg, text, item });
    });
    this.redraw();
  }

  redraw() {
    this.buttons.forEach((b, i) => {
      const st = b.item.disabled ? BTN.disabled : i === this.focus ? BTN.hover : BTN.normal;
      const g = b.bg;
      g.clear();
      g.fillStyle(col((BTN.pressed.bg as string) && i === this.focus ? 'bg.panel' : (BTN.normal.bg as string)), 1);
      g.fillRoundedRect(-this.w / 2, i * (this.h + this.gap), this.w, this.h, 6);
      g.lineStyle(i === this.focus ? 2 : 1, col((st.border as string) ?? (BTN.normal.border as string)), 1);
      g.strokeRoundedRect(-this.w / 2, i * (this.h + this.gap), this.w, this.h, 6);
      if (i === this.focus && !b.item.disabled) {
        g.lineStyle(2, col('ally.teal'), 1);
        g.strokeRoundedRect(-this.w / 2 - 3, i * (this.h + this.gap) - 3, this.w + 6, this.h + 6, 8);
      }
      b.text.setColor(colHex(b.item.disabled ? (BTN.disabled.text as string) : (BTN.normal.text as string)));
    });
  }

  handleKey(k: UiKey): boolean {
    if (k === 'up' || k === 'down') {
      const n = this.buttons.length;
      let i = this.focus;
      for (let step = 0; step < n; step++) {
        i = (i + (k === 'up' ? -1 : 1) + n) % n;
        if (!this.buttons[i].item.disabled) break;
      }
      this.focus = i;
      this.redraw();
      return true;
    }
    if (k === 'enter') {
      this.select();
      return true;
    }
    return false;
  }

  select() {
    const b = this.buttons[this.focus];
    if (!b || b.item.disabled) return;
    playCue('audio.card_select');
    b.item.onSelect();
  }

  destroy() {
    this.container.destroy(true);
  }
  setVisible(v: boolean) {
    this.container.setVisible(v);
  }
}

/** 중앙 패널 배경 (480×400 등) */
export function panelBg(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(col('bg.panel'), 0.98);
  g.fillRoundedRect(x, y, w, h, 12);
  g.lineStyle(1, col('line.strong'), 1);
  g.strokeRoundedRect(x, y, w, h, 12);
  return g;
}

export function dimBg(scene: Phaser.Scene, alpha = 0.72): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(0, 0, 1280, 720, col('bg.ink'), alpha).setOrigin(0).setInteractive();
}

interface SettingRow {
  key: keyof Settings;
  label: string;
  kind: 'range' | 'toggle';
}
const ROWS: SettingRow[] = [
  { key: 'volume', label: 'settings.master_volume', kind: 'range' },
  { key: 'input_sound', label: 'settings.input_sound', kind: 'toggle' },
  { key: 'weak_fx', label: 'settings.weak_fx', kind: 'toggle' },
  { key: 'hints', label: 'settings.hints', kind: 'toggle' },
  { key: 'fullscreen', label: 'settings.fullscreen', kind: 'toggle' },
];

/** 설정 패널 (타이틀·일시정지 공용). 좌우로 값 변경, Enter 토글, Esc/뒤로 */
export class SettingsPanel {
  readonly container: Phaser.GameObjects.Container;
  private focus = 0;
  private valueTexts: Phaser.GameObjects.Text[] = [];
  private labelTexts: Phaser.GameObjects.Text[] = [];
  private rowGfx: Phaser.GameObjects.Graphics;
  private errText: Phaser.GameObjects.Text;
  private backText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  onBack: () => void;
  onChange: (() => void) | null = null;
  private px = 400;
  private py = 160;
  private pw = 480;
  private ph = 400;

  constructor(scene: Phaser.Scene, onBack: () => void) {
    this.scene = scene;
    this.onBack = onBack;
    this.container = scene.add.container(0, 0);
    const dim = dimBg(scene);
    const bg = panelBg(scene, this.px, this.py, this.pw, this.ph);
    const title = scene.add.text(this.px + this.pw / 2, this.py + 28, t('settings.title'), uiStyle(SZ_UI.h1)).setOrigin(0.5);
    this.rowGfx = scene.add.graphics();
    this.container.add([dim, bg, title, this.rowGfx]);
    ROWS.forEach((r, i) => {
      const y = this.py + 80 + i * 48;
      const label = scene.add.text(this.px + 32, y, t(r.label), uiStyle(SZ_UI.body)).setOrigin(0, 0.5);
      const val = scene.add.text(this.px + this.pw - 32, y, '', uiStyle(SZ_UI.body)).setOrigin(1, 0.5);
      const hit = scene.add.rectangle(this.px + this.pw / 2, y, this.pw - 32, 44).setOrigin(0.5).setInteractive();
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        this.focus = i;
        // 오른쪽 절반 클릭 = +, 왼쪽 = -
        this.change(p.x > this.px + this.pw * 0.75 ? 1 : p.x > this.px + this.pw * 0.5 ? -1 : 1);
      });
      this.labelTexts.push(label);
      this.valueTexts.push(val);
      this.container.add([hit, label, val]);
    });
    this.backText = scene.add.text(this.px + this.pw / 2, this.py + this.ph - 52, t('settings.back'), uiStyle(SZ_UI.body, 'text.muted')).setOrigin(0.5).setInteractive();
    this.backText.on('pointerdown', () => this.onBack());
    this.errText = scene.add.text(this.px + this.pw / 2, this.py + this.ph - 24, '', uiStyle(SZ_UI.small, 'warn.red')).setOrigin(0.5);
    this.container.add([this.backText, this.errText]);
    this.redraw();
  }

  private redraw() {
    const s = getSettings();
    this.rowGfx.clear();
    ROWS.forEach((r, i) => {
      const y = this.py + 80 + i * 48;
      if (i === this.focus) {
        this.rowGfx.lineStyle(2, col('ally.teal'), 1);
        this.rowGfx.strokeRoundedRect(this.px + 16, y - 22, this.pw - 32, 44, 6);
      }
      const v = s[r.key];
      const shown = r.kind === 'range' ? String(v) : v ? '켬' : '끔';
      this.valueTexts[i].setText(i === this.focus ? `◀ ${shown} ▶` : shown);
      this.valueTexts[i].setColor(colHex(i === this.focus ? 'ally.teal' : 'text.primary'));
    });
    this.backText.setColor(colHex(this.focus === ROWS.length ? 'ally.teal' : 'text.muted'));
    this.errText.setText(saveError ? t('error.save') : '');
  }

  private change(dir: number) {
    const r = ROWS[this.focus];
    if (!r) return;
    const s = getSettings();
    if (r.kind === 'range') {
      const v = Phaser.Math.Clamp((s.volume as number) + dir * 10, 0, 100);
      updateSettings({ volume: v });
    } else {
      updateSettings({ [r.key]: !s[r.key] } as Partial<Settings>);
      if (r.key === 'fullscreen') {
        const want = getSettings().fullscreen;
        if (want && !this.scene.scale.isFullscreen) this.scene.scale.startFullscreen();
        if (!want && this.scene.scale.isFullscreen) this.scene.scale.stopFullscreen();
      }
    }
    playCue('audio.type_key');
    this.onChange?.();
    this.redraw();
  }

  handleKey(k: UiKey): boolean {
    if (k === 'up') {
      this.focus = (this.focus - 1 + ROWS.length + 1) % (ROWS.length + 1);
      this.redraw();
      return true;
    }
    if (k === 'down') {
      this.focus = (this.focus + 1) % (ROWS.length + 1);
      this.redraw();
      return true;
    }
    if (k === 'left') {
      this.change(-1);
      return true;
    }
    if (k === 'right') {
      this.change(1);
      return true;
    }
    if (k === 'enter') {
      if (this.focus === ROWS.length) this.onBack();
      else this.change(1);
      return true;
    }
    if (k === 'escape') {
      this.onBack();
      return true;
    }
    return false;
  }

  destroy() {
    this.container.destroy(true);
  }
}

/** 확인 대화: "진행 중인 런이 사라집니다" */
export class ConfirmDialog {
  readonly container: Phaser.GameObjects.Container;
  private menu: Menu;
  constructor(scene: Phaser.Scene, message: string, onYes: () => void, onNo: () => void) {
    this.container = scene.add.container(0, 0);
    const dim = dimBg(scene, 0.5);
    const bg = panelBg(scene, 440, 260, 400, 200);
    const msg = scene.add.text(640, 300, message, uiStyle(SZ_UI.body)).setOrigin(0.5);
    this.menu = new Menu(scene, 640, 340, [
      { label: '아니오', onSelect: onNo },
      { label: '예', onSelect: onYes },
    ], { h: 40, gap: 8 });
    this.container.add([dim, bg, msg, this.menu.container]);
  }
  handleKey(k: UiKey): boolean {
    if (k === 'escape') {
      this.menu.focus = 0;
      this.menu.select();
      return true;
    }
    return this.menu.handleKey(k);
  }
  destroy() {
    this.container.destroy(true);
  }
}

/** 아이콘: manifest 로 로드된 icon.* 텍스처가 있으면 이미지, 없으면 글자 placeholder */
export function iconNode(scene: Phaser.Scene, x: number, y: number, iconId: string, size: number, color = 'text.primary'): Phaser.GameObjects.Container {
  if (scene.textures.exists(iconId)) {
    const c = scene.add.container(x, y);
    const im = scene.add.image(0, 0, iconId).setDisplaySize(size, size);
    if (color !== 'text.primary') im.setTint(col(color));
    c.add(im);
    c.setData('iconId', iconId);
    return c;
  }
  const c = iconText(scene, x, y, ICON_LABEL[iconId] ?? '?', size, color);
  c.setData('iconId', iconId);
  return c;
}

/** 글자 1~2자의 사각 아이콘 (placeholder icons) */
export function iconText(scene: Phaser.Scene, x: number, y: number, label: string, size: number, color = 'text.primary'): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.lineStyle(2, col(color), 1);
  g.strokeRoundedRect(-size / 2, -size / 2, size, size, 4);
  const tx = scene.add.text(0, 0, label, uiStyle(Math.round(size * 0.55), color)).setOrigin(0.5);
  c.add([g, tx]);
  return c;
}

export const ICON_LABEL: Record<string, string> = {
  'icon.enemy.grunt': '잔',
  'icon.enemy.rapid': '속',
  'icon.enemy.chaser': '추',
  'icon.enemy.boss': '집',
  'icon.card.abbr_action': '동',
  'icon.card.abbr_direction': '방',
  'icon.card.abbr_grammar': '문',
  'icon.card.offense': '공',
  'icon.card.survival': '생',
  'icon.card.skill': '기',
  'icon.card.utility': '보',
  'icon.status.guard': '막',
  'icon.status.cooldown': '대',
  'icon.status.wait': '…',
  'icon.ui.pause': 'II',
  'icon.ui.settings': '설',
  'icon.ui.close': 'X',
};
