import type { MoveType, Stock } from '../../types';
import { CONFIG } from '../../config';
import { getData, update } from '../../app/store';
import { placeEquipment, QUADRANT_LABELS } from '../../logic/equipment';
import { field, h, numberInput, readNumber, yen } from '../dom';
import { renderEquipmentMap } from './equipmentMap';
import { openScreen } from '../../main';

export function renderEquipment(onClose: () => void): HTMLElement {
  const root = h('div', { class: 'panel' });
  const draw = () => {
    const list = h('div', {});
    for (const s of getData().stocks) {
      const p = placeEquipment(s, CONFIG);
      const del = h('button', { class: 'btn small' }, 'はずす');
      del.onclick = () => { update((d) => { d.stocks = d.stocks.filter((x) => x.id !== s.id); }); draw(); };
      list.append(h('div', { class: 'note', style: 'margin:8px 0' },
        `${QUADRANT_LABELS[p.quadrant].icon} ${s.name}(${QUADRANT_LABELS[p.quadrant].gear})`,
        h('br'), s.status === 'equipped' ? `装備中 ${yen(s.amount)} / 回復 ${yen(p.healPerTurn)}/ターン` : '欲しいものリスト',
        ' ', del));
    }
    const mapBtn = h('button', { class: 'btn' }, '🗺️ 装備マップを見る');
    mapBtn.onclick = () => openScreen(renderEquipmentMap(() => openScreen(renderEquipment(onClose))));
    const close = h('button', { class: 'btn primary' }, '店を出る');
    close.onclick = onClose;
    root.replaceChildren(
      h('h1', {}, '⚔️ 装備屋'),
      h('p', { class: 'note' }, 'このアプリは投資助言ではありません。ゲーム上の目安です。装備の位置は、入力した数字を決まった式に当てはめた結果です。'),
      list, mapBtn, renderForm(draw), close,
    );
  };
  draw();
  return root;
}

function renderForm(onSaved: () => void): HTMLElement {
  const status = h('select', { name: 'status' }, h('option', { value: 'equipped' }, '持っている(装備中)'), h('option', { value: 'wishlist' }, '欲しいものリスト'));
  const kind = h('select', { name: 'kind' }, h('option', { value: 'stock' }, '個別株'), h('option', { value: 'index' }, 'インデックス・ETF'));
  const move = h('select', { name: 'moveType' },
    h('option', { value: '' }, 'ベータ値を入れる'),
    h('option', { value: 'defensive' }, 'ディフェンシブ(食品・医薬品・電力など)'),
    h('option', { value: 'normal' }, 'ふつう'),
    h('option', { value: 'cyclical' }, '景気敏感(機械・鉄鋼・半導体など)'),
  );
  const name = h('input', { name: 'name', maxlength: '30' });
  const err = h('p', { class: 'error' });
  const form = h('form', {},
    h('h2', {}, '装備を追加'),
    field('銘柄名', name), field('区分', status), field('種類', kind),
    field('金額(評価額・円)', numberInput('amount', null), '欲しいものリストは空欄でもよい(「試しに装備」では100万円として計算)'),
    field('PER(倍)', numberInput('per', null, { min: '' })), field('PBR(倍)', numberInput('pbr', null, { min: '' })),
    field('値動きのタイプ', move), field('ベータ値', numberInput('beta', null), '「ベータ値を入れる」を選んだときだけ使います'),
    field('配当利回り(%)', numberInput('dividendYield', null)),
    err, h('button', { class: 'btn primary', type: 'submit' }, '追加する'),
  );
  form.onsubmit = (e) => {
    e.preventDefault();
    const isIndex = kind.value === 'index';
    const amount = readNumber(form, 'amount');
    const per = readNumber(form, 'per'), pbr = readNumber(form, 'pbr'), beta = readNumber(form, 'beta');
    const dy = readNumber(form, 'dividendYield');
    if (!name.value.trim()) { err.textContent = '銘柄名を入れてください'; return; }
    if (status.value === 'equipped' && !(amount && amount > 0)) { err.textContent = '装備中の銘柄は金額を入れてください'; return; }
    if (!isIndex && per === null && pbr === null) { err.textContent = 'PERかPBRのどちらかを入れてください(赤字ならPBRだけで大丈夫です)'; return; }
    if (!isIndex && move.value === '' && beta === null) { err.textContent = 'ベータ値を入れるか、値動きのタイプを選んでください'; return; }
    if ([amount, per, pbr, beta, dy].some((v) => v !== null && !Number.isFinite(v))) { err.textContent = '数字で入れてください'; return; }
    const stock: Stock = {
      id: crypto.randomUUID(), name: name.value.trim(),
      status: status.value as Stock['status'], kind: isIndex ? 'index' : 'stock',
      amount: amount ?? 1_000_000, per, pbr, beta: move.value === '' ? beta : null,
      moveType: move.value === '' ? null : (move.value as MoveType), dividendYield: dy ?? 0,
    };
    update((d) => { d.stocks.push(stock); });
    onSaved();
  };
  return form;
}
