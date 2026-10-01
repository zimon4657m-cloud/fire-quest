import type { CrashScenario } from '../types';

// 月次騰落率は Task 0 の調査(リサーチ/2026-10-01_AI投資メンター実装前調査.md)から転記する
export const CRASHES: CrashScenario[] = [
  {
    id: 'lehman',
    bossName: '百年に一度の大嵐',
    modelName: '2008年の金融危機(リーマンショック)をモデルにしています',
    monthlyReturns: [],
    source: '',
  },
  {
    id: 'covid',
    bossName: '見えない疫病神',
    modelName: '2020年の世界的な感染症による急落(コロナショック)をモデルにしています',
    monthlyReturns: [],
    source: '',
  },
  {
    id: 'dotcom',
    bossName: '泡の魔王',
    modelName: '2000年前後のITバブル崩壊をモデルにしています',
    monthlyReturns: [],
    source: '',
  },
];
