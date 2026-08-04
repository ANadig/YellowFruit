import { describe, expect, test } from 'vitest';
import { ScheduledMatch, ScheduledMatchStatus } from '../renderer/DataModel/ScheduledMatch';
import { Phase, PhaseTypes } from '../renderer/DataModel/Phase';
import { Pool } from '../renderer/DataModel/Pool';
import { PoolTeam } from '../renderer/DataModel/PoolTeam';
import { Team } from '../renderer/DataModel/Team';
import { TournamentRoom } from '../renderer/DataModel/TournamentRoom';
import {
  IScheduleIssue,
  ScheduleIssueSeverity,
  allocatableRooms,
  checkRoomDeletion,
  generateSchedule,
  hasBlockingIssue,
  mergeGeneratedSchedule,
  moveRoom,
  normalizeRoomOrder,
  roundsWithGames,
  summarizeRound,
  validatePhaseScheduleCompleteness,
  validateDraft,
  validateSchedule,
} from '../renderer/Services/ScheduleService';

const teamNames = ['Ninety Six A', 'Greenwood A', 'Emerald A', 'Clinton A', 'Dorman A', 'Laurens A'];

function makeRooms(names: string[]): TournamentRoom[] {
  return names.map((name, index) => new TournamentRoom(name, index));
}

/** A scheduled match in a round, optionally in a room */
function makeScheduled(
  roundNumber: number,
  left: string,
  right: string,
  roomId?: string,
  status = ScheduledMatchStatus.Scheduled,
): ScheduledMatch {
  const scheduled = new ScheduledMatch(roundNumber, left, right);
  scheduled.roomId = roomId;
  scheduled.status = status;
  return scheduled;
}

const errorsOf = (issues: IScheduleIssue[]) => issues.filter((i) => i.severity === ScheduleIssueSeverity.Error);
const warningsOf = (issues: IScheduleIssue[]) => issues.filter((i) => i.severity === ScheduleIssueSeverity.Warning);

describe('TournamentRoom', () => {
  test('a new room is enabled and has an id and a token', () => {
    const room = new TournamentRoom('Room 101', 0);

    expect(room.name).toBe('Room 101');
    expect(room.enabled).toBe(true);
    expect(room.id).toMatch(/^room-[0-9a-f]{16}$/);
    expect(room.accessToken).toHaveLength(48);
  });

  test('ids and tokens are unique across rooms', () => {
    const rooms = makeRooms(['A', 'B', 'C', 'D', 'E']);

    expect(new Set(rooms.map((r) => r.id)).size).toBe(5);
    expect(new Set(rooms.map((r) => r.accessToken)).size).toBe(5);
  });

  test('regenerating a token replaces it and keeps the id', () => {
    const room = new TournamentRoom('Library', 0);
    const originalToken = room.accessToken;
    const originalId = room.id;

    room.regenerateToken();

    expect(room.accessToken).not.toBe(originalToken);
    expect(room.id).toBe(originalId);
  });

  test('renaming a room leaves its URL working', () => {
    const room = new TournamentRoom('Room 101', 0);
    const before = room.url('http://192.168.1.50:4732');

    room.name = 'Room 101 (upstairs)';

    // The URL is built from the id and token, not the name, so a rename can't break a paired
    // Chromebook.
    expect(room.url('http://192.168.1.50:4732')).toBe(before);
  });

  test('the room URL carries the room id and token', () => {
    const room = new TournamentRoom('Cafeteria Left', 0);

    const url = room.url('http://192.168.1.50:4732');

    expect(url).toBe(`http://192.168.1.50:4732/room/${room.id}?token=${room.accessToken}`);
  });

  test('a trailing slash on the server address does not double up', () => {
    const room = new TournamentRoom('Room 1', 0);

    expect(room.url('http://192.168.1.50:4732/')).not.toContain('//room/');
  });

  test('rooms sort by sort order then name', () => {
    const rooms = [new TournamentRoom('Zebra', 1), new TournamentRoom('Apple', 1), new TournamentRoom('First', 0)];

    expect(rooms.sort(TournamentRoom.compare).map((r) => r.name)).toEqual(['First', 'Apple', 'Zebra']);
  });
});

