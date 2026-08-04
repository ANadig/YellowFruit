import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { networkInterfaces } from 'os';
import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import Router, { IRouterHost } from './Router';
import SessionStore from './SessionStore';
import {
  IMatchSubmission,
  IServerStatus,
  ISessionSummary,
  ITournamentSnapshot,
  defaultServerPort,
  emptyTournamentSnapshot,
} from './ServerTypes';

/** Content types for the handful of file types the room bundle is made of */
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

export interface ITournamentServerOptions {
  /** Directory holding the built browser room bundle */
  roomBundleDirectory: string;
  /** Called when a room submits a final result that needs the statskeeper's decision */
  onFinalSubmission: (submission: IMatchSubmission) => void;
  /** Called when any session changes, so the desktop dashboard can refresh */
  onSessionsChanged?: (sessions: ISessionSummary[]) => void;
}

/**
 * The optional local HTTP server that serves the browser room application and accepts QBJ match
 * submissions from it.
 *
 * Runs in the Electron main process but imports nothing from Electron, so it can be exercised
 * directly in tests. It binds only when explicitly started, and never on its own.
 */
export default class TournamentServer {
  private server: Server | null = null;

  private port: number = defaultServerPort;

  private lastErrorMessage: string | undefined;

  private snapshot: ITournamentSnapshot = emptyTournamentSnapshot;

  readonly sessions = new SessionStore();

  private router: Router;

  private options: ITournamentServerOptions;

  constructor(options: ITournamentServerOptions) {
    this.options = options;

    const host: IRouterHost = {
      sessions: this.sessions,
      getSnapshot: () => this.snapshot,
      onFinalSubmission: (sessionId) => this.handleFinalSubmission(sessionId),
      onSnapshot: () => this.notifySessionsChanged(),
      serveStatic: (req, res, pathname) => this.serveStatic(req, res, pathname),
    };
    this.router = new Router(host);
  }

  /** Replace the read-only tournament projection served to rooms */
  setTournamentSnapshot(snapshot: ITournamentSnapshot) {
    this.snapshot = snapshot;
  }

  getTournamentSnapshot(): ITournamentSnapshot {
    return this.snapshot;
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  getPort(): number {
    return this.port;
  }

  /**
   * Start listening. Resolves with the resulting status either way; a failure to bind is reported
   * through `errorMessage` rather than thrown, because the desktop UI needs to show it.
   */
  start(port: number = defaultServerPort): Promise<IServerStatus> {
    if (this.isRunning()) return Promise.resolve(this.getStatus());

    this.port = port;
    this.lastErrorMessage = undefined;

    return new Promise((resolve) => {
      const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.router.handle(req, res);
      });

      // A tournament LAN is not hostile by design, but it isn't trusted either. Keep connections
      // short-lived and cap headers so a single client can't tie the server up.
      server.headersTimeout = 10000;
      server.requestTimeout = 30000;
      server.maxHeadersCount = 64;

      const onError = (err: Error & { code?: string }) => {
        this.lastErrorMessage =
          err.code === 'EADDRINUSE'
            ? `Port ${port} is already being used by another program. Try a different port.`
            : `Couldn't start the tournament server: ${err.message}`;
        this.server = null;
        server.removeAllListeners();
        server.close();
        resolve(this.getStatus());
      };

      server.once('error', onError);
      // Bind on all interfaces so Chromebooks on the LAN can reach it.
      server.listen(port, () => {
        server.removeListener('error', onError);
        // Once listening, later errors shouldn't take the process down.
        server.on('error', (err) => {
          this.lastErrorMessage = err.message;
        });
        this.server = server;
        resolve(this.getStatus());
      });
    });
  }

  /** Stop listening. Existing sessions are discarded, since they only mean anything while up. */
  stop(): Promise<IServerStatus> {
    const { server } = this;
    if (!server) return Promise.resolve(this.getStatus());

    this.server = null;
    return new Promise((resolve) => {
      server.close(() => {
        this.sessions.clear();
        resolve(this.getStatus());
      });
      // Don't wait on keep-alive connections from rooms that have gone away.
      server.closeAllConnections?.();
    });
  }

  getStatus(): IServerStatus {
    return {
      running: this.isRunning(),
      port: this.port,
      addresses: this.isRunning() ? TournamentServer.getLanAddresses(this.port) : [],
      errorMessage: this.lastErrorMessage,
    };
  }

  getSessionSummaries(): ISessionSummary[] {
    return this.sessions.summarize();
  }

  /**
   * Every usable LAN URL for this machine.
   *
   * The first network interface is often not the right one (VPNs, Docker bridges, virtual adapters),
   * so list them all and let the person running the tournament pick the one their Chromebooks can
   * see. Loopback and link-local addresses are excluded because no other device can reach them.
   */
  static getLanAddresses(port: number): string[] {
    const addresses: string[] = [];
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] ?? []) {
        // Node <18 reports family as a string, newer versions as a number.
        const isIpv4 = iface.family === 'IPv4' || (iface.family as unknown as number) === 4;
        if (!isIpv4 || iface.internal) continue;
        if (iface.address.startsWith('169.254.')) continue; // link-local, not routable
        addresses.push(`http://${iface.address}:${port}`);
      }
    }
    return addresses;
  }

  /** Mark a session accepted, after the statskeeper approved the match in the Match Inbox */
  acceptSession(sessionId: string) {
    this.sessions.markAccepted(sessionId);
    this.notifySessionsChanged();
  }

  /** Mark a session rejected */
  rejectSession(sessionId: string, reason?: string) {
    this.sessions.markRejected(sessionId, reason);
    this.notifySessionsChanged();
  }

  private notifySessionsChanged() {
    this.options.onSessionsChanged?.(this.getSessionSummaries());
  }

  /** Hand a brand-new final submission to the host so it can reach the renderer for validation */
  private handleFinalSubmission(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.latestQbj) return;

    const submission: IMatchSubmission = {
      sessionId: session.id,
      roundNumber: session.roundNumber,
      leftTeam: session.leftTeam,
      rightTeam: session.rightTeam,
      qbj: session.latestQbj,
      submittedAt: session.lastSeenAt,
    };
    this.options.onFinalSubmission(submission);
    this.notifySessionsChanged();
  }

  /**
   * Serve the browser room application.
   *
   * Paths from the client are never trusted: the resolved path must stay inside the bundle
   * directory, and anything that isn't a real file there falls back to index.html so the room app
   * can handle its own routing. Nothing outside the bundle directory is reachable.
   */
  private serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
    const method = req.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    const root = this.options.roomBundleDirectory;
    const indexPath = path.join(root, 'index.html');

    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    // path.resolve collapses any ".." the client sent; the containment check below is what makes
    // that safe rather than the normalization itself.
    const candidate = path.resolve(root, relative);
    const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

    let fileToServe = indexPath;
    if (candidate === root || candidate.startsWith(rootWithSep)) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        fileToServe = candidate;
      }
    }

    if (!existsSync(fileToServe)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        'The room application has not been built. Run "npm run build:room" (or "npm run build") and restart the server.',
      );
      return;
    }

    const extension = path.extname(fileToServe).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = createReadStream(fileToServe);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  }
}
