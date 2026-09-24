// Тесты истории: чистая математика площадей и поведение add/multiplyLast/duplicate/delete/clear.
// DOM подменён минимальными фейками; Data/Precision/Utils/Modal — стабами.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

function mkEl() {
  return {
    innerHTML: '',
    textContent: '',
    dataset: {},
    style: {},
    offsetWidth: 0,
    classList: { add() {}, remove() {} },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    remove() {},
    after() {}
  };
}

let els;
let items;
let modalErrors;
let confirmed;
let idCounter;

function loadHistory(seed) {
  delete require.cache[require.resolve('../js/history.js')];
  els = {
    historyList: mkEl(),
    totalDisplay: mkEl(),
    itemsCount: mkEl(),
    multiplierSection: mkEl(),
    lastItemInfo: mkEl()
  };
  items = (seed || []).map((o) => ({ ...o }));
  modalErrors = [];
  confirmed = true;
  idCounter = 0;
  global.window = {};
  global.Data = {
    get: () => items,
    add: (item) => { items.push(item); },
    removeById: (id) => {
      const i = items.findIndex((x) => x.id === id);
      if (i !== -1) { items.splice(i, 1); return true; }
      return false;
    },
    clear: () => { items = []; },
    set: (next) => { items = next; },
    save: async () => true
  };
  global.Precision = { get: () => 2 };
  global.Utils = {
    formatTime: () => '12:00',
    escapeHtml: (s) => String(s),
    generateId: () => `id-${++idCounter}`
  };
  global.Modal = {
    showError: async (m) => { modalErrors.push(m); },
    confirm: async () => confirmed,
    show: async () => {}
  };
  global.document = { getElementById: (id) => els[id] || null };
  require('../js/history.js');
  const H = global.window.History;
  H.init();
  return H;
}

const rec = (over) => ({
  id: 'r1', width: 2000, height: 1500, timestamp: 1700000000000, isMultiplied: false, ...over
});

describe('History areas', () => {
  it('считает сырую площадь и площадь с множителем', () => {
    const H = loadHistory([]);
    assert.equal(H.getRawArea(rec()), 3);
    assert.equal(H.getDisplayArea(rec()), 3);
    assert.equal(H.getDisplayArea(rec({ multiplier: 3, isMultiplied: true })), 9);
    assert.equal(H.getDisplayArea(rec({ multiplier: 3 })), 3);
  });
});

describe('History add', () => {
  it('создаёт запись с id/timestamp и рендерит её', async () => {
    const H = loadHistory([]);
    const item = await H.add(2000, 1500);
    assert.equal(items.length, 1);
    assert.ok(typeof item.id === 'string' && item.id.length > 0);
    assert.ok(Number.isFinite(item.timestamp));
    assert.equal(item.isMultiplied, false);
    assert.ok(els.historyList.innerHTML.includes(item.id));
    assert.equal(els.itemsCount.textContent, 1);
  });
});

describe('History multiplyLast', () => {
  it('мутирует последнюю запись: id и timestamp целы, пишет updatedAt', async () => {
    const H = loadHistory([rec({ id: 'keep', timestamp: 111 })]);
    await H.multiplyLast(3);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, 'keep');
    assert.equal(items[0].timestamp, 111);
    assert.equal(items[0].multiplier, 3);
    assert.equal(items[0].isMultiplied, true);
    assert.ok(Number.isFinite(items[0].updatedAt));
  });

  it('на пустой истории и плохом множителе показывает ошибку', async () => {
    const H = loadHistory([]);
    await H.multiplyLast(2);
    await H.add(2000, 1500);
    await H.multiplyLast(0);
    await H.multiplyLast(NaN);
    assert.equal(modalErrors.length, 3);
    assert.equal(items.length, 1);
  });
});

describe('History duplicate/delete/clear', () => {
  it('duplicate вставляет копию после оригинала с новым id', async () => {
    const H = loadHistory([rec({ id: 'orig', width: 100, height: 200 })]);
    await H.duplicate('orig');
    assert.equal(items.length, 2);
    assert.equal(items[0].id, 'orig');
    assert.notEqual(items[1].id, 'orig');
    assert.equal(items[1].width, 100);
    assert.equal(items[1].height, 200);
  });

  it('duplicate не плодит multiplier=1 у немультиплицированных', async () => {
    const H = loadHistory([rec({ id: 'orig' })]);
    await H.duplicate('orig');
    assert.ok(!('multiplier' in items[1]));
  });

  it('deleteById удаляет и показывает пустое состояние', async () => {
    const H = loadHistory([rec({ id: 'gone' })]);
    await H.deleteById('gone');
    // удаление идёт через анимацию/таймер — ждём завершения
    await new Promise((r) => setTimeout(r, 600));
    assert.equal(items.length, 0);
    assert.ok(els.historyList.innerHTML.includes('История пуста'));
  });

  it('clearAll с подтверждением чистит всё', async () => {
    const H = loadHistory([rec({ id: 'a' }), rec({ id: 'b' })]);
    await H.clearAll();
    await new Promise((r) => setTimeout(r, 700));
    assert.equal(items.length, 0);
  });

  it('clearAll без подтверждения ничего не трогает', async () => {
    const H = loadHistory([rec({ id: 'a' })]);
    confirmed = false;
    await H.clearAll();
    assert.equal(items.length, 1);
  });
});
