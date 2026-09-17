// 큐 재생. 기본 에셋은 WebAudio 비프(주파수로 큐 구분). asset_contract.audio_cues 의 동시 수·볼륨·토글을 지킨다.
import contract from '../../shared/asset_contract.json';
import { getSettings } from './save';

interface Cue {
  cue_id: string;
  concurrency: number;
  volume_db: number;
  user_toggle?: string;
  length_s: string;
}
const CUES: Cue[] = (contract as { audio_cues: Cue[] }).audio_cues;
const CUE_BY_ID = Object.fromEntries(CUES.map((c) => [c.cue_id, c]));

// placeholder 비프 주파수·파형 (큐별 구분용)
const TONE: Record<string, [number, OscillatorType]> = {
  'audio.type_key': [1800, 'square'],
  'audio.command_ok': [880, 'triangle'],
  'audio.command_fail': [180, 'sawtooth'],
  'audio.hit_slash': [420, 'square'],
  'audio.hit_thrust': [600, 'square'],
  'audio.guard_block': [240, 'triangle'],
  'audio.move': [520, 'sine'],
  'audio.cast_warning': [330, 'sine'],
  'audio.player_hit': [120, 'sawtooth'],
  'audio.enemy_death': [300, 'triangle'],
  'audio.xp_pickup': [1320, 'sine'],
  'audio.levelup': [660, 'triangle'],
  'audio.card_select': [740, 'sine'],
  'audio.boss_telegraph': [150, 'square'],
  'audio.clear': [990, 'triangle'],
  'audio.death': [90, 'sawtooth'],
};

let ctx: AudioContext | null = null;
const playing = new Map<string, number>();
export const audioLog: { t: number; cue: string; skipped: string | null }[] = [];

function ensure(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensure();
}

function lengthOf(cue: Cue): number {
  const [a] = cue.length_s.split('~').map(Number);
  return Math.max(0.04, a);
}

export function playCue(cueId: string) {
  const cue = CUE_BY_ID[cueId];
  if (!cue) return;
  const s = getSettings();
  if (cue.user_toggle === 'settings.input_sound' && !s.input_sound) {
    audioLog.push({ t: performance.now(), cue: cueId, skipped: 'toggle' });
    return;
  }
  const n = playing.get(cueId) ?? 0;
  if (n >= cue.concurrency) {
    audioLog.push({ t: performance.now(), cue: cueId, skipped: 'concurrency' });
    return;
  }
  audioLog.push({ t: performance.now(), cue: cueId, skipped: null });
  if (audioLog.length > 500) audioLog.splice(0, audioLog.length - 500);
  const ac = ensure();
  if (!ac || s.volume <= 0) return;
  const [freq, type] = TONE[cueId] ?? [440, 'sine'];
  const len = lengthOf(cue);
  const master = s.volume / 100;
  const g = ac.createGain();
  const amp = Math.pow(10, cue.volume_db / 20) * master * 0.5;
  g.gain.setValueAtTime(amp, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + len);
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (cueId === 'audio.levelup' || cueId === 'audio.clear') o.frequency.exponentialRampToValueAtTime(freq * 1.5, ac.currentTime + len);
  if (cueId === 'audio.death') o.frequency.exponentialRampToValueAtTime(freq * 0.5, ac.currentTime + len);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + len);
  playing.set(cueId, n + 1);
  o.onended = () => playing.set(cueId, Math.max(0, (playing.get(cueId) ?? 1) - 1));
}
