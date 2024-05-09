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

export function handleWriteStatReports(event: IpcMainEvent, reports: StatReportHtmlPage[], filePathStart?: string) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  writeStatReportFile(reports, 0, window, filePathStart);
}

/** If externalFilePathStart not passed, write to the in-app location rather than exporting somewhere else */
function writeStatReportFile(
  reports: StatReportHtmlPage[],
  idx: number,
  window: BrowserWindow,
  externalFilePathStart?: string,
) {
  const page = reports[idx];
  if (!page) return;

  const pagePath = externalFilePathStart
    ? `${externalFilePathStart}_${page.fileName}`
    : path.resolve(inAppStatReportDirectory, page.fileName);
  fs.writeFile(pagePath, page.contents, { encoding: 'utf8' }, (err) => {
    if (err) {
      dialog.showMessageBoxSync(window, { message: `Error generating report: \n\n ${err.message}` });
      return;
    }
    if (idx < reports.length - 1) {
      writeStatReportFile(reports, idx + 1, window, externalFilePathStart);
    } else if (!externalFilePathStart) {
      window.webContents.send(IpcMainToRend.GeneratedInAppStatReport);
    }
  });
}

/** Take the special URL passed from the renderer process, and convert into the actual file name that we need to load */
export function parseStatReportPath(url: string) {
  let str = url.replace(`${statReportProtocol}://`, '');
  // Remove the #<anchor> at the end. Otherwise electron will attempt to load a file with that
  // exact name. Somehow, the iframe still magically scrolls to the anchor.
  str = str.replace(/#.*$/, '');

  // if it just ends with ".html/", we're good
  if (str.search(/\.html\/.+/) === -1) return str;

  // links in the iframe try to take you to, e.g. "standings.html/individuals.html" instead of
  // "individuals.html", so we need to remove the first page name before the slash
  return str.replace(/^.*\.html\//, '');
}

export function handleRequestToSaveHtmlReports(event: IpcMainEvent, curFileName?: string) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  promptForStatReportLocation(window, curFileName);
}

export function promptForStatReportLocation(window: BrowserWindow, curFileName?: string) {
  const fileName = dialog.showSaveDialogSync(window, {
    defaultPath: curFileName ? stripYftExtension(curFileName) : undefined,
    filters: [{ name: 'HTML Webpages', extensions: ['html'] }],
  });

  if (!fileName) return;

  let fileStart = fileName.replace(/.html/i, '');
  fileStart = fileStart.replace(/_(standings|individuals|games|teamdetail|playerdetail|rounds)/i, '');

  window.webContents.send(IpcMainToRend.RequestStatReport, fileStart);
}

function stripYftExtension(filename: string) {
  return filename.replace('.yft', '');
}
