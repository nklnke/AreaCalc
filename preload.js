const { contextBridge, ipcRenderer } = require('electron');

// Создаём API для рендерера (минимальный белый список)
contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  clearData: () => ipcRenderer.invoke('clear-data'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  getVersion: () => ipcRenderer.invoke('get-version')
});
