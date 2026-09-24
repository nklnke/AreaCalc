// npm run menu — интерактивное меню поверх scripts/commands.js.
const readline = require('readline');
const { spawn } = require('child_process');
const COMMANDS = require('./commands');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('Доступные команды:');
COMMANDS.forEach((c, i) => {
  const note = c.note ? ` [${c.note}]` : '';
  console.log(`  ${String(i + 1).padStart(2)}. npm run ${c.name} — ${c.desc}${note}`);
});
console.log('   0. Выход');

rl.question('Выбери номер: ', (answer) => {
  const n = parseInt(String(answer).trim(), 10);
  rl.close();
  if (!Number.isInteger(n) || n < 0 || n > COMMANDS.length) {
    console.error('Неверный номер.');
    process.exitCode = 1;
    return;
  }
  if (n === 0) return;
  const c = COMMANDS[n - 1];
  console.log(`> npm run ${c.name} (${c.cmd})`);
  const child = spawn('npm', ['run', c.name], { stdio: 'inherit', shell: true });
  child.on('exit', (code) => process.exit(code === null ? 1 : code));
});
