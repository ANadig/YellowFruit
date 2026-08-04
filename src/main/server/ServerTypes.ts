/**
 * Types shared between the Electron main-process tournament server, the YellowFruit renderer, and
 * the browser room application.
 *
 * Everything here is a plain JSON-serializable DTO. Nothing from YellowFruit's internal data model
 * belongs in this file: the whole point is that room clients see a small, deliberate projection of
 * the tournament rather than the internal object graph.
 */
import { ScheduledMatchStatus } from '../../renderer/DataModel/ScheduledMatch';
import { IModaqGameFormat } from '../../renderer/Services/YellowFruitScoringRulesToModaq';

/** Default port for the local tournament server */
export const defaultServerPort = 4732;

/** Largest request body the server will accept, in bytes. Room submissions are small JSON. */
export const maxRequestBodyBytes = 512 * 1024;

/** Header a room client uses to prove it owns the session it's writing to */
export const sessionTokenHeader = 'x-yf-session-token';

/**
 * Header a room client uses to prove which room it is.
 *
 * A room token authorizes that room's own scorekeeping and nothing else: it cannot read another
 * room, write another room's session, or change anything about the tournament.
 */
export const roomTokenHeader = 'x-yf-room-token';

/** Prefix for all HTTP API routes */
export const apiPrefix = '/api/v1';

/** How long without a snapshot before the desktop UI considers a room stale */
export const staleSessionThresholdMs = 60 * 1000;

// #region Tournament projection served to rooms

/** One player on a team roster, as a room needs it */
export interface IRoomPlayer {
  name: string;
}

/** One team a room is allowed to pick */
export interface IRoomTeam {
  /** Team name, exactly as YellowFruit knows it. Used to match the match back on import. */
  name: string;
  players: IRoomPlayer[];
}

/** One round a room is allowed to pick */
export interface IRoomRound {
  number: number;
  /** Display name, which for most rounds is just the number */
  name: string;
}

/**
 * The read-only projection of the open tournament that room clients get. The renderer builds this
 * and pushes it to the main process; the main process only ever serves it.
 */
export interface ITournamentSnapshot {
  /** Tournament name, for display in the room UI */
  name: string;
  rounds: IRoomRound[];
  teams: IRoomTeam[];
  /**
   * MODAQ game format derived from the tournament's scoring rules, or null if the rules can't be
   * represented in MODAQ. When null, `gameFormatErrors` explains why and rooms must refuse to
   * start a game.
   */
  gameFormat: IModaqGameFormat | null;
  gameFormatErrors: string[];
  gameFormatWarnings: string[];
  /**
   * True when a round can end before every regulation tossup is read, i.e. timed rounds. Rooms need
   * this to work out how many tossups were actually heard; see `QbjMatchNormalizer`.
   */
  timedRounds: boolean;
  /** Configured playing locations, including their access tokens. Tokens are never served. */
  rooms: IRoomDescriptor[];
  /** Every scheduled game that has a room, so the server can tell a room what it's playing */
  assignments: IAssignmentDescriptor[];
  /**
   * The round tournament control considers current.
   *
   * Rooms are not allowed to start a later round on their own, which stops a room racing ahead and
   * scoring a game whose teams are still playing the current round. Null means no round is in play.
   */
  currentRoundNumber: number | null;
}

/** A playing location, as the server needs to know it */
export interface IRoomDescriptor {
  id: string;
  name: string;
  /**
   * Capability token for this room. Used only to authorize incoming requests and never included in
   * any response.
   */
  accessToken: string;
  enabled: boolean;
}

/** One scheduled game with a room, projected for the server */
export interface IAssignmentDescriptor {
  scheduledMatchId: string;
  roomId: string;
  roundNumber: number;
  /** Display name for the round, which for most rounds is just the number */
  roundName: string;
  leftTeam: string;
  rightTeam: string;
  status: ScheduledMatchStatus;
}

/** An empty snapshot, used before the renderer has pushed anything or with no tournament open */
export const emptyTournamentSnapshot: ITournamentSnapshot = {
  name: '',
  rounds: [],
  teams: [],
  gameFormat: null,
  gameFormatErrors: ['YellowFruit has not sent tournament information to the server yet.'],
  gameFormatWarnings: [],
  timedRounds: false,
  rooms: [],
  assignments: [],
  currentRoundNumber: null,
};

// #endregion

// #region Sessions

/** Lifecycle of one room game */
export enum SessionStatus {
  /** Session exists but MODAQ hasn't sent anything yet */
  Created = 'created',
  /** At least one live snapshot has arrived */
  Playing = 'playing',
  /** The room submitted a final result; waiting on the statskeeper */
  Submitted = 'submitted',
  /** The statskeeper accepted it and it's now a real match in the tournament */
  Accepted = 'accepted',
  /** The statskeeper rejected it */
  Rejected = 'rejected',
}

/** What the desktop UI shows for a room */
export enum SessionDisplayState {
  Waiting = 'Waiting',
  Live = 'Live',
  Submitted = 'Submitted',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Stale = 'Disconnected',
}

/** A room game. Kept in memory in the main process; the .yft file remains the source of truth. */
export interface ISession {
  id: string;
  /**
   * Capability token for this session. Only a client that presents it may write to the session.
   * Never included in listings sent anywhere but the creating client and the desktop UI.
   */
  token: string;
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
  /**
   * The room this session belongs to, when it was started from a scheduled assignment.
   *
   * Undefined for a session started by picking teams by hand, which is still supported for a
   * tournament that hasn't set up rooms and schedules.
   */
  roomId?: string;
  /** The scheduled game this session is playing, when it came from an assignment */
  scheduledMatchId?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601, updated on every snapshot or final submission */
  lastSeenAt: string;
  status: SessionStatus;
  /** The most recent QBJ Match we've received, live or final. Replaced, never appended. */
  latestQbj: object | null;
  /** True once a final submission has been recorded, so re-submits are idempotent */
  finalReceived: boolean;
  /** Message from the statskeeper when a submission is rejected */
  rejectionReason?: string;
}

