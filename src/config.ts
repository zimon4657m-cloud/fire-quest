import type { GameConfig } from './types';

export const CONFIG: GameConfig = {
  // 出典: JPX「規模別・業種別PER・PBR(連結)」2026年9月末(2026-10-01公表)、プライム市場・総合・加重平均
  // https://www.jpx.co.jp/markets/statistics-equities/misc/t13vrt0000026ejq-att/perpbr202609.xlsx
  // 調査: Vault リサーチ/2026-10-01_AI投資メンター実装前調査.md
  basePer: 20.6,
  basePbr: 1.8,
  // 以下は設計書 4.2 / 3.7 のゲーム用の値
  moveTypeY: { defensive: 0.6, normal: 0, cyclical: -0.6 },
  moveTypeBeta: { defensive: 0.7, normal: 1.0, cyclical: 1.3 },
  centerThreshold: 0.2,
  // 4%ルール(年間支出の25倍)。出典: Bengen(1994)、Trinity Study(1998)。調査: Vault リサーチ/2026-10-01_AI投資メンター実装前調査.md
  fireMultiple: 25,
  jobBonus: 0.1,
  paceAhead: 1.05,
  paceBehind: 0.95,
  // 出典: 金融庁「つみたてシミュレーター」の想定利回りの初期値(年率3%)
  // https://www.fsa.go.jp/policy/nisa2/moneyplan_sim/
  defaultExpectedReturnPercent: 3,
  jobFitMinY: { turtle: -0.3, squirrel: -0.3, rabbit: 0, falcon: null },
  gateRatios: { forestGate: 0.1, passGate: 0.25 },
  maxLevel: 50,
};
