const { contextBridge, ipcRenderer } = require('electron');

const appVersion = ipcRenderer.sendSync('getAppVersion');

contextBridge.exposeInMainWorld('appVersion', appVersion);