// npm run help — печатает единый реестр команд из scripts/commands.js.
const COMMANDS = require('./commands');

const NAME_W = Math.max(...COMMANDS.map((c) => c.name.length));

for (const c of COMMANDS) {
  const note = c.note ? ` [${c.note}]` : '';
  console.log(`  npm run ${c.name.padEnd(NAME_W)}  ${c.desc}${note}`);
  console.log(`  ${' '.repeat(NAME_W + 10)}${c.cmd}`);
}
console.log('\nПодсказки: portable без автообновления; updater только NSIS; mac — только на macOS.');
