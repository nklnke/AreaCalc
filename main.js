const { app, BrowserWindow, ipcMain } = require('electron');
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
    minWidth: 750,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Area Calculator',
    backgroundColor: '#f4f6fa',
    frame: true
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

  // Автообновление (только NSIS-сборка; без publish-конфига молча пропускаем)
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  } catch (e) {
    // electron-updater не установлен или нет конфига публикации
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

// Минимальная валидация одной записи: отбрасываем битую, остальное сохраняем
function isValidRecord(item) {
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
