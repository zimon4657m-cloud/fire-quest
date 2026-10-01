import { describe, it, expect } from 'vitest';
import { unlockedGates } from './gates';
import { TEST_CONFIG as C } from './testConfig';
import { profile } from './fixtures';

describe('unlockedGates', () => {
  it('プロフィールがなければ何も開かない', () => expect(unlockedGates(null, C).size).toBe(0));
  it('生活防衛資金を満たすと橋が開く', () => {
    expect(unlockedGates(profile({ cash: 1_200_000 }), C).has('portBridge')).toBe(true);
    expect(unlockedGates(profile({ cash: 1_199_999 }), C).has('portBridge')).toBe(false);
  });
  it('生活費0なら橋は開かない', () => {
    expect(unlockedGates(profile({ monthlyExpense: 0 }), C).has('portBridge')).toBe(false);
  });
  it('目標の10%で森、25%で峠', () => {
    const g10 = unlockedGates(profile({ fullFireTarget: 60_000_000, cash: 1_200_000, investments: 4_000_000, otherAssets: 800_000 }), C);
    expect([g10.has('forestGate'), g10.has('passGate')]).toEqual([true, false]);
    const g25 = unlockedGates(profile({ investments: 13_000_000 }), C); // 合計15,000,000
    expect([g25.has('forestGate'), g25.has('passGate')]).toEqual([true, true]);
  });
  it('完全FIRE額0なら森・峠は開かない', () => {
    const g = unlockedGates(profile({ fullFireTarget: 0 }), C);
    expect([g.has('forestGate'), g.has('passGate')]).toEqual([false, false]);
  });
});