describe('TournamentRoom persistence', () => {
  test('a room survives a save and load round trip intact', () => {
    const room = new TournamentRoom('Science Lab', 3);
    room.description = 'Second floor, past the gym';
    room.enabled = false;

    const restored = TournamentRoom.fromYftFileObject(JSON.parse(JSON.stringify(room.toYftFileObject())));

    expect(restored).not.toBeNull();
    expect(restored?.id).toBe(room.id);
    expect(restored?.name).toBe('Science Lab');
    expect(restored?.description).toBe('Second floor, past the gym');
    expect(restored?.enabled).toBe(false);
    expect(restored?.accessToken).toBe(room.accessToken);
    expect(restored?.sortOrder).toBe(3);
  });

  test('the token is preserved so paired Chromebooks keep working after a reopen', () => {
    const room = new TournamentRoom('Room 104', 0);

    const restored = TournamentRoom.fromYftFileObject(room.toYftFileObject());

    expect(restored?.url('http://x')).toBe(room.url('http://x'));
  });

  test('a room with no stored token gets a fresh one rather than failing to load', () => {
    const restored = TournamentRoom.fromYftFileObject({ name: 'Room 9', enabled: true, sortOrder: 0 });

    expect(restored?.name).toBe('Room 9');
    expect(restored?.accessToken).toHaveLength(48);
  });

  test('a room defaults to enabled when the flag is absent', () => {
    expect(TournamentRoom.fromYftFileObject({ name: 'Room 9' })?.enabled).toBe(true);
  });

  test('unusable entries are rejected rather than producing a broken room', () => {
    expect(TournamentRoom.fromYftFileObject(null)).toBeNull();
    expect(TournamentRoom.fromYftFileObject({})).toBeNull();
    expect(TournamentRoom.fromYftFileObject({ name: 42 })).toBeNull();
  });
});

describe('room ordering', () => {
  test('normalizing gives consecutive sort orders with no gaps', () => {
    const rooms = [new TournamentRoom('C', 10), new TournamentRoom('A', 3), new TournamentRoom('B', 7)];

    const ordered = normalizeRoomOrder(rooms);

    expect(ordered.map((r) => r.name)).toEqual(['A', 'B', 'C']);
    expect(ordered.map((r) => r.sortOrder)).toEqual([0, 1, 2]);
  });

  test('moving a room down swaps it with the next one', () => {
    const rooms = makeRooms(['A', 'B', 'C']);

    const ordered = moveRoom(rooms, rooms[0].id, 1);

    expect(ordered.map((r) => r.name)).toEqual(['B', 'A', 'C']);
    expect(ordered.map((r) => r.sortOrder)).toEqual([0, 1, 2]);
  });

  test('moving the first room up does nothing', () => {
    const rooms = makeRooms(['A', 'B', 'C']);

    expect(moveRoom(rooms, rooms[0].id, -1).map((r) => r.name)).toEqual(['A', 'B', 'C']);
  });

  test('moving the last room down does nothing', () => {
    const rooms = makeRooms(['A', 'B', 'C']);

    expect(moveRoom(rooms, rooms[2].id, 1).map((r) => r.name)).toEqual(['A', 'B', 'C']);
  });

  test('moving an unknown room is a no-op', () => {
    const rooms = makeRooms(['A', 'B']);

    expect(moveRoom(rooms, 'nope', 1).map((r) => r.name)).toEqual(['A', 'B']);
  });

  test('only enabled rooms are offered to the allocator, in order', () => {
    const rooms = makeRooms(['A', 'B', 'C']);
    rooms[1].enabled = false;

    expect(allocatableRooms(rooms).map((r) => r.id)).toEqual([rooms[0].id, rooms[2].id]);
  });
});

