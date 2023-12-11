import { BrowserWindow, dialog } from 'electron';
import IpcChannels from '../IPCChannels';

export function openYftFile(mainWindow: BrowserWindow) {
  const fileNameAry = dialog.showOpenDialogSync(mainWindow, {
    filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }],
  });
  if (fileNameAry) {
    mainWindow.webContents.send(IpcChannels.openYftFile, fileNameAry[0]);
  }
}

export function saveYftFile() {}
