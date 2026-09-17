// 설정·기록 로컬 저장 (웹: localStorage, 손상 시 기본값). 런 중 저장 없음.
export interface Settings {
  volume: number; // 0~100
  input_sound: boolean;
  weak_fx: boolean;
  hints: boolean;
  fullscreen: boolean;
}
export interface RecordEntry {
  date: string;
  result: 'clear' | 'death';
  survived_s: number;
  level: number;
  kills: number;
  seed: number;
  cards: string[];
}
interface Profile {
  data_version: 1;
  settings: Settings;
  records: RecordEntry[];
}

const KEY = 'shorthand.profile.v1';
export const DEFAULT_SETTINGS: Settings = { volume: 80, input_sound: true, weak_fx: false, hints: true, fullscreen: false };

let profile: Profile = { data_version: 1, settings: { ...DEFAULT_SETTINGS }, records: [] };
export let saveError = false;

function isSettings(v: unknown): v is Settings {
  return !!v && typeof v === 'object' && typeof (v as Settings).volume === 'number';
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      profile = {
        data_version: 1,
        settings: isSettings(parsed.settings) ? { ...DEFAULT_SETTINGS, ...parsed.settings } : { ...DEFAULT_SETTINGS },
        records: Array.isArray(parsed.records) ? parsed.records.slice(0, 50) : [],
      };
    }
  } catch {
    profile = { data_version: 1, settings: { ...DEFAULT_SETTINGS }, records: [] };
  }
  return profile;
}

function persist(): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    saveError = false;
    return true;
  } catch {
    saveError = true;
    return false;
  }
}

export function getSettings(): Settings {
  return profile.settings;
}
export function updateSettings(patch: Partial<Settings>): boolean {
  profile.settings = { ...profile.settings, ...patch };
  return persist();
}
export function getRecords(): RecordEntry[] {
  return profile.records;
}
export function addRecord(r: RecordEntry): boolean {
  profile.records.unshift(r);
  profile.records = profile.records.slice(0, 50);
  return persist();
}
