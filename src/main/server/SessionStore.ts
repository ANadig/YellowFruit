import { randomUUID, randomBytes } from 'crypto';
import {
  ISession,
  ISessionScoreLine,
  ISessionStateResponse,
  ISessionSummary,
  SessionDisplayState,
  SessionStatus,
  staleSessionThresholdMs,
} from './ServerTypes';

/** Why a write to a session was refused */
export enum SessionWriteError {
  NotFound = 'NotFound',
  BadToken = 'BadToken',
  AlreadyResolved = 'AlreadyResolved',
}

export interface ISessionWriteFailure {
  ok: false;
  error: SessionWriteError;
}

export interface ISessionWriteSuccess {
  ok: true;
  session: ISession;
  /**
   * For final submissions: false when this exact final had already been recorded, so callers know
   * not to hand the same match to the statskeeper twice.
   */
  isNew: boolean;
}

export type SessionWriteResult = ISessionWriteSuccess | ISessionWriteFailure;

/**
 * In-memory store of room game sessions.
 *
 * Deliberately not persisted to a database: the .yft file stays the tournament's source of truth,
 * and a session is only meaningful while the server is running. Losing sessions on restart costs
 * the room a re-pick of round and teams; MODAQ's own localStorage persistence means the game
 * itself is never lost.
 */
export default class SessionStore {
  private sessions = new Map<string, ISession>();

  /** Injectable clock, so tests can control staleness without waiting */
  private now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  /** Create a new session for a room game. Ids and tokens are cryptographically random. */
  create(roundNumber: number, leftTeam: string, rightTeam: string): ISession {
    const timestamp = this.now().toISOString();
    const session: ISession = {
      id: randomUUID(),
      token: randomBytes(32).toString('base64url'),
      roundNumber,
      leftTeam,
      rightTeam,
      createdAt: timestamp,
      lastSeenAt: timestamp,
      status: SessionStatus.Created,
      latestQbj: null,
      finalReceived: false,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): ISession | undefined {
    return this.sessions.get(sessionId);
  }

  getAll(): ISession[] {
    return Array.from(this.sessions.values());
  }

  /** Look up a session and check the caller is allowed to write to it */
  private authorize(sessionId: string, token: string | undefined): SessionWriteResult {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: SessionWriteError.NotFound };
    if (!token || token !== session.token) return { ok: false, error: SessionWriteError.BadToken };
    return { ok: true, session, isNew: true };
  }

  /** Read a session's state, which also requires the session's token */
  read(sessionId: string, token: string | undefined): SessionWriteResult {
    return this.authorize(sessionId, token);
  }

  /**
   * Replace the session's live snapshot. Idempotent by construction: there is only ever one
   * snapshot, and a repeated PUT simply overwrites it. Snapshots never create tournament matches.
   */
  updateSnapshot(sessionId: string, token: string | undefined, qbj: object): SessionWriteResult {
    const auth = this.authorize(sessionId, token);
    if (!auth.ok) return auth;

    const { session } = auth;
    // Once the statskeeper has accepted or rejected the game, stop taking updates for it.
    if (session.status === SessionStatus.Accepted || session.status === SessionStatus.Rejected) {
      return { ok: false, error: SessionWriteError.AlreadyResolved };
    }

    session.latestQbj = qbj;
    session.lastSeenAt = this.now().toISOString();
    if (session.status === SessionStatus.Created) session.status = SessionStatus.Playing;
    return { ok: true, session, isNew: true };
  }

  /**
   * Record a final submission.
   * @returns isNew false if a final had already been recorded for this session, so the caller
   * doesn't create a second candidate match for the same game.
   */
  submitFinal(sessionId: string, token: string | undefined, qbj: object): SessionWriteResult {
    const auth = this.authorize(sessionId, token);
    if (!auth.ok) return auth;

    const { session } = auth;
    if (session.status === SessionStatus.Accepted) {
      // Already a real match in the tournament. Acknowledge without doing anything, so a room
      // retrying after a flaky network doesn't produce a duplicate game.
      return { ok: true, session, isNew: false };
    }

    const alreadyHadFinal = session.finalReceived;
    session.latestQbj = qbj;
    session.lastSeenAt = this.now().toISOString();
    session.finalReceived = true;
    session.status = SessionStatus.Submitted;
    delete session.rejectionReason;
    return { ok: true, session, isNew: !alreadyHadFinal };
  }

