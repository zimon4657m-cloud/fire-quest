import { h } from '../dom';

export function renderCard(title: string, body: string, onClose: () => void): HTMLElement {
  const close = h('button', { class: 'btn primary' }, 'とじる');
  close.onclick = onClose;
  return h('div', { class: 'panel' }, h('div', { class: 'window' }, h('h2', { style: 'color:#fff' }, title), h('p', {}, body)), close);
}
