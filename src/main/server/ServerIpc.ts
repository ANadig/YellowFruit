/**
 * Bridges the local tournament server to the YellowFruit renderer.
 *
 * This is the only file in src/main/server that imports Electron, which keeps TournamentServer
 * itself a plain Node HTTP server that tests can drive directly. Nothing here widens the preload
 * bridge: it registers handlers on the existing enumerated IPC channels, and the renderer still
 * talks through contextBridge as it always has.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { IpcMainEvent, IpcMainInvokeEvent } from 'electron/main';
import TournamentServer from './TournamentServer';
import {
  IMatchSubmission,
  IServerStatus,
  ISessionSummary,
  ISubmissionVerdict,
  ITournamentSnapshot,
  defaultServerPort,
} from './ServerTypes';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain } from '../../IPCChannels';

let server: TournamentServer | null = null;
let ownerWindow: BrowserWindow | null = null;

/** Where the built browser room bundle lives */
function roomBundleDirectory(): string {
  // Packaged: dist/main/main.js -> dist/room. Dev: .erb/dll/main.bundle.dev.js -> release/app/dist/room.
  if (app.isPackaged) return path.join(__dirname, '../room');
  return path.resolve(__dirname, '../../release/app/dist/room');
}

function sendToRenderer(channel: IpcMainToRend, payload: unknown) {
  if (!ownerWindow || ownerWindow.isDestroyed()) return;
  ownerWindow.webContents.send(channel, payload);
}

function handleFinalSubmission(submission: IMatchSubmission) {
  // The renderer validates it through MatchImportService and shows it in the Match Inbox. Nothing
  // is ever added to the tournament without the statskeeper explicitly accepting it.
  sendToRenderer(IpcMainToRend.TournamentServerMatchSubmitted, submission);
}

function handleSessionsChanged(sessions: ISessionSummary[]) {
  sendToRenderer(IpcMainToRend.TournamentServerSessionsChanged, sessions);
}

function handleSessionStarted(sessionId: string, scheduledMatchId: string) {
  sendToRenderer(IpcMainToRend.TournamentServerSessionStarted, { sessionId, scheduledMatchId });
}

function getServer(): TournamentServer {
  if (!server) {
    server = new TournamentServer({
      roomBundleDirectory: roomBundleDirectory(),
      onFinalSubmission: handleFinalSubmission,
      onSessionsChanged: handleSessionsChanged,
      onSessionStarted: handleSessionStarted,
    });
  }
  return server;
}

function offlineStatus(): IServerStatus {
  return { running: false, port: defaultServerPort, addresses: [] };
}

/**
 * Register the tournament server's IPC handlers. The server itself is not started here: it binds
 * only when the user asks it to from the Rooms page.
 */
export default function registerTournamentServerIpc(getWindow: () => BrowserWindow | null) {
  ownerWindow = getWindow();

  ipcMain.handle(IpcBidirectional.TournamentServerStart, async (_event: IpcMainInvokeEvent, port?: number) => {
    ownerWindow = getWindow();
    const requestedPort = typeof port === 'number' && port > 0 && port < 65536 ? port : defaultServerPort;
    const status = await getServer().start(requestedPort);
    sendToRenderer(IpcMainToRend.TournamentServerStatusChanged, status);
    return status;
  });

  ipcMain.handle(IpcBidirectional.TournamentServerStop, async () => {
    if (!server) return offlineStatus();
    const status = await server.stop();
    sendToRenderer(IpcMainToRend.TournamentServerStatusChanged, status);
    return status;
  });

  ipcMain.handle(IpcBidirectional.TournamentServerGetStatus, () => (server ? server.getStatus() : offlineStatus()));

  ipcMain.handle(IpcBidirectional.TournamentServerGetSessions, () => (server ? server.getSessionSummaries() : []));

  ipcMain.on(IpcRendToMain.TournamentServerSetSnapshot, (_event: IpcMainEvent, snapshot: ITournamentSnapshot) => {
    // Only ever stored and served verbatim; the main process doesn't interpret the tournament.
    getServer().setTournamentSnapshot(snapshot);
  });

  ipcMain.on(IpcRendToMain.TournamentServerSubmissionVerdict, (_event: IpcMainEvent, verdict: ISubmissionVerdict) => {
    if (!server || !verdict?.sessionId) return;
    if (verdict.accepted) server.acceptSession(verdict.sessionId);
    else server.rejectSession(verdict.sessionId, verdict.reason);
  });
}

/** Shut the server down when the app is closing, so the port is released */
export async function shutDownTournamentServer() {
  if (!server) return;
  await server.stop();
  server = null;
}