  /** Mark a session accepted after the statskeeper approved it */
  markAccepted(sessionId: string): ISession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    session.status = SessionStatus.Accepted;
    delete session.rejectionReason;
    return session;
  }

  /** Mark a session rejected. The room may submit again afterwards. */
  markRejected(sessionId: string, reason?: string): ISession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    session.status = SessionStatus.Rejected;
    session.finalReceived = false;
    if (reason) session.rejectionReason = reason;
    return session;
  }

  /** Forget a session entirely */
  remove(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  clear() {
    this.sessions.clear();
  }

  /** Project a session for the client that owns it. Never includes the token. */
  static toStateResponse(session: ISession): ISessionStateResponse {
    return {
      sessionId: session.id,
      roundNumber: session.roundNumber,
      leftTeam: session.leftTeam,
      rightTeam: session.rightTeam,
      status: session.status,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      rejectionReason: session.rejectionReason,
    };
  }

  /**
   * Pull a running score out of a MODAQ QBJ snapshot.
   *
   * MODAQ emits snake_case QBJ and does not include a team's total points, so we add up tossup
   * buzzes and bonus points the same way the QBJ schema defines them. This is display-only: it
   * never feeds YellowFruit's standings, which are computed from accepted matches.
   */
  static deriveScore(session: ISession): ISessionScoreLine | null {
    const qbj = session.latestQbj as any;
    if (!qbj || !Array.isArray(qbj.match_teams) || qbj.match_teams.length < 2) return null;

    const pointsFor = (matchTeam: any): number => {
      let total = typeof matchTeam?.bonus_points === 'number' ? matchTeam.bonus_points : 0;
      total += typeof matchTeam?.bonus_bounceback_points === 'number' ? matchTeam.bonus_bounceback_points : 0;
      for (const matchPlayer of matchTeam?.match_players ?? []) {
        for (const answerCount of matchPlayer?.answer_counts ?? []) {
          const value = answerCount?.answer?.value;
          const number = answerCount?.number;
          if (typeof value === 'number' && typeof number === 'number') total += value * number;
        }
      }
      return total;
    };

    // Trust the session's own team assignment for labels; MODAQ team order matches the order the
    // room set them up in, but the session is the authority on which team is which.
    return {
      leftTeam: session.leftTeam,
      rightTeam: session.rightTeam,
      leftPoints: pointsFor(qbj.match_teams[0]),
      rightPoints: pointsFor(qbj.match_teams[1]),
      tossupsRead: typeof qbj.tossups_read === 'number' ? qbj.tossups_read : 0,
    };
  }

  /** What state the desktop dashboard should show for a session */
  static displayState(session: ISession, msSinceLastSeen: number): SessionDisplayState {
    switch (session.status) {
      case SessionStatus.Accepted:
        return SessionDisplayState.Accepted;
      case SessionStatus.Rejected:
        return SessionDisplayState.Rejected;
      case SessionStatus.Submitted:
        return SessionDisplayState.Submitted;
      case SessionStatus.Created:
        return msSinceLastSeen > staleSessionThresholdMs ? SessionDisplayState.Stale : SessionDisplayState.Waiting;
      case SessionStatus.Playing:
      default:
        return msSinceLastSeen > staleSessionThresholdMs ? SessionDisplayState.Stale : SessionDisplayState.Live;
    }
  }

  /** Build the desktop live-rooms dashboard rows, newest room first */
  summarize(): ISessionSummary[] {
    const nowMs = this.now().getTime();
    return this.getAll()
      .map((session) => {
        const msSinceLastSeen = Math.max(0, nowMs - new Date(session.lastSeenAt).getTime());
        return {
          sessionId: session.id,
          roundNumber: session.roundNumber,
          leftTeam: session.leftTeam,
          rightTeam: session.rightTeam,
          status: session.status,
          displayState: SessionStore.displayState(session, msSinceLastSeen),
          createdAt: session.createdAt,
          lastSeenAt: session.lastSeenAt,
          msSinceLastSeen,
          score: SessionStore.deriveScore(session),
          rejectionReason: session.rejectionReason,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
