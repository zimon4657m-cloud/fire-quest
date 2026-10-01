import { describe, it, expect } from 'vitest';
import { computeCompass, futureValue, makePlan, monthsBetween, requiredMonthlySaving } from './compass';
import { TEST_CONFIG as C } from './testConfig';
import { profile } from './fixtures';
import type { Plan } from '../types';

describe('計算の部品', () => {
  it('monthsBetween は満了した月数', () => {
    expect(monthsBetween('2026-01-01', '2026-11-01')).toBe(10);
    expect(monthsBetween('2026-01-15', '2026-11-01')).toBe(9);
    expect(monthsBetween('2026-11-01', '2026-01-01')).toBe(0);
  });
  it('futureValue(利回り0%と1%/月)', () => {
    expect(futureValue(100, 0, 0, 12)).toBe(100);
    expect(futureValue(0, 10, 0, 12)).toBe(120);
    expect(futureValue(1000, 0, 12, 12)).toBeCloseTo(1126.825, 2);
  });
  it('requiredMonthlySaving', () => {
    expect(requiredMonthlySaving(0, 1200, 0, 12)).toBe(100);
    expect(requiredMonthlySaving(2000, 1200, 0, 12)).toBeLessThanOrEqual(0);
    expect(requiredMonthlySaving(0, 1200, 0, 0)).toBeNull();
    expect(Number.isFinite(requiredMonthlySaving(0, 1200, 12, 12)!)).toBe(true);
  });
});

describe('makePlan', () => {
  it('今の総資産から、目標年齢で目標額に届く積立額を出す', () => {
    const p = profile({ age: 44, cash: 0, investments: 0, otherAssets: 0, fullFireTarget: 1200, expectedReturn: 0 });
    const plan = makePlan(p, { type: 'fullFire', targetAge: 45 }, '2026-10-01', C);
    expect(plan).toEqual({ startDate: '2026-10-01', startAssets: 0, targetAmount: 1200, targetAge: 45, plannedMonthlySaving: 100 });
  });
  it('目標年齢が今以下なら積立額0', () => {
    const p = profile({ age: 50, expectedReturn: 0 });
    expect(makePlan(p, { type: 'fullFire', targetAge: 45 }, '2026-10-01', C).plannedMonthlySaving).toBe(0);
  });
});

describe('computeCompass', () => {
  const plan: Plan = { startDate: '2026-01-01', startAssets: 1000, targetAmount: 1_000_000, targetAge: 45, plannedMonthlySaving: 100 };
  const run = (total: number, o = {}) =>
    computeCompass(
      profile({ age: 32, cash: total, investments: 0, otherAssets: 0, expectedReturn: 0, fullFireTarget: 1_000_000, ...o }),
      { type: 'fullFire', targetAge: 45 }, plan, { y: 0 }, 'turtle', '2026-11-01', C,
    );
  it('ペースの境界(今いるべき額 2000)', () => {
    expect(run(2100).pace).toBe('ahead');
    expect(run(1900).pace).toBe('onTrack');
    expect(run(1899).pace).toBe('behind');
    expect(run(1900).expectedNow).toBe(2000);
  });
  it('遅れていると霧が出る', () => {
    expect(run(1899).fog).toBe(true);
    expect(run(2100).fog).toBe(false);
  });
  it('予定線がなければペースは null', () => {
    const r = computeCompass(profile(), { type: 'fullFire', targetAge: 45 }, null, null, 'turtle', '2026-11-01', C);
    expect([r.pace, r.expectedNow]).toEqual([null, null]);
  });
  it('目標年齢が今以下なら badAge', () => {
    expect(run(2000, { age: 45 }).saving.status).toBe('badAge');
  });
  it('資産がすでに目標以上なら alreadyEnough', () => {
    expect(run(2_000_000).saving.status).toBe('alreadyEnough');
  });
  it('今の積立で足りれば onPace、足りなければ needMore と差額', () => {
    expect(run(0, { monthlySaving: 10_000 }).saving.status).toBe('onPace');
    const r = run(0, { monthlySaving: 0 });
    expect(r.saving.status).toBe('needMore');
    expect(r.saving.diff).toBeCloseTo(r.saving.required);
  });
  it('職業とのズレ(亀は y < -0.3 でズレ)', () => {
    const p = profile({ expectedReturn: 0 });
    const g = { type: 'fullFire' as const, targetAge: 45 };
    expect(computeCompass(p, g, null, { y: -0.31 }, 'turtle', '2026-11-01', C).fit.ok).toBe(false);
    expect(computeCompass(p, g, null, { y: -0.3 }, 'turtle', '2026-11-01', C).fit.ok).toBe(true);
    expect(computeCompass(p, g, null, { y: -1 }, 'falcon', '2026-11-01', C).fit.ok).toBe(true);
    expect(computeCompass(p, g, null, null, 'rabbit', '2026-11-01', C).fit.ok).toBe(true);
    expect(computeCompass(p, g, null, { y: -0.31 }, 'turtle', '2026-11-01', C).fog).toBe(true);
  });
});
