/**
 * Entry point for the browser room application.
 *
 * This bundle is completely separate from YellowFruit's Electron renderer. It runs in an ordinary
 * browser on a scorekeeper's machine, has no access to Electron APIs, and talks to YellowFruit only
 * over the local HTTP API.
 */
import { createRoot } from 'react-dom/client';
import RoomApp from './RoomApp';
import './room.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<RoomApp />);
}
