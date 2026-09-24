// Тесты калькулятора через публичный API (без eval, тот же парсер что в приложении).
// js/calculator.js — IIFE на window, поэтому подменяем window/document фейками.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

function mkEl(value) {
  return {
    value: value || '',
    selectionStart: (value || '').length,
    selectionEnd: (value || '').length,
    textContent: '',
    focus() {},
    setSelectionRange(s, e) { this.selectionStart = s; this.selectionEnd = e; },
    addEventListener() {},
    scrollIntoView() {}
  };
}

let els;
let C;

function loadCalculator() {
  delete require.cache[require.resolve('../js/calculator.js')];
  global.window = {};
  els = {
    calcInput: mkEl(),
    calcResult: mkEl(),
    calcEquals: mkEl(),
    calcClear: mkEl()
  };
  global.document = {
    getElementById: (id) => els[id] || null,
    querySelector: () => null
  };
  require('../js/calculator.js');
  C = global.window.Calculator;
  C.init();
}

function calc(expr) {
  els.calcInput.value = expr;
  els.calcInput.selectionStart = els.calcInput.selectionEnd = expr.length;
  C.calculate(true);
  return els.calcInput.value;
}

describe('Calculator', () => {
  beforeEach(loadCalculator);

  it('считает приоритет операций и скобки', () => {
    assert.equal(calc('2+3'), '5');
    assert.equal(calc('2.5*3+10'), '17.5');
    assert.equal(calc('(1+2)*3'), '9');
    assert.equal(calc('10/4'), '2.5');
  });

  it('поддерживает постфиксный процент', () => {
    assert.equal(calc('50%'), '0.5');
    assert.equal(calc('(1+2)%'), '0.03');
    assert.equal(calc('2*(3+4)%'), '0.14');
  });

  it('гасит шум float-арифметики', () => {
    assert.equal(calc('0.1+0.2'), '0.3');
  });

  it('на ошибке показывает "Ошибка" и не трогает поле', () => {
    els.calcInput.value = '2+';
    els.calcInput.selectionStart = els.calcInput.selectionEnd = 2;
    C.calculate(true);
    assert.equal(els.calcResult.textContent, 'Ошибка');
    assert.equal(els.calcInput.value, '2+');
  });

  it('insertText/backspace/clear работают через курсор', () => {
    C.clear();
    C.insertText('7'); C.insertText('*'); C.insertText('6');
    C.calculate(true);
    assert.equal(els.calcInput.value, '42');

    els.calcInput.value = '12';
    els.calcInput.selectionStart = els.calcInput.selectionEnd = 2;
    C.backspace();
    assert.equal(els.calcInput.value, '1');

    C.clear();
    assert.equal(els.calcInput.value, '');
  });
});
