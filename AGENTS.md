# AGENTS.md — AreaCalc (Electron)

Небольшое Electron-приложение, без сборщика / фреймворка / тестов / линтера. Обычные глобалы через `<script>`.

## Команды

- `npm install`, затем `npm start` (`electron .`) для запуска.
- `npm run build:win:portable` — предпочтительная сборка (один файл, `dist/`). `npm run build:win` — NSIS-установщик.
- В README упомянуты `build:mac` / `build:linux` — **этих скриптов нет** в `package.json`. Не запускать их.
- Скриптов тестов, линта и проверки типов нет. Проверяй запуском приложения и ручным проходом по UI.
- Если сборка падает: удалить `node_modules` + `package-lock.json`, выполнить `npm install`, пересобрать.

## Архитектура (неочевидное)

- Вход: `main.js` (главный процесс Electron, окно 900×1000, `minWidth 750 / minHeight 600`, single-instance) → `preload.js` открывает только `window.electronAPI.{loadData, saveData, clearData}` (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`) → `index.html` (есть CSP-meta) → `js/main.js` — точка входа рендера.
- Модули рендера — IIFE-глобалы на `window.*` (`Utils`, `Theme`, `Precision`, `Data`, `Skeleton`, `Modal`, `History`, `Edit`, `InputFilter`, `Export`). Никаких `import`/`require`. **Порядок тегов `<script>` в `index.html` и есть порядок загрузки**: `utils → theme → precision → data → skeleton → modal → history → edit → input-filter → export → main`, а `js/main.js` явно вызывает каждый `init()` — новые модули нужно добавлять и в список тегов, и в init `js/main.js`.
- То же для CSS: `variables.css` обязан быть первым; полный порядок — в `index.html` / README.
- Хранение разделено: история идёт через IPC в `areas_history.json` в Electron `userData` (`main.js` обрабатывает `load-data` / `save-data` / `clear-data`); тема и точность лежат в `localStorage`. Вне Electron (`window.electronAPI` отсутствует) `Data.load()` ловит ошибку и возвращает `[]`.
- Площадь **вычисляется, а не хранится**: `width × height / 1_000_000 × multiplier`. Поле `id` записей — **строки** (`crypto.randomUUID()`), хотя таблица в README говорит `number`.
- `History.multiplyLast()` **мутирует последнюю запись на месте** (сохраняет `id` и исходный `timestamp`, пишет `updatedAt`, выставляет `isMultiplied`) — новую не добавляет. `duplicate()` вставляет копию после оригинала.

## Соглашения / подводные камни

- В `package.json` whitelist `electron-builder` `files`: `main.js, preload.js, index.html, icon.ico, css/**, js/**`. Новые файлы/ассеты в корне не попадут в сборку, пока не добавишь их туда.
- Парсинг чисел (`Utils.parseNumber`, `InputFilter`): запятая принимается как десятичный разделитель; максимум 10 цифр целой части + 4 знака после запятой. Валидацию держать согласованной с этим.
- Экспорт CSV: разделитель `;` + BOM для кириллицы в Excel; импорт принимает и экспортный формат `{version, history:[...]}`, и сырой `[...]`, отбрасывает записи с неположительными/нечисловыми width/height, а при дописывании переназначает `id`.
- Заметки рендерятся через `Utils.escapeHtml` — сохранять это для любого нового рендера пользовательского текста.
- `dist/` и `node_modules/` — игнорируемые git-артефакты сборки; не редактировать и не коммитить их.
