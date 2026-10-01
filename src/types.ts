export type Job = 'turtle' | 'squirrel' | 'falcon' | 'rabbit';
export type Choice = 'A' | 'B';
export type GoalType = 'sideFire' | 'fullFire' | 'amountOnly';
export type MoveType = 'defensive' | 'normal' | 'cyclical';
export type Quadrant = 'center' | 'magicShield' | 'heavyArmor' | 'greatSword' | 'battleAxe';
export type GateId = 'portBridge' | 'forestGate' | 'passGate';
export type QuestId = 'openedAccount' | 'setupNisa' | 'recordedExpense';

export interface Goal {
  type: GoalType;
  targetAge: number;
}

export interface Profile {
  age: number;
  monthlyExpense: number;
  cash: number;
  investments: number;
  otherAssets: number;
  monthlySaving: number;
  sideIncome: number;
  sideFireTarget: number;
  fullFireTarget: number;
  emergencyMonths: number;
  /** 想定利回り(年率%)。null なら CONFIG.defaultExpectedReturnPercent */
  expectedReturn: number | null;
  vow: string;
}

export interface Plan {
  startDate: string; // YYYY-MM-DD
  startAssets: number;
  targetAmount: number;
  targetAge: number;
  plannedMonthlySaving: number;
}

export interface Stock {
  id: string;
  name: string;
  status: 'equipped' | 'wishlist';
  kind: 'stock' | 'index';
  amount: number;
  per: number | null;
  pbr: number | null;
  beta: number | null;
  moveType: MoveType | null;
  /** 配当利回り(%) */
  dividendYield: number;
}

export type Quests = Record<QuestId, boolean>;

export interface HistoryEntry {
  date: string;
  totalAssets: number;
  cash: number;
}

export interface SaveData {
  version: 1;
  job: Job | null;
  goal: Goal | null;
  profile: Profile | null;
  plan: Plan | null;
  stocks: Stock[];
  quests: Quests;
  openedChests: QuestId[];
  history: HistoryEntry[];
  player: { x: number; y: number } | null;
}

export interface CrashScenario {
  id: string;
  /** ゲーム内のボス名(架空) */
  bossName: string;
  /** モデルにした出来事(説明用) */
  modelName: string;
  /** 月次騰落率(小数。-0.12 = -12%) */
  monthlyReturns: number[];
  source: string;
}

export interface GameConfig {
  basePer: number;
  basePbr: number;
  moveTypeY: Record<MoveType, number>;
  moveTypeBeta: Record<MoveType, number>;
  centerThreshold: number;
  fireMultiple: number;
  jobBonus: number;
  paceAhead: number;
  paceBehind: number;
  defaultExpectedReturnPercent: number;
  jobFitMinY: Record<Job, number | null>;
  gateRatios: { forestGate: number; passGate: number };
  maxLevel: number;
}
