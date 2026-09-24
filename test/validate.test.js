// Тесты общей валидации (shared/validate.js) — тот же канон, что в main и renderer.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const V = require('../shared/validate');

const valid = () => ({ id: 'a', width: 1000, height: 2000, timestamp: 1700000000000 });

describe('isValidRecord', () => {
  it('принимает минимальную корректную запись', () => {
    assert.equal(V.isValidRecord(valid()), true);
  });

  it('бракует плохой id', () => {
    assert.equal(V.isValidRecord({ ...valid(), id: '' }), false);
    assert.equal(V.isValidRecord({ ...valid(), id: 123 }), false);
    assert.equal(V.isValidRecord({ ...valid(), id: 'x'.repeat(101) }), false);
  });

  it('бракует плохие размеры', () => {
    for (const w of [0, -1, NaN, Infinity, '10', null]) {
      assert.equal(V.isValidRecord({ ...valid(), width: w }), false, `width=${String(w)}`);
    }
    assert.equal(V.isValidRecord({ ...valid(), height: 0 }), false);
    assert.equal(V.isValidRecord({ ...valid(), width: V.MAX_VALUE + 1 }), false);
  });

  it('бракует плохой timestamp', () => {
    assert.equal(V.isValidRecord({ ...valid(), timestamp: NaN }), false);
    assert.equal(V.isValidRecord({ ...valid(), timestamp: 0 }), false);
    assert.equal(V.isValidRecord({ ...valid(), timestamp: ' вчера' }), false);
  });

  it('не бракует запись из-за мусорных опциональных полей', () => {
    assert.equal(V.isValidRecord({ ...valid(), multiplier: -5, note: 42 }), true);
  });
});

describe('normalizeRecord', () => {
  it('приводит числовой id к строке', () => {
    assert.equal(V.normalizeRecord({ ...valid(), id: 123 }).id, '123');
  });

  it('заменяет битый timestamp на now', () => {
    const n = V.normalizeRecord({ ...valid(), timestamp: NaN }, 1700000000001);
    assert.equal(n.timestamp, 1700000000001);
  });

  it('отбрасывает multiplier без isMultiplied, оставляет с ним', () => {
    assert.ok(!('multiplier' in V.normalizeRecord({ ...valid(), multiplier: 2 })));
    const kept = V.normalizeRecord({ ...valid(), multiplier: 2, isMultiplied: true });
    assert.equal(kept.multiplier, 2);
    assert.equal(kept.isMultiplied, true);
  });

  it('отбрасывает мусорный multiplier и updatedAt', () => {
    const n = V.normalizeRecord({ ...valid(), multiplier: -2, isMultiplied: true, updatedAt: NaN });
    assert.ok(!('multiplier' in n));
    assert.equal(n.isMultiplied, false);
    assert.ok(!('updatedAt' in n));
  });

  it('режет длинные заметки до 500 символов', () => {
    assert.equal(V.normalizeRecord({ ...valid(), note: 'z'.repeat(600) }).note.length, 500);
  });

  it('возвращает null для битых размеров', () => {
    assert.equal(V.normalizeRecord({ ...valid(), width: -1 }), null);
    assert.equal(V.normalizeRecord(null), null);
  });
});

describe('sanitizeHistory', () => {
  it('фильтрует битые записи и не-массивы', () => {
    const out = V.sanitizeHistory([valid(), { id: 'b', width: -1, height: 1, timestamp: 1 }]);
    assert.equal(out.length, 1);
    assert.deepEqual(V.sanitizeHistory(null), []);
    assert.deepEqual(V.sanitizeHistory({}), []);
  });
});
