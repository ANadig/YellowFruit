import { createRoot } from 'react-dom/client';
import App from './App';
import { IpcBidirectional } from '../IPCChannels';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once(IpcBidirectional.ipcExample, (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage(IpcBidirectional.ipcExample, ['ping']);
