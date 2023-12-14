// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import IpcChannels, { rendererListenableEvents } from '../IPCChannels';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: IpcChannels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: IpcChannels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: IpcChannels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    removeAllListeners() {
      for (const c of rendererListenableEvents) {
        ipcRenderer.removeAllListeners(c);
      }
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
