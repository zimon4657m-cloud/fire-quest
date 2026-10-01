import { describe, it, expect } from 'vitest';
import { applyRegistration, computeExp } from './registration';
import { emptySave } from './storage';
import { profile } from './fixtures';
import { TEST_CONFIG as C } from './testConfig';

describe('applyRegistration', () => {
  it('初回はゴール・プロフィール・予定線・履歴を保存する', () => {
    const d = emptySave();
    applyRegistration(d, profile(), { type: 'fullFire', targetAge: 45 }, '2026-10-01', C);
    expect(d.goal).toEqual({ type: 'fullFire', targetAge: 45 });
    expect(d.plan?.targetAge).toBe(45);
    expect(d.history).toHaveLength(1);
  });
  it('宿屋で目標年齢を変えると予定線を引き直す', () => {
    const d = emptySave();
    applyRegistration(d, profile(), { type: 'fullFire', targetAge: 30 }, '2026-10-01', C);
    applyRegistration(d, profile(), { type: 'fullFire', targetAge: 50 }, '2026-11-01', C);
    expect(d.goal?.targetAge).toBe(50);
    expect(d.plan).toMatchObject({ targetAge: 50, startDate: '2026-11-01' });
  });
  it('ゴールの種類を変えても引き直す', () => {
    const d = emptySave();
    applyRegistration(d, profile(), { type: 'fullFire', targetAge: 45 }, '2026-10-01', C);
    applyRegistration(d, profile(), { type: 'sideFire', targetAge: 45 }, '2026-11-01', C);
    expect(d.plan).toMatchObject({ targetAmount: 45_000_000, startDate: '2026-11-01' });
  });
  it('目標が同じなら予定線はそのまま', () => {
    const d = emptySave();
    applyRegistration(d, profile(), { type: 'fullFire', targetAge: 45 }, '2026-10-01', C);
    applyRegistration(d, profile({ cash: 2_000_000 }), { type: 'fullFire', targetAge: 45 }, '2026-11-01', C);
    expect(d.plan?.startDate).toBe('2026-10-01');
    expect(d.history).toHaveLength(2);
  });
});

describe('computeExp', () => {
  it('記録した回数 + 達成した行動クエストの数', () => {
    const d = emptySave();
    expect(computeExp(d)).toBe(0);
    d.history.push({ date: '2026-10-01', totalAssets: 1, cash: 1 });
    d.quests.setupNisa = true;
    expect(computeExp(d)).toBe(2);
  });
});
