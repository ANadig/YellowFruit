/**
 * Keeps a room's final submission safe when the network isn't cooperating.
 *
 * A game is the most valuable thing in the room, so a final result is written to localStorage
 * *before* the first upload attempt and only removed once YellowFruit has acknowledged it. If the
 * Wi-Fi drops, the tab is refreshed, or the Chromebook is closed and reopened, the pending
 * submission is still there and will be retried.
 *
 * This is separate from MODAQ's own state persistence, which independently preserves the game
 * itself. Between the two, no completed game should ever be lost.
 */
import { ISessionCredentials, postFinal } from './api';

const storageKey = 'yellowfruit-room-pending-final';

export interface IPendingSubmission {
  credentials: ISessionCredentials;
  qbj: object;
  /** ISO 8601 */
  queuedAt: string;
  attempts: number;
}

/** localStorage can throw (private mode, quota). Never let that break scorekeeping. */
function safeRead(): IPendingSubmission | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.credentials?.sessionId || !parsed?.qbj) return null;
    return parsed as IPendingSubmission;
  } catch (err: any) {
    return null;
  }
}

function safeWrite(pending: IPendingSubmission | null) {
  try {
    if (pending === null) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, JSON.stringify(pending));
  } catch (err: any) {
    // Out of space or storage disabled. The in-memory copy still works for this session.
  }
}

export function getPendingSubmission(): IPendingSubmission | null {
  return safeRead();
}

export function clearPendingSubmission() {
  safeWrite(null);
}

/** Record a final result locally before trying to send it anywhere */
export function queueSubmission(credentials: ISessionCredentials, qbj: object): IPendingSubmission {
  const pending: IPendingSubmission = {
    credentials,
    qbj,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  safeWrite(pending);
  return pending;
}

export type FlushOutcome =
  | { state: 'nothingQueued' }
  | { state: 'accepted'; newSubmission: boolean }
  | { state: 'rejectedByServer'; error: string; status?: number }
  | { state: 'offline'; error: string };

/**
 * Try to send whatever is queued.
 *
 * A transport failure leaves the submission queued so it can be retried. A refusal from the server
 * itself (a 4xx) also leaves it queued unless the session is gone entirely, because the scorekeeper
 * needs a chance to see what went wrong rather than silently losing the game.
 */
export async function flushPendingSubmission(): Promise<FlushOutcome> {
  const pending = safeRead();
  if (!pending) return { state: 'nothingQueued' };

  safeWrite({ ...pending, attempts: pending.attempts + 1 });

  const result = await postFinal(pending.credentials, pending.qbj);
  if (result.ok) {
    clearPendingSubmission();
    return { state: 'accepted', newSubmission: result.value.newSubmission };
  }

  if (result.status === 404) {
    // The session no longer exists, which happens when YellowFruit's server was restarted. Retrying
    // will never work, so stop and let the UI tell the scorekeeper to export the game manually.
    return { state: 'rejectedByServer', error: result.error, status: result.status };
  }

  if (result.status !== undefined) {
    return { state: 'rejectedByServer', error: result.error, status: result.status };
  }

  return { state: 'offline', error: result.error };
}
