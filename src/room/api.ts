/**
 * HTTP client for the room application.
 *
 * Every call is written on the assumption that the network can disappear mid-tournament. Nothing
 * here throws in a way that could take the scorekeeping UI down: callers get a result object and
 * decide what to show. A failed upload never discards local state.
 */
import {
  ICreateSessionRequest,
  IRoomRound,
  IRoomTeam,
  ISessionCreatedResponse,
  ISessionStateResponse,
  apiPrefix,
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
