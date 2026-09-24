// Тесты экспорта: CSV (разделитель ;, BOM, экранирование) и JSON (конверт бэкапа).
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');


let lastBlob = null;
let lastDownload = null;
let modalErrors = [];

function fakeAnchor() {
  return {
    href: '',
    download: '',
    click() { lastDownload = { content: lastBlob.parts.join(''), filename: this.download }; }
  };
}

function loadExport(items, precision) {
  delete require.cache[require.resolve('../js/export.js')];
  lastBlob = null;
  lastDownload = null;
  modalErrors = [];
  const data = items.map((o) => ({ ...o }));
  global.window = {};
  global.Data = { get: () => data };
  global.Precision = { get: () => (precision === undefined ? 2 : precision) };
  global.History = {
    getDisplayArea: (item) => ((item.width * item.height) / 1000000) *
      ((item.isMultiplied && item.multiplier) ? item.multiplier : 1)
  };
  global.Modal = {
    showError: async (m) => { modalErrors.push(m); },
    show: async () => {}
  };
  global.Blob = class {
    constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type; lastBlob = this; }
  };
  global.URL = { createObjectURL: () => 'blob:url', revokeObjectURL() {} };
  global.document = {
    getElementById: () => ({ addEventListener() {}, style: {}, value: '', files: [] }),
    querySelectorAll: () => [],
    createElement: () => fakeAnchor(),
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {}
  };
  require('../js/export.js');
  return global.window.Export;
}

const rec = (over) => ({
  id: 'x1', width: 2000, height: 1500, timestamp: 1700000000000, isMultiplied: false, ...over
});

describe('Export CSV', () => {
  let Export;
  beforeEach(() => { Export = loadExport([rec()]); });

  it('начинается с BOM и заголовков через ;', () => {
    Export.exportCSV();
    assert.equal(lastDownload.content.charCodeAt(0), 0xFEFF);
    const firstLine = lastDownload.content.slice(1).split('\n')[0];
    assert.equal(firstLine, 'Ширина (мм);Высота (мм);Множитель;Площадь (м²);Заметка;Дата');
  });

  it('считает площадь с множителем и точностью', () => {
    Export = loadExport([rec({ multiplier: 3, isMultiplied: true })], 4);
    Export.exportCSV();
    const row = lastDownload.content.split('\n')[1].split(';');
    assert.deepEqual(row.slice(0, 4), ['2000', '1500', '3', '9.0000']);
  });

  it('экранирует заметки с разделителем', () => {
    Export = loadExport([rec({ note: 'кухня; окно' })]);
    Export.exportCSV();
    assert.ok(lastDownload.content.includes('"кухня; окно"'));
  });

  it('на пустой истории показывает ошибку и не качает файл', () => {
    Export = loadExport([]);
    Export.exportCSV();
    assert.equal(modalErrors.length, 1);
    assert.equal(lastDownload, null);
  });
});

describe('Export JSON', () => {
  it('кладёт конверт бэкапа с версией и счётчиком', () => {
    const Export = loadExport([rec(), rec({ id: 'x2' })]);
    Export.exportJSON();
    const data = JSON.parse(lastDownload.content);
    assert.equal(data.version, '2.1.0');
    assert.equal(data.count, 2);
    assert.equal(data.history.length, 2);
    assert.ok(typeof data.exportDate === 'string');
    assert.ok(lastDownload.filename.startsWith('areacalc_backup_'));
  });

  it('на пустой истории показывает ошибку', () => {
    const Export = loadExport([]);
    Export.exportJSON();
    assert.equal(modalErrors.length, 1);
    assert.equal(lastDownload, null);
  });
});
