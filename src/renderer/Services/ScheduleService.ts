/**
 * Rooms, scheduled matches, and the rules about what may be scheduled where.
 *
 * A deliberately thin service over the two new models rather than new behaviour inside
 * `TournamentManager`: everything here is a pure question about a list of rooms and a list of
 * scheduled matches, so it can be tested without a tournament file, a window, or a server.
 *
 * The rules exist because the failure modes are expensive on the day. A team booked into two rooms in
 * the same round means one of those games can't happen; a room with two games in one round means a
 * scorekeeper picks the wrong one; a game handed to a disabled room means nobody shows up.
 */
import { ScheduledMatch, ScheduledMatchStatus } from '../DataModel/ScheduledMatch';
import { Phase } from '../DataModel/Phase';
import { TournamentRoom } from '../DataModel/TournamentRoom';
import { IAllocatableRoom, IPoolPairingRequest, allocateRooms, generatePhasePairings } from './RoundRobinScheduler';

/** How bad a scheduling problem is */
export enum ScheduleIssueSeverity {
  /** Must be fixed; the schedule is not playable as it stands */
  Error = 'error',
  /** Probably a mistake, but a director may have meant it */
  Warning = 'warning',
}

export interface IScheduleIssue {
  severity: ScheduleIssueSeverity;
  message: string;
  /** Scheduled matches this is about, so the UI can point at them */
  scheduledMatchIds: string[];
}

/** A proposed scheduled match, before it has been created */
export interface IScheduledMatchDraft {
  roundNumber: number;
  leftTeamName: string;
  rightTeamName: string;
  roomId?: string;
  phaseCode?: string;
  poolName?: string;
}

const error = (message: string, ids: string[] = []): IScheduleIssue => ({
  severity: ScheduleIssueSeverity.Error,
  message,
  scheduledMatchIds: ids,
});

const warning = (message: string, ids: string[] = []): IScheduleIssue => ({
  severity: ScheduleIssueSeverity.Warning,
  message,
  scheduledMatchIds: ids,
});

/** Scheduled matches that still occupy a slot in their round */
function occupiesSlot(scheduled: ScheduledMatch): boolean {
  return scheduled.status !== ScheduledMatchStatus.Cancelled;
}

/**
 * Validate one proposed scheduled match against the games already scheduled.
 *
 * @param existing every scheduled match in the tournament, including the one being edited
 * @param editingId when editing rather than creating, the id being edited, so it doesn't conflict
 * with itself
 */
export function validateDraft(
  draft: IScheduledMatchDraft,
  existing: ScheduledMatch[],
  rooms: TournamentRoom[],
  editingId?: string,
): IScheduleIssue[] {
  const issues: IScheduleIssue[] = [];

  const left = draft.leftTeamName.trim();
  const right = draft.rightTeamName.trim();

  if (left === '' || right === '') {
    issues.push(error('Both teams must be chosen.'));
    return issues;
  }

  if (left === right) {
    issues.push(error(`${left} cannot play itself.`));
    return issues;
  }

  const sameRound = existing.filter(
    (other) => other.id !== editingId && other.roundNumber === draft.roundNumber && occupiesSlot(other),
  );

  for (const teamName of [left, right]) {
    const clash = sameRound.filter((other) => other.involvesTeam(teamName));
    if (clash.length > 0) {
      issues.push(
        error(
          `${teamName} is already scheduled in round ${draft.roundNumber} (${clash[0].describe()}).`,
          clash.map((c) => c.id),
        ),
      );
    }
  }

  if (draft.roomId !== undefined && draft.roomId !== '') {
    const room = rooms.find((r) => r.id === draft.roomId);
    if (!room) {
      issues.push(error('That room no longer exists.'));
    } else {
      if (!room.enabled) {
        issues.push(error(`${room.name} is disabled and cannot be given new games.`));
      }
      const roomClash = sameRound.filter((other) => other.roomId === draft.roomId);
      if (roomClash.length > 0) {
        issues.push(
          error(
            `${room.name} already has a game in round ${draft.roundNumber} (${roomClash[0].describe()}).`,
            roomClash.map((c) => c.id),
          ),
        );
      }
    }
  }

  // A rematch is legitimate in a double round robin or a tiebreaker, so this is only a warning.
  const rematches = existing.filter(
    (other) => other.id !== editingId && occupiesSlot(other) && other.matchesTeams(left, right),
  );
  if (rematches.length > 0) {
    issues.push(
      warning(
        `${left} and ${right} are already scheduled to play in round ${rematches[0].roundNumber}.`,
        rematches.map((r) => r.id),
      ),
    );
  }

  return issues;
}

/** Do the issues include anything that must block the action? */
export function hasBlockingIssue(issues: IScheduleIssue[]): boolean {
  return issues.some((issue) => issue.severity === ScheduleIssueSeverity.Error);
}

