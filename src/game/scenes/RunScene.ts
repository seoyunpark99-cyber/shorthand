import Phaser from 'phaser';
import { Sim } from '../../sim/core';
import { DIR_BY_ID, DIR_ORDER, ENEMY_BY_ID, SPAWN, bandAt, difficultyMultiplier, xpNext, type ActionId, type DirId } from '../../sim/data';
import { parse, shortestActionToken, shortestCommand, shortestDirToken } from '../../sim/parser';
import { Recorder } from '../../sim/replay';
import { Rng } from '../../sim/rng';
import type { Cell, SimEvent } from '../../sim/types';
import { ENEMY_ASSET, importReport, isPlaceholder, setupBodySprite, texKey } from '../assets';
import { playCue } from '../audio';
import { cardText } from '../cards_text';
import { input, type UiKey } from '../input';
import { getSettings, saveError } from '../save';
import { cellCenter, col, colHex, fmtClock, L, SZ_MONO, SZ_UI, t, TILE, TOKENS, monoStyle, uiStyle } from '../tokens';
import { ConfirmDialog, dimBg, iconNode, Menu, panelBg, SettingsPanel } from '../ui';

const STEP_MS = SPAWN.simulation.step_ms;
const RING = L.ring;
const CMD_STATES = TOKENS.component_states['hud.command_bar'];

interface Fx {
  kind: string;
  t0: number;
  dur: number;
  cell?: Cell;
  from?: Cell;
  to?: Cell;
  dir?: DirId;
  cells?: Cell[];
  hit?: boolean;
}

interface EnemyView {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
}

export class RunScene extends Phaser.Scene {
  private sim!: Sim;
  private recorder!: Recorder;
  private acc = 0;
  private seed = 1;
  private ended = false;

  // 보드
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerLabel!: Phaser.GameObjects.Text;
  private enemyViews = new Map<number, EnemyView>();
  private shardViews = new Map<string, { sprite: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text }>();
  private dangerGfx!: Phaser.GameObjects.Graphics;
  private fxGfx!: Phaser.GameObjects.Graphics;
  private ringGfx!: Phaser.GameObjects.Graphics;
  private guardGfx!: Phaser.GameObjects.Graphics;
  private ringTexts: Phaser.GameObjects.Text[] = [];
  private ringIcons: Phaser.GameObjects.Container[] = [];
  private bossLineNums: Phaser.GameObjects.Text[] = [];
  private fx: Fx[] = [];
  private playerActUntil = 0;
  private playerHitUntil = 0;

  // HUD
  private cmdGfx!: Phaser.GameObjects.Graphics;
  private cmdText!: Phaser.GameObjects.Text;
  private cmdRight!: Phaser.GameObjects.Text;
  private cmdState: 'idle' | 'valid_prefix' | 'invalid' | 'complete_flash' | 'ready' = 'idle';
  private cmdFlashUntil = 0;
  private clockText!: Phaser.GameObjects.Text;
  private hpGfx!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private xpGfx!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private xpFillAnimUntil = 0;
  private abbrRows: Phaser.GameObjects.Text[] = [];
  private abbrHighlight = new Map<number, number>();
  private lastTokens: string[] = [];
  private skillText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hitReasonText!: Phaser.GameObjects.Text;
  private hitReasonUntil = 0;
  private waitingText!: Phaser.GameObjects.Text;
  private failText = '';
  private failUntil = 0;
  private devText!: Phaser.GameObjects.Text;
  private devMode = false;

  // 오버레이
  private levelupC: Phaser.GameObjects.Container | null = null;
  private levelupFocus = 0;
  private levelupPanels: Phaser.GameObjects.Image[] = [];
  private levelupConfirmedAt = 0;
  private pauseC: Phaser.GameObjects.Container | null = null;
  private pauseMenu: Menu | null = null;
  private settings: SettingsPanel | null = null;
  private confirm: ConfirmDialog | null = null;
  private bandText!: Phaser.GameObjects.Text;
  private bandBg!: Phaser.GameObjects.Rectangle;

  // 튜토리얼
  private tut = { firstChar: false, firstKill: false, secondCastSeen: false, movedOrKilled: false, shardDropped: false, firstLevelup: false, abbrPicked: false, abbrUsed: false };
  private hintKey: string | null = null;

  constructor() {
    super('run');
  }

  init(data: { seed?: number }) {
    this.seed = data.seed ?? 1;
  }

  create() {
    this.sim = new Sim(this.seed);
    this.recorder = new Recorder(this.seed);
    this.acc = 0;
    this.ended = false;
    this.fx = [];
    this.enemyViews.clear();
    this.shardViews.clear();
    this.ringTexts = [];
    this.ringIcons = [];
    this.abbrRows = [];
    this.tut = { firstChar: false, firstKill: false, secondCastSeen: false, movedOrKilled: false, shardDropped: false, firstLevelup: false, abbrPicked: false, abbrUsed: false };
    this.levelupC = null;
    this.pauseC = null;
    this.settings = null;
    this.confirm = null;

    this.buildBoard();
    this.buildHud();
    this.syncEnemies();
    this.syncShards();
    this.updateAbbrTable(true);

    input.combatInput = true;
    input.clear();
    input.onUiKey = (k, ev) => this.onUiKey(k, ev);
    input.onImeChange = (c) => {
      if (c) input.push({ kind: 'pause', reason: 'ime' });
      else if (this.sim.state.pauseReason === 'ime') input.push({ kind: 'resume' });
    };
    input.onFocusChange = (f) => {
      if (!f) input.push({ kind: 'pause', reason: 'focus' });
    };
    this.input.on('pointerdown', () => {
      if (this.sim.state.phase === 'paused' && this.sim.state.pauseReason === 'focus') input.push({ kind: 'resume' });
    });
    this.events.once('shutdown', () => {
      delete (window as unknown as { __sim?: unknown }).__sim;
      input.onUiKey = null;
      input.onImeChange = null;
      input.onFocusChange = null;
      input.combatInput = false;
    });
    this.setHint('tut.01');
    // 개발 모드 콘솔 조회 (TECH_QA 7절): window.__sim.state()
    (window as unknown as { __sim?: unknown }).__sim = { state: () => this.sim.state, hash: () => this.sim.hash(), replay: () => this.recorder.file };
    this.renderAll();
  }

  // ───────────────────────── 구성 ─────────────────────────

