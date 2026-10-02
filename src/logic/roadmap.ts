import type { GameConfig, Goal, Profile } from '../types';
import { totalAssets } from './status';
import { unlockedGates } from './gates';
import { futureValue } from './compass';

export type MilestoneId = 'start' | 'portBridge' | 'forestGate' | 'passGate' | 'sideFire' | 'fullFire';
export type Milestone = {
  id: MilestoneId;
  emoji: string;
  name: string;
  /** その地点に着くと、暮らしがどう変わるか(短い言葉) */
  meaning: string;
  /** その地点の金額。start は 0 */
  amount: number;
  /** 何で判定するか(橋だけ現金) */
  basis: 'cash' | 'total';
  reached: boolean;
  /** 本人が選んだゴールの地点 */
  isGoal: boolean;
  /** まだマップに無い場所(薄く出す) */
  far: boolean;
};
export type Roadmap = {
  /** 下(スタート)から上(ゴール)の順 */
  milestones: Milestone[];
  /** 「いまここ」を置く位置。milestones[hereIndex] のすぐ上 */
  hereIndex: number;
  total: number;
  next: { milestone: Milestone; remaining: number; etaAge: number | null } | null;
};

const MAX_MONTHS = 1200;

/** 今の資産・毎月の積立・利回りで、target に届くまでの月数。届かなければ null */
export function monthsToReach(current: number, monthly: number, annualPct: number, target: number): number | null {
  if (current >= target) return 0;
  for (let m = 1; m <= MAX_MONTHS; m++) {
    if (futureValue(current, monthly, annualPct, m) >= target) return m;
  }
  return null;
}

export function computeRoadmap(p: Profile, goal: Goal, cfg: GameConfig): Roadmap {
  const total = totalAssets(p);
  const gates = unlockedGates(p, cfg);
  const goalId: MilestoneId = goal.type === 'sideFire' ? 'sideFire' : 'fullFire';
  const mk = (id: MilestoneId, emoji: string, name: string, meaning: string, amount: number, basis: Milestone['basis'], reached: boolean, far = false): Milestone =>
    ({ id, emoji, name, meaning, amount, basis, reached, isGoal: id === goalId, far });

  const upper: Milestone[] = [];
  if (p.fullFireTarget > 0) {
    upper.push(mk('forestGate', '🌲', '森の門', '生活費の1割を資産が稼ぐ', p.fullFireTarget * cfg.gateRatios.forestGate, 'total', gates.has('forestGate')));
    upper.push(mk('passGate', '⛰️', '峠', '生活費の4分の1を資産が稼ぐ', p.fullFireTarget * cfg.gateRatios.passGate, 'total', gates.has('passGate')));
    upper.push(mk('fullFire', '🏰', '完全FIRE宮殿', '働かなくても暮らせる', p.fullFireTarget, 'total', total >= p.fullFireTarget, true));
  }
  if (p.sideFireTarget > 0) upper.push(mk('sideFire', '🏘️', 'サイドFIRE街', '仕事を自由に選べる', p.sideFireTarget, 'total', total >= p.sideFireTarget, true));
  // 同じ金額なら宮殿を上にする
  upper.sort((a, b) => a.amount - b.amount || (a.id === 'fullFire' ? 1 : b.id === 'fullFire' ? -1 : 0));

  const milestones: Milestone[] = [mk('start', '⚓', '港町', '冒険のスタート', 0, 'total', true)];
  if (p.monthlyExpense > 0) {
    milestones.push(mk('portBridge', '🌉', '橋', `収入が止まっても${p.emergencyMonths}か月暮らせる`, p.monthlyExpense * p.emergencyMonths, 'cash', gates.has('portBridge')));
  }
  milestones.push(...upper);

  let hereIndex = 0;
  milestones.forEach((m, i) => { if (m.reached) hereIndex = i; });

  const target = milestones.find((m) => !m.reached);
  let next: Roadmap['next'] = null;
  if (target) {
    const have = target.basis === 'cash' ? p.cash : total;
    let etaAge: number | null = null;
    if (target.basis === 'total') {
      const months = monthsToReach(total, p.monthlySaving, p.expectedReturn ?? cfg.defaultExpectedReturnPercent, target.amount);
      if (months !== null) etaAge = p.age + Math.floor(months / 12);
    }
    next = { milestone: target, remaining: Math.max(0, target.amount - have), etaAge };
  }
  return { milestones, hereIndex, total, next };
}
