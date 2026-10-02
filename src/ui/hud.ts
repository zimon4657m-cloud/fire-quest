import type { Roadmap } from '../logic/roadmap';
import { h, manYen } from './dom';

const CSS = `
.hud-compass { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; z-index: 10;
  font-size: 30px; background: var(--cream); border: 3px solid var(--gold); border-radius: 50%; width: 60px; height: 60px; padding: 0; }
.hud-compass.shake { animation: shake .6s infinite; }
@keyframes shake { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
.hud-fog { position: fixed; inset: 0; z-index: 5; pointer-events: none; opacity: 0; transition: opacity 1s;
  background: radial-gradient(circle at center, rgba(255,255,255,0) 20%, rgba(230,230,235,.85) 75%); }
.hud-fog.on { opacity: 1; }
.hud-status { position: fixed; top: calc(12px + env(safe-area-inset-top)); left: 12px; z-index: 10; font-size: 14px; padding: 6px 10px; }
.hud-band { position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 10; }
.hud-pad { position: fixed; left: 12px; bottom: calc(110px + env(safe-area-inset-bottom)); z-index: 10;
  display: grid; grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); gap: 4px; }
.hud-road { position: fixed; z-index: 10; right: 12px; top: calc(84px + env(safe-area-inset-top)); bottom: calc(110px + env(safe-area-inset-bottom));
  width: clamp(220px, 25vw, 320px); overflow-y: auto; cursor: pointer; font-size: 14px; padding: 10px 12px; display: flex; flex-direction: column; }
.hud-road h2 { font-size: 15px; margin: 0 0 6px; color: var(--gold); }
.road-list { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.road-list li { display: flex; gap: 6px; align-items: baseline; padding: 3px 0 3px 10px; border-left: 3px solid var(--gold); }
.road-list li .mean { display: block; font-size: 11px; opacity: .8; font-weight: normal; }
.road-list li .amt { margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
.road-list li.far { opacity: .45; }
.road-list li.reached .amt::after { content: ' ✅'; }
.road-list li.here { font-weight: bold; color: #000; background: var(--gold); border-left-color: #fff; border-radius: 4px; }
.road-foot { font-size: 10px; opacity: .7; line-height: 1.4; margin-top: 4px; }
.road-next { margin: 8px 0 0; padding-top: 6px; border-top: 1px dashed var(--gold); line-height: 1.5; }
@media (max-width: 767px) { .hud-road { display: none; } }
.hud-pad button { font-size: 22px; border-radius: 10px; border: 2px solid #fff; background: rgba(0,0,0,.5); color: #fff; }
`;

export function mountHud(handlers: { onCompass(): void; onMove(dx: number, dy: number): void }) {
  const root = document.getElementById('hud')!;
  const compass = h('button', { class: 'hud-compass', 'aria-label': '羅針盤' }, '🧭');
  compass.onclick = handlers.onCompass;
  const fog = h('div', { class: 'hud-fog' });
  const band = h('div', { class: 'hud-band window' });
  const status = h('div', { class: 'hud-status window' });
  const pad = h('div', { class: 'hud-pad' });
  const road = h('div', { class: 'hud-road window', role: 'button', 'aria-label': '道のりマップ(タップで羅針盤)' });
  road.onclick = handlers.onCompass;
  const cells: [string, number, number, string][] = [
    ['', 0, 0, ''], ['▲', 0, -1, '上'], ['', 0, 0, ''],
    ['◀', -1, 0, '左'], ['', 0, 0, ''], ['▶', 1, 0, '右'],
    ['', 0, 0, ''], ['▼', 0, 1, '下'], ['', 0, 0, ''],
  ];
  for (const [label, dx, dy, aria] of cells) {
    if (!label) { pad.append(h('span')); continue; }
    const b = h('button', { 'aria-label': aria }, label);
    b.onclick = () => handlers.onMove(dx, dy);
    pad.append(b);
  }
  root.replaceChildren(h('style', {}, CSS), fog, status, compass, road, pad, band);
  return {
    render(text: string, isFog: boolean, statusText: string, roadmap: Roadmap | null) {
      renderRoad(road, roadmap);
      band.textContent = text;
      status.textContent = statusText;
      status.hidden = statusText === '';
      fog.classList.toggle('on', isFog);
      compass.classList.toggle('shake', isFog);
    },
  };
}

function renderRoad(root: HTMLElement, r: Roadmap | null) {
  root.hidden = r === null;
  if (!r) return root.replaceChildren();
  const list = h('ol', { class: 'road-list' });
  r.milestones.forEach((m, i) => {
    const cls = [m.reached ? 'reached' : '', m.far && !m.reached ? 'far' : ''].filter(Boolean).join(' ');
    const name = h('span', {}, `${m.emoji} ${m.name}${m.isGoal ? ' 🎯' : ''}`, h('span', { class: 'mean' }, `(${m.meaning})`));
    const amt = m.id === 'start' ? '' : m.basis === 'cash' ? `現金${manYen(m.amount)}` : manYen(m.amount);
    list.prepend(h('li', { class: cls }, name, h('span', { class: 'amt' }, amt)));
    if (i === r.hereIndex) list.prepend(h('li', { class: 'here' }, h('span', {}, '🧑 いまここ'), h('span', { class: 'amt' }, manYen(r.total))));
  });
  const next = r.next
    ? [`次の目的地: ${r.next.milestone.name}まで あと${manYen(r.next.remaining)}`,
       r.next.etaAge !== null ? `今のペースなら ${r.next.etaAge}歳ごろ(目安)` : '']
    : ['すべての目的地に届いています'];
  root.replaceChildren(h('h2', {}, '🗺️ 道のりマップ'), list,
    h('p', { class: 'road-next' }, ...next.filter(Boolean).flatMap((t, i) => (i ? [h('br'), t] : [t]))),
    h('small', { class: 'road-foot' }, '※「資産が稼ぐ」は4%ルール(資産の年4%を取り崩す)で見た目安です'));
}
