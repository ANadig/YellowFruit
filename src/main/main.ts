/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, protocol, net, dialog } from 'electron';
import { pathToFileURL } from 'url';
import { IpcMainEvent } from 'electron/main';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  handleSaveFile,
  handleWriteStatReports,
  handleSetWindowTitle,
  inAppStatReportDirectory,
  parseStatReportPath,
  handleRequestToSaveHtmlReports,
  handleContinueAction,
  tryFileSwitchAction,
  appAllowedToQuit,
  handleSaveBackup,
  generateBackup,
  handleLoadBackup,
  handleExportQbjFile,
  createDirectories,
} from './FileUtils';
import { IpcBidirectional, IpcRendToMain } from '../IPCChannels';
import { FileSwitchActions, statReportProtocol } from '../SharedUtils';

protocol.registerSchemesAsPrivileged([
  {
    scheme: statReportProtocol,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

let mainWindow: BrowserWindow | null = null;

ipcMain.on(IpcBidirectional.ipcExample, async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply(IpcBidirectional.ipcExample, msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const autoSaveIntervalMS = 120000; // 2 minutes

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e) => {
    if (!mainWindow) return; // just making typescript happy
    if (!appAllowedToQuit()) {
      e.preventDefault();
      tryFileSwitchAction(mainWindow, FileSwitchActions.CloseApp);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createDirectories();
    createWindow();
    ipcMain.on(IpcRendToMain.saveFile, handleSaveFile);
    ipcMain.on(IpcRendToMain.setWindowTitle, handleSetWindowTitle);
    ipcMain.on(IpcRendToMain.StatReportSaveDialog, handleRequestToSaveHtmlReports);
    ipcMain.on(IpcRendToMain.WriteStatReports, handleWriteStatReports);
    ipcMain.on(IpcRendToMain.ContinueWithAction, handleContinueAction);
    ipcMain.on(IpcRendToMain.SaveBackup, handleSaveBackup);
    ipcMain.on(IpcRendToMain.WebPageCrashed, handleRendererCrashed);
    ipcMain.on(IpcBidirectional.ExportQbjFile, handleExportQbjFile);
    ipcMain.once(IpcBidirectional.LoadBackup, handleLoadBackup);
    ipcMain.once(IpcRendToMain.StartAutosave, () => {
      setInterval(() => generateBackup(mainWindow), autoSaveIntervalMS);
    });
    ipcMain.on(IpcBidirectional.GetAppVersion, (event) =>
      event.reply(IpcBidirectional.GetAppVersion, app.getVersion()),
    );

    protocol.handle(statReportProtocol, (request) => {
      const url = pathToFileURL(path.resolve(inAppStatReportDirectory, parseStatReportPath(request.url)));
      return net.fetch(url.href);
    });

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

function handleRendererCrashed(event: IpcMainEvent) {
  if (isDebug) return;

  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  dialog.showMessageBoxSync(window, {
    title: 'YellowFruit',
    message: 'YellowFruit has encountered an unexpected error. Click OK to relaunch the application.',
    buttons: ['OK'],
  });

  forceRelaunch();
}

function forceRelaunch() {
  app.relaunch();
  app.exit();
}