describe('room deletion', () => {
  test('an unused room can be deleted', () => {
    const rooms = makeRooms(['Room 101']);

    const check = checkRoomDeletion(rooms[0], []);

    expect(check.canDelete).toBe(true);
    expect(check.affectedScheduledMatchIds).toEqual([]);
  });

  test('a room with only future games can be deleted, and reports what loses its room', () => {
    const rooms = makeRooms(['Room 101']);
    const scheduled = [makeScheduled(4, teamNames[0], teamNames[1], rooms[0].id)];

    const check = checkRoomDeletion(rooms[0], scheduled);

    expect(check.canDelete).toBe(true);
    expect(check.affectedScheduledMatchIds).toEqual([scheduled[0].id]);
  });

  test('a room that has hosted an accepted game cannot be deleted', () => {
    const rooms = makeRooms(['Room 101']);
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id, ScheduledMatchStatus.Accepted)];

    const check = checkRoomDeletion(rooms[0], scheduled);

    expect(check.canDelete).toBe(false);
    expect(check.reason).toContain('Disable the room instead');
  });

  test('a room with a submission awaiting review cannot be deleted', () => {
    const rooms = makeRooms(['Room 101']);
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id, ScheduledMatchStatus.Submitted)];

    expect(checkRoomDeletion(rooms[0], scheduled).canDelete).toBe(false);
  });

  test('a room with a game in progress cannot be deleted', () => {
    const rooms = makeRooms(['Room 101']);
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id, ScheduledMatchStatus.Playing)];

    const check = checkRoomDeletion(rooms[0], scheduled);

    expect(check.canDelete).toBe(false);
    expect(check.reason).toContain('in progress');
  });

  test('a room with a rejected result needing attention cannot be deleted', () => {
    const rooms = makeRooms(['Room 101']);
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id, ScheduledMatchStatus.NeedsAttention)];

    expect(checkRoomDeletion(rooms[0], scheduled).canDelete).toBe(false);
  });

  test('games in a different room do not block deletion', () => {
    const rooms = makeRooms(['Room 101', 'Room 102']);
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], rooms[1].id, ScheduledMatchStatus.Accepted)];

    expect(checkRoomDeletion(rooms[0], scheduled).canDelete).toBe(true);
  });
});

