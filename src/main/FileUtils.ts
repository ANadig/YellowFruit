import { BrowserWindow, IpcMainEvent, dialog } from 'electron';
import fs from 'fs';
import { IpcMainToRend } from '../IPCChannels';

export function openYftFile(mainWindow: BrowserWindow) {
  const fileNameAry = dialog.showOpenDialogSync(mainWindow, {
    filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }],
  });
  if (!fileNameAry) return;

  fs.readFile(fileNameAry[0], { encoding: 'utf8' }, (err, data) => {
    if (err) {
      dialog.showMessageBoxSync(mainWindow, { message: `Error reading file: \n\n ${err.message}` });
      return;
    }
    mainWindow.webContents.send(IpcMainToRend.openYftFile, fileNameAry[0], data);
  });
}

export function requestToSaveYftFile(mainWindow: BrowserWindow) {
  mainWindow.webContents.send(IpcMainToRend.saveCurrentTournament);
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
