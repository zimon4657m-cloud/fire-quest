import { describe, it, expect } from 'vitest';
import { simulateBoss, stockBeta } from './boss';
import { TEST_CONFIG as C } from './testConfig';
import { profile } from './fixtures';
import type { CrashScenario, Stock } from '../types';

const stock = (o: Partial<Stock>): Stock => ({
  id: 's', name: 'テスト', status: 'equipped', kind: 'stock', amount: 100,
  per: 15, pbr: 1.5, beta: 1, moveType: null, dividendYield: 0, ...o,
});
const scenario = (r: number[]): CrashScenario => ({ id: 't', bossName: 'テスト', modelName: '', monthlyReturns: r, source: '' });
const P = profile({ cash: 50, monthlySaving: 0, monthlyExpense: 10 });

describe('stockBeta', () => {
  it('インデックスは常に1、なければ値動きタイプ、どちらもなければ1', () => {
    expect(stockBeta(stock({ kind: 'index', beta: 2 }), C)).toBe(1);
    expect(stockBeta(stock({ beta: null, moveType: 'cyclical' }), C)).toBe(1.3);
    expect(stockBeta(stock({ beta: null }), C)).toBe(1);
  });
});

describe('simulateBoss', () => {
  it('下落と回復、最大の減少額、戻ったターン', () => {
    const r = simulateBoss([stock({})], P, scenario([-0.5, 0, 1.0]), 'falcon', {}, C);
    expect(r.turns.map((t) => t.total)).toEqual([100, 100, 150]);
    expect([r.startTotal, r.minTotal, r.maxDrop, r.recoveryTurn]).toEqual([150, 100, 50, 3]);
    expect(r.hpMonths).toBe(5);
  });
  it('戻らなければ recoveryTurn は null', () => {
    expect(simulateBoss([stock({})], P, scenario([-0.5]), 'falcon', {}, C).recoveryTurn).toBeNull();
  });
  it('下がらなければ maxDrop 0・recoveryTurn 0', () => {
    const r = simulateBoss([stock({})], P, scenario([0.1]), 'falcon', {}, C);
    expect([r.maxDrop, r.recoveryTurn]).toEqual([0, 0]);
  });
  it('亀は守り側の下げを10%軽くする', () => {
    const r = simulateBoss([stock({ beta: 0.5 })], P, scenario([-0.2]), 'turtle', {}, C);
    expect(r.turns[0].invested).toBeCloseTo(91); // 100 - 100*0.2*0.5*0.9
  });
  it('隼は攻め側の上げを10%増やす', () => {
    const r = simulateBoss([stock({ beta: 1.5 })], P, scenario([0.1]), 'falcon', {}, C);
    expect(r.turns[0].invested).toBeCloseTo(116.5); // 100 + 100*0.1*1.5*1.1
  });
  it('リスは配当の回復を10%増やす', () => {
    const r = simulateBoss([stock({ dividendYield: 12 })], P, scenario([0]), 'squirrel', {}, C);
    expect(r.turns[0].invested).toBeCloseTo(101.1);
  });
  it('うさぎは逃げると以降ダメージを受けない', () => {
    const run = (k?: number) => simulateBoss([stock({})], P, scenario([-0.5, -0.5]), 'rabbit', { escapeAtTurn: k }, C);
    expect(run(2).turns[1]).toMatchObject({ invested: 0, cash: 100, total: 100, escaped: true });
    expect(run(2).escapedAt).toBe(2);
    expect(run().turns[1].total).toBe(75);
  });
  it('うさぎ以外は escapeAtTurn を無視', () => {
    const r = simulateBoss([stock({})], P, scenario([-0.5, -0.5]), 'turtle', { escapeAtTurn: 1 }, C);
    expect(r.escapedAt).toBeNull();
  });
  it('積立は毎ターン積立袋に入り、相場と一緒に動く', () => {
    const r = simulateBoss([], profile({ cash: 0, monthlySaving: 10, monthlyExpense: 10 }), scenario([0, -0.5]), 'falcon', {}, C);
    expect(r.turns.map((t) => t.invested)).toEqual([10, 15]); // 10 → 10*0.5+10
  });
  it('欲しいものリストと金額0は戦わない', () => {
    const r = simulateBoss([stock({ status: 'wishlist' }), stock({ amount: 0 })], P, scenario([-0.5]), 'falcon', {}, C);
    expect(r.turns[0].invested).toBe(0);
  });
  it('生活費0なら hpMonths は null', () => {
    expect(simulateBoss([], profile({ monthlyExpense: 0 }), scenario([0]), 'falcon', {}, C).hpMonths).toBeNull();
  });
});
