import type { SaveData } from '../types';

export const SAVE_KEY = 'fire-quest-save';
const JOBS = ['turtle', 'squirrel', 'falcon', 'rabbit'];

export class InvalidSaveError extends Error {}

export function emptySave(): SaveData {
  return {
    version: 1, job: null, goal: null, profile: null, plan: null, stocks: [],
    quests: { openedAccount: false, setupNisa: false, recordedExpense: false },
    openedChests: [], history: [], player: null,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseSave(raw: unknown): SaveData {
  if (!isObj(raw)) throw new InvalidSaveError('保存データの形が違います');
  if (raw.version !== 1) throw new InvalidSaveError('対応していないバージョンです');
  const base = emptySave();
  const d = { ...base, ...raw } as SaveData;
  if (d.job !== null && !JOBS.includes(d.job)) throw new InvalidSaveError('職業が不正です');
  if (!Array.isArray(d.stocks) || !d.stocks.every(isObj)) throw new InvalidSaveError('装備の形が違います');
  if (!Array.isArray(d.history) || !Array.isArray(d.openedChests)) throw new InvalidSaveError('記録の形が違います');
  if (d.profile !== null && !isObj(d.profile)) throw new InvalidSaveError('冒険者の形が違います');
  d.quests = { ...base.quests, ...(isObj(raw.quests) ? raw.quests : {}) };
  return d;
}

export function isStorageAvailable(storage: Storage | null): boolean {
  if (!storage) return false;
  try {
    storage.setItem('__fq_test__', '1');
    storage.removeItem('__fq_test__');
    return true;
  } catch {
    return false;
  }
}

export function readSave(storage: Storage | null) {
  const storageOk = isStorageAvailable(storage);
  if (!storage || !storageOk) return { data: emptySave(), storageOk, corrupted: false };
  const text = storage.getItem(SAVE_KEY);
  if (text === null) return { data: emptySave(), storageOk, corrupted: false };
  try {
    return { data: parseSave(JSON.parse(text)), storageOk, corrupted: false };
  } catch {
    return { data: emptySave(), storageOk, corrupted: true };
  }
}

export function writeSave(storage: Storage, data: SaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function exportJson(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

export function importJson(text: string): SaveData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new InvalidSaveError('JSONとして読めません');
  }
  return parseSave(raw);
}
