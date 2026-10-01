import { CONFIG } from '../../config';
import { getData } from '../../app/store';
import { computeParty, placeEquipment, QUADRANT_LABELS } from '../../logic/equipment';
import { h } from '../dom';

const NS = 'http://www.w3.org/2000/svg';
const S = 300, M = 30; // 1辺と余白
const px = (x: number) => M + ((x + 1) / 2) * (S - 2 * M);
const py = (y: number) => M + ((1 - y) / 2) * (S - 2 * M);

function svg(tag: string, attrs: Record<string, string | number>, text?: string) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
}

export function renderEquipmentMap(onBack: () => void): HTMLElement {
  const trial = new Set<string>();
  const root = h('div', { class: 'panel' });
  const draw = () => {
    const stocks = getData().stocks;
    const map = svg('svg', { viewBox: `0 0 ${S} ${S}`, width: '100%', style: 'background:#fff;border-radius:8px' });
    map.append(
      svg('line', { x1: M, y1: S / 2, x2: S - M, y2: S / 2, stroke: '#999' }),
      svg('line', { x1: S / 2, y1: M, x2: S / 2, y2: S - M, stroke: '#999' }),
      svg('text', { x: S / 2, y: 18, 'text-anchor': 'middle', 'font-size': 12 }, '守り(値動き小)'),
      svg('text', { x: S / 2, y: S - 8, 'text-anchor': 'middle', 'font-size': 12 }, '攻め(値動き大)'),
      svg('text', { x: 4, y: S / 2 - 6, 'font-size': 12 }, '成長'),
      svg('text', { x: S - 4, y: S / 2 - 6, 'text-anchor': 'end', 'font-size': 12 }, 'バリュー'),
      svg('text', { x: M + 4, y: M + 14, 'font-size': 11, fill: '#666' }, '🛡️魔法の盾'),
      svg('text', { x: S - M - 4, y: M + 14, 'text-anchor': 'end', 'font-size': 11, fill: '#666' }, '🏰重装鎧'),
      svg('text', { x: M + 4, y: S - M - 6, 'font-size': 11, fill: '#666' }, '⚔️大剣'),
      svg('text', { x: S - M - 4, y: S - M - 6, 'text-anchor': 'end', 'font-size': 11, fill: '#666' }, '🪓戦斧'),
    );
    const maxAmount = Math.max(1, ...stocks.map((s) => s.amount));
    for (const s of stocks) {
      const p = placeEquipment(s, CONFIG);
      const r = 4 + 10 * Math.sqrt(s.amount / maxAmount);
      const wish = s.status === 'wishlist';
      map.append(svg('circle', {
        cx: px(p.x), cy: py(p.y), r, fill: wish ? 'none' : '#c9a227', stroke: '#0b2545',
        'stroke-dasharray': wish ? '3 3' : '', 'fill-opacity': trial.has(s.id) ? 0.9 : 0.6,
      }));
      map.append(svg('text', { x: px(p.x), y: py(p.y) - r - 2, 'text-anchor': 'middle', 'font-size': 10 }, s.name));
    }
    const party = computeParty(stocks, CONFIG, [...trial]);
    if (party) map.append(svg('text', { x: px(party.x), y: py(party.y) + 6, 'text-anchor': 'middle', 'font-size': 18 }, '★'));

    const toggles = h('div', {});
    for (const s of stocks.filter((x) => x.status === 'wishlist')) {
      const b = h('button', { class: 'btn small' }, `${trial.has(s.id) ? '✅' : '⬜'} 試しに装備: ${s.name}`);
      b.onclick = () => { if (trial.has(s.id)) trial.delete(s.id); else trial.add(s.id); draw(); };
      toggles.append(b);
    }
    const back = h('button', { class: 'btn primary' }, '装備屋にもどる');
    back.onclick = onBack;
    root.replaceChildren(
      h('h1', {}, '🗺️ 装備マップ'),
      map as unknown as HTMLElement,
      h('p', {}, party ? `★ 今の編成: ${QUADRANT_LABELS[party.quadrant].icon} ${party.name}` : '装備中の銘柄がありません'),
      h('p', { class: 'note' }, '「試しに装備」は見た目だけで、データは変わりません。'),
      toggles, back,
    );
  };
  draw();
  return root;
}
