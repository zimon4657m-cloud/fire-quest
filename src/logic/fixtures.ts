import type { Profile } from '../types';

export const profile = (o: Partial<Profile> = {}): Profile => ({
  age: 32, monthlyExpense: 200_000, cash: 1_200_000, investments: 4_000_000, otherAssets: 800_000,
  monthlySaving: 100_000, sideIncome: 50_000, sideFireTarget: 45_000_000, fullFireTarget: 60_000_000,
  emergencyMonths: 6, expectedReturn: null, vow: '', ...o,
});
