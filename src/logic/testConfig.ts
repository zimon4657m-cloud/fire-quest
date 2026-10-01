import type { GameConfig } from '../types';

export const TEST_CONFIG: GameConfig = {
  basePer: 15,
  basePbr: 1.5,
  moveTypeY: { defensive: 0.6, normal: 0, cyclical: -0.6 },
  moveTypeBeta: { defensive: 0.7, normal: 1.0, cyclical: 1.3 },
  centerThreshold: 0.2,
  fireMultiple: 25,
  jobBonus: 0.1,
  paceAhead: 1.05,
  paceBehind: 0.95,
  defaultExpectedReturnPercent: 3,
  jobFitMinY: { turtle: -0.3, squirrel: -0.3, rabbit: 0, falcon: null },
  gateRatios: { forestGate: 0.1, passGate: 0.25 },
  maxLevel: 50,
};
