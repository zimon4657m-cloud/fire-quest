import type { GameConfig, Goal, Job, Plan, Profile } from '../types';
import { goalTarget, totalAssets } from './status';
import { JOBS } from './job';

export type Pace = 'ahead' | 'onTrack' | 'behind';
export type CompassResult = {
  pace: Pace | null;
  expectedNow: number | null;
  saving: { status: 'badAge' | 'alreadyEnough' | 'onPace' | 'needMore'; required: number; diff: number };
  fit: { ok: boolean; message: string };
  fog: boolean;
};

export function monthsBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  let m = (ty - fy) * 12 + (tm - fm);
  if (td < fd) m -= 1;
  return Math.max(0, m);
}

export function futureValue(start: number, monthly: number, annualPct: number, months: number): number {
  const i = annualPct / 100 / 12;
  if (i === 0) return start + monthly * months;
  const g = Math.pow(1 + i, months);
  return start * g + (monthly * (g - 1)) / i;
}

export function requiredMonthlySaving(current: number, target: number, annualPct: number, months: number): number | null {
  if (months <= 0) return null;
  const i = annualPct / 100 / 12;
  if (i === 0) return (target - current) / months;
  const g = Math.pow(1 + i, months);
  return ((target - current * g) * i) / (g - 1);
}

const rateOf = (p: Profile, cfg: GameConfig) => p.expectedReturn ?? cfg.defaultExpectedReturnPercent;

export function makePlan(p: Profile, goal: Goal, todayISO: string, cfg: GameConfig): Plan {
  const target = goalTarget(goal, p);
  const start = totalAssets(p);
  const req = requiredMonthlySaving(start, target, rateOf(p, cfg), (goal.targetAge - p.age) * 12);
  return {
    startDate: todayISO, startAssets: start, targetAmount: target, targetAge: goal.targetAge,
    plannedMonthlySaving: req === null ? 0 : Math.max(0, Math.round(req)),
  };
}

export function computeCompass(
  p: Profile, goal: Goal, plan: Plan | null, party: { y: number } | null, job: Job, todayISO: string, cfg: GameConfig,
): CompassResult {
  const rate = rateOf(p, cfg);
  const total = totalAssets(p);

  let pace: Pace | null = null;
  let expectedNow: number | null = null;
  if (plan) {
    expectedNow = futureValue(plan.startAssets, plan.plannedMonthlySaving, rate, monthsBetween(plan.startDate, todayISO));
    if (expectedNow > 0) {
      const ratio = total / expectedNow;
      pace = ratio >= cfg.paceAhead ? 'ahead' : ratio >= cfg.paceBehind ? 'onTrack' : 'behind';
    }
  }

  const req = requiredMonthlySaving(total, goalTarget(goal, p), rate, (goal.targetAge - p.age) * 12);
  let saving: CompassResult['saving'];
  if (req === null) saving = { status: 'badAge', required: 0, diff: 0 };
  else if (req <= 0) saving = { status: 'alreadyEnough', required: 0, diff: 0 };
  else {
    const diff = req - p.monthlySaving;
    saving = { status: diff <= 0 ? 'onPace' : 'needMore', required: req, diff: Math.max(0, diff) };
  }

  const minY = cfg.jobFitMinY[job];
  const misfit = party !== null && minY !== null && party.y < minY;
  const j = JOBS[job];
  const fit = {
    ok: !misfit,
    message: misfit
      ? `${j.emoji}${j.name}タイプの冒険者にしては、攻めの装備に寄っています`
      : `${j.emoji}${j.name}タイプらしい装備です`,
  };

  return { pace, expectedNow, saving, fit, fog: pace === 'behind' || misfit };
}
