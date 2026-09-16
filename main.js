const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Отключаем ненужные функции Chromium для ускорения
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 950,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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

app.whenReady().then(() => {
  createWindow();

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

// Загрузка данных
ipcMain.handle('load-data', async (event) => {
  const dataPath = path.join(app.getPath('userData'), 'areas_history.json');
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
});

// Сохранение данных
ipcMain.handle('save-data', async (event, data) => {
  const dataPath = path.join(app.getPath('userData'), 'areas_history.json');
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
});

// Очистка данных
ipcMain.handle('clear-data', async (event) => {
  const dataPath = path.join(app.getPath('userData'), 'areas_history.json');
  try {
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
    }
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
});