  private buildBoard() {
    const rng = new Rng(this.seed ^ 0x5bd1e995);
    for (let y = 0; y < SPAWN.board.height; y++)
      for (let x = 0; x < SPAWN.board.width; x++) {
        const wall = x === 0 || y === 0 || x === SPAWN.board.width - 1 || y === SPAWN.board.height - 1;
        const alt = !wall && rng.float() < 0.2;
        const key = wall ? 'tile.wall' : alt ? 'tile.floor_alt' : 'tile.floor';
        this.add.image(L.board.x + x * TILE, L.board.y + y * TILE, key).setOrigin(0).setScale(0.5).setDepth(0);
      }
    this.dangerGfx = this.add.graphics().setDepth(1);
    this.fxGfx = this.add.graphics().setDepth(5);
    this.guardGfx = this.add.graphics().setDepth(4);
    this.ringGfx = this.add.graphics().setDepth(6);
    for (let i = 0; i < 8; i++) {
      this.ringTexts.push(this.add.text(0, 0, '', monoStyle(SZ_MONO.gauge)).setOrigin(0.5).setDepth(7).setVisible(false));
      const ic = this.add.container(0, 0).setDepth(7).setVisible(false);
      this.ringIcons.push(ic);
    }
    for (let i = 0; i < 2; i++) this.bossLineNums.push(this.add.text(0, 0, '', monoStyle(SZ_MONO.gauge, 'boss.gold')).setOrigin(0.5).setDepth(2).setVisible(false));

    const [px, py] = cellCenter(this.sim.state.player.cell[0], this.sim.state.player.cell[1]);
    this.playerShadow = this.add.ellipse(px, py + TILE / 2 - 2, 40, 14, 0x000000, 0.35).setDepth(2);
    this.playerSprite = this.add.sprite(px, py + TILE / 2 - 4, texKey('visual.player.body', 'idle', 0)).setDepth(3);
    setupBodySprite(this.playerSprite, 'visual.player.body');
    this.playerLabel = this.add.text(px, py - 36, '', monoStyle(10, 'text.muted')).setOrigin(0.5).setDepth(9).setVisible(false);
  }

  private buildHud() {
    // 상단 띠
    this.add.text(L.top_strip.x, L.top_strip.y + L.top_strip.h / 2, t('title.name'), uiStyle(SZ_UI.body, 'text.muted', { fontStyle: '600' })).setOrigin(0, 0.5);
    const pauseIcon = iconNode(this, L.top_strip.x + L.top_strip.w - 14, L.top_strip.y + L.top_strip.h / 2, 'icon.ui.pause', 24, 'text.muted');
    pauseIcon.setSize(24, 24).setInteractive(new Phaser.Geom.Rectangle(-12, -12, 24, 24), Phaser.Geom.Rectangle.Contains);
    pauseIcon.on('pointerdown', () => input.push({ kind: 'pause', reason: 'user' }));

    // 명령창
    this.cmdGfx = this.add.graphics().setDepth(8);
    this.cmdText = this.add.text(L.command_bar.x + 24, L.command_bar.y + L.command_bar.h / 2, '', monoStyle(SZ_MONO.command)).setOrigin(0, 0.5).setDepth(9);
    this.cmdRight = this.add.text(L.command_bar.x + L.command_bar.w - 16, L.command_bar.y + L.command_bar.h / 2, '', monoStyle(SZ_MONO.gauge, 'text.muted')).setOrigin(1, 0.5).setDepth(9);

    // 사이드 패널 배경
    const sp = L.side_panel;
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(col('bg.panel'), 1);
    g.fillRoundedRect(sp.x, sp.y, sp.w, sp.h, 8);
    g.lineStyle(1, col('line.faint'), 1);
    g.strokeRoundedRect(sp.x, sp.y, sp.w, sp.h, 8);
    const rows = L.side_panel_rows;
    for (const key of ['abbr_table', 'skill_cooldown', 'hint_and_hit_reason']) {
      g.lineBetween(sp.x + 16, rows[key].y - 8, sp.x + sp.w - 16, rows[key].y - 8);
    }
    const pad = TOKENS.spacing_px.panel_padding;
    // 1행: 시계 · HP · XP
    const r1 = rows.clock_hp_xp;
    this.clockText = this.add.text(sp.x + pad, r1.y + 8, '00:00', monoStyle(SZ_MONO.command)).setDepth(9);
    this.hpGfx = this.add.graphics().setDepth(9);
    this.hpText = this.add.text(sp.x + 180, r1.y + 8, '', uiStyle(SZ_UI.small, 'text.muted')).setDepth(9);
    this.xpGfx = this.add.graphics().setDepth(9);
    this.xpText = this.add.text(sp.x + 360, r1.y + 8, '', uiStyle(SZ_UI.small, 'text.muted')).setDepth(9);
    // 2행: 축약표
    const r2 = rows.abbr_table;
    this.add.text(sp.x + pad, r2.y, t('hud.abbr_table.title'), uiStyle(SZ_UI.small, 'text.muted')).setDepth(9);
    for (let i = 0; i < 9; i++) {
      const colX = i < 5 ? sp.x + pad : sp.x + pad + 280;
      const rowY = r2.y + 28 + (i < 5 ? i : i - 5) * 30;
      this.abbrRows.push(this.add.text(colX, rowY, '', monoStyle(SZ_MONO.abbr_table)).setDepth(9));
    }
    // 3행: 스킬
    const r3 = rows.skill_cooldown;
    this.skillText = this.add.text(sp.x + pad, r3.y + 12, '', uiStyle(SZ_UI.body, 'text.muted')).setDepth(9);
    // 4행: 힌트 / 피격 원인
    const r4 = rows.hint_and_hit_reason;
    this.hintText = this.add.text(sp.x + pad, r4.y + 4, '', uiStyle(SZ_UI.body, 'text.muted', { wordWrap: { width: sp.w - pad * 2 } })).setDepth(9);
    this.hitReasonText = this.add.text(sp.x + pad, r4.y + 84, '', uiStyle(SZ_UI.body, 'threat.orange', { wordWrap: { width: sp.w - pad * 2 } })).setDepth(9);
    // 대기 안내
    this.waitingText = this.add.text(L.board.x + L.board.w / 2, L.board.y + 20, t('run.waiting'), uiStyle(SZ_UI.body, 'ally.teal', { backgroundColor: colHex('bg.panel') })).setOrigin(0.5).setDepth(10).setPadding(8, 4, 8, 4);
    // IME·포커스 띠
    this.bandBg = this.add.rectangle(L.board.x, L.board.y + L.board.h / 2 - 24, L.board.w, 48, col('bg.panel'), 0.95).setOrigin(0).setDepth(20).setVisible(false);
    this.bandText = this.add.text(L.board.x + L.board.w / 2, L.board.y + L.board.h / 2, '', uiStyle(SZ_UI.body, 'ally.teal')).setOrigin(0.5).setDepth(21).setVisible(false);
    // 개발 모드
    this.devText = this.add.text(L.board.x + 4, L.board.y + L.board.h - 4, '', monoStyle(12, 'ally.teal', { backgroundColor: colHex('bg.ink') })).setOrigin(0, 1).setDepth(30).setVisible(false);
  }

