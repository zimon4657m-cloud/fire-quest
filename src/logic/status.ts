import type { GameConfig, Goal, Profile } from '../types';

export type StatusResult =
  | { ok: true; hp: number; maxHp: number; level: number; total: number; fireRatio: number }
  | { ok: false; reason: 'noExpense' };

export function totalAssets(p: Profile): number {
  return p.cash + p.investments + p.otherAssets;
}

export function defaultFireTargets(monthlyExpense: number, sideIncome: number, cfg: GameConfig) {
  return {
    full: monthlyExpense * 12 * cfg.fireMultiple,
    side: Math.max(0, monthlyExpense - sideIncome) * 12 * cfg.fireMultiple,
  };
}

export function goalTarget(goal: Goal, p: Profile): number {
  return goal.type === 'sideFire' ? p.sideFireTarget : p.fullFireTarget;
}

export function computeStatus(p: Profile, cfg: GameConfig): StatusResult {
  if (!(p.monthlyExpense > 0)) return { ok: false, reason: 'noExpense' };
  const total = totalAssets(p);
  const fireRatio = p.fullFireTarget > 0 ? total / p.fullFireTarget : 0;
  const level = 1 + Math.floor(Math.min(1, fireRatio) * (cfg.maxLevel - 1));
  return {
    ok: true,
    hp: Math.floor((p.cash / p.monthlyExpense) * 10) / 10,
    maxHp: p.emergencyMonths,
    level,
    total,
    fireRatio,
  };
}
