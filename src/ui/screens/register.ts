import type { GoalType, Profile } from '../../types';
import { CONFIG } from '../../config';
import { getData, replaceAll, update } from '../../app/store';
import { defaultFireTargets, goalTarget } from '../../logic/status';
import { applyRegistration } from '../../logic/registration';
import { GATE_INFO, unlockedGates } from '../../logic/gates';
import { exportJson, importJson, InvalidSaveError } from '../../logic/storage';
import { field, h, numberInput, readNumber, todayISO } from '../dom';

// 金額の欄は画面では万円で入れてもらい、保存は円のまま(計算ロジックは円で動く)
const MAN = 10000;
const FIELDS: { name: keyof Profile; label: string; required: boolean; note?: string; man?: boolean }[] = [
  { name: 'age', label: '年齢', required: true },
  { name: 'monthlyExpense', label: '毎月の生活費(万円)', required: true, man: true },
  { name: 'cash', label: '現金(万円)', required: true, man: true, note: 'HP(何か月暮らせるか)になります' },
  { name: 'investments', label: '株式・投資信託の合計(万円)', required: true, man: true },
  { name: 'otherAssets', label: 'その他の資産(万円)', required: false, man: true, note: 'ゴールドなど' },
  { name: 'monthlySaving', label: '毎月の積立額(万円)', required: true, man: true },
  { name: 'sideIncome', label: '副業などの月収入(万円)', required: false, man: true, note: 'サイドFIRE後に働いて得たい月収も含めて入れてください' },
  { name: 'emergencyMonths', label: '生活防衛資金の月数', required: true, note: '初期値は6か月' },
  { name: 'expectedReturn', label: '想定利回り(年率%)', required: false, note: `空欄なら${CONFIG.defaultExpectedReturnPercent}%で計算します。利回りは保証されません` },
  { name: 'sideFireTarget', label: 'サイドFIREの目標額(万円)', required: true, man: true },
  { name: 'fullFireTarget', label: '完全FIREの目標額(万円)', required: true, man: true },
];

export function renderRegister(onDone: (opened: string[]) => void): HTMLElement {
  const d = getData();
  const p = d.profile;
  const form = h('form', {});
  const goalSelect = h('select', { name: 'goalType' },
    h('option', { value: 'sideFire' }, 'サイドFIRE(働き方を選べる状態)'),
    h('option', { value: 'fullFire' }, '完全FIRE(働かなくても暮らせる状態)'),
    h('option', { value: 'amountOnly' }, '資産額の目標だけ(完全FIREの目標額の欄を使います)'),
  );
  goalSelect.value = d.goal?.type ?? 'sideFire';
  const targetAge = numberInput('targetAge', d.goal?.targetAge ?? null, { step: '1', min: '1' });
  form.append(field('ゴール', goalSelect), field('目標の年齢', targetAge, '変えると、羅針盤の予定線をその日から引き直します'));
  for (const f of FIELDS) {
    const raw = p ? (p[f.name] as number | null) : f.name === 'emergencyMonths' ? 6 : null;
    const init = raw !== null && f.man ? raw / MAN : raw;
    form.append(field(f.label + (f.required ? '' : '(任意)'), numberInput(f.name, init), f.note));
  }
  const vow = h('textarea', { name: 'vow', maxlength: '50', rows: '2' });
  vow.value = p?.vow ?? '';
  form.append(field('最初の誓い(50文字まで)', vow, '例: 45歳で会社を選べる人になる'));

  const calc = h('button', { class: 'btn small', type: 'button' }, '生活費からFIRE額を計算');
  const calcNote = h('p', { class: 'note' });
  calc.onclick = () => {
    calcNote.textContent = (readNumber(form, 'sideIncome') ?? 0) > 0 ? ''
      : '副業などの月収入を入れると、サイドFIREの目標額がその分下がります';
    const t = defaultFireTargets((readNumber(form, 'monthlyExpense') ?? 0) * MAN, (readNumber(form, 'sideIncome') ?? 0) * MAN, CONFIG);
    (form.elements.namedItem('fullFireTarget') as HTMLInputElement).value = String(t.full / MAN);
    (form.elements.namedItem('sideFireTarget') as HTMLInputElement).value = String(t.side / MAN);
  };
  const err = h('p', { class: 'error' });
  form.append(
    h('p', { class: 'note' }, 'FIRE額の初期値は「年間の支出 × 25」(いわゆる4%ルール)です。米国の過去データをもとにした目安で、将来を保証するものではありません。'),
    calc, calcNote, err, h('button', { class: 'btn primary', type: 'submit' }, '冒険の書に記録する'),
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const values: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const v = readNumber(form, f.name);
      if (v === null && f.required) { err.textContent = `${f.label}を入れてください`; return; }
      if (v !== null && (!Number.isFinite(v) || v < 0)) { err.textContent = `${f.label}は0以上の数字で入れてください`; return; }
      values[f.name] = v !== null && f.man ? Math.round(v * MAN) : v;
    }
    const age = Number(targetAge.value);
    if (!(age > 0)) { err.textContent = '目標の年齢を入れてください'; return; }
    const goal = { type: goalSelect.value as GoalType, targetAge: age };
    const next: Profile = {
      age: values.age!, monthlyExpense: values.monthlyExpense!, cash: values.cash!, investments: values.investments!,
      otherAssets: values.otherAssets ?? 0, monthlySaving: values.monthlySaving!, sideIncome: values.sideIncome ?? 0,
      emergencyMonths: values.emergencyMonths!, expectedReturn: values.expectedReturn,
      sideFireTarget: values.sideFireTarget!, fullFireTarget: values.fullFireTarget!, vow: vow.value.slice(0, 50),
    };
    if (!(goalTarget(goal, next) > 0)) { err.textContent = '選んだゴールの目標額を入れてください(0より大きい金額)'; return; }
    const before = unlockedGates(d.profile, CONFIG);
    update((data) => applyRegistration(data, next, goal, todayISO(), CONFIG));
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
