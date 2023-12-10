import { BrowserWindow, dialog } from 'electron';

export function openYftFile(mainWindow: BrowserWindow) {
  const fileNameAry = dialog.showOpenDialogSync(mainWindow, {
    filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }],
  });
  if (fileNameAry) {
    dialog.showMessageBoxSync(mainWindow, { message: fileNameAry[0] });
  }
}

export function saveYftFile() {}