/**
 * Validate the schedule as a whole.
 *
 * Used for the round-readiness display and before a rebracket, where the question isn't "is this one
 * game legal" but "is this round actually playable".
 */
export function validateSchedule(scheduled: ScheduledMatch[], rooms: TournamentRoom[]): IScheduleIssue[] {
  const issues: IScheduleIssue[] = [];
  const roomsById = new Map(rooms.map((room) => [room.id, room]));

  const byRound = new Map<number, ScheduledMatch[]>();
  for (const match of scheduled) {
    if (!occupiesSlot(match)) continue;
    byRound.set(match.roundNumber, (byRound.get(match.roundNumber) ?? []).concat(match));
  }

  for (const [roundNumber, matches] of Array.from(byRound).sort((a, b) => a[0] - b[0])) {
    const teamAppearances = new Map<string, ScheduledMatch[]>();
    const roomUse = new Map<string, ScheduledMatch[]>();

    for (const match of matches) {
      if (match.leftTeamName === match.rightTeamName) {
        issues.push(error(`Round ${roundNumber}: ${match.leftTeamName} is scheduled against itself.`, [match.id]));
      }
      for (const teamName of [match.leftTeamName, match.rightTeamName]) {
        teamAppearances.set(teamName, (teamAppearances.get(teamName) ?? []).concat(match));
      }
      if (match.roomId) {
        roomUse.set(match.roomId, (roomUse.get(match.roomId) ?? []).concat(match));
      }
    }

    for (const [teamName, appearances] of teamAppearances) {
      if (appearances.length > 1) {
        issues.push(
          error(
            `Round ${roundNumber}: ${teamName} is scheduled in ${appearances.length} games.`,
            appearances.map((a) => a.id),
          ),
        );
      }
    }

    for (const [roomId, uses] of roomUse) {
      const roomName = roomsById.get(roomId)?.name ?? 'An unknown room';
      if (uses.length > 1) {
        issues.push(
          error(
            `Round ${roundNumber}: ${roomName} has ${uses.length} games.`,
            uses.map((u) => u.id),
          ),
        );
      }
      if (roomsById.has(roomId) && !roomsById.get(roomId)?.enabled) {
        issues.push(
          warning(
            `Round ${roundNumber}: ${roomName} is disabled but still has a game assigned.`,
            uses.map((u) => u.id),
          ),
        );
      }
      if (!roomsById.has(roomId)) {
        issues.push(
          error(
            `Round ${roundNumber}: a game is assigned to a room that no longer exists.`,
            uses.map((u) => u.id),
          ),
        );
      }
    }

    const unassigned = matches.filter((match) => !match.roomId);
    if (unassigned.length > 0) {
      issues.push(
        warning(
          `Round ${roundNumber}: ${unassigned.length} game${
            unassigned.length === 1 ? '' : 's'
          } not assigned to a room.`,
          unassigned.map((u) => u.id),
        ),
      );
    }
  }

  return issues;
}

// #region Rooms

export interface IRoomDeletionCheck {
  canDelete: boolean;
  /** Why not, if not */
  reason?: string;
  /** Scheduled matches that would be orphaned */
  affectedScheduledMatchIds: string[];
}

/**
 * Can this room be deleted?
 *
 * A room that has hosted an accepted game is part of the tournament's history and deleting it would
 * make that history unexplainable, so it must be disabled instead. A room with only future games can
 * go, but the caller has to deal with the games that lose their room.
 */
export function checkRoomDeletion(room: TournamentRoom, scheduled: ScheduledMatch[]): IRoomDeletionCheck {
  const inThisRoom = scheduled.filter((match) => match.roomId === room.id);
  const played = inThisRoom.filter(
    (match) => match.status === ScheduledMatchStatus.Accepted || match.status === ScheduledMatchStatus.Submitted,
  );

  if (played.length > 0) {
    return {
      canDelete: false,
      reason: `${room.name} has ${played.length} game${
        played.length === 1 ? '' : 's'
      } that have already been played there. Disable the room instead of deleting it, so the results stay explainable.`,
      affectedScheduledMatchIds: played.map((p) => p.id),
    };
  }

  const inProgress = inThisRoom.filter(
    (match) => match.status === ScheduledMatchStatus.Playing || match.status === ScheduledMatchStatus.NeedsAttention,
  );
  if (inProgress.length > 0) {
    const hasNeedsAttention = inProgress.some((match) => match.status === ScheduledMatchStatus.NeedsAttention);
    return {
      canDelete: false,
      reason: hasNeedsAttention
        ? `${room.name} has a game that still needs attention. Resolve it before deleting the room.`
        : `${room.name} has a game in progress. Wait for it to finish before deleting the room.`,
      affectedScheduledMatchIds: inProgress.map((p) => p.id),
    };
  }

  return {
    canDelete: true,
    affectedScheduledMatchIds: inThisRoom.map((match) => match.id),
  };
}

