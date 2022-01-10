console.log("In preload!");

const { contextBridge } = require('electron')
const fs = require('fs');
const Path = require('path');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const appDataPath = ipcRenderer.sendSync('getAppDataPath');
console.log(appDataPath);

contextBridge.exposeInMainWorld("RELEASED_RPT_CONFIG_FILE", Path.resolve(__dirname, '..', 'data', 'ReleasedRptConfig.json'));
contextBridge.exposeInMainWorld("USER_CONFIG_FOLDER_PROD", Path.resolve(appDataPath, 'YellowFruit'));
// USER_CONFIG should be the value from the previous line
contextBridge.exposeInMainWorld("CUSTOM_RPT_CONFIG_FILE_PROD", Path.resolve(USER_CONFIG_FOLDER_PROD, 'CustomRptConfig.json'));
contextBridge.exposeInMainWorld("CUSTOM_RPT_CONFIG_FILE_DEV", Path.resolve(__dirname, '..', 'data', 'CustomRptConfig.json'));
contextBridge.exposeInMainWorld("defaultStandingsLocation", Path.resolve(__dirname, 'standings.html'));
contextBridge.exposeInMainWorld("defaultIndividualsLocation", Path.resolve(__dirname, 'individuals.html'));
contextBridge.exposeInMainWorld("defaultScoreboardLocation", Path.resolve(__dirname, 'games.html'));
contextBridge.exposeInMainWorld("defaultTeamDetailLocation", Path.resolve(__dirname, 'teamdetail.html'));
contextBridge.exposeInMainWorld("defaultPlayerDetailLocation", Path.resolve(__dirname, 'playerdetail.html'));
contextBridge.exposeInMainWorld("defaultRoundReportLocation", Path.resolve(__dirname, 'rounds.html'));

contextBridge.exposeInMainWorld("ipcRender", electron.ipcRenderer);
contextBridge.exposeInMainWorld("electron", electron);

window.ipcRenderer = ipcRenderer;
window.xyz = 1;

console.log("End of preload!");