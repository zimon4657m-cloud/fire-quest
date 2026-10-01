export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