describe('ScheduledMatch', () => {
  test('a scheduled match starts as scheduled with no result', () => {
    const scheduled = new ScheduledMatch(3, teamNames[0], teamNames[1]);

    expect(scheduled.status).toBe(ScheduledMatchStatus.Scheduled);
    expect(scheduled.resultMatchId).toBeUndefined();
    expect(scheduled.isAccepted()).toBe(false);
    expect(scheduled.isPlayable()).toBe(true);
  });

  test('teams match in either order', () => {
    const scheduled = new ScheduledMatch(3, teamNames[0], teamNames[1]);

    expect(scheduled.matchesTeams(teamNames[0], teamNames[1])).toBe(true);
    expect(scheduled.matchesTeams(teamNames[1], teamNames[0])).toBe(true);
  });

  test('a different pair of teams does not match', () => {
    const scheduled = new ScheduledMatch(3, teamNames[0], teamNames[1]);

    expect(scheduled.matchesTeams(teamNames[0], teamNames[2])).toBe(false);
    expect(scheduled.matchesTeams(teamNames[2], teamNames[3])).toBe(false);
  });

  test('an accepted game is no longer playable, so a room cannot re-score it', () => {
    const scheduled = new ScheduledMatch(3, teamNames[0], teamNames[1]);

    scheduled.status = ScheduledMatchStatus.Accepted;
    scheduled.resultMatchId = 'Match_7';

    expect(scheduled.isAccepted()).toBe(true);
    expect(scheduled.isResolved()).toBe(true);
    expect(scheduled.isPlayable()).toBe(false);
  });

  test('a cancelled game is not playable', () => {
    const scheduled = new ScheduledMatch(3, teamNames[0], teamNames[1]);
    scheduled.status = ScheduledMatchStatus.Cancelled;

    expect(scheduled.isPlayable()).toBe(false);
  });

  test('it survives a save and load round trip, including the result link', () => {
    const scheduled = new ScheduledMatch(5, teamNames[0], teamNames[1]);
    scheduled.phaseCode = '2';
    scheduled.poolName = 'Playoff Pool 1';
    scheduled.roomId = 'room-abc';
    scheduled.status = ScheduledMatchStatus.Accepted;
    scheduled.resultMatchId = 'Match_12';
    scheduled.generated = true;

    const restored = ScheduledMatch.fromYftFileObject(JSON.parse(JSON.stringify(scheduled.toYftFileObject())));

    expect(restored).toEqual(scheduled);
  });

  test('an unrecognized status falls back to scheduled rather than staying invalid', () => {
    const restored = ScheduledMatch.fromYftFileObject({
      roundNumber: 1,
      leftTeamName: teamNames[0],
      rightTeamName: teamNames[1],
      status: 'somethingElse',
    });

    expect(restored?.status).toBe(ScheduledMatchStatus.Scheduled);
  });

  test('unusable entries are rejected', () => {
    expect(ScheduledMatch.fromYftFileObject(null)).toBeNull();
    expect(ScheduledMatch.fromYftFileObject({ roundNumber: 1 })).toBeNull();
    expect(ScheduledMatch.fromYftFileObject({ roundNumber: 'x', leftTeamName: 'A', rightTeamName: 'B' })).toBeNull();
    expect(ScheduledMatch.fromYftFileObject({ roundNumber: 1, leftTeamName: '', rightTeamName: 'B' })).toBeNull();
  });
});

describe('validateDraft', () => {
  const rooms = makeRooms(['Room 101', 'Room 102']);

  test('a clean draft has no issues', () => {
    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[0].id },
      [],
      rooms,
    );

    expect(issues).toEqual([]);
  });

  test('a team cannot play itself', () => {
    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[0] },
      [],
      rooms,
    );

    expect(errorsOf(issues)[0].message).toContain('cannot play itself');
    expect(hasBlockingIssue(issues)).toBe(true);
  });

  test('both teams must be chosen', () => {
    const issues = validateDraft({ roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: '' }, [], rooms);

    expect(errorsOf(issues)[0].message).toContain('Both teams must be chosen');
  });

  test('a team already scheduled in the round is rejected', () => {
    const existing = [makeScheduled(1, teamNames[0], teamNames[2], rooms[0].id)];

    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[1].id },
      existing,
      rooms,
    );

    expect(errorsOf(issues)[0].message).toContain(`${teamNames[0]} is already scheduled in round 1`);
    expect(errorsOf(issues)[0].scheduledMatchIds).toEqual([existing[0].id]);
  });

  test('the same teams in a different round are fine', () => {
    const existing = [makeScheduled(1, teamNames[0], teamNames[2], rooms[0].id)];

    const issues = validateDraft(
      { roundNumber: 2, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[0].id },
      existing,
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
  });

  test('a room already used in the round is rejected', () => {
    const existing = [makeScheduled(1, teamNames[2], teamNames[3], rooms[0].id)];

    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[0].id },
      existing,
      rooms,
    );

    expect(errorsOf(issues)[0].message).toContain('already has a game in round 1');
  });

  test('a disabled room cannot be given a new game', () => {
    const disabled = makeRooms(['Room 101']);
    disabled[0].enabled = false;

    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: disabled[0].id },
      [],
      disabled,
    );

    expect(errorsOf(issues)[0].message).toContain('is disabled');
  });

  test('a room that no longer exists is rejected', () => {
    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: 'gone' },
      [],
      rooms,
    );

    expect(errorsOf(issues)[0].message).toContain('no longer exists');
  });

  test('a cancelled game does not occupy its team or room slot', () => {
    const existing = [makeScheduled(1, teamNames[0], teamNames[2], rooms[0].id, ScheduledMatchStatus.Cancelled)];

    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[0].id },
      existing,
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
  });

  test('a repeat matchup is a warning, not an error, since a double round robin is legitimate', () => {
    const existing = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id)];

    const issues = validateDraft(
      { roundNumber: 4, leftTeamName: teamNames[1], rightTeamName: teamNames[0], roomId: rooms[0].id },
      existing,
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
    expect(warningsOf(issues)[0].message).toContain('already scheduled to play');
    expect(hasBlockingIssue(issues)).toBe(false);
  });

  test('editing a game does not make it conflict with itself', () => {
    const existing = [makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id)];

    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1], roomId: rooms[0].id },
      existing,
      rooms,
      existing[0].id,
    );

    expect(issues).toEqual([]);
  });

  test('a game with no room assigned yet is allowed', () => {
    const issues = validateDraft(
      { roundNumber: 1, leftTeamName: teamNames[0], rightTeamName: teamNames[1] },
      [],
      rooms,
    );

    expect(issues).toEqual([]);
  });
});

