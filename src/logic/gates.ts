import type { GameConfig, GateId, Profile } from '../types';
import { totalAssets } from './status';

export const GATE_INFO: Record<GateId, { name: string; condition: string }> = {
  portBridge: { name: '港町を出る橋', condition: '現金が「生活費 × 生活防衛資金の月数」に届くと橋が架かる' },
  forestGate: { name: '積立の森の門', condition: '総資産が完全FIRE額の10%に届くと開く' },
  passGate: { name: '山と湖へ向かう峠', condition: '総資産が完全FIRE額の25%に届くと開く' },
};

export function unlockedGates(p: Profile | null, cfg: GameConfig): Set<GateId> {
  const open = new Set<GateId>();
  if (!p) return open;
  if (p.monthlyExpense > 0 && p.cash >= p.monthlyExpense * p.emergencyMonths) open.add('portBridge');
  if (p.fullFireTarget > 0) {
    const total = totalAssets(p);
    if (total >= p.fullFireTarget * cfg.gateRatios.forestGate) open.add('forestGate');
    if (total >= p.fullFireTarget * cfg.gateRatios.passGate) open.add('passGate');
  }
  return open;
}
