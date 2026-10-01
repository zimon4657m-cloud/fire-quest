import type { Choice, GoalType } from '../../types';
import { computeJob, JOBS, QUESTIONS } from '../../logic/job';
import { update } from '../../app/store';
import { field, h, numberInput } from '../dom';

const DISCLAIMER = 'このアプリは投資助言ではありません。ゲーム上の目安です。';

export function renderDiagnosis(onDone: () => void): HTMLElement {
  const root = h('div', { class: 'panel' });
  const answers: Choice[] = [];

  const intro = () => {
    const start = h('button', { class: 'btn primary' }, '冒険をはじめる');
    start.onclick = () => question(0);
    root.replaceChildren(
      h('h1', {}, 'FIRE QUEST'),
      h('p', {}, '8つの質問で、あなたの職業(投資スタイル)を決めます。'),
      h('p', { class: 'note' }, DISCLAIMER),
      start,
    );
  };

  const question = (i: number) => {
    if (i >= QUESTIONS.length) return future();
    const q = QUESTIONS[i];
    const pick = (c: Choice) => () => { answers[i] = c; question(i + 1); };
    const a = h('button', { class: 'btn' }, `A. ${q.a}`);
    const b = h('button', { class: 'btn' }, `B. ${q.b}`);
    a.onclick = pick('A');
    b.onclick = pick('B');
    const back = h('button', { class: 'btn small' }, 'もどる');
    back.onclick = () => (i === 0 ? intro() : question(i - 1));
    root.replaceChildren(h('p', {}, `Q${i + 1} / ${QUESTIONS.length}`), h('h2', {}, q.text), a, b, back);
  };

  const future = () => {
    const select = h('select', { name: 'goal' },
      h('option', { value: 'sideFire' }, 'サイドFIRE(働き方を選べる状態)'),
      h('option', { value: 'fullFire' }, '完全FIRE(働かなくても暮らせる状態)'),
      h('option', { value: 'amountOnly' }, '資産額の目標だけ決めたい'),
    );
    const age = numberInput('targetAge', null, { step: '1', min: '1' });
    const err = h('p', { class: 'error' });
    const next = h('button', { class: 'btn primary', type: 'submit' }, '職業を見る');
    const form = h('form', {}, field('ゴールは?', select), field('何歳までに?', age), err, next);
    form.onsubmit = (e) => {
      e.preventDefault();
      const targetAge = Number(age.value);
      if (!(targetAge > 0)) { err.textContent = '目標の年齢を入れてください'; return; }
      const job = computeJob(answers);
      update((d) => { d.job = job; d.goal = { type: select.value as GoalType, targetAge }; });
      result();
    };
    root.replaceChildren(h('h2', {}, 'なりたい未来'), form);
  };

  const result = () => {
    const job = computeJob(answers);
    const j = JOBS[job];
    const go = h('button', { class: 'btn primary' }, '冒険者登録へ');
    go.onclick = onDone;
    root.replaceChildren(
      h('p', {}, 'あなたの職業は…'),
      h('h1', {}, `${j.emoji} ${j.name}`),
      h('p', {}, j.catch),
      h('p', { class: 'note' }, `職業の効果(ゲーム上の効果です): ${j.effect}`),
      go,
    );
  };

  intro();
  return root;
}
