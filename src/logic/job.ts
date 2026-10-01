import type { Choice, Job } from '../types';

export const QUESTIONS: { axis: 'time' | 'calm'; text: string; a: string; b: string }[] = [
  { axis: 'time', text: '株を買うときの基準は？',
    a: '5年後・10年後も持ち続けられるかを重視する', b: '数ヶ月〜1年以内に利益が出そうかを重視する' },
  { axis: 'time', text: '保有銘柄の値動きは普段どれくらい見る？',
    a: '月1〜2回、配当や決算のタイミングだけ確認する', b: '毎日、株価をこまめにチェックしてしまう' },
  { axis: 'time', text: '理想の投資スタイルは？',
    a: '一度買ったらほったらかしで資産を育てたい', b: '相場の波に合わせてこまめに売買したい' },
  { axis: 'time', text: '含み益が出た銘柄、どうする？',
    a: 'まだ成長すると思えば売らずに持ち続ける', b: '目標株価に近づいたら早めに利確する' },
  { axis: 'calm', text: '株価が急落したときの反応は？',
    a: 'シナリオが崩れていなければ、一喜一憂せずそのまま様子を見る', b: '気になって何度もニュースやチャートを確認してしまう' },
  { axis: 'calm', text: 'SNSで「この銘柄やばい」という投稿を見たら？',
    a: '自分の分析結果を信じて、あまり気にしない', b: '不安になって自分の保有銘柄を見直してしまう' },
  { axis: 'calm', text: '保有銘柄が急に無配・減配を発表したら？',
    a: '財務指標を確認し、事実として淡々と受け止める', b: 'ショックで、しばらく投資のことを考えたくなくなる' },
  { axis: 'calm', text: '投資の話を人とするとき？',
    a: '感情より数字（指標やデータ）で語ることが多い', b: '良かった・怖かったなど気持ちの部分をつい話してしまう' },
];

export const JOBS: Record<Job, { emoji: string; name: string; catch: string; effect: string }> = {
  turtle: { emoji: '🐢', name: '亀', catch: '長期志向 × 動じない', effect: '守り側の装備の防御力 +10%' },
  squirrel: { emoji: '🐿️', name: 'リス', catch: '長期志向 × 動じやすい', effect: '配当の回復量 +10%' },
  falcon: { emoji: '🦅', name: '隼', catch: '短期志向 × 動じない', effect: '攻め側の装備の攻撃力 +10%' },
  rabbit: { emoji: '🐰', name: 'うさぎ', catch: '短期志向 × 動じやすい', effect: 'ボス戦で「逃げる」を選べる' },
};

export function computeJob(answers: Choice[]): Job {
  if (answers.length !== QUESTIONS.length) throw new Error('回答は8つ必要です');
  let timeA = 0, timeB = 0, calmA = 0, calmB = 0;
  QUESTIONS.forEach((q, i) => {
    const isA = answers[i] === 'A';
    if (q.axis === 'time') {
      if (isA) timeA++;
      else timeB++;
    } else if (isA) calmA++;
    else calmB++;
  });
  const isLong = timeA !== timeB ? timeA > timeB : answers[0] === 'A';
  const isCalm = calmA !== calmB ? calmA > calmB : answers[4] === 'A';
  if (isLong) return isCalm ? 'turtle' : 'squirrel';
  return isCalm ? 'falcon' : 'rabbit';
}
