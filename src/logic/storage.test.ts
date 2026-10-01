import { describe, it, expect } from 'vitest';
import { emptySave, exportJson, importJson, InvalidSaveError, isStorageAvailable, parseSave, readSave, SAVE_KEY, writeSave } from './storage';
import type { SaveData } from '../types';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
class BrokenStorage extends MemoryStorage {
  setItem(): void { throw new Error('QuotaExceeded'); }
}

describe('storage', () => {
  it('空の保存データ', () => {
    const d = emptySave();
    expect(d.version).toBe(1);
    expect(d.stocks).toEqual([]);
    expect(d.quests).toEqual({ openedAccount: false, setupNisa: false, recordedExpense: false });
  });
  it('書いて読むと同じ', () => {
    const s = new MemoryStorage();
    const d = { ...emptySave(), job: 'turtle' as const };
    writeSave(s, d);
    expect(readSave(s)).toEqual({ data: d, storageOk: true, corrupted: false });
  });
  it('何も保存されていなければ空データ', () => {
    expect(readSave(new MemoryStorage()).data).toEqual(emptySave());
  });
  it('壊れたJSONは空データで起動し corrupted=true、元のデータは消さない', () => {
    const s = new MemoryStorage();
    s.setItem(SAVE_KEY, '{broken');
    const r = readSave(s);
    expect([r.corrupted, r.data]).toEqual([true, emptySave()]);
    expect(s.getItem(SAVE_KEY)).toBe('{broken');
  });
  it('localStorage が使えなければ storageOk=false', () => {
    expect(isStorageAvailable(new BrokenStorage())).toBe(false);
    expect(isStorageAvailable(null)).toBe(false);
    expect(readSave(null).storageOk).toBe(false);
  });
  it('書き出し→読み込みで同じデータ', () => {
    const d = { ...emptySave(), job: 'rabbit' as const };
    expect(importJson(exportJson(d))).toEqual(d);
  });
  it('形が違うJSONは InvalidSaveError', () => {
    expect(() => importJson('{"version":99}')).toThrow(InvalidSaveError);
    expect(() => importJson('[]')).toThrow(InvalidSaveError);
    expect(() => importJson('not json')).toThrow(InvalidSaveError);
    expect(() => parseSave({ ...emptySave(), job: 'dragon' })).toThrow(InvalidSaveError);
    expect(() => parseSave({ ...emptySave(), stocks: 'x' })).toThrow(InvalidSaveError);
  });
  it('足りない項目は初期値で補う(古いデータの移行)', () => {
    const old: Partial<SaveData> = emptySave();
    delete old.openedChests;
    delete old.history;
    expect(parseSave(old)).toEqual(emptySave());
  });
});
