const { contextBridge, ipcRenderer } = require('electron');

// Создаём API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  
  // Исправленный метод для обработки событий из меню
  onClearHistory: (callback) => {
    // Убираем слушатель, если он уже был
    ipcRenderer.removeAllListeners('clear-history');
    // Добавляем новый
    ipcRenderer.on('clear-history', (event) => callback());
  }
});
