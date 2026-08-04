/**
 * HTTP client for the room application.
 *
 * Every call is written on the assumption that the network can disappear mid-tournament. Nothing
 * here throws in a way that could take the scorekeeping UI down: callers get a result object and
 * decide what to show. A failed upload never discards local state.
 */
import {
  ICreateSessionRequest,
  IRoomAssignmentResponse,
  IRoomRound,
  IRoomTeam,
  ISessionCreatedResponse,
  ISessionStateResponse,
  apiPrefix,
  roomTokenHeader,
  sessionTokenHeader,
} from '../main/server/ServerTypes';
import { IModaqGameFormat } from '../renderer/Services/YellowFruitScoringRulesToModaq';

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: string; status?: number };

/** Tournament information the room needs before it can start a game */
export interface ITournamentInfo {
  name: string;
  gameFormat: IModaqGameFormat | null;
  gameFormatErrors: string[];
  gameFormatWarnings: string[];
  /** Timed rounds can end before every regulation tossup is read */
  timedRounds: boolean;
  roundCount: number;
  teamCount: number;
}

/** Credentials the room holds for the game it's currently scoring */
export interface ISessionCredentials {
  sessionId: string;
  token: string;
}

/** Which room this page is, read from its permanent URL */
export interface IRoomIdentity {
  roomId: string;
  token: string;
}

/**
 * Work out which room this page is from its own URL.
 *
 * The permanent room URL is `/room/<roomId>?token=<token>`, which is what the QR code encodes and
 * what the Chromebook stays on all day. A page opened without one falls back to the manual
 * team-picking workflow, which is still how a tournament that hasn't configured rooms works.
 */
export function readRoomIdentity(location: { pathname: string; search: string }): IRoomIdentity | null {
  const match = /^\/room\/([^/]+)\/?$/.exec(location.pathname);
  if (!match) return null;
  const token = new URLSearchParams(location.search).get('token');
  if (!token) return null;
  return { roomId: decodeURIComponent(match[1]), token };
}

/** How long to wait on a request before treating the server as unreachable */
const requestTimeoutMs = 8000;

/** The subset of fetch options the room app actually uses */
interface IRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

async function request<T>(path: string, init: IRequestOptions = {}): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(path, { ...init, signal: controller.signal });
    const text = await response.text();
    let payload: any = null;
    if (text !== '') {
      try {
        payload = JSON.parse(text);
      } catch (err: any) {
        return { ok: false, error: 'The server sent a response the room app could not read.' };
      }
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.error ?? `The server refused the request (${response.status}).`,
      };
    }
    return { ok: true, value: payload as T };
  } catch (err: any) {
    // Aborts and network failures both land here. Either way, YellowFruit is unreachable.
    return { ok: false, error: 'Could not reach the YellowFruit computer.' };
  } finally {
    clearTimeout(timeout);
  }
}

function jsonHeaders(credentials?: ISessionCredentials): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (credentials) headers[sessionTokenHeader] = credentials.token;
  return headers;
}

/** Is the YellowFruit server reachable right now? */
export function getStatus(): Promise<ApiResult<{ status: string }>> {
  return request(`${apiPrefix}/status`);
}

export function getTournament(): Promise<ApiResult<ITournamentInfo>> {
  return request(`${apiPrefix}/tournament`);
}

export function getRounds(): Promise<ApiResult<{ rounds: IRoomRound[] }>> {
  return request(`${apiPrefix}/rounds`);
}

export function getTeams(): Promise<ApiResult<{ teams: IRoomTeam[] }>> {
  return request(`${apiPrefix}/teams`);
}

/**
 * What this room should be playing right now.
 *
 * Polled continuously, so a change tournament control makes reaches the room without anyone
 * reloading anything. Also the recovery path: the response carries any open session's token, so a
 * page that has just been refreshed can resume the game it was already scoring in one round trip.
 */
export function getRoomAssignment(identity: IRoomIdentity): Promise<ApiResult<IRoomAssignmentResponse>> {
  return request(`${apiPrefix}/rooms/${encodeURIComponent(identity.roomId)}/assignment`, {
    headers: { [roomTokenHeader]: identity.token },
  });
}

/**
 * Start the game this room is assigned.
 *
 * The teams and the round are decided by the server from the assignment; this only says which
 * assignment the page believes it is starting, so a stale page is refused rather than obeyed.
 */
export function startAssignedMatch(
  identity: IRoomIdentity,
  scheduledMatchId: string,
): Promise<ApiResult<ISessionCreatedResponse>> {
  return request(`${apiPrefix}/rooms/${encodeURIComponent(identity.roomId)}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [roomTokenHeader]: identity.token },
    body: JSON.stringify({ scheduledMatchId }),
  });
}

export function createSession(body: ICreateSessionRequest): Promise<ApiResult<ISessionCreatedResponse>> {
  return request(`${apiPrefix}/sessions`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
}

export function getSession(credentials: ISessionCredentials): Promise<ApiResult<ISessionStateResponse>> {
  return request(`${apiPrefix}/sessions/${encodeURIComponent(credentials.sessionId)}`, {
    headers: { [sessionTokenHeader]: credentials.token },
  });
}

/**
 * Replace the live snapshot for this game. Safe to call repeatedly: the server keeps one snapshot
 * per session, so a retry is not a duplicate.
 */
export function putSnapshot(credentials: ISessionCredentials, qbj: object): Promise<ApiResult<ISessionStateResponse>> {
  return request(`${apiPrefix}/sessions/${encodeURIComponent(credentials.sessionId)}/snapshot`, {
    method: 'PUT',
    headers: jsonHeaders(credentials),
    body: JSON.stringify(qbj),
  });
}

/**
 * Submit the final result. Idempotent server-side, so retrying after a network failure will not
 * create a second game in the tournament.
 */
export function postFinal(
  credentials: ISessionCredentials,
  qbj: object,
): Promise<ApiResult<ISessionStateResponse & { newSubmission: boolean }>> {
  return request(`${apiPrefix}/sessions/${encodeURIComponent(credentials.sessionId)}/final`, {
    method: 'POST',
    headers: jsonHeaders(credentials),
    body: JSON.stringify(qbj),
  });
}
