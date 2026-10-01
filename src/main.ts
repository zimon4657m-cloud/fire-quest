import './style.css';
import { CONFIG } from './config';
import { initStore, getData, isStorageOk, wasCorrupted, update, subscribe } from './app/store';
import { unlockedGates, GATE_INFO } from './logic/gates';
import { computeStatus } from './logic/status';
import { computeExp } from './logic/registration';
import { computeParty } from './logic/equipment';
import { computeCompass } from './logic/compass';
import { bandMessage } from './logic/messages';
import { findStart, type Interaction, type WorldState } from './logic/world';
import { KNOWLEDGE } from './data/knowledge';
import { createGame } from './game/createGame';
import { mountHud } from './ui/hud';
import { h, todayISO } from './ui/dom';
import { renderDiagnosis } from './ui/screens/diagnosis';
import { renderRegister } from './ui/screens/register';
import { renderCard } from './ui/screens/card';
import { renderEquipment } from './ui/screens/equipment';
import { renderBoss } from './ui/screens/boss';
import { renderCompass } from './ui/screens/compass';

const screen = document.getElementById('screen')!;
const QUEST_LABELS = { openedAccount: '証券口座を開いた', setupNisa: 'NISAの積立を設定した', recordedExpense: '生活費を記録した' };

let game: ReturnType<typeof createGame> | null = null;
let hud: ReturnType<typeof mountHud> | null = null;

export function openScreen(el: HTMLElement): void {
  screen.replaceChildren(el);
  screen.hidden = false;
  screen.scrollTop = 0;
}
export function closeScreen(): void {
  screen.hidden = true;
  screen.replaceChildren();
  renderHud();
}

export function worldState(): WorldState {
  const d = getData();
  return { gates: unlockedGates(d.profile, CONFIG), quests: d.quests, sideIncomeFlag: (d.profile?.sideIncome ?? 0) > 0 };
}

export function currentCompass() {
  const d = getData();
  if (!d.profile || !d.goal || !d.job) return null;
  const status = computeStatus(d.profile, CONFIG);
  if (!status.ok) return null;
  return computeCompass(d.profile, d.goal, d.plan, computeParty(d.stocks, CONFIG), d.job, todayISO(), CONFIG);
}

function renderHud(): void {
  if (!hud) return;
  const d = getData();
  const status = d.profile ? computeStatus(d.profile, CONFIG) : null;
  const c = currentCompass();
  const statusText = status?.ok ? `Lv ${status.level}  HP ${status.hp}/${status.maxHp}  EXP ${computeExp(d)}` : '';
  hud.render(bandMessage(status, c), c?.fog ?? false, statusText);
}

export function onInteract(i: Interaction): void {
  const back = () => closeScreen();
  switch (i.kind) {
    case 'inn':
      return openScreen(renderRegister((opened) => {
        if (opened.length) openScreen(renderCard('道がひらけた!', `${opened.join('・')}が開きました。`, back));
        else back();
      }));
    case 'npc':
      return openScreen(renderCard(KNOWLEDGE[i.id].title, KNOWLEDGE[i.id].body, back));
    case 'gateClosed':
      return openScreen(renderCard(GATE_INFO[i.gate].name, GATE_INFO[i.gate].condition, back));
    case 'doorClosed': {
      const card = renderCard('閉じた扉', `クエスト「${QUEST_LABELS[i.quest]}」を達成したら、下のボタンでチェックしてください(自己申告です)。`, back);
      const check = h('button', { class: 'btn' }, `✅ ${QUEST_LABELS[i.quest]}`);
      check.onclick = () => { update((d) => { d.quests[i.quest] = true; }); back(); };
      card.append(check);
      return openScreen(card);
    }
    case 'chest': {
      if (getData().openedChests.includes(i.quest)) return;
      update((d) => { d.openedChests.push(i.quest); });
      return openScreen(renderCard(`宝箱: ${KNOWLEDGE[i.quest].title}`, KNOWLEDGE[i.quest].body, back));
    }
    case 'shop':
      return openScreen(renderEquipment(back));
    case 'cave':
      return openScreen(renderBoss(back));
  }
}

function showWorld(): void {
  closeScreen();
  if (game) return;
  const d = getData();
  hud = mountHud({ onCompass: () => openScreen(renderCompass(closeScreen)), onMove: (dx, dy) => game?.move(dx, dy) });
  game = createGame(document.getElementById('game')!, {
    getState: worldState,
    start: d.player ?? findStart(),
    onInteract,
    onMoved: (x, y) => update((data) => { data.player = { x, y }; }),
    isBlocked: () => !screen.hidden,
  });
  subscribe(() => { game?.refresh(); renderHud(); });
  renderHud();
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
