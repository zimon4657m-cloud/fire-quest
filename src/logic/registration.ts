import type { GameConfig, Goal, Profile, SaveData } from '../types';
import { goalTarget, totalAssets } from './status';
import { makePlan } from './compass';

/** 冒険者登録・宿屋の記録。ゴールか目標額が変わったときだけ予定線を引き直す */
export function applyRegistration(data: SaveData, profile: Profile, goal: Goal, todayISO: string, cfg: GameConfig): void {
  const targetChanged = !data.plan
    || data.plan.targetAge !== goal.targetAge
    || data.plan.targetAmount !== goalTarget(goal, profile);
  data.goal = goal;
  data.profile = profile;
  if (targetChanged) data.plan = makePlan(profile, goal, todayISO, cfg);
  data.history.push({ date: todayISO, totalAssets: totalAssets(profile), cash: profile.cash });
}

/** EXP = 記録した回数 + 達成した行動クエストの数(設計書 3.3) */
export function computeExp(data: SaveData): number {
  return data.history.length + Object.values(data.quests).filter(Boolean).length;
}
