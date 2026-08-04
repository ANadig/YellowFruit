/**
 * Answers "which room is this, and what should it be playing?"
 *
 * All of the authority about what a room may do lives here rather than in the room client. A browser
 * tells us which room it claims to be and which assignment it thinks it is starting; everything else
 * — the teams, the round, whether it is allowed to start at all — is decided from the tournament
 * snapshot. A room client that has been sitting on a stale page, or that has been tampered with,
 * cannot talk the server into recording the wrong game.
 *
 * Pure functions over the snapshot, so this is fully testable without Electron or a listening socket.
 */
import { ScheduledMatchStatus } from '../../renderer/DataModel/ScheduledMatch';
import {
  IAssignmentDescriptor,
  IRoomAssignmentResponse,
  IRoomDescriptor,
  IRoomMatchup,
  IRoomMatchupSummary,
  IRoomTeam,
  ITournamentSnapshot,
  RoomBlockedReason,
} from './ServerTypes';

/** Why a room lookup failed */
export enum RoomAuthError {
  /** No room with that id in the current tournament */
  NotFound = 'NotFound',
  /** The token didn't match the room's */
  BadToken = 'BadToken',
}

export type RoomLookupResult = { ok: true; room: IRoomDescriptor } | { ok: false; error: RoomAuthError };

/**
 * Constant-time-ish string comparison.
 *
 * Room tokens are compared on a tournament LAN rather than the open internet, so this is belt and
 * braces, but there is no reason to leak token bytes through timing when the fix is three lines.
 */
function tokensMatch(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    // eslint-disable-next-line no-bitwise
    difference |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return difference === 0;
}

/**
 * Identify a room from its id and token.
 *
 * A wrong token and an unknown room are separate results here so the caller can log the difference,
 * but both must produce the same response to the client: telling an unauthorized caller that a room
 * id exists lets it enumerate rooms.
 */
export function authorizeRoom(
  snapshot: ITournamentSnapshot,
  roomId: string,
  token: string | undefined,
): RoomLookupResult {
  const room = snapshot.rooms.find((candidate) => candidate.id === roomId);
  if (!room) return { ok: false, error: RoomAuthError.NotFound };
  if (!token || !tokensMatch(room.accessToken, token)) return { ok: false, error: RoomAuthError.BadToken };
  return { ok: true, room };
}

/** This room's assignments, earliest round first */
export function assignmentsForRoom(snapshot: ITournamentSnapshot, roomId: string): IAssignmentDescriptor[] {
  return snapshot.assignments
    .filter((assignment) => assignment.roomId === roomId)
    .slice()
    .sort((a, b) => a.roundNumber - b.roundNumber);
}

/** Look up a roster by team name. Rooms need rosters to set MODAQ up. */
function findTeam(snapshot: ITournamentSnapshot, name: string): IRoomTeam {
  // A team that has vanished from the tournament shouldn't crash a room mid-tournament; an empty
  // roster still lets the scorekeeper see the matchup and lets control see the problem.
  return snapshot.teams.find((team) => team.name === name) ?? { name, players: [] };
}

/**
 * Which of a room's assignments should it be playing?
 *
 * The current game is the earliest one that hasn't been resolved. That makes the room's page
 * self-advancing: as soon as tournament control accepts round 4's result, round 5 becomes current
 * and the Chromebook picks it up on its next poll with no action from the scorekeeper.
 */
export function pickCurrentAssignment(assignments: IAssignmentDescriptor[]): IAssignmentDescriptor | null {
  const unresolved = assignments.find(
    (assignment) =>
      assignment.status !== ScheduledMatchStatus.Accepted && assignment.status !== ScheduledMatchStatus.Cancelled,
  );
  return unresolved ?? null;
}

/** The most recent finished game in this room, for the "Previous" line */
function pickPreviousAssignment(
  assignments: IAssignmentDescriptor[],
  current: IAssignmentDescriptor | null,
): IAssignmentDescriptor | null {
  const finished = assignments.filter(
    (assignment) =>
      assignment.status === ScheduledMatchStatus.Accepted &&
      (current === null || assignment.roundNumber < current.roundNumber),
  );
  return finished.length > 0 ? finished[finished.length - 1] : null;
}

