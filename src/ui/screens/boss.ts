import { CONFIG } from '../../config';
import { CRASHES } from '../../data/crashes';
import { getData } from '../../app/store';
import { simulateBoss } from '../../logic/boss';
import { h, yen } from '../dom';

export function renderBoss(onClose: () => void): HTMLElement {
  const root = h('div', { class: 'panel' });
  const d = getData();
  const leave = h('button', { class: 'btn' }, '洞窟を出る');
  leave.onclick = onClose;

  const choose = () => {
    const buttons = CRASHES.filter((c) => c.monthlyReturns.length > 0).map((c) => {
      const b = h('button', { class: 'btn' }, `👹 ${c.bossName}`);
      b.onclick = () => fight(c.id, undefined, 0);
      return b;
    });
    root.replaceChildren(h('h1', {}, '🕳️ 損失の洞窟'),
      h('p', { class: 'note' }, '過去の暴落の値動きを、今の装備に当てはめたシミュレーションです。将来の値動きを予想するものではありません。'),
      ...buttons, leave);
  };

  const fight = (id: string, escapeAtTurn: number | undefined, shown: number) => {
    const c = CRASHES.find((x) => x.id === id)!;
    const r = simulateBoss(d.stocks, d.profile!, c, d.job!, { escapeAtTurn }, CONFIG);
    if (shown >= r.turns.length) return result(c.bossName, c.modelName, c.source, r);
    const t = shown === 0 ? null : r.turns[shown - 1];
    const now = t ? t.total : r.startTotal;
    const hpBar = r.startTotal > 0 ? Math.max(0, Math.min(100, (now / r.startTotal) * 100)) : 0;
    const next = h('button', { class: 'btn primary' }, '▶ 次のターン');
    next.onclick = () => fight(id, escapeAtTurn, shown + 1);
    const skip = h('button', { class: 'btn small' }, '最後まで進める');
    skip.onclick = () => fight(id, escapeAtTurn, r.turns.length);
    const parts: HTMLElement[] = [
      h('h1', {}, `👹 ${c.bossName}`),
      h('div', { class: 'window' },
        `ターン ${shown} / ${r.turns.length}(1ターン=1か月)`, h('br'),
        `資産: ${yen(now)}`, h('br'),
        h('div', { style: `height:12px;background:#c9a227;width:${hpBar}%` })),
      next, skip,
    ];
    if (d.job === 'rabbit' && escapeAtTurn === undefined) {
      const run = h('button', { class: 'btn' }, '🐰 逃げる(装備を現金に変える)');
      run.onclick = () => fight(id, shown + 1, shown + 1);
      parts.push(run);
    }
    root.replaceChildren(...parts);
  };

  const result = (boss: string, model: string, source: string, r: ReturnType<typeof simulateBoss>) => {
    const again = h('button', { class: 'btn' }, '別のボスと戦う');
    again.onclick = choose;
    root.replaceChildren(
      h('h1', {}, `${boss}との戦いの結果`),
      h('div', { class: 'window' },
        `いちばん減ったとき: −${yen(r.maxDrop)}`, h('br'),
        r.maxDrop <= 0
          ? '資産は一度も元の額を下回りませんでした'
          : r.recoveryTurn === null ? 'この期間では元の資産額に戻りませんでした' : `元の資産額に戻ったのは ${r.recoveryTurn} ターン目`,
        h('br'),
        r.hpMonths === null ? '' : `HP(現金)は最後まで ${r.hpMonths.toFixed(1)} か月分残りました`, h('br'),
        r.escapedAt ? `${r.escapedAt} ターン目に逃げました` : ''),
      h('p', { class: 'note' }, `${model}。データ: ${source}`),
      again, leave,
    );
  };

  if (!d.profile || !d.job) root.replaceChildren(h('p', {}, '宿屋で冒険者登録をしてから来てください。'), leave);
  else choose();
  return root;
}