describe('validateSchedule', () => {
  const rooms = makeRooms(['Room 101', 'Room 102']);

  test('a valid round reports nothing', () => {
    const scheduled = [
      makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id),
      makeScheduled(1, teamNames[2], teamNames[3], rooms[1].id),
    ];

    expect(validateSchedule(scheduled, rooms)).toEqual([]);
  });

  test('a double-booked team is an error naming the round', () => {
    const scheduled = [
      makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id),
      makeScheduled(1, teamNames[0], teamNames[2], rooms[1].id),
    ];

    const issues = errorsOf(validateSchedule(scheduled, rooms));

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe(`Round 1: ${teamNames[0]} is scheduled in 2 games.`);
  });

  test('a double-booked room is an error', () => {
    const scheduled = [
      makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id),
      makeScheduled(1, teamNames[2], teamNames[3], rooms[0].id),
    ];

    expect(errorsOf(validateSchedule(scheduled, rooms))[0].message).toBe('Round 1: Room 101 has 2 games.');
  });

  test('a game assigned to a deleted room is an error', () => {
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], 'deleted-room')];

    expect(errorsOf(validateSchedule(scheduled, rooms))[0].message).toContain('no longer exists');
  });

  test('a game in a disabled room is a warning', () => {
    const withDisabled = makeRooms(['Room 101']);
    withDisabled[0].enabled = false;
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1], withDisabled[0].id)];

    const issues = validateSchedule(scheduled, withDisabled);

    expect(errorsOf(issues)).toEqual([]);
    expect(warningsOf(issues).some((i) => i.message.includes('disabled'))).toBe(true);
  });

  test('games without a room are a warning', () => {
    const scheduled = [makeScheduled(1, teamNames[0], teamNames[1])];

    expect(warningsOf(validateSchedule(scheduled, rooms))[0].message).toContain('not assigned to a room');
  });

  test('cancelled games are ignored entirely', () => {
    const scheduled = [
      makeScheduled(1, teamNames[0], teamNames[1], rooms[0].id, ScheduledMatchStatus.Cancelled),
      makeScheduled(1, teamNames[0], teamNames[2], rooms[0].id),
    ];

    expect(errorsOf(validateSchedule(scheduled, rooms))).toEqual([]);
  });
});

