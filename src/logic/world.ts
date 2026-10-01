import type { GateId, QuestId, Quests } from '../types';

// 32列 × 20行。凡例: . 草原 / = 道 / T 森 / @ スタート / ~ 海・川 / ^ 山 / # 壁・柵 / L 湖 / K 遠くの宮殿
// % 島の砂浜 / F 副業島の旗 / B 橋 / G 森の門 / P 峠 / I 宿屋 / S 装備屋 / C 洞窟 / N 町の人・立て札 / D クエストの扉
export const WORLD_MAP: string[] = [
  '~~...........~^^^^^^^^^^^^^^^^^^', // 0
  '~~...........~#TTTTTTTTT#^^^^^K^', // 1
  '~~...........~#TTTTTTTTT#^^^^^^^', // 2
  '~~##########.~#TTTTNTTTT#^^^^^^^', // 3
  '~~#I......S#.~#TTTTTTTTT#^^^^^^^', // 4
  '~~#........#.~#TTTTTTTTT#^^^^^^^', // 5
  '~~#..N.....#.~#TTTTTTTTT#^^^^^^^', // 6
  '~~#D.......#.~#####G#####^^^^^^^', // 7
  '~~#....@...==B...........^^^^^^^', // 8
  '~~#D.......#.~...........^..N...', // 9
  '~~#..N.....#.~...........P..LL..', // 10
  '~~#D.......#.~...........^..LL..', // 11
  '~~##########.~...........^......', // 12
  '~~...........~...........^^^^^^^', // 13
  '~~~~~~~~~~~~.~...........^^^^^^^', // 14
  '~~~~~~~~~~~~.~......C....^^^^^^^', // 15
  '~~~~%F~~~~~~.~...........^^^^^^^', // 16
  '~~~~~~~~~~~~.~...........^^^^^^^', // 17
  '~~~~~~~~~~~~.~...........^^^^^^^', // 18
  '~~~~~~~~~~~~.~...........^^^^^^^', // 19
];
export const MAP_W = 32;
export const MAP_H = 20;

const GATE_TILES: Record<string, GateId> = { B: 'portBridge', G: 'forestGate', P: 'passGate' };
const DOORS: Record<string, QuestId> = { '3,7': 'openedAccount', '3,9': 'setupNisa', '3,11': 'recordedExpense' };
const NPCS: Record<string, string> = { '19,3': 'compound', '5,6': 'emergencyFund', '5,10': 'diversify', '28,9': 'crashHistory' };
const FREE = new Set(['.', '=', 'T', '@']);

export type WorldState = { gates: Set<GateId>; quests: Quests; sideIncomeFlag: boolean };
export type Interaction =
  | { kind: 'inn' } | { kind: 'shop' } | { kind: 'cave' }
  | { kind: 'npc'; id: string }
  | { kind: 'gateClosed'; gate: GateId }
  | { kind: 'doorClosed'; quest: QuestId }
  | { kind: 'chest'; quest: QuestId };

export function tileAt(x: number, y: number): string {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return '~';
  return WORLD_MAP[y][x];
}

export function isWalkable(x: number, y: number, s: WorldState): boolean {
  const t = tileAt(x, y);
  if (FREE.has(t)) return true;
  if (GATE_TILES[t]) return s.gates.has(GATE_TILES[t]);
  if (t === 'D') return s.quests[DOORS[`${x},${y}`]] === true;
  return false;
}

export function interactionAt(x: number, y: number, s: WorldState): Interaction | null {
  const t = tileAt(x, y);
  if (t === 'I') return { kind: 'inn' };
  if (t === 'S') return { kind: 'shop' };
  if (t === 'C') return { kind: 'cave' };
  if (t === 'N') return { kind: 'npc', id: NPCS[`${x},${y}`] };
  if (GATE_TILES[t] && !s.gates.has(GATE_TILES[t])) return { kind: 'gateClosed', gate: GATE_TILES[t] };
  if (t === 'D') {
    const quest = DOORS[`${x},${y}`];
    return s.quests[quest] ? { kind: 'chest', quest } : { kind: 'doorClosed', quest };
  }
  return null;
}

export function findStart(): { x: number; y: number } {
  for (let y = 0; y < MAP_H; y++) {
    const x = WORLD_MAP[y].indexOf('@');
    if (x >= 0) return { x, y };
  }
  throw new Error('スタート地点がありません');
}

export function findPath(
  from: { x: number; y: number }, to: { x: number; y: number }, s: WorldState,
): { x: number; y: number }[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (!isWalkable(to.x, to.y, s)) return null;
  const key = (x: number, y: number) => y * MAP_W + x;
  const prev = new Map<number, number>();
  const queue = [from];
  prev.set(key(from.x, from.y), -1);
  while (queue.length) {
    const c = queue.shift()!;
    if (c.x === to.x && c.y === to.y) {
      const path: { x: number; y: number }[] = [];
      let k = key(c.x, c.y);
      while (k !== key(from.x, from.y)) {
        path.unshift({ x: k % MAP_W, y: Math.floor(k / MAP_W) });
        k = prev.get(k)!;
      }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      if (!prev.has(key(nx, ny)) && isWalkable(nx, ny, s)) {
        prev.set(key(nx, ny), key(c.x, c.y));
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return null;
}
