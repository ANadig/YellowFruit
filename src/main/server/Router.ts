import { IncomingMessage, ServerResponse } from 'http';
import SessionStore, { SessionWriteError, SessionWriteResult } from './SessionStore';
import normalizeQbjMatch from '../../renderer/Services/QbjMatchNormalizer';
import { authorizeRoom, buildAssignmentResponse, checkCanStart, findAssignmentForRoom } from './RoomDirectory';
import {
  ICreateSessionRequest,
  ISessionCreatedResponse,
  ITournamentSnapshot,
  apiPrefix,
  maxRequestBodyBytes,
  roomTokenHeader,
  sessionTokenHeader,
} from './ServerTypes';

/** A parsed request body, or the reason it was refused */
type BodyResult = { ok: true; body: unknown } | { ok: false; status: number; message: string };

/** What the router needs from its host in order to do its job */
export interface IRouterHost {
  sessions: SessionStore;
  /** The read-only tournament projection to serve to rooms */
  getSnapshot: () => ITournamentSnapshot;
  /**
   * Called when a room submits a final result that the server hasn't seen before. The host hands
   * it to the YellowFruit renderer for validation. Never called for live snapshots.
   */
  onFinalSubmission: (sessionId: string) => void;
  /** Called whenever a live snapshot arrives, so the desktop dashboard can refresh */
  onSnapshot?: (sessionId: string) => void;
  /**
   * Called when a room starts its assigned game, so the desktop can move the scheduled match to
   * playing. Not called when an existing session is resumed.
   */
  onSessionStarted?: (sessionId: string) => void;
  /** Serve the browser room application for non-API routes */
  serveStatic: (req: IncomingMessage, res: ServerResponse, pathname: string) => void;
}

/** Longest URL we'll even look at, to avoid pathological parsing */
const maxUrlLength = 2048;

/**
 * Read and JSON-parse a request body, enforcing a size cap and requiring a JSON content type.
 *
 * The cap is enforced while streaming rather than after the fact, so an oversized upload is
 * destroyed instead of being buffered.
 */
export function readJsonBody(req: IncomingMessage): Promise<BodyResult> {
  return new Promise((resolve) => {
    const contentType = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      resolve({ ok: false, status: 415, message: 'Request body must be application/json.' });
      req.resume(); // drain so the connection can be reused
      return;
    }

    const declaredLength = Number(req.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > maxRequestBodyBytes) {
      resolve({ ok: false, status: 413, message: 'Request body is too large.' });
      req.destroy();
      return;
    }

    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;

    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      received += chunk.length;
      if (received > maxRequestBodyBytes) {
        settled = true;
        resolve({ ok: false, status: 413, message: 'Request body is too large.' });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const text = Buffer.concat(chunks).toString('utf8');
      try {
        resolve({ ok: true, body: JSON.parse(text) });
      } catch (err: any) {
        resolve({ ok: false, status: 400, message: 'Request body is not valid JSON.' });
      }
    });

    req.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, status: 400, message: 'Failed to read the request body.' });
    });
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    // Room clients poll for their own session state; never let a proxy or browser cache it.
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function sendError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

/** Map a session write failure onto an HTTP response */
function sendSessionWriteError(res: ServerResponse, result: { error: SessionWriteError }) {
  switch (result.error) {
    case SessionWriteError.NotFound:
      sendError(res, 404, 'No such session.');
      break;
    case SessionWriteError.BadToken:
      // Deliberately the same shape as NotFound would be, so a client can't probe for valid ids.
      sendError(res, 403, 'Not authorized for this session.');
      break;
    case SessionWriteError.AlreadyResolved:
      sendError(res, 409, 'This game has already been resolved by tournament control.');
      break;
    case SessionWriteError.TeamMismatch:
      sendError(
        res,
        409,
        'The teams in this game are not the teams this room was assigned. Check with tournament control before submitting.',
      );
      break;
    default:
      sendError(res, 400, 'Session could not be updated.');
  }
}