describe('generateSchedule', () => {
  test('an 8-team pool over 7 rounds and 4 rooms produces a full valid schedule', () => {
    const rooms = makeRooms(['101', '102', '103', '104']);
    const teamIds = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);

    const { scheduledMatches, issues } = generateSchedule(
      {
        pools: [{ poolId: 'pool-1', teamIds, roundRobins: 1 }],
        roundNumbers: [1, 2, 3, 4, 5, 6, 7],
        phaseCode: '1',
        poolNames: { 'pool-1': 'Prelim Pool 1' },
      },
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
    expect(scheduledMatches).toHaveLength(28);
    expect(new Set(scheduledMatches.map((m) => m.roundNumber))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    expect(scheduledMatches.every((m) => m.roomId !== undefined)).toBe(true);
    expect(scheduledMatches.every((m) => m.generated)).toBe(true);
    expect(scheduledMatches[0].poolName).toBe('Prelim Pool 1');
    expect(scheduledMatches[0].phaseCode).toBe('1');
  });

  test('the generated schedule passes whole-schedule validation', () => {
    const rooms = makeRooms(['101', '102', '103', '104']);
    const teamIds = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);

    const { scheduledMatches } = generateSchedule(
      { pools: [{ poolId: 'p', teamIds, roundRobins: 1 }], roundNumbers: [1, 2, 3, 4, 5, 6, 7], phaseCode: '1' },
      rooms,
    );

    expect(errorsOf(validateSchedule(scheduledMatches, rooms))).toEqual([]);
  });

  test('generated pairings land on the phase’s real round numbers', () => {
    // A playoff phase starting at round 8 must produce games in rounds 8-10, not 1-3.
    const rooms = makeRooms(['101', '102']);

    const { scheduledMatches } = generateSchedule(
      {
        pools: [{ poolId: 'p', teamIds: teamNames.slice(0, 4), roundRobins: 1 }],
        roundNumbers: [8, 9, 10],
        phaseCode: '2',
      },
      rooms,
    );

    expect(new Set(scheduledMatches.map((m) => m.roundNumber))).toEqual(new Set([8, 9, 10]));
  });

  test('too few rounds is an error and produces nothing', () => {
    const rooms = makeRooms(['101', '102', '103', '104']);
    const teamIds = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);

    const { scheduledMatches, issues } = generateSchedule(
      { pools: [{ poolId: 'p', teamIds, roundRobins: 1 }], roundNumbers: [1, 2, 3], phaseCode: '1' },
      rooms,
    );

    expect(scheduledMatches).toEqual([]);
    expect(errorsOf(issues)[0].message).toContain('needs 7 rounds but the phase only has 3');
  });

  test('too few rooms is an error and produces nothing rather than a half-placed schedule', () => {
    const rooms = makeRooms(['101', '102']);
    const teamIds = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);

    const { scheduledMatches, issues } = generateSchedule(
      { pools: [{ poolId: 'p', teamIds, roundRobins: 1 }], roundNumbers: [1, 2, 3, 4, 5, 6, 7], phaseCode: '1' },
      rooms,
    );

    expect(scheduledMatches).toEqual([]);
    expect(errorsOf(issues)[0].message).toContain('needs 4 rooms but only 2 enabled rooms are available');
  });

  test('disabled rooms do not count toward available rooms', () => {
    const rooms = makeRooms(['101', '102', '103', '104']);
    rooms[3].enabled = false;
    const teamIds = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);

    const { issues } = generateSchedule(
      { pools: [{ poolId: 'p', teamIds, roundRobins: 1 }], roundNumbers: [1, 2, 3, 4, 5, 6, 7], phaseCode: '1' },
      rooms,
    );

    expect(errorsOf(issues)[0].message).toContain('only 3 enabled rooms are available');
  });

  test('a disabled room is never assigned a generated game', () => {
    const rooms = makeRooms(['101', '102', '103']);
    rooms[1].enabled = false;

    const { scheduledMatches } = generateSchedule(
      {
        pools: [{ poolId: 'p', teamIds: teamNames.slice(0, 4), roundRobins: 1 }],
        roundNumbers: [1, 2, 3],
        phaseCode: '1',
      },
      rooms,
    );

    expect(scheduledMatches.some((m) => m.roomId === rooms[1].id)).toBe(false);
  });

  test('two pools generate side by side into separate room blocks', () => {
    const rooms = makeRooms(['101', '102', '103', '104']);

    const { scheduledMatches, issues } = generateSchedule(
      {
        pools: [
          { poolId: 'a', teamIds: teamNames.slice(0, 4), roundRobins: 1 },
          { poolId: 'b', teamIds: ['W', 'X', 'Y', 'Z'], roundRobins: 1 },
        ],
        roundNumbers: [1, 2, 3],
        phaseCode: '1',
        poolNames: { a: 'Pool A', b: 'Pool B' },
      },
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
    expect(scheduledMatches).toHaveLength(12);
    const poolARooms = new Set(scheduledMatches.filter((m) => m.poolName === 'Pool A').map((m) => m.roomId));
    const poolBRooms = new Set(scheduledMatches.filter((m) => m.poolName === 'Pool B').map((m) => m.roomId));
    for (const roomId of poolARooms) expect(poolBRooms.has(roomId)).toBe(false);
  });

  test('a double round robin generates twice the games', () => {
    const rooms = makeRooms(['101', '102']);

    const { scheduledMatches, issues } = generateSchedule(
      {
        pools: [{ poolId: 'p', teamIds: teamNames.slice(0, 4), roundRobins: 2 }],
        roundNumbers: [1, 2, 3, 4, 5, 6],
        phaseCode: '1',
      },
      rooms,
    );

    expect(errorsOf(issues)).toEqual([]);
    expect(scheduledMatches).toHaveLength(12);
  });

  test('generation is deterministic', () => {
    const rooms = makeRooms(['101', '102']);
    const request = {
      pools: [{ poolId: 'p', teamIds: teamNames.slice(0, 4), roundRobins: 1 }],
      roundNumbers: [1, 2, 3],
      phaseCode: '1',
    };

    const first = generateSchedule(request, rooms).scheduledMatches;
    const second = generateSchedule(request, rooms).scheduledMatches;

    // Ids are random by design, so compare the schedule itself.
    const shape = (matches: ScheduledMatch[]) =>
      matches.map((m) => `${m.roundNumber}:${m.leftTeamName}:${m.rightTeamName}:${m.roomId}`);
    expect(shape(first)).toEqual(shape(second));
  });
});

