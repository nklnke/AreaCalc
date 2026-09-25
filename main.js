const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// Single instance: второй запуск фокусирует уже открытое окно
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 1000,
    // Фиксированный размер: ресайз и максимизация запрещены, своя панель — только свернуть/закрыть
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Area Calculator',
    // Своя панель: безрамочное прозрачное окно, скругление рисует CSS (.app)
    transparent: true,
    frame: false
  });

  mainWindow.loadFile('index.html');

  // Удаляем стандартное меню полностью
  mainWindow.setMenu(null);

  // DevTools для отладки
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createWindow();

  // Автообновление (только NSIS-сборка; publish-конфиг — GitHub Releases nklnke/AreaCalc).
  // Диалог показываем сами через dialog.showMessageBox: системные тосты Windows
  // могут быть подавлены (центр уведомлений, отсутствие ярлыка в Пуске),
  // а окно приложения видно всегда. Поэтому checkForUpdates() + свой диалог,
  // а не checkForUpdatesAndNotify().
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.logger = console;
    autoUpdater.on('update-downloaded', async (info) => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const version = (info && info.version) ? info.version : '';
        const { response } = await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Доступно обновление',
          message: `Загружена версия ${version}. Перезапустить приложение для установки?`,
          buttons: ['Перезапустить', 'Позже'],
          defaultId: 0,
          cancelId: 1
        });
        if (response === 0) autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        console.error('Update dialog failed:', err && err.message ? err.message : err);
      }
    });
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Auto update check failed:', err && err.message ? err.message : err);
    });
  } catch (e) {
    // electron-updater не установлен или нет конфига публикации
    console.error('Auto updater init failed:', e && e.message ? e.message : e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== IPC для работы с файлами =====

function getDataPath() {
  return path.join(app.getPath('userData'), 'areas_history.json');
}

// Минимальная валидация одной записи: отбрасываем битую, остальное сохраняем.
// Канон — shared/validate.js (тот же модуль в renderer как window.Validate).
let Validate;
try {
  Validate = require('./shared/validate');
} catch (e) {
  Validate = null;
}

function isValidRecord(item) {
  if (Validate) return Validate.isValidRecord(item);
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.width === 'number' &&
    typeof item.height === 'number' &&
    Number.isFinite(item.width) &&
    Number.isFinite(item.height) &&
    item.width > 0 &&
    item.height > 0 &&
    typeof item.timestamp === 'number' &&
    Number.isFinite(item.timestamp)
  );
}

function sanitizeHistory(data) {
  if (Validate) return Validate.sanitizeHistory(data);
  if (!Array.isArray(data)) return [];
  return data.filter(isValidRecord);
}

// Загрузка данных
ipcMain.handle('load-data', async (event) => {
  const dataPath = getDataPath();
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    return sanitizeHistory(JSON.parse(raw));
  } catch (error) {
    // Файла нет при первом запуске — это нормально
    if (error && error.code === 'ENOENT') return [];
    // Битый JSON или ошибка чтения: не затираем файл, возвращаем пусто
    console.error('Error loading data:', error);
    return [];
  }
});

// Сохранение данных (атомарно: tmp + rename, чтобы не получить обрезанный файл при падении)
ipcMain.handle('save-data', async (event, data) => {
  const dataPath = getDataPath();
  try {
    const clean = sanitizeHistory(data);
    const tmpPath = dataPath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(clean, null, 2), 'utf8');
    await fs.rename(tmpPath, dataPath);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
});

// Очистка данных
ipcMain.handle('clear-data', async (event) => {
  const dataPath = getDataPath();
  try {
    await fs.rm(dataPath, { force: true });
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
});

// ===== Своя панель окна =====

ipcMain.handle('get-version', () => app.getVersion());

// Открытие внешних ссылок из справки: только GitHub-репозиторий проекта.
// Прямой <a href> в песочнице увёл бы окно приложения на внешний сайт,
// поэтому открываем через shell.openExternal с whitelist.
ipcMain.handle('open-external', async (event, url) => {
  if (typeof url !== 'string' || !/^https:\/\/github\.com\/nklnke\/AreaCalc(\/.*)?$/.test(url)) {
    return false;
  }
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});
