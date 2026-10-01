import { describe, it, expect } from 'vitest';
import { axisScore, placeEquipment, quadrantOf, computeParty } from './equipment';
import { TEST_CONFIG as C } from './testConfig';
import type { Stock } from '../types';

const stock = (o: Partial<Stock>): Stock => ({
  id: 's', name: 'テスト', status: 'equipped', kind: 'stock', amount: 100,
  per: 15, pbr: 1.5, beta: 1, moveType: null, dividendYield: 0, ...o,
});

describe('axisScore', () => {
  it('基準の半分で+1、2倍で-1、同じで0', () => {
    expect(axisScore(15, 7.5)).toBeCloseTo(1);
    expect(axisScore(15, 30)).toBeCloseTo(-1);
    expect(axisScore(15, 15)).toBeCloseTo(0);
  });
  it('範囲外は±1に収める', () => {
    expect(axisScore(15, 1)).toBe(1);
    expect(axisScore(15, 300)).toBe(-1);
  });
  it('0以下・未入力は null', () => {
    expect(axisScore(15, 0)).toBeNull();
    expect(axisScore(15, -5)).toBeNull();
    expect(axisScore(15, null)).toBeNull();
  });
});

describe('placeEquipment', () => {
  it('X は PER と PBR の平均', () => {
    expect(placeEquipment(stock({ per: 7.5, pbr: 1.5 }), C).x).toBeCloseTo(0.5);
  });
  it('PER が使えないときは PBR だけ', () => {
    expect(placeEquipment(stock({ per: -3, pbr: 0.75 }), C).x).toBeCloseTo(1);
  });
  it('両方使えないときは X=0(NaNにならない)', () => {
    expect(placeEquipment(stock({ per: null, pbr: 0 }), C).x).toBe(0);
  });
  it('ベータ値 0.5 で守りの端、1.5 で攻めの端', () => {
    expect(placeEquipment(stock({ beta: 0.5 }), C).y).toBeCloseTo(1);
    expect(placeEquipment(stock({ beta: 1.5 }), C).y).toBeCloseTo(-1);
    expect(placeEquipment(stock({ beta: 0.1 }), C).y).toBe(1);
  });
  it('ベータ値がなければ値動きのタイプで決める', () => {
    expect(placeEquipment(stock({ beta: null, moveType: 'defensive' }), C).y).toBeCloseTo(0.6);
    expect(placeEquipment(stock({ beta: null, moveType: 'cyclical' }), C).y).toBeCloseTo(-0.6);
    expect(placeEquipment(stock({ beta: null, moveType: null }), C).y).toBe(0);
  });
  it('インデックスは入力にかかわらず中心', () => {
    const p = placeEquipment(stock({ kind: 'index', per: 5, beta: 2 }), C);
    expect([p.x, p.y, p.quadrant]).toEqual([0, 0, 'center']);
  });
  it('回復量 = 金額 × 利回り% ÷ 100 ÷ 12', () => {
    expect(placeEquipment(stock({ amount: 1_200_000, dividendYield: 3 }), C).healPerTurn).toBeCloseTo(3000);
  });
});

describe('quadrantOf', () => {
  it('中心は |x|,|y| がどちらも 0.2 未満', () => {
    expect(quadrantOf(0.19, -0.19, C)).toBe('center');
    expect(quadrantOf(0.2, 0, C)).toBe('heavyArmor');
  });
  it('4区画', () => {
    expect(quadrantOf(-0.5, 0.5, C)).toBe('magicShield');
    expect(quadrantOf(0.5, 0.5, C)).toBe('heavyArmor');
    expect(quadrantOf(-0.5, -0.5, C)).toBe('greatSword');
    expect(quadrantOf(0.5, -0.5, C)).toBe('battleAxe');
  });
});

describe('computeParty', () => {
  it('装備中だけを金額で重み付けした重心', () => {
    const p = computeParty([
      stock({ id: 'a', amount: 300, per: 7.5, pbr: 0.75, beta: 1 }), // x=1, y=0
      stock({ id: 'b', amount: 100, kind: 'index' }), // x=0, y=0
      stock({ id: 'w', status: 'wishlist', amount: 1000, per: 30, pbr: 3 }),
    ], C)!;
    expect(p.x).toBeCloseTo(0.75);
    expect(p.y).toBeCloseTo(0);
    expect(p.quadrant).toBe('heavyArmor');
  });
  it('試しに装備した欲しいものリストは含める', () => {
    const p = computeParty([
      stock({ id: 'a', amount: 100, kind: 'index' }),
      stock({ id: 'w', status: 'wishlist', amount: 100, per: 30, pbr: 3, beta: 1 }), // x=-1
    ], C, ['w'])!;
    expect(p.x).toBeCloseTo(-0.5);
  });
  it('装備がなければ null', () => {
    expect(computeParty([], C)).toBeNull();
    expect(computeParty([stock({ amount: 0 })], C)).toBeNull();
  });
});
