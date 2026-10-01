import { h } from './dom';

const CSS = `
.hud-compass { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; z-index: 10;
  font-size: 30px; background: var(--cream); border: 3px solid var(--gold); border-radius: 50%; width: 60px; height: 60px; padding: 0; }
.hud-compass.shake { animation: shake .6s infinite; }
@keyframes shake { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
.hud-fog { position: fixed; inset: 0; z-index: 5; pointer-events: none; opacity: 0; transition: opacity 1s;
  background: radial-gradient(circle at center, rgba(255,255,255,0) 20%, rgba(230,230,235,.85) 75%); }
.hud-fog.on { opacity: 1; }
.hud-band { position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 10; }
.hud-pad { position: fixed; left: 12px; bottom: calc(110px + env(safe-area-inset-bottom)); z-index: 10;
  display: grid; grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); gap: 4px; }
.hud-pad button { font-size: 22px; border-radius: 10px; border: 2px solid #fff; background: rgba(0,0,0,.5); color: #fff; }
`;

export function mountHud(handlers: { onCompass(): void; onMove(dx: number, dy: number): void }) {
  const root = document.getElementById('hud')!;
  const compass = h('button', { class: 'hud-compass', 'aria-label': '羅針盤' }, '🧭');
  compass.onclick = handlers.onCompass;
  const fog = h('div', { class: 'hud-fog' });
  const band = h('div', { class: 'hud-band window' });
  const pad = h('div', { class: 'hud-pad' });
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
  root.replaceChildren(h('style', {}, CSS), fog, compass, pad, band);
  return {
    render(text: string, isFog: boolean) {
      band.textContent = text;
      fog.classList.toggle('on', isFog);
      compass.classList.toggle('shake', isFog);
    },
  };
}
