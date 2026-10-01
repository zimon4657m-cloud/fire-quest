import type { CrashScenario, GameConfig, Job, Profile, Stock } from '../types';
import { placeEquipment } from './equipment';
import { sum } from './math';

export type BossTurn = { turn: number; invested: number; cash: number; total: number; escaped: boolean };
export type BossResult = {
  turns: BossTurn[];
  startTotal: number;
  minTotal: number;
  maxDrop: number;
  recoveryTurn: number | null;
  escapedAt: number | null;
  hpMonths: number | null;
};

export function stockBeta(s: Stock, cfg: GameConfig): number {
  if (s.kind === 'index') return 1;
  if (s.beta != null && Number.isFinite(s.beta)) return s.beta;
  if (s.moveType) return cfg.moveTypeBeta[s.moveType];
  return 1;
}

export function simulateBoss(
  stocks: Stock[], profile: Profile, scenario: CrashScenario, job: Job,
  choices: { escapeAtTurn?: number }, cfg: GameConfig,
): BossResult {
  const gear = stocks
    .filter((s) => s.status === 'equipped' && s.amount > 0)
    .map((s) => ({ value: s.amount, beta: stockBeta(s, cfg), yieldPct: s.dividendYield || 0, side: placeEquipment(s, cfg).y }));
  let pot = 0;
  let cash = profile.cash;
  let escapedAt: number | null = null;
  const startTotal = sum(gear.map((g) => g.value)) + cash;
  const turns: BossTurn[] = [];

  scenario.monthlyReturns.forEach((r, i) => {
    const turn = i + 1;
    if (job === 'rabbit' && choices.escapeAtTurn === turn && escapedAt === null) {
      cash += sum(gear.map((g) => g.value)) + pot;
      gear.forEach((g) => (g.value = 0));
      pot = 0;
      escapedAt = turn;
    }
    if (escapedAt === null) {
      for (const g of gear) {
        let change = g.value * r * g.beta;
        if (change < 0 && job === 'turtle' && g.side > 0) change *= 1 - cfg.jobBonus;
        if (change > 0 && job === 'falcon' && g.side < 0) change *= 1 + cfg.jobBonus;
        let heal = (g.value * g.yieldPct) / 100 / 12;
        if (job === 'squirrel') heal *= 1 + cfg.jobBonus;
        g.value = Math.max(0, g.value + change + heal);
      }
      pot = Math.max(0, pot * (1 + r)) + profile.monthlySaving;
    } else {
      cash += profile.monthlySaving;
    }
    const invested = sum(gear.map((g) => g.value)) + pot;
    turns.push({ turn, invested, cash, total: invested + cash, escaped: escapedAt !== null });
  });

  let minTotal = startTotal;
  let minIndex = -1;
  turns.forEach((t, i) => {
    if (t.total < minTotal) { minTotal = t.total; minIndex = i; }
  });
  let recoveryTurn: number | null = 0;
  if (minIndex >= 0) {
    const back = turns.slice(minIndex + 1).find((t) => t.total >= startTotal);
    recoveryTurn = back ? back.turn : null;
  }
  return {
    turns, startTotal, minTotal, maxDrop: startTotal - minTotal, recoveryTurn, escapedAt,
    hpMonths: profile.monthlyExpense > 0 ? profile.cash / profile.monthlyExpense : null,
  };
}
