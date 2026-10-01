import { describe, it, expect } from 'vitest';
import { bandMessage } from './messages';
import type { CompassResult } from './compass';

const ok = { ok: true as const, hp: 6, maxHp: 6, level: 5, total: 1, fireRatio: 0.1 };
const compass = (o: Partial<CompassResult>): CompassResult => ({
  pace: 'onTrack', expectedNow: 1, saving: { status: 'onPace', required: 0, diff: 0 },
  fit: { ok: true, message: '' }, fog: false, ...o,
});

describe('bandMessage', () => {
  it('登録前', () => expect(bandMessage(null, null)).toContain('宿屋'));
  it('生活費なし', () => expect(bandMessage({ ok: false, reason: 'noExpense' }, null)).toContain('生活費'));
  it('HP不足が最優先', () => expect(bandMessage({ ...ok, hp: 2 }, compass({ pace: 'behind' }))).toContain('体力'));
  it('遅れ', () => expect(bandMessage(ok, compass({ pace: 'behind' }))).toContain('羅針盤'));
  it('ズレ', () => expect(bandMessage(ok, compass({ fit: { ok: false, message: 'x' } }))).toContain('装備屋'));
  it('先行', () => expect(bandMessage(ok, compass({ pace: 'ahead' }))).toContain('先'));
  it('ふだん', () => expect(bandMessage(ok, compass({}))).toBe('今は大丈夫。一歩ずつ進もう'));
  it('売買をすすめる言葉を含まない', () => {
    const all = [bandMessage(null, null), bandMessage(ok, compass({ pace: 'behind' })), bandMessage(ok, compass({ fit: { ok: false, message: '' } }))];
    for (const m of all) expect(m).not.toMatch(/買[いうえ]|売[りるれ]/);
  });
});
