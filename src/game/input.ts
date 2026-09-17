// input.layer: DOM keydown → 스텝 정렬 입력 큐. IME(composition)·포커스·키 반복 차단·카드 번호 격리.
import type { InputEvent } from '../sim/types';

export type UiKey = 'up' | 'down' | 'left' | 'right' | 'enter' | 'escape' | 'f10' | 'f3' | 'digit1' | 'digit2' | 'digit3';

export class InputLayer {
  private queue: InputEvent[] = [];
  private composing = false;
  private focused = true;
  /** 전투 문자 입력을 받을지 (레벨업·모달에서는 false → 카드 번호 등이 버퍼에 새지 않음) */
  combatInput = false;
  onUiKey: ((k: UiKey, ev: KeyboardEvent) => void) | null = null;
  onImeChange: ((composing: boolean) => void) | null = null;
  onFocusChange: ((focused: boolean) => void) | null = null;
  /** 첫 사용자 제스처(오디오 언락 등) */
  onAnyKey: (() => void) | null = null;
  private target: HTMLElement | Window;

  constructor(target: HTMLElement | Window = window) {
    this.target = target;
    this.bind();
  }

  private bind() {
    const t = this.target as Window;
    t.addEventListener('keydown', this.onKeyDown as EventListener);
    t.addEventListener('compositionstart', () => {
      this.composing = true;
      this.onImeChange?.(true);
    });
    t.addEventListener('compositionend', () => {
      this.composing = false;
      this.onImeChange?.(false);
    });
    window.addEventListener('blur', () => {
      this.focused = false;
      this.onFocusChange?.(false);
    });
    window.addEventListener('focus', () => {
      this.focused = true;
      this.onFocusChange?.(true);
    });
  }

  get isComposing() {
    return this.composing;
  }
  get isFocused() {
    return this.focused;
  }

  private onKeyDown = (ev: KeyboardEvent) => {
    this.onAnyKey?.();
    if (ev.repeat) return; // 키 반복 무시 (T-INPUT-03)
    // 한글 IME: keydown 의 key 가 'Process' 또는 isComposing
    if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) {
      if (!this.composing) {
        this.composing = true;
        this.onImeChange?.(true);
      }
      return;
    }
    const uiKey = this.uiKeyOf(ev);
    if (uiKey) {
      if (['up', 'down', 'left', 'right', 'f10', 'f3', 'enter'].includes(uiKey) || (!this.combatInput && uiKey.startsWith('digit'))) {
        ev.preventDefault();
      }
      this.onUiKey?.(uiKey, ev);
      if (uiKey === 'escape') {
        if (this.combatInput) this.queue.push({ kind: 'escape' });
        ev.preventDefault();
        return;
      }
      if (uiKey.startsWith('digit') && !this.combatInput) return;
      if (uiKey === 'enter' || uiKey === 'f10' || uiKey === 'f3' || uiKey === 'up' || uiKey === 'down' || uiKey === 'left' || uiKey === 'right') return;
    }
    if (!this.combatInput) return;
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (ev.key === 'Backspace') {
      this.queue.push({ kind: 'backspace' });
      ev.preventDefault();
      return;
    }
    if (ev.key.length === 1) {
      const ch = ev.key.toLowerCase();
      if (/^[a-z1-9 .]$/.test(ch)) {
        this.queue.push({ kind: 'char', ch });
        ev.preventDefault();
      }
    }
  };

  private uiKeyOf(ev: KeyboardEvent): UiKey | null {
    switch (ev.key) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      case 'Enter':
        return 'enter';
      case 'Escape':
        return 'escape';
      case 'F10':
        return 'f10';
      case 'F3':
        return 'f3';
      case '1':
        return 'digit1';
      case '2':
        return 'digit2';
      case '3':
        return 'digit3';
    }
    return null;
  }

  /** 이번 스텝에 도착한 입력을 꺼낸다 */
  drain(): InputEvent[] {
    const q = this.queue;
    this.queue = [];
    return q;
  }
  push(e: InputEvent) {
    this.queue.push(e);
  }
  clear() {
    this.queue = [];
  }
}

export const input = new InputLayer();