  // ───────────────────────── 루프 ─────────────────────────

  update(time: number, delta: number) {
    if (this.ended) return;
    this.acc += Math.min(delta, 250);
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 10) {
      this.acc -= STEP_MS;
      steps++;
      const inputs = input.drain();
      this.recorder.record(inputs);
      const events = this.sim.step(inputs);
      for (const e of events) this.onEvent(e, time);
      if (this.sim.state.phase === 'result') {
        this.endRun();
        return;
      }
    }
    this.renderAll();
  }

  private endRun() {
    this.ended = true;
    this.recorder.finish(this.sim);
    input.combatInput = false;
    const st = this.sim.state;
    this.renderAll();
    this.time.delayedCall(700, () => this.scene.start('result', { state: st }));
  }

  private onUiKey(k: UiKey, ev: KeyboardEvent) {
    const st = this.sim.state;
    if (k === 'f3') {
      this.devMode = !this.devMode;
      return;
    }
    if (this.confirm) {
      this.confirm.handleKey(k);
      return;
    }
    if (this.settings) {
      this.settings.handleKey(k);
      return;
    }
    if (st.phase === 'levelup') {
      this.levelupKey(k);
      return;
    }
    if (st.phase === 'paused' && st.pauseReason === 'user') {
      if (k === 'escape') {
        this.closePause();
        return;
      }
      this.pauseMenu?.handleKey(k);
      return;
    }
    if (st.phase === 'paused' && (st.pauseReason === 'focus' || st.pauseReason === 'ime')) {
      if (st.pauseReason === 'focus') {
        input.push({ kind: 'resume' });
        input.clear(); // 해제 키는 버퍼에 넣지 않음
        ev.preventDefault();
      }
      return;
    }
    if (k === 'f10') input.push({ kind: 'pause', reason: 'user' });
  }

  // ───────────────────────── 이벤트 ─────────────────────────

  private onEvent(e: SimEvent, now: number) {
    const st = this.sim.state;
    switch (e.id) {
      case 'ev.clock_started':
        this.waitingText.setVisible(false);
        this.tut.firstChar = true;
        if (this.hintKey === 'tut.01') this.setHint(null);
        break;
      case 'ev.buffer_changed':
        if (e.failText === 'overflow') {
          this.cmdState = 'invalid';
          this.cmdFlashUntil = now + (CMD_STATES.invalid.flash_ms as number);
        } else if (e.buffer.length === 0) {
          if (this.cmdState !== 'complete_flash') this.cmdState = 'idle';
        } else if (e.validPrefix) {
          this.cmdState = e.remainingChars === 0 ? 'ready' : 'valid_prefix';
        } else {
          this.cmdState = 'invalid';
          this.cmdFlashUntil = now + (CMD_STATES.invalid.flash_ms as number);
        }
        if (e.failText && e.failText !== 'overflow') {
          this.failText = e.failText;
          this.failUntil = now + 1500;
        }
        if (e.buffer.length > 0) playCue('audio.type_key');
        break;
      case 'ev.command_complete':
        this.cmdState = 'complete_flash';
        this.cmdFlashUntil = now + (CMD_STATES.complete_flash.flash_ms as number);
        playCue('audio.command_ok');
        if (this.tut.abbrPicked && !this.tut.abbrUsed) {
          this.tut.abbrUsed = true;
          if (this.hintKey === 'tut.06') this.setHint(null);
        }
        if (e.action !== 'move' && e.action !== 'guard') {
          this.playerActUntil = now + 120;
          this.fx.push({ kind: 'player_act', t0: now, dur: 120, dir: e.dir });
        }
        break;
      case 'ev.command_fail':
        this.failText = t(`hud.fail.${e.reason}`);
        this.failUntil = now + 1500;
        if (e.reason === 'invalid') {
          this.cmdState = 'invalid';
          this.cmdFlashUntil = now + (CMD_STATES.invalid.flash_ms as number);
        }
        playCue('audio.command_fail');
        break;
      case 'ev.miss':
        this.fx.push({ kind: `fx.${e.action}`, t0: now, dur: e.action === 'slash' ? 320 : 250, cell: e.cell, dir: e.dir, hit: false });
        break;
      case 'ev.hit': {
        this.fx.push({ kind: `fx.${e.action}`, t0: now, dur: e.action === 'slash' ? 320 : 250, cell: e.cell, dir: this.dirFromPlayer(e.cell), hit: true });
        playCue(e.action === 'thrust' ? 'audio.hit_thrust' : 'audio.hit_slash');
        const v = this.enemyViews.get(e.enemyId);
        if (v) {
          v.sprite.setTint(0xffffff);
          this.time.delayedCall(80, () => v.sprite.clearTint());
        }
        break;
      }
      case 'ev.kill': {
        const v = this.enemyViews.get(e.enemyId);
        if (v) {
          this.tweens.add({ targets: [v.sprite], alpha: 0, duration: 350, onComplete: () => v.sprite.destroy() });
          v.shadow.destroy();
          v.label.destroy();
          this.enemyViews.delete(e.enemyId);
        }
        this.fx.push({ kind: 'fx.death_dissolve', t0: now, dur: 350, cell: e.cell });
        playCue('audio.enemy_death');
        this.tut.firstKill = true;
        this.tut.movedOrKilled = true;
        if (this.hintKey === 'tut.03') this.setHint(null);
        break;
      }
      case 'ev.move': {
        const [x, y] = cellCenter(e.to[0], e.to[1]);
        this.tweens.add({ targets: [this.playerSprite], x, y: y + TILE / 2 - 4, duration: 80 });
        this.tweens.add({ targets: [this.playerShadow], x, y: y + TILE / 2 - 2, duration: 80 });
        this.fx.push({ kind: 'fx.move_trail', t0: now, dur: 150, cell: e.from });
        playCue('audio.move');
        this.tut.movedOrKilled = true;
        if (this.hintKey === 'tut.03') this.setHint(null);
        break;
      }
      case 'ev.guard_set':
        this.fx.push({ kind: 'fx.guard_pop', t0: now, dur: 150, dir: e.dir });
        break;
      case 'ev.guard_consumed':
        this.fx.push({ kind: 'fx.guard_break', t0: now, dur: 200, dir: e.dir });
        playCue('audio.guard_block');
        break;
      case 'ev.cast_started':
        if (this.tut.firstKill && !this.tut.secondCastSeen) {
          this.tut.secondCastSeen = true;
          if (!this.tut.movedOrKilled || true) this.setHint('tut.03');
        }
        break;
      case 'ev.cast_warning':
        playCue('audio.cast_warning');
        break;
      case 'ev.enemy_attack':
        this.fx.push({ kind: 'fx.enemy_attack', t0: now, dur: 200, cells: e.cells, hit: e.hit });
        break;
      case 'ev.player_hit':
        this.playerHitUntil = now + 200;
        this.hitReasonText.setText(e.reasonText);
        this.hitReasonUntil = now + 3000;
        playCue('audio.player_hit');
        break;
      case 'ev.shard_dropped':
        if (!this.tut.shardDropped) {
          this.tut.shardDropped = true;
          if (!this.tut.firstLevelup) this.setHint('tut.04');
        }
        break;
      case 'ev.shard_picked':
        this.fx.push({ kind: 'fx.pickup_line', t0: now, dur: 200, cell: e.cell });
        playCue('audio.xp_pickup');
        break;
      case 'ev.levelup':
        this.fx.push({ kind: 'fx.levelup_beam', t0: now, dur: 400 });
        this.xpFillAnimUntil = now + 300;
        playCue('audio.levelup');
        this.tut.firstLevelup = true;
        if (this.hintKey === 'tut.04') this.setHint(null);
        break;
      case 'ev.card_applied':
        playCue('audio.card_select');
        this.updateAbbrTable(false);
        if (!this.tut.abbrPicked && e.cardId.startsWith('A') && ['A01', 'A02', 'A03', 'A04', 'A05', 'A16', 'A17', 'A18', 'A11'].includes(e.cardId)) {
          this.tut.abbrPicked = true;
          const ex = shortestCommand(this.sim.vocab, 'slash', 'left');
          this.setHintText(t('tut.06', { example: ex, n: ex.length }));
          this.hintKey = 'tut.06';
        }
        break;
      case 'ev.spawn_telegraph':
        break;
      case 'ev.spawned':
      case 'ev.boss_appear':
        this.syncEnemies();
        if (e.id === 'ev.boss_appear') {
          this.fx.push({ kind: 'fx.boss_marker', t0: now, dur: 1000, cell: e.cell });
          playCue('audio.boss_telegraph');
        }
        break;
      case 'ev.boss_telegraph':
        playCue('audio.boss_telegraph');
        break;
      case 'ev.boss_recovery':
        break;
      case 'ev.pause':
        if (e.reason === 'user') this.openPause();
        this.fx = [];
        break;
      case 'ev.resume':
        this.closePauseUi();
        break;
      case 'ev.run_end':
        break;
    }
    if (st.phase === 'levelup' && !this.levelupC) this.openLevelup();
    if (st.phase !== 'levelup' && this.levelupC) this.closeLevelup();
  }

  private dirFromPlayer(cell: Cell): DirId {
    const p = this.sim.state.player.cell;
    const dx = Math.sign(cell[0] - p[0]);
    const dy = Math.sign(cell[1] - p[1]);
    return (DIR_ORDER.find((d) => DIR_BY_ID[d].vector[0] === dx && DIR_BY_ID[d].vector[1] === dy) ?? 'left') as DirId;
  }

  // ───────────────────────── 힌트 ─────────────────────────

  private setHint(key: string | null) {
    this.hintKey = key;
    if (!key || !getSettings().hints) {
      this.hintText.setText('');
      return;
    }
    this.hintText.setText(t(key));
  }
  private setHintText(text: string) {
    this.hintText.setText(getSettings().hints ? text : '');
  }

  // ───────────────────────── 동기화 ─────────────────────────

  private syncEnemies() {
    const st = this.sim.state;
    for (const e of st.enemies) {
      if (this.enemyViews.has(e.id)) continue;
      const asset = ENEMY_ASSET[e.type];
      const [x, y] = cellCenter(e.cell[0], e.cell[1]);
      const shadow = this.add.ellipse(x, y + TILE / 2 - 2, e.type === 'boss_executor' ? 56 : 40, 14, 0x000000, 0.35).setDepth(2);
      const sprite = this.add.sprite(x, y + TILE / 2 - 4, texKey(asset, 'idle', 0)).setDepth(3);
      setupBodySprite(sprite, asset);
      const label = this.add.text(x, y - 36, '', monoStyle(10, 'text.muted')).setOrigin(0.5).setDepth(9).setVisible(false);
      this.enemyViews.set(e.id, { sprite, shadow, label });
    }
    for (const [id, v] of this.enemyViews) {
      if (!st.enemies.some((e) => e.id === id)) {
        v.sprite.destroy();
        v.shadow.destroy();
        v.label.destroy();
        this.enemyViews.delete(id);
      }
    }
  }

  private syncShards() {
    const st = this.sim.state;
    const keys = new Set<string>();
    for (const s of st.shards) {
      const k = `${s.cell[0]},${s.cell[1]}`;
      keys.add(k);
      let v = this.shardViews.get(k);
      const [x, y] = cellCenter(s.cell[0], s.cell[1]);
      if (!v) {
        const sprite = this.add.image(x, y, 'visual.shard').setScale(0.5).setDepth(2);
        const text = this.add.text(x + 14, y + 10, '', monoStyle(12, 'xp.blue')).setOrigin(0, 0.5).setDepth(2);
        v = { sprite, text };
        this.shardViews.set(k, v);
      }
      v.text.setText(s.xp >= 2 ? `×${s.xp}` : '');
    }
    for (const [k, v] of this.shardViews) {
      if (!keys.has(k)) {
        v.sprite.destroy();
        v.text.destroy();
        this.shardViews.delete(k);
      }
    }
  }

  private currentTokens(): string[] {
    const v = this.sim.vocab;
    const acts: ActionId[] = ['slash', 'thrust', 'guard', 'move', 'spin'];
    const rows = acts.map((a) => shortestActionToken(v, a) ?? '—');
    const pairs: [DirId, DirId][] = [['left', 'right'], ['up', 'down'], ['upleft', 'downright'], ['upright', 'downleft']];
    for (const [a, b] of pairs) rows.push(`${shortestDirToken(v, a)}·${shortestDirToken(v, b)}`);
    return rows;
  }

  private updateAbbrTable(initial: boolean) {
    const toks = this.currentTokens();
    const labels = ['베기', '찌르기', '막기', '이동', '회전베기', '가로', '세로', '왼위·오아래', '오위·왼아래'];
    toks.forEach((tok, i) => {
      const changed = !initial && this.lastTokens[i] !== undefined && this.lastTokens[i] !== tok;
      this.abbrRows[i].setText(`${labels[i].padEnd(5, ' ')} ${tok}`);
      if (changed) this.abbrHighlight.set(i, this.time.now + 600);
    });
    this.lastTokens = toks;
  }

  // ───────────────────────── 렌더 ─────────────────────────

  private renderAll() {
    const now = this.time.now;
    const st = this.sim.state;
    const weak = getSettings().weak_fx;
    this.syncEnemies();
    this.syncShards();

    // 몸체 프레임·위치
    const idleFrame = Math.floor(now / 450) % 2;
    const pActing = now < this.playerActUntil;
    this.playerSprite.setTexture(texKey('visual.player.body', pActing ? 'act' : 'idle', pActing ? 0 : idleFrame));
    if (now < this.playerHitUntil) this.playerSprite.setTint(0xffb0a0);
    else this.playerSprite.clearTint();
    if (!this.tweens.isTweening(this.playerSprite)) {
      const [px, py] = cellCenter(st.player.cell[0], st.player.cell[1]);
      let ox = 0;
      let oy = 0;
      const act = this.fx.find((f) => f.kind === 'player_act');
      if (act && act.dir) {
        const k = 1 - Math.min(1, (now - act.t0) / act.dur);
        ox = DIR_BY_ID[act.dir].vector[0] * 6 * k;
        oy = DIR_BY_ID[act.dir].vector[1] * 6 * k;
      }
      this.playerSprite.setPosition(px + ox, py + TILE / 2 - 4 + oy);
      this.playerShadow.setPosition(px, py + TILE / 2 - 2);
    }
    for (const e of st.enemies) {
      const v = this.enemyViews.get(e.id);
      if (!v) continue;
      const asset = ENEMY_ASSET[e.type];
      const [x, y] = cellCenter(e.cell[0], e.cell[1]);
      if (Math.abs(v.sprite.x - x) > 0.5 || Math.abs(v.sprite.y - (y + TILE / 2 - 4)) > 0.5) {
        if (!this.tweens.isTweening(v.sprite)) {
          this.tweens.add({ targets: [v.sprite], x, y: y + TILE / 2 - 4, duration: 80 });
          this.tweens.add({ targets: [v.shadow], x, y: y + TILE / 2 - 2, duration: 80 });
        }
      }
      v.sprite.setTexture(texKey(asset, e.state === 'cast' ? 'cast' : 'idle', e.state === 'cast' ? 0 : idleFrame));
      v.label.setVisible(this.devMode);
      if (this.devMode) v.label.setPosition(v.sprite.x, v.sprite.y - 40).setText(`${asset.split('.').slice(-2, -1)[0]}#${e.id} ${e.state}${isPlaceholder(v.sprite.texture.key) ? ' ph' : ''}`);
    }
    this.playerLabel.setVisible(this.devMode);
    if (this.devMode) this.playerLabel.setPosition(this.playerSprite.x, this.playerSprite.y - 40).setText(`player${isPlaceholder(this.playerSprite.texture.key) ? ' ph' : ''}`);

    this.drawDanger(now);
    this.drawRing();
    this.drawGuard();
    this.drawFx(now, weak);
    this.drawHud(now);
    this.drawBands();
    this.devText.setVisible(this.devMode);
    if (this.devMode) {
      this.devText.setText(
        `step ${st.step} t=${st.clock.toFixed(2)} M=${difficultyMultiplier(st.clock).toFixed(3)} phase=${st.phase} enemies=${st.enemies.length} seed=${st.seed}\n` +
          `manifest ${importReport.manifest_ok ? 'ok' : 'placeholder'} loaded=${importReport.loaded.length} failed=${importReport.failed.length} hash=${this.sim.hash()}`,
      );
    }
  }

  private drawDanger(now: number) {
    const g = this.dangerGfx;
    const st = this.sim.state;
    g.clear();
    this.bossLineNums.forEach((n) => n.setVisible(false));
    for (const e of st.enemies) {
      if (e.state !== 'cast') continue;
      const isBoss = e.type === 'boss_executor';
      const tracking = ENEMY_BY_ID[e.type].targeting === 'tracks_player_until_lock' && !e.locked;
      const warn = e.castRemaining <= 1.0;
      e.telegraphCells.forEach((c, i) => {
        const x = L.board.x + c[0] * TILE;
        const y = L.board.y + c[1] * TILE;
        // 빗금 45도 4px 간격
        g.lineStyle(1, col('threat.orange'), 0.8);
        for (let k = -TILE; k < TILE; k += 4) {
          const x1 = Math.max(x, x + k);
          const y1 = y + (x1 - (x + k));
          const x2 = Math.min(x + TILE, x + k + TILE);
          const y2 = y + (x2 - (x + k));
          if (x2 > x1) g.lineBetween(x1, y1, x2, y2);
        }
        g.lineStyle(2, col(warn ? 'warn.red' : isBoss ? 'boss.gold' : 'threat.orange'), 1);
        if (tracking) this.dashedRect(g, x + 1, y + 1, TILE - 2, TILE - 2, 6);
        else g.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        if (isBoss && i === 0) {
          const n = this.bossLineNums[e.bossStep === 2 ? 1 : 0];
          n.setPosition(x + 10, y + 10).setText(String(e.bossStep)).setVisible(true);
        }
      });
    }
    // 추적 점선 연결 (추적자→예고 칸)
    for (const e of st.enemies) {
      if (e.type !== 'chaser' || e.state !== 'cast' || e.locked) continue;
      const [ex, ey] = cellCenter(e.cell[0], e.cell[1]);
      for (const c of e.telegraphCells) {
        const [tx, ty] = cellCenter(c[0], c[1]);
        this.dashedLine(g, ex, ey, tx, ty, 4, col('threat.orange'));
      }
    }
    // 스폰 예고
    for (const s of st.spawnTelegraphs) {
      const k = 1 - Math.max(0, s.remaining) / SPAWN.spawn.telegraph_s;
      const size = 56 - 16 * k;
      const [cx, cy] = cellCenter(s.cell[0], s.cell[1]);
      g.lineStyle(2, col('threat.orange_dim'), 1);
      this.dashedRect(g, cx - size / 2, cy - size / 2, size, size, 5);
    }
    void now;
  }

  private dashedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, dash: number) {
    const seg = (x1: number, y1: number, x2: number, y2: number) => this.dashedLine(g, x1, y1, x2, y2, dash);
    seg(x, y, x + w, y);
    seg(x + w, y, x + w, y + h);
    seg(x + w, y + h, x, y + h);
    seg(x, y + h, x, y);
  }
  private dashedLine(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, dash: number, color?: number) {
    if (color !== undefined) g.lineStyle(1, color, 0.9);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const n = Math.floor(len / (dash * 2));
    for (let i = 0; i <= n; i++) {
      const a = (i * dash * 2) / len;
      const b = Math.min(1, (i * dash * 2 + dash) / len);
      g.lineBetween(x1 + dx * a, y1 + dy * a, x1 + dx * b, y1 + dy * b);
    }
  }

  private drawRing() {
    const g = this.ringGfx;
    const st = this.sim.state;
    g.clear();
    const [cx, cy] = cellCenter(st.player.cell[0], st.player.cell[1]);
    const r = RING.radius_px;
    const gapRad = Phaser.Math.DegToRad(RING.segment_gap_deg);
    const segRad = Phaser.Math.DegToRad(45) - gapRad;
    const v = this.sim.vocab;
    DIR_ORDER.forEach((dir, i) => {
      const centerA = -Math.PI / 2 + (Math.PI / 4) * i;
      const a0 = centerA - segRad / 2;
      const a1 = centerA + segRad / 2;
      const abbreviated = (v.dirTokens.get(dir) ?? []).length > 1;
      g.lineStyle(RING.gauge_arc_width_px, col(abbreviated ? 'line.strong' : 'line.faint'), 1);
      g.beginPath();
      g.arc(cx, cy, r, a0, a1, false);
      g.strokePath();
      const casters = st.enemies
        .filter((e) => e.state === 'cast' && e.castDir === dir && e.type !== 'boss_executor')
        .sort((a, b) => a.castRemaining - b.castRemaining);
      const text = this.ringTexts[i];
      const icon = this.ringIcons[i];
      const waiting = st.enemies.filter((e) => e.state === 'waiting' && this.dirFromPlayer(e.cell) === dir).length;
      if (casters.length === 0) {
        text.setVisible(false);
        icon.setVisible(false);
        return;
      }
      const e = casters[0];
      const progress = e.castTotal > 0 ? 1 - e.castRemaining / e.castTotal : 0;
      const warn = e.castRemaining <= 1.0;
      g.lineStyle(warn ? 10 : RING.gauge_arc_width_px, col(warn ? 'warn.red' : 'threat.orange'), 1);
      g.beginPath();
      g.arc(cx, cy, r, a0, a0 + segRad * Math.max(0, Math.min(1, progress)), false);
      g.strokePath();
      const tx = cx + Math.cos(centerA) * RING.text_offset_px;
      const ty = cy + Math.sin(centerA) * RING.text_offset_px;
      text.setPosition(tx, ty).setText(e.castRemaining.toFixed(1)).setVisible(true);
      text.setStyle(monoStyle(SZ_MONO.gauge, warn ? 'warn.red' : 'text.primary', { fontStyle: warn ? 'bold' : 'normal' }));
      const ix = cx + Math.cos(centerA) * RING.icon_offset_px;
      const iy = cy + Math.sin(centerA) * RING.icon_offset_px;
      icon.setPosition(ix, iy).setVisible(true);
      const iconId = `icon.enemy.${e.type}`;
      const marks = (casters.length > 1 ? '′' : '') + (waiting ? '…' : '');
      if (icon.getData('iconId') !== iconId || icon.getData('marks') !== marks) {
        icon.removeAll(true);
        icon.add(iconNode(this, 0, 0, iconId, 20));
        if (marks) icon.add(this.add.text(12, -10, marks, monoStyle(12, 'threat.orange')).setOrigin(0, 0.5));
        icon.setData('iconId', iconId).setData('marks', marks);
      }
    });
  }

  private drawGuard() {
    const g = this.guardGfx;
    const st = this.sim.state;
    g.clear();
    if (!st.player.guard) return;
    const [cx, cy] = cellCenter(st.player.cell[0], st.player.cell[1]);
    const i = DIR_ORDER.indexOf(st.player.guard.dir);
    const centerA = -Math.PI / 2 + (Math.PI / 4) * i;
    g.lineStyle(5, col('ally.teal'), 1);
    g.beginPath();
    g.arc(cx, cy, 34, centerA - Math.PI / 2, centerA + Math.PI / 2, false);
    g.strokePath();
  }

  private drawFx(now: number, weak: boolean) {
    const g = this.fxGfx;
    g.clear();
    this.fx = this.fx.filter((f) => now - f.t0 < f.dur);
    const st = this.sim.state;
    const [px, py] = cellCenter(st.player.cell[0], st.player.cell[1]);
    for (const f of this.fx) {
      const k = (now - f.t0) / f.dur;
      switch (f.kind) {
        case 'fx.slash': {
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          const a = k < 0.4 ? 1 : weak ? 0 : 1 - (k - 0.4) / 0.6;
          if (a <= 0) break;
          g.lineStyle(6, col('ally.teal'), a);
          const ang = Math.atan2(y - py, x - px);
          g.beginPath();
          g.arc(x, y, 22, ang - 1.2, ang + 1.2, false);
          g.strokePath();
          if (f.hit) {
            g.lineStyle(2, 0xffffff, a);
            g.lineBetween(x - 14, y - 10, x + 14, y + 10);
            g.lineBetween(x - 14, y + 10, x + 14, y - 10);
          }
          break;
        }
        case 'fx.thrust': {
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          const a = 1 - k;
          g.lineStyle(3, col('ally.teal'), a);
          g.lineBetween(px, py, x, y);
          g.lineStyle(2, col('ally.teal'), a);
          g.strokePoints([{ x, y: y - 12 }, { x: x + 12, y }, { x, y: y + 12 }, { x: x - 12, y }] as Phaser.Math.Vector2[], true);
          break;
        }
        case 'fx.spin': {
          const a = 1 - k;
          const i = DIR_ORDER.indexOf(f.dir!);
          const centerA = -Math.PI / 2 + (Math.PI / 4) * i;
          g.lineStyle(8, col('ally.teal'), a);
          g.beginPath();
          g.arc(px, py, 40, centerA - Math.PI / 3, centerA + Math.PI / 3, false);
          g.strokePath();
          break;
        }
        case 'fx.move_trail': {
          if (weak) break;
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          g.fillStyle(col('player.ivory'), 0.4 * (1 - k));
          g.fillRoundedRect(x - 10, y - 20, 20, 36, 6);
          break;
        }
        case 'fx.enemy_attack': {
          for (const c of f.cells ?? []) {
            const x = L.board.x + c[0] * TILE;
            const y = L.board.y + c[1] * TILE;
            const a = k < 0.4 ? (weak ? 0.35 : 0.7) : (1 - k) * (weak ? 0.35 : 0.7);
            g.fillStyle(col('threat.orange'), a);
            g.fillRect(x, y, TILE, TILE);
          }
          break;
        }
        case 'fx.guard_pop':
        case 'fx.guard_break': {
          if (f.kind === 'fx.guard_break' && !weak) {
            const i = DIR_ORDER.indexOf(f.dir!);
            const centerA = -Math.PI / 2 + (Math.PI / 4) * i;
            g.fillStyle(col('ally.teal'), 1 - k);
            for (let j = 0; j < 6; j++) {
              const a = centerA - Math.PI / 2 + (Math.PI / 5) * j;
              const d = 34 + k * 30;
              g.fillCircle(px + Math.cos(a) * d, py + Math.sin(a) * d, 3);
            }
          }
          break;
        }
        case 'fx.pickup_line': {
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          g.lineStyle(2, col('xp.blue'), 1 - k);
          g.lineBetween(x + (px - x) * k, y + (py - y) * k, px, py);
          break;
        }
        case 'fx.levelup_beam': {
          g.fillStyle(col('player.ivory'), 0.8 * (1 - k));
          g.fillRect(px - 12, L.board.y, 24, py - L.board.y + 20);
          break;
        }
        case 'fx.death_dissolve': {
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          const n = weak ? 4 : 8;
          for (let j = 0; j < n; j++) {
            const a = (Math.PI * 2 * j) / n;
            const d = k * 26;
            g.fillStyle(j % 2 ? col('threat.orange') : col('bg.slate'), 1 - k);
            g.fillRect(x + Math.cos(a) * d - 3, y + Math.sin(a) * d - 3, 6, 6);
          }
          break;
        }
        case 'fx.boss_marker': {
          const [x, y] = cellCenter(f.cell![0], f.cell![1]);
          const size = 112 - 32 * k;
          g.lineStyle(3, col('boss.gold'), 1 - k * 0.5);
          this.dashedRect(g, x - size / 2, y - size / 2, size, size, 8);
          break;
        }
      }
    }
  }

  private drawHud(now: number) {
    const st = this.sim.state;
    const p = st.player;
    // 명령창
    if (this.cmdFlashUntil && now > this.cmdFlashUntil && (this.cmdState === 'invalid' || this.cmdState === 'complete_flash')) {
      const pr0 = parse(p.buffer, this.sim.vocab);
      this.cmdState = p.buffer.length ? (pr0.complete ? 'ready' : pr0.validPrefix ? 'valid_prefix' : 'invalid') : 'idle';
      this.cmdFlashUntil = 0;
    }
    const cb = L.command_bar;
    const g = this.cmdGfx;
    g.clear();
    g.fillStyle(col('bg.panel'), 1);
    g.fillRoundedRect(cb.x, cb.y, cb.w, cb.h, 6);
    g.lineStyle(this.cmdState === 'ready' ? 3 : 2, col(this.cmdState === 'ready' ? 'ally.teal' : (CMD_STATES[this.cmdState].border as string)), 1);
    g.strokeRoundedRect(cb.x, cb.y, cb.w, cb.h, 6);
    const showHintCmd = !this.tut.firstChar && getSettings().hints && p.buffer.length === 0;
    this.cmdText.setText(showHintCmd ? 'slash left' : p.buffer);
    this.cmdText.setColor(colHex(showHintCmd ? 'text.muted' : 'text.primary'));
    const pr = this.sim.vocab;
    let right = '';
    if (now < this.failUntil) right = this.failText;
    else if (p.buffer.length > 0) {
      if (pr.patterns.has(p.buffer)) right = 'Enter ↵';
      else {
        const cands = [...pr.patterns.keys()].filter((k) => k.startsWith(p.buffer) && !k.endsWith('.')).sort((a, b) => a.length - b.length || a.localeCompare(b));
        if (cands.length > 0) right = cands.length === 1 || cands[0].length - p.buffer.length <= 2 ? t('hud.remaining_chars', { n: cands[0].length - p.buffer.length }) : cands.slice(0, 3).join('  ');
      }
    }
    this.cmdRight.setText(right).setColor(colHex(now < this.failUntil ? 'warn.red' : 'text.muted'));

    // 시계·HP·XP
    const { mm, ss } = fmtClock(st.clock);
    this.clockText.setText(t('run.clock', { mm, ss }));
    const sp = L.side_panel;
    const r1 = L.side_panel_rows.clock_hp_xp;
    this.hpGfx.clear();
    for (let i = 0; i < p.hpMax; i++) {
      const x = sp.x + 180 + i * 22;
      const y = r1.y + 34;
      if (i < p.hp) {
        this.hpGfx.fillStyle(col(p.hp <= 2 ? 'warn.red' : 'player.ivory'), 1);
        this.hpGfx.fillRoundedRect(x, y, 18, 18, 3);
      } else {
        this.hpGfx.lineStyle(1, col('line.faint'), 1);
        this.hpGfx.strokeRoundedRect(x, y, 18, 18, 3);
      }
    }
    this.hpText.setText(t('hud.hp', { hp: p.hp, hp_max: p.hpMax }));
    this.xpGfx.clear();
    const xw = 180;
    this.xpGfx.fillStyle(col('bg.ink'), 1);
    this.xpGfx.fillRoundedRect(sp.x + 360, r1.y + 36, xw, 14, 4);
    const ratio = now < this.xpFillAnimUntil ? 1 : Math.min(1, p.xp / xpNext(p.level));
    this.xpGfx.fillStyle(col('xp.blue'), 1);
    this.xpGfx.fillRoundedRect(sp.x + 360, r1.y + 36, Math.max(4, xw * ratio), 14, 4);
    this.xpText.setText(t('hud.xp', { level: p.level, xp: p.xp, xp_next: xpNext(p.level) }));

    // 축약표 강조
    this.abbrRows.forEach((row, i) => {
      const until = this.abbrHighlight.get(i) ?? 0;
      row.setColor(colHex(now < until ? 'ally.teal' : i === 4 && !p.skills.includes('spin') ? 'text.muted' : 'text.primary'));
    });

    // 스킬
    if (p.skills.includes('spin')) {
      const cd = p.cooldowns.spin ?? 0;
      this.skillText.setText(cd > 0 ? t('hud.skill.cooldown', { s: cd.toFixed(1) }) : t('hud.skill.ready'));
      this.skillText.setColor(colHex(cd > 0 ? 'text.muted' : 'ally.teal'));
    } else this.skillText.setText('회전베기 (미보유)');

    // 피격 원인
    if (now > this.hitReasonUntil) this.hitReasonText.setText('');
  }

  private drawBands() {
    const st = this.sim.state;
    const show = st.phase === 'paused' && (st.pauseReason === 'ime' || st.pauseReason === 'focus');
    this.bandBg.setVisible(show);
    this.bandText.setVisible(show);
    if (show) this.bandText.setText(t(st.pauseReason === 'ime' ? 'hud.ime_notice' : 'hud.focus_lost'));
  }

  // ───────────────────────── 레벨업 ─────────────────────────

  private openLevelup() {
    const st = this.sim.state;
    const offer = st.offer!;
    input.combatInput = false;
    this.levelupFocus = 0;
    this.levelupPanels = [];
    const c = this.add.container(0, 0).setDepth(40);
    this.levelupC = c;
    c.add(dimBg(this, 0.72));
    c.add(this.add.text(640, 150, t('levelup.title', { level: st.player.level }), uiStyle(SZ_UI.h1)).setOrigin(0.5));
    const lo = L.levelup_overlay;
    const positions = offer.emergency ? [lo.cards[1]] : lo.cards;
    offer.cards.forEach((card, i) => {
      const pos = positions[i];
      const [w, h] = lo.card_size;
      const panel = this.add.image(pos.x, pos.y, 'ui.panel.card:normal').setOrigin(0);
      this.levelupPanels.push(panel);
      const ct = cardText(card.id, card.rank, st.player, this.sim.vocab);
      const icon = iconNode(this, pos.x + 16 + 16, pos.y + 28, ct.iconKey, 32);
      const rank = this.add.text(pos.x + w - 16, pos.y + 28, ct.rank, monoStyle(SZ_MONO.gauge, 'text.muted')).setOrigin(1, 0.5);
      const num = this.add.text(pos.x + w / 2, pos.y + 28, String(i + 1), monoStyle(SZ_MONO.gauge, 'text.muted')).setOrigin(0.5);
      const title = this.add.text(pos.x + 16, pos.y + 76, ct.title, uiStyle(SZ_UI.card_title, 'text.primary', { fontStyle: '600', wordWrap: { width: w - 32 } }));
      const cat = this.add.text(pos.x + 16, pos.y + 110, ct.category === 'abbreviation' ? '축약' : '성능', uiStyle(SZ_UI.small, ct.category === 'abbreviation' ? 'ally.teal' : 'heal.green'));
      const body = this.add.text(pos.x + 16, pos.y + 140, ct.body, uiStyle(SZ_UI.card_body, 'text.primary', { wordWrap: { width: w - 32 }, lineSpacing: 4 }));
      const hit = this.add.rectangle(pos.x, pos.y, w, h).setOrigin(0).setInteractive();
      hit.on('pointerover', () => {
        this.levelupFocus = i;
        this.redrawLevelup();
      });
      hit.on('pointerdown', () => {
        this.levelupFocus = i;
        this.confirmLevelup();
      });
      c.add([panel, hit, icon, rank, num, title, cat, body]);
    });
    // 푸터
    const main = shortestCommand(this.sim.vocab, 'slash', 'left');
    const band = bandAt(st.clock);
    const next = band ? band.pool.map(([id]) => ENEMY_BY_ID[id].name_ko).join(', ') : ENEMY_BY_ID.boss_executor.name_ko;
    c.add(this.add.text(640, lo.footer.y + 10, t('levelup.footer', { hp: st.player.hp, hp_max: st.player.hpMax, main_cmd: main, next_enemies: next }), uiStyle(SZ_UI.body, 'text.muted')).setOrigin(0.5));
    c.add(this.add.text(640, lo.footer.y + 40, t('levelup.confirm'), uiStyle(SZ_UI.small, 'text.muted')).setOrigin(0.5));
    if (getSettings().hints && !this.tut.abbrPicked) c.add(this.add.text(640, 110, t('tut.05'), uiStyle(SZ_UI.small, 'ally.teal')).setOrigin(0.5));
    this.redrawLevelup();
  }

  private redrawLevelup() {
    this.levelupPanels.forEach((p, i) => p.setTexture(i === this.levelupFocus ? 'ui.panel.card:selected' : 'ui.panel.card:normal'));
  }

  private levelupKey(k: UiKey) {
    const n = this.levelupPanels.length;
    if (k === 'digit1' || k === 'digit2' || k === 'digit3') {
      const i = Number(k.slice(-1)) - 1;
      if (i < n) {
        this.levelupFocus = i;
        this.redrawLevelup();
      }
      return;
    }
    if (k === 'left' || k === 'right') {
      this.levelupFocus = (this.levelupFocus + (k === 'left' ? -1 : 1) + n) % n;
      this.redrawLevelup();
      return;
    }
    if (k === 'enter') this.confirmLevelup();
  }

  private confirmLevelup() {
    const now = this.time.now;
    if (now - this.levelupConfirmedAt < 300) return; // Enter 연타 중복 방지
    this.levelupConfirmedAt = now;
    input.push({ kind: 'card', index: this.levelupFocus });
    // 다음 스텝에서 sim 이 적용. 카드 화면은 상태 변화에 따라 갱신
    this.closeLevelup();
    this.time.delayedCall(0, () => {
      /* 다음 update 에서 phase 확인 후 재개 또는 다음 카드 */
    });
  }

  private closeLevelup() {
    this.levelupC?.destroy(true);
    this.levelupC = null;
    this.levelupPanels = [];
    if (this.sim.state.phase === 'combat' || this.sim.state.phase === 'waiting_first_input') input.combatInput = true;
  }

  // ───────────────────────── 일시정지·설정 ─────────────────────────

  private openPause() {
    if (this.pauseC) return;
    input.combatInput = false;
    const c = this.add.container(0, 0).setDepth(50);
    this.pauseC = c;
    c.add(dimBg(this, 0.6));
    c.add(panelBg(this, 400, 160, 480, 400));
    c.add(this.add.text(640, 200, t('pause.title'), uiStyle(SZ_UI.h1)).setOrigin(0.5));
    this.pauseMenu = new Menu(this, 640, 250, [
      { label: t('pause.resume'), onSelect: () => this.closePause() },
      { label: t('pause.settings'), onSelect: () => this.openSettings() },
      { label: t('pause.restart'), onSelect: () => this.askConfirm(() => this.scene.restart({ seed: this.seed })) },
      { label: t('pause.to_title'), onSelect: () => this.askConfirm(() => this.scene.start('title')) },
    ]);
    c.add(this.pauseMenu.container);
    if (saveError) c.add(this.add.text(640, 520, t('error.save'), uiStyle(SZ_UI.small, 'warn.red')).setOrigin(0.5));
  }

  private closePause() {
    this.closePauseUi();
    input.push({ kind: 'resume' });
  }

  private closePauseUi() {
    this.pauseMenu?.destroy();
    this.pauseMenu = null;
    this.pauseC?.destroy(true);
    this.pauseC = null;
    input.clear();
    if (this.sim.state.phase !== 'paused') input.combatInput = true;
  }

  private openSettings() {
    this.settings = new SettingsPanel(this, () => {
      this.settings?.destroy();
      this.settings = null;
      this.pauseMenu?.redraw();
      if (this.hintKey && !getSettings().hints) this.hintText.setText('');
    });
    this.settings.container.setDepth(60);
  }

  private askConfirm(yes: () => void) {
    this.confirm = new ConfirmDialog(this, '진행 중인 런이 사라집니다', () => {
      this.confirm?.destroy();
      this.confirm = null;
      yes();
    }, () => {
      this.confirm?.destroy();
      this.confirm = null;
    });
    this.confirm.container.setDepth(70);
  }
}






