console.log('In preload!');

const { contextBridge } = require('electron')
const fs = require('fs');
const Path = require('path');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const appDataPath = ipcRenderer.sendSync('getAppDataPath');
console.log(appDataPath);
const userConfigFolderProd = Path.resolve(appDataPath, 'YellowFruit');
const appFolder = Path.resolve(__dirname, '..');

contextBridge.exposeInMainWorld('RELEASED_RPT_CONFIG_FILE', Path.resolve(appFolder, '..', 'data', 'ReleasedRptConfig.json'));
contextBridge.exposeInMainWorld('USER_CONFIG_FOLDER_PROD', userConfigFolderProd);
contextBridge.exposeInMainWorld('CUSTOM_RPT_CONFIG_FILE_PROD', Path.resolve(userConfigFolderProd, 'CustomRptConfig.json'));
contextBridge.exposeInMainWorld('CUSTOM_RPT_CONFIG_FILE_DEV', Path.resolve(appFolder, '..', '..', 'data', 'CustomRptConfig.json'));
contextBridge.exposeInMainWorld('defaultStandingsLocation', Path.resolve(appFolder, 'standings.html'));
contextBridge.exposeInMainWorld('defaultIndividualsLocation', Path.resolve(appFolder, 'individuals.html'));
contextBridge.exposeInMainWorld('defaultScoreboardLocation', Path.resolve(appFolder, 'games.html'));
contextBridge.exposeInMainWorld('defaultTeamDetailLocation', Path.resolve(appFolder, 'teamdetail.html'));
contextBridge.exposeInMainWorld('defaultPlayerDetailLocation', Path.resolve(appFolder, 'playerdetail.html'));
contextBridge.exposeInMainWorld('defaultRoundReportLocation', Path.resolve(appFolder, 'rounds.html'));

// This is unsafe, we should expose a type-safe set of messages for communication. See 
// https://www.electronjs.org/docs/latest/tutorial/context-isolation/
// This uses a trick from https://github.com/electron/electron/issues/21437#issuecomment-880929111
contextBridge.exposeInMainWorld('ipcRenderer', {
    ...electron.ipcRenderer,
    on: (channel, listener) => {
        ipcRenderer.on(channel, listener);
        return () => {
            ipcRenderer.removeListener(channel, listener);
        };
    }
});

electron.ipcRenderer.on

// TODO: We should lock this down so we don't allow arbitrary read/writes
contextBridge.exposeInMainWorld('fs', { writeFileSync: fs.writeFileSync, readFileSync: fs.readFileSync, existsSync: fs.existsSync });

console.log('End of preload!');