import './style.css';
import { initStore, getData, isStorageOk, wasCorrupted } from './app/store';
import { renderDiagnosis } from './ui/screens/diagnosis';
import { renderRegister } from './ui/screens/register';
import { renderCard } from './ui/screens/card';
import { h } from './ui/dom';

const screen = document.getElementById('screen')!;

export function openScreen(el: HTMLElement): void {
  screen.replaceChildren(el);
  screen.hidden = false;
  screen.scrollTop = 0;
}
export function closeScreen(): void {
  screen.hidden = true;
  screen.replaceChildren();
}

function showWorld(): void {
  closeScreen();
  document.getElementById('game')!.replaceChildren(h('p', { style: 'color:#fff;padding:16px' }, 'ここにワールドマップ(Task 11)'));
}

export function route(): void {
  const d = getData();
  if (!d.job || !d.goal) return openScreen(renderDiagnosis(route));
  if (!d.profile) return openScreen(renderRegister(() => route()));
  showWorld();
}

let storage: Storage | null = null;
try { storage = window.localStorage; } catch { storage = null; }
initStore(storage);
route();
if (!isStorageOk()) {
  openScreen(renderCard('記録が残りません', 'この状態ではデータが保存されません。宿屋の「冒険の書を書き出す」で保存してください。', route));
} else if (wasCorrupted()) {
  openScreen(renderCard('冒険の書が読めませんでした', '保存データが壊れているようです。前に書き出したファイルがあれば、宿屋から読み込んでください。それまで記録は上書きされません。', route));
}