/** Rooms that may be given new assignments, in the order the allocator should offer them */
export function allocatableRooms(rooms: TournamentRoom[]): IAllocatableRoom[] {
  return rooms
    .filter((room) => room.enabled)
    .slice()
    .sort(TournamentRoom.compare)
    .map((room) => ({ id: room.id, sortOrder: room.sortOrder }));
}

/** Renumber sortOrder to 0..n-1 so reordering never leaves gaps or ties */
export function normalizeRoomOrder(rooms: TournamentRoom[]): TournamentRoom[] {
  const ordered = rooms.slice().sort(TournamentRoom.compare);
  ordered.forEach((room, index) => {
    room.sortOrder = index;
  });
  return ordered;
}

/** Move a room up or down in the list, returning the reordered array */
export function moveRoom(rooms: TournamentRoom[], roomId: string, delta: number): TournamentRoom[] {
  const ordered = normalizeRoomOrder(rooms);
  const index = ordered.findIndex((room) => room.id === roomId);
  if (index < 0) return ordered;
  const target = Math.min(ordered.length - 1, Math.max(0, index + delta));
  if (target === index) return ordered;

  const [moved] = ordered.splice(index, 1);
  ordered.splice(target, 0, moved);
  ordered.forEach((room, i) => {
    room.sortOrder = i;
  });
  return ordered;
}

// #endregion

// #region Generation

export interface IGenerationRequest {
  /** Pools to generate for, in the order their rooms should be blocked out */
  pools: IPoolPairingRequest[];
  /** Tournament round numbers to lay the generated rounds onto, in order */
  roundNumbers: number[];
  phaseCode: string;
  /** Pool display names, keyed by the pool ids used in `pools` */
  poolNames?: Record<string, string>;
}

export interface IGenerationResult {
  scheduledMatches: ScheduledMatch[];
  issues: IScheduleIssue[];
}

/**
 * Generate a phase's scheduled matches and put them in rooms.
 *
 * Generated pairings are laid onto the phase's actual round numbers in order. A phase with fewer
 * rounds than its pools need is an error rather than a silent truncation, because the missing games
 * would never be played and the standings would quietly be wrong.
 */
export function generateSchedule(request: IGenerationRequest, rooms: TournamentRoom[]): IGenerationResult {
  const issues: IScheduleIssue[] = [];
  const pairingRounds = generatePhasePairings(request.pools);

  if (pairingRounds.length > request.roundNumbers.length) {
    issues.push(
      error(
        `This format needs ${pairingRounds.length} rounds but the phase only has ${request.roundNumbers.length}. Add rounds to the phase, or reduce the number of round robins.`,
      ),
    );
    return { scheduledMatches: [], issues };
  }

  const { assignments, errors: allocationErrors } = allocateRooms(pairingRounds, allocatableRooms(rooms));

  for (const allocationError of allocationErrors) {
    const roundNumber = request.roundNumbers[allocationError.roundIndex - 1] ?? allocationError.roundIndex;
    issues.push(
      error(
        `Round ${roundNumber} needs ${allocationError.gamesNeeded} rooms but only ${
          allocationError.roomsAvailable
        } enabled room${allocationError.roomsAvailable === 1 ? ' is' : 's are'} available.`,
      ),
    );
  }

  // Don't produce a half-placed schedule: a director acting on a partial one would think the
  // tournament was ready when some games have nowhere to be played.
  if (allocationErrors.length > 0) return { scheduledMatches: [], issues };

  const scheduledMatches = assignments.map((assignment) => {
    const scheduled = new ScheduledMatch(
      request.roundNumbers[assignment.roundIndex - 1],
      assignment.leftTeamId,
      assignment.rightTeamId,
    );
    scheduled.phaseCode = request.phaseCode;
    scheduled.poolName = request.poolNames?.[assignment.poolId];
    scheduled.roomId = assignment.roomId;
    scheduled.generated = true;
    return scheduled;
  });

  issues.push(...validateSchedule(scheduledMatches, rooms));

  return { scheduledMatches, issues };
}

export interface IMergedScheduleResult {
  scheduledMatches: ScheduledMatch[];
  /** Accepted, cancelled, playing, submitted, and needs-attention games retained from history/state. */
  preservedMatches: ScheduledMatch[];
  /** Future scheduled/ready games that were replaced by the preview. */
  replacedFutureCount: number;
  issues: IScheduleIssue[];
}

/**
 * Apply a generated preview without erasing anything that has already happened or is currently in
 * flight. This is intentionally a separate pure operation so the UI can show the exact replacement
 * impact before it mutates the tournament.
 */
