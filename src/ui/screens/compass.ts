import { getData } from '../../app/store';
import { currentCompass } from '../../main';
import { h, yen } from '../dom';

const PACE = { ahead: '🟢 予定より先行しています', onTrack: '🔵 予定どおりです', behind: '🟠 予定より少し遅れています' };

export function renderCompass(onClose: () => void): HTMLElement {
  const d = getData();
  const c = currentCompass();
  const close = h('button', { class: 'btn primary' }, 'とじる');
  close.onclick = onClose;
  if (!c || !d.profile) {
    return h('div', { class: 'panel' }, h('h1', {}, '🧭 羅針盤'), h('p', {}, '宿屋で生活費と目標を記録すると、針が動き出します。'), close);
  }
  const saving = {
    badAge: '目標の年齢を見直してください(今の年齢より後にしてください)',
    alreadyEnough: '今の資産だけで目標に届く見込みです',
    onPace: `今の積立(毎月${yen(d.profile.monthlySaving)})で届く見込みです`,
    needMore: `このまま行くなら、毎月あと ${yen(c.saving.diff)}(合計 ${yen(c.saving.required)})`,
  }[c.saving.status];
  return h('div', { class: 'panel' },
    h('h1', {}, '🧭 羅針盤'),
    d.profile.vow ? h('div', { class: 'window' }, `最初の誓い: 「${d.profile.vow}」`) : h('p', {}, '宿屋で「最初の誓い」を書けます。'),
    h('h2', {}, '① ペース'),
    h('p', {}, c.pace ? `${PACE[c.pace]}(今いるべき額: ${yen(c.expectedNow ?? 0)})` : 'まだ予定線がありません'),
    h('h2', {}, '② 必要な積立額'),
    h('p', {}, saving),
    h('h2', {}, '③ 自分らしさ'),
    h('p', {}, c.fit.message),
    h('p', { class: 'note' }, '想定利回りで計算した目安です。利回りは保証されません。'),
    close,
  );
}