/** What the room client gets back when it creates a session */
export interface ISessionCreatedResponse {
  sessionId: string;
  token: string;
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
  status: SessionStatus;
}

/** Session as shown to the room client that owns it (no token echo needed) */
export interface ISessionStateResponse {
  sessionId: string;
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
  status: SessionStatus;
  createdAt: string;
  lastSeenAt: string;
  rejectionReason?: string;
}

/** Request body for creating a session */
export interface ICreateSessionRequest {
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
}

// #endregion

// #region Room assignments

/** One matchup as a room needs it, with the rosters MODAQ has to be set up with */
export interface IRoomMatchup {
  scheduledMatchId: string;
  roundNumber: number;
  roundName: string;
  leftTeam: IRoomTeam;
  rightTeam: IRoomTeam;
  status: ScheduledMatchStatus;
}

/** A matchup reduced to what a room shows for context, with no rosters */
export interface IRoomMatchupSummary {
  scheduledMatchId: string;
  roundNumber: number;
  roundName: string;
  leftTeam: string;
  rightTeam: string;
  status: ScheduledMatchStatus;
}

/** Why a room can't start its assigned game right now */
export enum RoomBlockedReason {
  /** The round isn't in play yet, so control has to advance the round first */
  FutureRound = 'futureRound',
  /** Already accepted or cancelled; handing it back out would let a room re-score it */
  AlreadyResolved = 'alreadyResolved',
  /** The tournament's scoring rules can't be represented in MODAQ */
  RulesUnusable = 'rulesUnusable',
  /** The room is disabled */
  RoomDisabled = 'roomDisabled',
}

/**
 * Everything a room page needs, in one response.
 *
 * This is the endpoint a Chromebook polls all day. It is deliberately one request: a room that has
 * just come back from a network drop should recover in a single round trip.
 */
export interface IRoomAssignmentResponse {
  roomId: string;
  roomName: string;
  tournamentName: string;
  /** The game this room should be playing now, or null if it has nothing assigned */
  current: IRoomMatchup | null;
  /** The room's previous game, for context */
  previous: IRoomMatchupSummary | null;
  /** The room's next game, so a scorekeeper can see what's coming */
  next: IRoomMatchupSummary | null;
  /**
   * An open session for the current matchup, if there is one.
   *
   * Includes the session token so a reloaded page can resume writing to the game it was already
   * scoring instead of starting a second session for it.
   */
  session: ISessionResumeInfo | null;
  /** Set when the room cannot start `current` */
  blockedReason?: RoomBlockedReason;
  /** Human-readable version of `blockedReason` */
  blockedMessage?: string;
  gameFormat: IModaqGameFormat | null;
  gameFormatErrors: string[];
  gameFormatWarnings: string[];
  timedRounds: boolean;
}

/** Enough to pick up an in-progress session after a reload */
export interface ISessionResumeInfo {
  sessionId: string;
  token: string;
  status: SessionStatus;
  finalReceived: boolean;
  rejectionReason?: string;
}

/** Request body for starting a room's assigned game */
export interface IStartAssignedMatchRequest {
  /** Which assignment the room believes it is starting, so a stale page can't start the wrong game */
  scheduledMatchId: string;
}

/** A running score line derived from a QBJ snapshot, for the desktop live dashboard */
export interface ISessionScoreLine {
  leftTeam: string;
  rightTeam: string;
  leftPoints: number;
  rightPoints: number;
  /** Number of tossups read so far */
  tossupsRead: number;
}

/** One row of the desktop live-rooms dashboard */
export interface ISessionSummary {
  sessionId: string;
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
  /** The room this game is in, when it was started from an assignment */
  roomId?: string;
  scheduledMatchId?: string;
  status: SessionStatus;
  displayState: SessionDisplayState;
  createdAt: string;
  lastSeenAt: string;
  /** Milliseconds since the last snapshot */
  msSinceLastSeen: number;
  score: ISessionScoreLine | null;
  rejectionReason?: string;
}

// #endregion

// #region Main <-> renderer messages

/** Current state of the HTTP server, reported to the renderer */
export interface IServerStatus {
  running: boolean;
  port: number;
  /** Every usable LAN address a Chromebook could open, e.g. http://192.168.1.50:4732 */
  addresses: string[];
  /** Set when the last start attempt failed */
  errorMessage?: string;
}

/** A final match submission handed to the renderer for validation */
export interface IMatchSubmission {
  sessionId: string;
  /**
   * The round this game belongs to, taken from the session rather than the payload.
   *
   * MODAQ omits `_round` from custom exports, and even when a round is present in a submission the
   * server's assignment is the authority: a room must not be able to file a game against a round it
   * wasn't scheduled in.
   */
  roundNumber: number;
  leftTeam: string;
  rightTeam: string;
  /** The room that submitted, when the session came from an assignment */
  roomId?: string;
  /** The scheduled game this result is for, so accepting can link the two */
  scheduledMatchId?: string;
  /** The QBJ Match object exactly as MODAQ produced it */
  qbj: object;
  /** ISO 8601 */
  submittedAt: string;
}

/** Renderer's verdict on a submission */
export interface ISubmissionVerdict {
  sessionId: string;
  accepted: boolean;
  reason?: string;
}

// #endregion