export function mergeGeneratedSchedule(
  existing: ScheduledMatch[],
  generated: ScheduledMatch[],
  rooms: TournamentRoom[],
): IMergedScheduleResult {
  const generatedRoundNumbers = new Set(generated.map((match) => match.roundNumber));
  const preservedMatches = existing.filter(
    (match) =>
      (match.status !== ScheduledMatchStatus.Scheduled && match.status !== ScheduledMatchStatus.Ready) ||
      !generatedRoundNumbers.has(match.roundNumber),
  );
  const protectedPairs = new Set(preservedMatches.map((match) => `${match.roundNumber}\u0000${match.teamPairKey()}`));
  const generatedToKeep = generated.filter(
    (match) => !protectedPairs.has(`${match.roundNumber}\u0000${match.teamPairKey()}`),
  );
  const scheduledMatches = [...preservedMatches, ...generatedToKeep].sort(
    (a, b) => a.roundNumber - b.roundNumber || a.roomId?.localeCompare(b.roomId ?? '') || a.id.localeCompare(b.id),
  );

  return {
    scheduledMatches,
    preservedMatches,
    replacedFutureCount: existing.length - preservedMatches.length,
    issues: validateSchedule(scheduledMatches, rooms),
  };
}

// #endregion

// #region Round readiness

export interface IRoundReadiness {
  roundNumber: number;
  expected: number;
  scheduled: number;
  roomsAssigned: number;
  playing: number;
  submitted: number;
  accepted: number;
  waiting: number;
  cancelled: number;
  needsAttention: number;
  /** True once every game that was going to happen has been accepted or explicitly called off */
  complete: boolean;
}

/**
 * Summarize one round's operational state.
 *
 * `expected` counts everything that wasn't cancelled, which is the number a director cares about
 * when asking whether a round is done.
 */
export function summarizeRound(scheduled: ScheduledMatch[], roundNumber: number): IRoundReadiness {
  const inRound = scheduled.filter((match) => match.roundNumber === roundNumber);
  const countOf = (status: ScheduledMatchStatus) => inRound.filter((m) => m.status === status).length;

  const cancelled = countOf(ScheduledMatchStatus.Cancelled);
  const accepted = countOf(ScheduledMatchStatus.Accepted);
  const expected = inRound.length - cancelled;

  return {
    roundNumber,
    expected,
    scheduled: inRound.length,
    roomsAssigned: inRound.filter((m) => m.roomId && m.status !== ScheduledMatchStatus.Cancelled).length,
    playing: countOf(ScheduledMatchStatus.Playing),
    submitted: countOf(ScheduledMatchStatus.Submitted),
    accepted,
    waiting: countOf(ScheduledMatchStatus.Scheduled) + countOf(ScheduledMatchStatus.Ready),
    cancelled,
    needsAttention: countOf(ScheduledMatchStatus.NeedsAttention),
    complete: inRound.length > 0 && accepted + cancelled === inRound.length,
  };
}

/** Every round that has scheduled games, in order */
export function roundsWithGames(scheduled: ScheduledMatch[]): number[] {
  return Array.from(new Set(scheduled.map((match) => match.roundNumber))).sort((a, b) => a - b);
}

/**
 * Check that a pool-based phase has every pairing its configured round robin requires.
 *
 * This is intentionally separate from `validateSchedule`: an otherwise conflict-free schedule can
 * still be incomplete if one generated game was deleted or never assigned. Manual/ad-hoc games are
 * allowed; only missing configured pairings are errors.
 */
export function validatePhaseScheduleCompleteness(phase: Phase, scheduled: ScheduledMatch[]): IScheduleIssue[] {
  if (phase.pools.length === 0) return [];

  const generated = generatePhasePairings(
    phase.pools.map((pool, index) => ({
      poolId: `${phase.code}-${index}`,
      teamIds: pool.poolTeams.map((poolTeam) => poolTeam.team.name),
      roundRobins: pool.roundRobins,
    })),
  );
  const actual = new Set(
    scheduled
      .filter(
        (match) => phase.includesRoundNumber(match.roundNumber) && match.status !== ScheduledMatchStatus.Cancelled,
      )
      .map((match) => `${match.roundNumber}\u0000${match.teamPairKey()}`),
  );
  const roundNumbers = phase.rounds.map((round) => round.number).sort((a, b) => a - b);
  const issues: IScheduleIssue[] = [];

  for (const round of generated) {
    const roundNumber = roundNumbers[round.roundIndex - 1];
    if (roundNumber === undefined) continue;
    for (const pairing of round.pairings) {
      const pairKey = [pairing.leftTeamId, pairing.rightTeamId].sort().join('\u0000');
      if (!actual.has(`${roundNumber}\u0000${pairKey}`)) {
        issues.push(error(`Round ${roundNumber} is missing ${pairing.leftTeamId} vs ${pairing.rightTeamId}.`));
      }
    }
  }

  return issues;
}

// #endregion
