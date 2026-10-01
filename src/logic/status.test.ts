import { describe, it, expect } from 'vitest';
import { computeStatus, defaultFireTargets, goalTarget, totalAssets } from './status';
import { TEST_CONFIG as C } from './testConfig';
import { profile } from './fixtures';

describe('status', () => {
  it('総資産は現金+株式+その他', () => expect(totalAssets(profile())).toBe(6_000_000));
  it('FIRE額の初期値(25倍)', () => {
    expect(defaultFireTargets(200_000, 50_000, C)).toEqual({ full: 60_000_000, side: 45_000_000 });
  });
  it('副収入が生活費より多ければサイドFIRE額は0', () => {
    expect(defaultFireTargets(200_000, 300_000, C).side).toBe(0);
  });
  it('目標額はゴールの種類で選ぶ', () => {
    expect(goalTarget({ type: 'sideFire', targetAge: 45 }, profile())).toBe(45_000_000);
    expect(goalTarget({ type: 'fullFire', targetAge: 45 }, profile())).toBe(60_000_000);
    expect(goalTarget({ type: 'amountOnly', targetAge: 45 }, profile())).toBe(60_000_000);
  });
  it('HP・最大HP・Lv', () => {
    const s = computeStatus(profile(), C);
    expect(s).toMatchObject({ ok: true, hp: 6, maxHp: 6, total: 6_000_000 });
    if (s.ok) {
      expect(s.fireRatio).toBeCloseTo(0.1);
      expect(s.level).toBe(5); // 1 + floor(0.1 * 49)
    }
  });
  it('目標を超えたら Lv は最大', () => {
    const s = computeStatus(profile({ cash: 70_000_000 }), C);
    expect(s.ok && s.level).toBe(50);
  });
  it('生活費0なら計算しない', () => {
    expect(computeStatus(profile({ monthlyExpense: 0 }), C)).toEqual({ ok: false, reason: 'noExpense' });
  });
  it('完全FIRE額0なら Lv1・割合0(NaNにならない)', () => {
    const s = computeStatus(profile({ fullFireTarget: 0 }), C);
    expect(s.ok && [s.level, s.fireRatio]).toEqual([1, 0]);
  });
});
