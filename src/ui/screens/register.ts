import type { Profile } from '../../types';
import { CONFIG } from '../../config';
import { getData, replaceAll, update } from '../../app/store';
import { defaultFireTargets, totalAssets } from '../../logic/status';
import { makePlan } from '../../logic/compass';
import { GATE_INFO, unlockedGates } from '../../logic/gates';
import { exportJson, importJson, InvalidSaveError } from '../../logic/storage';
import { field, h, numberInput, readNumber, todayISO } from '../dom';

const FIELDS: { name: keyof Profile; label: string; required: boolean; note?: string }[] = [
  { name: 'age', label: '年齢', required: true },
  { name: 'monthlyExpense', label: '毎月の生活費(円)', required: true },
  { name: 'cash', label: '現金(円)', required: true, note: 'HP(何か月暮らせるか)になります' },
  { name: 'investments', label: '株式・投資信託の合計(円)', required: true },
  { name: 'otherAssets', label: 'その他の資産(円)', required: false, note: 'ゴールドなど' },
  { name: 'monthlySaving', label: '毎月の積立額(円)', required: true },
  { name: 'sideIncome', label: '副業などの月収入(円)', required: false },
  { name: 'emergencyMonths', label: '生活防衛資金の月数', required: true, note: '初期値は6か月' },
  { name: 'expectedReturn', label: '想定利回り(年率%)', required: false, note: `空欄なら${CONFIG.defaultExpectedReturnPercent}%で計算します。利回りは保証されません` },
  { name: 'sideFireTarget', label: 'サイドFIREの目標額(円)', required: true },
  { name: 'fullFireTarget', label: '完全FIREの目標額(円)', required: true },
];

export function renderRegister(onDone: (opened: string[]) => void): HTMLElement {
  const d = getData();
  const p = d.profile;
  const form = h('form', {});
  for (const f of FIELDS) {
    const init = p ? (p[f.name] as number | null) : f.name === 'emergencyMonths' ? 6 : null;
    form.append(field(f.label + (f.required ? '' : '(任意)'), numberInput(f.name, init), f.note));
  }
  const vow = h('textarea', { name: 'vow', maxlength: '50', rows: '2' });
  vow.value = p?.vow ?? '';
  form.append(field('最初の誓い(50文字まで)', vow, '例: 45歳で会社を選べる人になる'));

  const calc = h('button', { class: 'btn small', type: 'button' }, '生活費からFIRE額を計算');
  calc.onclick = () => {
    const t = defaultFireTargets(readNumber(form, 'monthlyExpense') ?? 0, readNumber(form, 'sideIncome') ?? 0, CONFIG);
    (form.elements.namedItem('fullFireTarget') as HTMLInputElement).value = String(t.full);
    (form.elements.namedItem('sideFireTarget') as HTMLInputElement).value = String(t.side);
  };
  const err = h('p', { class: 'error' });
  form.append(
    h('p', { class: 'note' }, 'FIRE額の初期値は「年間の支出 × 25」(いわゆる4%ルール)です。米国の過去データをもとにした目安で、将来を保証するものではありません。'),
    calc, err, h('button', { class: 'btn primary', type: 'submit' }, '冒険の書に記録する'),
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const values: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const v = readNumber(form, f.name);
      if (v === null && f.required) { err.textContent = `${f.label}を入れてください`; return; }
      if (v !== null && (!Number.isFinite(v) || v < 0)) { err.textContent = `${f.label}は0以上の数字で入れてください`; return; }
      values[f.name] = v;
    }
    const next: Profile = {
      age: values.age!, monthlyExpense: values.monthlyExpense!, cash: values.cash!, investments: values.investments!,
      otherAssets: values.otherAssets ?? 0, monthlySaving: values.monthlySaving!, sideIncome: values.sideIncome ?? 0,
      emergencyMonths: values.emergencyMonths!, expectedReturn: values.expectedReturn,
      sideFireTarget: values.sideFireTarget!, fullFireTarget: values.fullFireTarget!, vow: vow.value.slice(0, 50),
    };
    const before = unlockedGates(d.profile, CONFIG);
    update((data) => {
      const goal = data.goal!;
      const targetChanged = !data.plan
        || data.plan.targetAge !== goal.targetAge
        || data.plan.targetAmount !== (goal.type === 'sideFire' ? next.sideFireTarget : next.fullFireTarget);
      data.profile = next;
      if (targetChanged) data.plan = makePlan(next, goal, todayISO(), CONFIG);
      data.history.push({ date: todayISO(), totalAssets: totalAssets(next), cash: next.cash });
    });
    const after = unlockedGates(next, CONFIG);
    onDone([...after].filter((g) => !before.has(g)).map((g) => GATE_INFO[g].name));
  };

  // 書き出し・読み込み(機種変更・バックアップ用)
  const exportBtn = h('button', { class: 'btn small', type: 'button' }, '冒険の書を書き出す');
  exportBtn.onclick = () => {
    const blob = new Blob([exportJson(getData())], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `fire-quest-${todayISO()}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const file = h('input', { type: 'file', accept: 'application/json,.json' });
  file.onchange = async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      replaceAll(importJson(await f.text()));
      onDone([]);
    } catch (ex) {
      err.textContent = ex instanceof InvalidSaveError ? `読み込めませんでした: ${ex.message}` : '読み込めませんでした';
    }
  };

  return h('div', { class: 'panel' },
    h('h1', {}, p ? '🛏️ 宿屋' : '冒険者登録'),
    form,
    h('h2', {}, 'バックアップ'),
    exportBtn,
    field('冒険の書を読み込む(今のデータは置き換わります)', file),
  );
}
