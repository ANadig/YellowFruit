// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain, rendererListenableEvents } from '../IPCChannels';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: IpcRendToMain | IpcBidirectional, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: IpcMainToRend | IpcBidirectional, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    invoke: (channel: IpcBidirectional, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    once(channel: IpcMainToRend | IpcBidirectional, func: (...args: unknown[]) => void) {
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
