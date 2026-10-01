import type { GameConfig, Quadrant, Stock } from '../types';
import { clamp, sum } from './math';

export const QUADRANT_LABELS: Record<Quadrant, { gear: string; party: string; icon: string }> = {
  center: { gear: '基本の鎧', party: 'バランス型パーティー', icon: '🪖' },
  magicShield: { gear: '魔法の盾', party: '堅実成長パーティー', icon: '🛡️' },
  heavyArmor: { gear: '重装鎧', party: '鉄壁パーティー', icon: '🏰' },
  greatSword: { gear: '大剣', party: '攻撃型パーティー', icon: '⚔️' },
  battleAxe: { gear: '戦斧', party: '突撃型パーティー', icon: '🪓' },
};

export function axisScore(base: number, value: number | null): number | null {
  if (value == null || !(value > 0) || !(base > 0)) return null;
  return clamp(Math.log(base / value) / Math.log(2), -1, 1);
}

export function quadrantOf(x: number, y: number, cfg: GameConfig): Quadrant {
  if (Math.abs(x) < cfg.centerThreshold && Math.abs(y) < cfg.centerThreshold) return 'center';
  if (y >= 0) return x < 0 ? 'magicShield' : 'heavyArmor';
  return x < 0 ? 'greatSword' : 'battleAxe';
}

function yOf(stock: Stock, cfg: GameConfig): number {
  if (stock.beta != null && Number.isFinite(stock.beta)) return clamp((1 - stock.beta) / 0.5, -1, 1);
  if (stock.moveType) return cfg.moveTypeY[stock.moveType];
  return 0;
}

export function placeEquipment(stock: Stock, cfg: GameConfig) {
  const healPerTurn = (stock.amount * (stock.dividendYield || 0)) / 100 / 12;
  if (stock.kind === 'index') return { x: 0, y: 0, quadrant: 'center' as Quadrant, healPerTurn };
  const scores = [axisScore(cfg.basePer, stock.per), axisScore(cfg.basePbr, stock.pbr)]
    .filter((s): s is number => s !== null);
  const x = scores.length ? sum(scores) / scores.length : 0;
  const y = yOf(stock, cfg);
  return { x, y, quadrant: quadrantOf(x, y, cfg), healPerTurn };
}

export function computeParty(stocks: Stock[], cfg: GameConfig, trialIds: string[] = []) {
  const team = stocks.filter(
    (s) => (s.status === 'equipped' || trialIds.includes(s.id)) && s.amount > 0,
  );
  const total = sum(team.map((s) => s.amount));
  if (total <= 0) return null;
  let x = 0, y = 0;
  for (const s of team) {
    const p = placeEquipment(s, cfg);
    x += (p.x * s.amount) / total;
    y += (p.y * s.amount) / total;
  }
  const quadrant = quadrantOf(x, y, cfg);
  return { x, y, quadrant, name: QUADRANT_LABELS[quadrant].party };
}
