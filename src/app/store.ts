import type { SaveData } from '../types';
import { readSave, writeSave } from '../logic/storage';

let data: SaveData;
let storage: Storage | null = null;
let storageOk = false;
let corrupted = false;
const listeners = new Set<(d: SaveData) => void>();

export function initStore(s: Storage | null): void {
  storage = s;
  const r = readSave(s);
  data = r.data;
  storageOk = r.storageOk;
  corrupted = r.corrupted;
}

export const getData = () => data;
export const isStorageOk = () => storageOk;
export const wasCorrupted = () => corrupted;

function persist() {
  if (storage && storageOk && !corrupted) {
    try {
      writeSave(storage, data);
    } catch {
      storageOk = false;
    }
  }
  listeners.forEach((l) => l(data));
}

export function update(fn: (d: SaveData) => void): void {
  fn(data);
  persist();
}

/** 読み込み機能から呼ぶ。壊れたデータの状態を解除して上書きする */
export function replaceAll(d: SaveData): void {
  data = d;
  corrupted = false;
  persist();
}

export function subscribe(fn: (d: SaveData) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
