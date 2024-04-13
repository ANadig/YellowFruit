import path from 'path';
import { app, BrowserWindow, IpcMainEvent, dialog } from 'electron';
import fs from 'fs';
import { IpcMainToRend } from '../IPCChannels';
import { StatReportHtmlPage, statReportProtocol } from '../SharedUtils';

export function newYftFile(mainWindow: BrowserWindow) {
  mainWindow.webContents.send(IpcMainToRend.newTournament);
}

export function openYftFile(mainWindow: BrowserWindow) {
  const fileNameAry = dialog.showOpenDialogSync(mainWindow, {
    filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }],
  });
  if (!fileNameAry) return;

  fs.readFile(fileNameAry[0], { encoding: 'utf8' }, (err, fileContents) => {
    if (err) {
      dialog.showMessageBoxSync(mainWindow, { message: `Error reading file: \n\n ${err.message}` });
      return;
    }
    mainWindow.webContents.send(IpcMainToRend.openYftFile, fileNameAry[0], fileContents);
  });
}

export function requestToSaveYftFile(mainWindow: BrowserWindow) {
  mainWindow.webContents.send(IpcMainToRend.saveCurrentTournament);
}

export function yftSaveAs(mainWindow: BrowserWindow) {
  const fileName = dialog.showSaveDialogSync(mainWindow, {
    filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }],
  });

  if (!fileName) return;

  mainWindow.webContents.send(IpcMainToRend.saveAsCommand, fileName);
}

// Handlers for renderer-->main

export function handleSaveAsRequest(event: IpcMainEvent) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  yftSaveAs(window);
}

export function handleSaveFile(event: IpcMainEvent, filePath: string, fileContents: string) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  fs.writeFile(filePath, fileContents, { encoding: 'utf8' }, (err) => {
    if (err) {
      dialog.showMessageBoxSync(window, { message: `Error saving file: \n\n ${err.message}` });
      return;
    }
    window.webContents.send(IpcMainToRend.tournamentSavedSuccessfully);
  });
}

export function handleSetWindowTitle(event: IpcMainEvent, title: string) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  window?.setTitle(`YellowFruit - ${title}`);
}

export const inAppStatReportDirectory = path.resolve(app.getPath('userData'), 'StatReport');

export function handleShowInAppStatReport(event: IpcMainEvent, reports: StatReportHtmlPage[]) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  writeInAppStatReportFile(reports, 0, window);
}

function writeInAppStatReportFile(reports: StatReportHtmlPage[], idx: number, window: BrowserWindow) {
  const page = reports[idx];
  if (!page) return;

  const pagePath = path.resolve(inAppStatReportDirectory, page.fileName);
  fs.writeFile(pagePath, page.contents, { encoding: 'utf8' }, (err) => {
    if (err) {
      dialog.showMessageBoxSync(window, { message: `Error generating report: \n\n ${err.message}` });
      return;
    }
    if (idx < reports.length - 1) {
      writeInAppStatReportFile(reports, idx + 1, window);
    } else {
      window.webContents.send(IpcMainToRend.GeneratedInAppStatReport);
    }
  });
}

export function parseStatReportPath(url: string) {
  const str = url.replace(`${statReportProtocol}://`, '');

  if (str.search(/\.html\/.+/) === -1) return str;
  // links in the iframe try to take you to, e.g. "standings.html/individuals.html" instead of
  // "individuals.html", so we need to remove the first page name before the slash
  return str.replace(/^.*\.html\//, '');
}