/** Pull a token out of the request headers */
function headerToken(req: IncomingMessage, header: string): string | undefined {
  const raw = req.headers[header];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

/** Pull the session token out of the request headers */
function tokenFrom(req: IncomingMessage): string | undefined {
  return headerToken(req, sessionTokenHeader);
}

/** Validate a create-session request body against the tournament we're actually running */
function validateCreateRequest(
  body: unknown,
  snapshot: ITournamentSnapshot,
): { ok: true; request: ICreateSessionRequest } | { ok: false; message: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, message: 'Expected a JSON object.' };

  const { roundNumber, leftTeam, rightTeam } = body as Record<string, unknown>;

  if (typeof roundNumber !== 'number' || !Number.isFinite(roundNumber)) {
    return { ok: false, message: 'roundNumber must be a number.' };
  }
  if (typeof leftTeam !== 'string' || typeof rightTeam !== 'string') {
    return { ok: false, message: 'leftTeam and rightTeam must be strings.' };
  }
  if (!snapshot.rounds.some((r) => r.number === roundNumber)) {
    return { ok: false, message: 'That round is not part of this tournament.' };
  }
  // Only teams that exist in the currently open tournament are allowed.
  const knownTeam = (name: string) => snapshot.teams.some((t) => t.name === name);
  if (!knownTeam(leftTeam) || !knownTeam(rightTeam)) {
    return { ok: false, message: 'Both teams must be teams in this tournament.' };
  }
  if (leftTeam === rightTeam) {
    return { ok: false, message: 'A team cannot play itself.' };
  }
  if (snapshot.gameFormat === null) {
    return { ok: false, message: "This tournament's scoring rules cannot be used for room scorekeeping." };
  }

  return { ok: true, request: { roundNumber, leftTeam, rightTeam } };
}

/** A QBJ Match body is only accepted if it at least looks like one */
function looksLikeQbjMatch(body: unknown): body is object {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
  const candidate = body as Record<string, unknown>;
  // MODAQ always emits match_teams; snake_case is the QBJ wire format.
  return Array.isArray(candidate.match_teams);
}

/**
 * Routes HTTP requests for the local tournament server.
 *
 * Only the endpoints a room scorekeeper needs exist. There are no admin mutation endpoints: a room
 * client cannot change the tournament, accept its own match, or read another room's session.
 */
export default class Router {
  private host: IRouterHost;

