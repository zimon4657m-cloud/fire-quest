export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

export const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}円`;

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function numberInput(name: string, value: number | null, opts: { step?: string; min?: string } = {}) {
  const attrs: Record<string, string> = {
    name, type: 'number', inputmode: 'decimal', step: opts.step ?? 'any',
    value: value === null ? '' : String(value),
  };
  const min = opts.min ?? '0';
  if (min !== '') attrs.min = min;
  return h('input', attrs);
}

export function field(label: string, input: HTMLElement, note?: string): HTMLElement {
  return h('label', { class: 'field' }, h('span', {}, label), input, ...(note ? [h('small', {}, note)] : []));
}

/** 空欄は null、数字でなければ NaN を返す */
export function readNumber(form: HTMLFormElement, name: string): number | null {
  const v = (form.elements.namedItem(name) as HTMLInputElement).value.trim();
  return v === '' ? null : Number(v);
}