describe('summarizeRound', () => {
  const rooms = makeRooms(['101', '102', '103', '104']);

  function eightGameRound(): ScheduledMatch[] {
    return [
      makeScheduled(4, 'A', 'B', rooms[0].id, ScheduledMatchStatus.Playing),
      makeScheduled(4, 'C', 'D', rooms[1].id, ScheduledMatchStatus.Playing),
      makeScheduled(4, 'E', 'F', rooms[2].id, ScheduledMatchStatus.Submitted),
      makeScheduled(4, 'G', 'H', rooms[3].id, ScheduledMatchStatus.Accepted),
      makeScheduled(4, 'I', 'J', undefined, ScheduledMatchStatus.Scheduled),
    ];
  }

  test('it counts each state', () => {
    const summary = summarizeRound(eightGameRound(), 4);

    expect(summary.expected).toBe(5);
    expect(summary.playing).toBe(2);
    expect(summary.submitted).toBe(1);
    expect(summary.accepted).toBe(1);
    expect(summary.waiting).toBe(1);
    expect(summary.roomsAssigned).toBe(4);
    expect(summary.complete).toBe(false);
  });

  test('a round is complete only once every expected game is accepted', () => {
    const scheduled = eightGameRound();
    for (const match of scheduled) match.status = ScheduledMatchStatus.Accepted;

    expect(summarizeRound(scheduled, 4).complete).toBe(true);
  });

  test('a cancelled game does not stop a round from completing', () => {
    const scheduled = eightGameRound();
    for (const match of scheduled) match.status = ScheduledMatchStatus.Accepted;
    scheduled[0].status = ScheduledMatchStatus.Cancelled;

    const summary = summarizeRound(scheduled, 4);

    expect(summary.expected).toBe(4);
    expect(summary.cancelled).toBe(1);
    expect(summary.complete).toBe(true);
  });

  test('a round made entirely of cancelled games is resolved', () => {
    const scheduled = eightGameRound();
    for (const match of scheduled) match.status = ScheduledMatchStatus.Cancelled;

    const summary = summarizeRound(scheduled, 4);

    expect(summary.expected).toBe(0);
    expect(summary.complete).toBe(true);
  });

  test('a submitted game still awaiting review keeps the round incomplete', () => {
    const scheduled = eightGameRound();
    for (const match of scheduled) match.status = ScheduledMatchStatus.Accepted;
    scheduled[2].status = ScheduledMatchStatus.Submitted;

    expect(summarizeRound(scheduled, 4).complete).toBe(false);
  });

  test('a round with no games is not complete', () => {
    expect(summarizeRound([], 4).complete).toBe(false);
    expect(summarizeRound([], 4).expected).toBe(0);
  });

  test('other rounds are ignored', () => {
    const scheduled = eightGameRound().concat(makeScheduled(5, 'A', 'B', rooms[0].id));

    expect(summarizeRound(scheduled, 4).expected).toBe(5);
  });

  test('rounds with games are listed in order', () => {
    const scheduled = [makeScheduled(7, 'A', 'B'), makeScheduled(2, 'C', 'D'), makeScheduled(7, 'E', 'F')];

    expect(roundsWithGames(scheduled)).toEqual([2, 7]);
  });
});

