import { describe, it, expect } from 'vitest';
import { computeJob, QUESTIONS } from './job';
import type { Choice } from '../types';

const a = (s: string) => s.split('') as Choice[];

describe('computeJob', () => {
  it('質問は8問', () => expect(QUESTIONS).toHaveLength(8));
  it('長期×動じない = 亀', () => expect(computeJob(a('AAAAAAAA'))).toBe('turtle'));
  it('長期×動じやすい = リス', () => expect(computeJob(a('AAAABBBB'))).toBe('squirrel'));
  it('短期×動じない = 隼', () => expect(computeJob(a('BBBBAAAA'))).toBe('falcon'));
  it('短期×動じやすい = うさぎ', () => expect(computeJob(a('BBBBBBBB'))).toBe('rabbit'));
  it('time軸が2対2なら Q1 で決める', () => {
    expect(computeJob(a('ABBAAAAA'))).toBe('turtle');
    expect(computeJob(a('BAABAAAA'))).toBe('falcon');
  });
  it('calm軸が2対2なら Q5 で決める', () => {
    expect(computeJob(a('AAAAABBA'))).toBe('turtle');
    expect(computeJob(a('AAAABAAB'))).toBe('squirrel');
  });
  it('回答が8つでなければエラー', () => {
    expect(() => computeJob(a('AAA'))).toThrow();
  });
});
