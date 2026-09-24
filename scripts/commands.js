// Единый реестр npm-команд: используется scripts/help.js и scripts/menu.js,
// чтобы справка и интерактив не разъезжались.
const COMMANDS = [
  { name: 'start', cmd: 'electron .', desc: 'Запуск приложения' },
  { name: 'test', cmd: 'node --test test/*.test.js', desc: 'Тесты (node:test, без зависимостей)' },
  { name: 'help', cmd: 'node scripts/help.js', desc: 'Список всех команд' },
  { name: 'menu', cmd: 'node scripts/menu.js', desc: 'Интерактивное меню команд' },
  { name: 'build', cmd: 'electron-builder', desc: 'Сборка по умолчанию (все цели из конфига)' },
  { name: 'build:win', cmd: 'electron-builder --win nsis --x64', desc: 'Установщик Windows NSIS (с автообновлением)' },
  { name: 'build:win:portable', cmd: 'electron-builder --win portable --x64', desc: 'Portable exe (без автообновления)' },
  { name: 'build:win:dir', cmd: 'electron-builder --win nsis --x64 --dir --publish never', desc: 'Быстрая проверка сборки без установщика' },
  { name: 'build:mac', cmd: 'electron-builder --mac', desc: 'Сборка macOS (dmg+zip)', note: 'только на macOS' },
  { name: 'build:linux', cmd: 'electron-builder --linux', desc: 'Сборка Linux (AppImage)', note: 'из Windows — WSL/Docker' },
  { name: 'release:win', cmd: 'electron-builder --win nsis --x64 --publish always', desc: 'Релиз Windows в GitHub Releases', note: 'нужен GH_TOKEN' },
  { name: 'release:win:draft', cmd: 'electron-builder --win nsis --x64 --publish onTagOrDraft', desc: 'Тестовый черновик релиза', note: 'нужен GH_TOKEN' },
  { name: 'release:tag', cmd: 'node scripts/release-tag.js <version>', desc: 'CI-релиз: бамп версии, коммит, тег, push', note: 'дальше соберет Actions' },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMMANDS;
}