describe('generated schedule application', () => {
  const rooms = makeRooms(['101', '102']);

  test('replaces future assignments but retains accepted history', () => {
    const accepted = makeScheduled(1, 'A', 'B', rooms[0].id, ScheduledMatchStatus.Accepted);
    accepted.resultMatchId = 'Match_1';
    const future = makeScheduled(2, 'A', 'C', rooms[0].id, ScheduledMatchStatus.Ready);
    const laterFuture = makeScheduled(5, 'C', 'D', rooms[1].id, ScheduledMatchStatus.Scheduled);
    const generated = makeScheduled(2, 'B', 'D', rooms[1].id);

    const result = mergeGeneratedSchedule([accepted, future, laterFuture], [generated], rooms);

    expect(result.preservedMatches).toEqual([accepted, laterFuture]);
    expect(result.replacedFutureCount).toBe(1);
    expect(result.scheduledMatches).toEqual([accepted, generated, laterFuture]);
    expect(result.scheduledMatches.find((match) => match.resultMatchId === 'Match_1')).toBe(accepted);
  });

  test('does not add a generated duplicate for an accepted pairing', () => {
    const accepted = makeScheduled(1, 'A', 'B', rooms[0].id, ScheduledMatchStatus.Accepted);
    const generated = makeScheduled(1, 'B', 'A', rooms[1].id);

    const result = mergeGeneratedSchedule([accepted], [generated], rooms);

    expect(result.scheduledMatches).toHaveLength(1);
    expect(result.scheduledMatches[0]).toBe(accepted);
  });

  test('detects a missing configured pairing before rebracketing', () => {
    const phase = new Phase(PhaseTypes.Prelim, 1, 3, 'prelim');
    const syntheticPool = new Pool(3, 1, 'Pool', false, 1, 3);
    syntheticPool.roundRobins = 1;
    syntheticPool.poolTeams = ['A', 'B', 'C'].map((name) => new PoolTeam(new Team(name)));
    phase.pools = [syntheticPool];

    const onlyFirstGame = [makeScheduled(1, 'A', 'B', rooms[0].id, ScheduledMatchStatus.Accepted)];
    const issues = validatePhaseScheduleCompleteness(phase, onlyFirstGame);

    expect(issues.map((issue) => issue.message)).toEqual([
      'Round 1 is missing C vs B.',
      'Round 2 is missing C vs A.',
      'Round 3 is missing A vs B.',
    ]);
  });
});
