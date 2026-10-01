import { describe, it, expect } from 'vitest';
import { clamp, sum } from './math';
import { CONFIG } from '../config';

describe('math', () => {
  it('clamp は範囲内に収める', () => {
    expect(clamp(2, -1, 1)).toBe(1);
    expect(clamp(-2, -1, 1)).toBe(-1);
    expect(clamp(0.3, -1, 1)).toBe(0.3);
  });
  it('sum は合計する(空は0)', () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });
});

describe('CONFIG', () => {
  it('調査値が転記されている(0のままではない)', () => {
    expect(CONFIG.basePer).toBeGreaterThan(0);
    expect(CONFIG.basePbr).toBeGreaterThan(0);
    expect(CONFIG.defaultExpectedReturnPercent).toBeGreaterThan(0);
  });
});