/** The game after the current one, for the "Next" line */
function pickNextAssignment(
  assignments: IAssignmentDescriptor[],
  current: IAssignmentDescriptor | null,
): IAssignmentDescriptor | null {
  if (current === null) return null;
  return (
    assignments.find(
      (assignment) =>
        assignment.roundNumber > current.roundNumber && assignment.status !== ScheduledMatchStatus.Cancelled,
    ) ?? null
  );
}

function toMatchup(snapshot: ITournamentSnapshot, assignment: IAssignmentDescriptor): IRoomMatchup {
  return {
    scheduledMatchId: assignment.scheduledMatchId,
    roundNumber: assignment.roundNumber,
    roundName: assignment.roundName,
    leftTeam: findTeam(snapshot, assignment.leftTeam),
    rightTeam: findTeam(snapshot, assignment.rightTeam),
    status: assignment.status,
  };
}

function toSummary(assignment: IAssignmentDescriptor): IRoomMatchupSummary {
  return {
    scheduledMatchId: assignment.scheduledMatchId,
    roundNumber: assignment.roundNumber,
    roundName: assignment.roundName,
    leftTeam: assignment.leftTeam,
    rightTeam: assignment.rightTeam,
    status: assignment.status,
  };
}

export interface IStartBlock {
  reason: RoomBlockedReason;
  message: string;
}

/**
 * May this room start this assignment right now?
 *
 * Returns the reason it may not, or null if it may. The future-round rule is the important one: a
 * room that can see round 5 on its page must not be able to start it while round 4 is still being
 * played, because the teams involved are physically in other rooms. Only tournament control can
 * advance the round.
 */
export function checkCanStart(
  snapshot: ITournamentSnapshot,
  room: IRoomDescriptor,
  assignment: IAssignmentDescriptor,
): IStartBlock | null {
  if (!room.enabled) {
    return {
      reason: RoomBlockedReason.RoomDisabled,
      message: 'This room has been taken out of use. Check with tournament control.',
    };
  }

  if (snapshot.gameFormat === null) {
    return {
      reason: RoomBlockedReason.RulesUnusable,
      message: "This tournament's scoring rules cannot be used for room scorekeeping.",
    };
  }

  if (assignment.status === ScheduledMatchStatus.Accepted || assignment.status === ScheduledMatchStatus.Cancelled) {
    return {
      reason: RoomBlockedReason.AlreadyResolved,
      message: 'This game has already been finished by tournament control.',
    };
  }

  if (snapshot.currentRoundNumber === null || assignment.roundNumber > snapshot.currentRoundNumber) {
    return {
      reason: RoomBlockedReason.FutureRound,
      message: `Round ${assignment.roundName} has not started yet. This page will update when tournament control opens the round.`,
    };
  }

  return null;
}

/**
 * Build the response a room page polls for.
 *
 * `session` is filled in by the caller, which owns the session store; everything else is derived
 * from the snapshot.
 */
export function buildAssignmentResponse(
  snapshot: ITournamentSnapshot,
  room: IRoomDescriptor,
): Omit<IRoomAssignmentResponse, 'session'> {
  const assignments = assignmentsForRoom(snapshot, room.id);
  const current = pickCurrentAssignment(assignments);
  const block = current ? checkCanStart(snapshot, room, current) : null;

  return {
    roomId: room.id,
    roomName: room.name,
    tournamentName: snapshot.name,
    current: current ? toMatchup(snapshot, current) : null,
    previous: (() => {
      const previous = pickPreviousAssignment(assignments, current);
      return previous ? toSummary(previous) : null;
    })(),
    next: (() => {
      const next = pickNextAssignment(assignments, current);
      return next ? toSummary(next) : null;
    })(),
    blockedReason: block?.reason,
    blockedMessage: block?.message,
    gameFormat: snapshot.gameFormat,
    gameFormatErrors: snapshot.gameFormatErrors,
    gameFormatWarnings: snapshot.gameFormatWarnings,
    timedRounds: snapshot.timedRounds,
  };
}

/** Find one assignment, but only if it really belongs to this room */
export function findAssignmentForRoom(
  snapshot: ITournamentSnapshot,
  roomId: string,
  scheduledMatchId: string,
): IAssignmentDescriptor | undefined {
  return snapshot.assignments.find(
    (assignment) => assignment.scheduledMatchId === scheduledMatchId && assignment.roomId === roomId,
  );
}
