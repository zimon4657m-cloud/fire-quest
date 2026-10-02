import { describe, it, expect } from 'vitest';
import { computeRoadmap, monthsToReach } from './roadmap';
import { TEST_CONFIG as C } from './testConfig';
import { profile } from './fixtures';

const side = { type: 'sideFire' as const, targetAge: 45 };
const ids = (r: ReturnType<typeof computeRoadmap>) => r.milestones.map((m) => m.id);

describe('monthsToReach', () => {
  it('すでに届いていれば0', () => expect(monthsToReach(100, 0, 3, 100)).toBe(0));
  it('利回り0なら単純な割り算', () => expect(monthsToReach(0, 10, 0, 100)).toBe(10));
  it('積立0・利回り0で届かなければ null', () => expect(monthsToReach(0, 0, 0, 100)).toBeNull());
});

describe('computeRoadmap', () => {
  it('下から 港町→橋→森→峠→サイド→完全 の順に並ぶ', () => {
    const r = computeRoadmap(profile(), side, C);
    expect(ids(r)).toEqual(['start', 'portBridge', 'forestGate', 'passGate', 'sideFire', 'fullFire']);
    expect(r.milestones.map((m) => m.amount)).toEqual([0, 1_200_000, 6_000_000, 15_000_000, 45_000_000, 60_000_000]);
  });
  it('門の判定は unlockedGates と同じ(総資産600万で森の門まで)', () => {
    const r = computeRoadmap(profile(), side, C); // 合計 6,000,000
    expect(r.milestones.map((m) => m.reached)).toEqual([true, true, true, false, false, false]);
    expect(r.hereIndex).toBe(2);
    expect(r.next?.milestone.id).toBe('passGate');
    expect(r.next?.remaining).toBe(9_000_000);
  });
  it('次の目的地に届く年齢を出す(利回り0・積立10万で90か月=7年後)', () => {
    const r = computeRoadmap(profile({ expectedReturn: 0 }), side, C);
    expect(r.next?.etaAge).toBe(32 + 7);
  });
  it('サイドFIRE額が峠より小さければ峠より手前に並ぶ', () => {
    const r = computeRoadmap(profile({ sideFireTarget: 10_000_000 }), side, C);
    expect(ids(r)).toEqual(['start', 'portBridge', 'forestGate', 'sideFire', 'passGate', 'fullFire']);
  });
  it('サイドと完全が同額なら宮殿が上', () => {
    const r = computeRoadmap(profile({ sideFireTarget: 60_000_000 }), side, C);
    expect(ids(r).slice(-2)).toEqual(['sideFire', 'fullFire']);
  });
  it('ゴールの地点に印が付く', () => {
    expect(computeRoadmap(profile(), side, C).milestones.find((m) => m.isGoal)?.id).toBe('sideFire');
    expect(computeRoadmap(profile(), { type: 'fullFire', targetAge: 50 }, C).milestones.find((m) => m.isGoal)?.id).toBe('fullFire');
  });
  it('橋が未達なら次の目的地は橋で、現金との差を出し年齢は出さない', () => {
    const r = computeRoadmap(profile({ cash: 1_000_000, investments: 4_200_000 }), side, C);
    expect(r.next?.milestone.id).toBe('portBridge');
    expect(r.next?.remaining).toBe(200_000);
    expect(r.next?.etaAge).toBeNull();
    expect(r.hereIndex).toBe(2); // 森の門は総資産で届いている
  });
  it('目標額0の地点は出さない', () => {
    expect(ids(computeRoadmap(profile({ sideFireTarget: 0, fullFireTarget: 0 }), side, C))).toEqual(['start', 'portBridge']);
  });
  it('全部届いたら next は null', () => {
    expect(computeRoadmap(profile({ investments: 100_000_000 }), side, C).next).toBeNull();
  });
});
