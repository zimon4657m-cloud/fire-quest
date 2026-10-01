import type { GameConfig } from './types';

export const CONFIG: GameConfig = {
  // 出典: JPX「規模別・業種別PER・PBR」(Task 0 の調査値を転記する)
  basePer: 0,
  basePbr: 0,
  // 以下は設計書 4.2 / 3.7 のゲーム用の値
  moveTypeY: { defensive: 0.6, normal: 0, cyclical: -0.6 },
  moveTypeBeta: { defensive: 0.7, normal: 1.0, cyclical: 1.3 },
  centerThreshold: 0.2,
  // 4%ルール(年間支出の25倍)。出典は Task 0 の調査ファイル
  fireMultiple: 25,
  jobBonus: 0.1,
  paceAhead: 1.05,
  paceBehind: 0.95,
  // 出典: Task 0 の調査値を転記する
  defaultExpectedReturnPercent: 0,
  jobFitMinY: { turtle: -0.3, squirrel: -0.3, rabbit: 0, falcon: null },
  gateRatios: { forestGate: 0.1, passGate: 0.25 },
  maxLevel: 50,
};
