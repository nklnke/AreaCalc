// Тесты реестра команд: help/menu строятся из scripts/commands.js,
// реестр обязан совпадать 1:1 со scripts в package.json.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const COMMANDS = require('../scripts/commands');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

describe('commands registry', () => {
  it('имена уникальны и заполнены', () => {
    const names = COMMANDS.map((c) => c.name);
    assert.equal(new Set(names).size, names.length);
    for (const c of COMMANDS) {
      assert.ok(c.name && c.cmd && c.desc, `пустое поле: ${JSON.stringify(c)}`);
    }
  });

  it('совпадает 1:1 со scripts в package.json', () => {
    const registry = new Set(COMMANDS.map((c) => c.name));
    const scripts = new Set(Object.keys(pkg.scripts));
    for (const name of registry) {
      assert.ok(scripts.has(name), `команда ${name} есть в реестре, но нет в package.json`);
    }
    for (const name of scripts) {
      assert.ok(registry.has(name), `скрипт ${name} есть в package.json, но нет в реестре`);
    }
  });
});