  constructor(host: IRouterHost) {
    this.host = host;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.route(req, res);
    } catch (err: any) {
      if (!res.headersSent) sendError(res, 500, 'The tournament server hit an unexpected error.');
      else res.end();
    }
  }

  private async route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const rawUrl = req.url ?? '/';
    if (rawUrl.length > maxUrlLength) {
      sendError(res, 414, 'Request URL is too long.');
      return;
    }

    let pathname: string;
    try {
      // The base is only needed to parse a relative URL; it's never used to make a request.
      pathname = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
    } catch (err: any) {
      sendError(res, 400, 'Malformed request URL.');
      return;
    }

    const method = req.method ?? 'GET';

    if (!pathname.startsWith(apiPrefix)) {
      // Anything that isn't the API is the browser room application.
      this.host.serveStatic(req, res, pathname);
      return;
    }

    const route = pathname.slice(apiPrefix.length);
    const segments = route.split('/').filter((s) => s !== '');

    // GET /api/v1/status
    if (segments.length === 1 && segments[0] === 'status') {
      this.requireMethod(req, res, 'GET', () => sendJson(res, 200, { status: 'ok' }));
      return;
    }

    // GET /api/v1/tournament
    if (segments.length === 1 && segments[0] === 'tournament') {
      this.requireMethod(req, res, 'GET', () => {
        const snapshot = this.host.getSnapshot();
        sendJson(res, 200, {
          name: snapshot.name,
          gameFormat: snapshot.gameFormat,
          gameFormatErrors: snapshot.gameFormatErrors,
          gameFormatWarnings: snapshot.gameFormatWarnings,
          timedRounds: snapshot.timedRounds,
          roundCount: snapshot.rounds.length,
          teamCount: snapshot.teams.length,
        });
      });
      return;
    }

    // GET /api/v1/rounds
    if (segments.length === 1 && segments[0] === 'rounds') {
      this.requireMethod(req, res, 'GET', () => sendJson(res, 200, { rounds: this.host.getSnapshot().rounds }));
      return;
    }

    // GET /api/v1/teams
    if (segments.length === 1 && segments[0] === 'teams') {
      this.requireMethod(req, res, 'GET', () => sendJson(res, 200, { teams: this.host.getSnapshot().teams }));
      return;
    }

    if (segments[0] === 'rooms' && segments.length >= 2) {
      const roomId = segments[1];

      // GET /api/v1/rooms/:roomId/assignment
      if (segments.length === 3 && segments[2] === 'assignment') {
        if (method !== 'GET') {
          sendError(res, 405, `${method} is not allowed for this endpoint.`);
          return;
        }
        this.getRoomAssignment(req, res, roomId);
        return;
      }

      // POST /api/v1/rooms/:roomId/sessions
      if (segments.length === 3 && segments[2] === 'sessions') {
        if (method !== 'POST') {
          sendError(res, 405, `${method} is not allowed for this endpoint.`);
          return;
        }
        await this.startAssignedMatch(req, res, roomId);
        return;
      }
    }

    // POST /api/v1/sessions
    if (segments.length === 1 && segments[0] === 'sessions') {
      if (method !== 'POST') {
        sendError(res, 405, `${method} is not allowed for this endpoint.`);
        return;
      }
      await this.createSession(req, res);
      return;
    }

    if (segments[0] === 'sessions' && segments.length >= 2) {
      const sessionId = segments[1];

      // GET /api/v1/sessions/:sessionId
      if (segments.length === 2) {
        if (method !== 'GET') {
          sendError(res, 405, `${method} is not allowed for this endpoint.`);
          return;
        }
        const result = this.host.sessions.read(sessionId, tokenFrom(req));
        if (!result.ok) {
          sendSessionWriteError(res, result);
          return;
        }
        sendJson(res, 200, SessionStore.toStateResponse(result.session));
        return;
      }

      // PUT /api/v1/sessions/:sessionId/snapshot
      if (segments.length === 3 && segments[2] === 'snapshot') {
        if (method !== 'PUT') {
          sendError(res, 405, `${method} is not allowed for this endpoint.`);
          return;
        }
        await this.writeSession(req, res, sessionId, 'snapshot');
        return;
      }

      // POST /api/v1/sessions/:sessionId/final
      if (segments.length === 3 && segments[2] === 'final') {
        if (method !== 'POST') {
          sendError(res, 405, `${method} is not allowed for this endpoint.`);
          return;
        }
        await this.writeSession(req, res, sessionId, 'final');
        return;
      }
    }

    sendError(res, 404, 'No such endpoint.');
  }

  // eslint-disable-next-line class-methods-use-this
  private requireMethod(req: IncomingMessage, res: ServerResponse, expected: string, handler: () => void) {
    const method = req.method ?? 'GET';
    if (method !== expected && !(expected === 'GET' && method === 'HEAD')) {
      sendError(res, 405, `${method} is not allowed for this endpoint.`);
      return;
    }
    handler();
  }

  /**
   * Identify the calling room, or send the refusal.
   *
   * An unknown room and a bad token get the same 403, so a caller with no valid token can't use the
   * difference to work out which room ids exist.
   */
  private authorizeRoomOrRefuse(req: IncomingMessage, res: ServerResponse, roomId: string) {
    const result = authorizeRoom(this.host.getSnapshot(), roomId, headerToken(req, roomTokenHeader));
    if (!result.ok) {
      sendError(res, 403, 'This room link is not valid for the tournament that is currently open.');
      return null;
    }
    return result.room;
  }

  /**
   * What this room should be playing.
   *
   * The endpoint a Chromebook polls all day. It answers in one round trip so a room coming back from
   * a network drop recovers immediately, and it includes the token of any session already open for
   * the current game so a reload resumes rather than starting a second session.
   */
  private getRoomAssignment(req: IncomingMessage, res: ServerResponse, roomId: string) {
    const room = this.authorizeRoomOrRefuse(req, res, roomId);
    if (!room) return;

    const snapshot = this.host.getSnapshot();
    const response = buildAssignmentResponse(snapshot, room);

    const scheduledMatchId = response.current?.scheduledMatchId;
    const existing = scheduledMatchId ? this.host.sessions.findResumableForScheduledMatch(scheduledMatchId) : undefined;

    sendJson(res, 200, {
      ...response,
      session: existing ? SessionStore.toResumeInfo(existing) : null,
    });
  }

  /**
   * Start the game this room is assigned.
   *
   * Everything that ends up recorded — the round and both teams — comes from the tournament
   * snapshot, not the request. The room only says which assignment it believes it is starting, and
   * that is checked against what the room is actually assigned, so a stale page cannot start a game
   * that has moved or been finished.
   */
  private async startAssignedMatch(req: IncomingMessage, res: ServerResponse, roomId: string) {
    const room = this.authorizeRoomOrRefuse(req, res, roomId);
    if (!room) {
      req.resume();
      return;
    }

    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) {
      sendError(res, bodyResult.status, bodyResult.message);
      return;
    }

    const scheduledMatchId = (bodyResult.body as Record<string, unknown>)?.scheduledMatchId;
    if (typeof scheduledMatchId !== 'string' || scheduledMatchId === '') {
      sendError(res, 400, 'scheduledMatchId must be a string.');
      return;
    }

    const snapshot = this.host.getSnapshot();
    const assignment = findAssignmentForRoom(snapshot, roomId, scheduledMatchId);
    if (!assignment) {
      sendError(res, 409, 'That game is not assigned to this room any more. This page will refresh itself.');
      return;
    }

    const block = checkCanStart(snapshot, room, assignment);
    if (block) {
      sendJson(res, 409, { error: block.message, blockedReason: block.reason });
      return;
    }

    // A reload, or a second tab, must not produce a second session for the same game.
    const existing = this.host.sessions.findResumableForScheduledMatch(scheduledMatchId);
    const session =
      existing ??
      this.host.sessions.create(assignment.roundNumber, assignment.leftTeam, assignment.rightTeam, {
        roomId,
        scheduledMatchId,
      });

    const payload: ISessionCreatedResponse = {
      sessionId: session.id,
      token: session.token,
      roundNumber: session.roundNumber,
      leftTeam: session.leftTeam,
      rightTeam: session.rightTeam,
      status: session.status,
    };
    // 200 rather than 201 when resuming, so the client can tell it didn't create anything.
    sendJson(res, existing ? 200 : 201, payload);
    if (!existing) this.host.onSessionStarted?.(session.id);
  }

  /**
   * Correct the question counts on an incoming QBJ match against the format we're running.
   *
   * With no usable game format there's nothing to correct against, so the payload is stored as sent
   * rather than guessed at.
   */
  private normalizeSubmission(qbj: object): object {
    const { gameFormat, timedRounds } = this.host.getSnapshot();
    if (!gameFormat) return qbj;
    return normalizeQbjMatch(qbj, {
      regulationTossupCount: gameFormat.regulationTossupCount,
      minimumOvertimeQuestionCount: gameFormat.minimumOvertimeQuestionCount,
      gameMayEndEarly: timedRounds,
    }).qbj;
  }

  private async createSession(req: IncomingMessage, res: ServerResponse) {
    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) {
      sendError(res, bodyResult.status, bodyResult.message);
      return;
    }

    const snapshot = this.host.getSnapshot();
    const validated = validateCreateRequest(bodyResult.body, snapshot);
    if (!validated.ok) {
      sendError(res, 400, validated.message);
      return;
    }

    const { roundNumber, leftTeam, rightTeam } = validated.request;
    const session = this.host.sessions.create(roundNumber, leftTeam, rightTeam);
    const payload: ISessionCreatedResponse = {
      sessionId: session.id,
      token: session.token,
      roundNumber: session.roundNumber,
      leftTeam: session.leftTeam,
      rightTeam: session.rightTeam,
      status: session.status,
    };
    sendJson(res, 201, payload);
  }

  private async writeSession(req: IncomingMessage, res: ServerResponse, sessionId: string, kind: 'snapshot' | 'final') {
    // Check authorization before reading the body, so an unauthorized client can't make us buffer
    // its upload.
    const token = tokenFrom(req);
    const preflight = this.host.sessions.read(sessionId, token);
    if (!preflight.ok) {
      sendSessionWriteError(res, preflight);
      req.resume();
      return;
    }

    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) {
      sendError(res, bodyResult.status, bodyResult.message);
      return;
    }

    if (!looksLikeQbjMatch(bodyResult.body)) {
      sendError(res, 400, 'Request body must be a QBJ Match object with a match_teams array.');
      return;
    }

    // The room client corrects MODAQ's scaffold-inflated question counts before it uploads, but do
    // it again here so a stale or cached room bundle can't put bad counts into the tournament. The
    // correction is idempotent, so re-running it on an already-corrected match changes nothing.
    const qbj = this.normalizeSubmission(bodyResult.body);

    let result: SessionWriteResult;
    if (kind === 'snapshot') {
      result = this.host.sessions.updateSnapshot(sessionId, token, qbj);
    } else {
      result = this.host.sessions.submitFinal(sessionId, token, qbj);
    }

    if (!result.ok) {
      sendSessionWriteError(res, result);
      return;
    }

    if (kind === 'snapshot') {
      this.host.onSnapshot?.(sessionId);
    } else if (result.isNew) {
      // Only a genuinely new final gets handed to the statskeeper. A retry of the same submission
      // is acknowledged without creating a second candidate match.
      this.host.onFinalSubmission(sessionId);
    }

    sendJson(res, 200, {
      ...SessionStore.toStateResponse(result.session),
      /** False when this final had already been recorded; the room can stop retrying either way. */
      newSubmission: result.isNew,
    });
  }
}
