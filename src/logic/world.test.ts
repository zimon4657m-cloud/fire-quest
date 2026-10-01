import { describe, it, expect } from 'vitest';
import { findPath, findStart, interactionAt, isWalkable, MAP_H, MAP_W, WORLD_MAP, type WorldState } from './world';
import { KNOWLEDGE } from '../data/knowledge';

const closed: WorldState = {
  gates: new Set(), quests: { openedAccount: false, setupNisa: false, recordedExpense: false }, sideIncomeFlag: false,
};
const open: WorldState = {
  gates: new Set(['portBridge', 'forestGate', 'passGate']),
  quests: { openedAccount: true, setupNisa: true, recordedExpense: true }, sideIncomeFlag: true,
};

/** 歩けるマスだけをたどって、target の隣まで行けるか */
function canReachNextTo(ch: string, s: WorldState): boolean {
  const start = findStart();
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (WORLD_MAP[y][x] !== ch) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (isWalkable(nx, ny, s) && (findPath(start, { x: nx, y: ny }, s) || (nx === start.x && ny === start.y))) return true;
    }
  }
  return false;
}

describe('WORLD_MAP', () => {
  it('32×20 で、スタートは1つ', () => {
    expect(WORLD_MAP).toHaveLength(MAP_H);
    WORLD_MAP.forEach((row) => expect(row).toHaveLength(MAP_W));
    expect(WORLD_MAP.join('').split('@')).toHaveLength(2);
  });
  it('門が閉じていれば、洞窟・峠の先には行けない', () => {
    expect(canReachNextTo('C', closed)).toBe(false);
    expect(canReachNextTo('L', closed)).toBe(false);
  });
  it('門が閉じていても宿屋・装備屋・町の人には行ける', () => {
    expect(canReachNextTo('I', closed)).toBe(true);
    expect(canReachNextTo('S', closed)).toBe(true);
  });
  it('橋だけ開けば洞窟に行けるが、森と峠の先には行けない', () => {
    const bridge = { ...closed, gates: new Set(['portBridge'] as const) } as WorldState;
    expect(canReachNextTo('C', bridge)).toBe(true);
    expect(isWalkable(19, 6, bridge)).toBe(true);
    expect(findPath(findStart(), { x: 19, y: 6 }, bridge)).toBeNull();
    expect(canReachNextTo('L', bridge)).toBe(false);
  });
  it('全部開けば森の中と峠の先(湖のそば)に行ける', () => {
    expect(findPath(findStart(), { x: 19, y: 6 }, open)).not.toBeNull();
    expect(canReachNextTo('L', open)).toBe(true);
  });
  it('NPC はすべて知識カードを持つ', () => {
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (WORLD_MAP[y][x] === 'N') {
        const i = interactionAt(x, y, closed);
        expect(i?.kind).toBe('npc');
        if (i?.kind === 'npc') expect(KNOWLEDGE[i.id]).toBeDefined();
      }
    }
  });
});

describe('isWalkable / interactionAt', () => {
  it('範囲外・海・山は歩けない', () => {
    expect(isWalkable(-1, 0, open)).toBe(false);
    expect(isWalkable(0, 0, open)).toBe(false);
    expect(isWalkable(25, 0, open)).toBe(false);
  });
  it('閉じた門は体当たりで条件を教える', () => {
    expect(interactionAt(13, 8, closed)).toEqual({ kind: 'gateClosed', gate: 'portBridge' });
    expect(interactionAt(13, 8, open)).toBeNull();
  });
  it('扉はクエスト達成で開き、乗ると宝箱', () => {
    expect(interactionAt(3, 7, closed)).toEqual({ kind: 'doorClosed', quest: 'openedAccount' });
    expect(isWalkable(3, 7, open)).toBe(true);
    expect(interactionAt(3, 7, open)).toEqual({ kind: 'chest', quest: 'openedAccount' });
  });
  it('宿屋・装備屋・洞窟', () => {
    expect(interactionAt(3, 4, closed)).toEqual({ kind: 'inn' });
    expect(interactionAt(10, 4, closed)).toEqual({ kind: 'shop' });
    expect(interactionAt(20, 15, closed)).toEqual({ kind: 'cave' });
  });
  it('クエストの宝箱はすべて知識カードを持つ', () => {
    for (const q of ['openedAccount', 'setupNisa', 'recordedExpense']) expect(KNOWLEDGE[q]).toBeDefined();
  });
});

describe('findPath', () => {
  it('同じマスなら空配列、行けなければ null', () => {
    const s = findStart();
    expect(findPath(s, s, closed)).toEqual([]);
    expect(findPath(s, { x: 0, y: 0 }, closed)).toBeNull();
  });
  it('隣のマスへは1歩', () => {
    const s = findStart();
    expect(findPath(s, { x: s.x + 1, y: s.y }, closed)).toEqual([{ x: s.x + 1, y: s.y }]);
  });
});
