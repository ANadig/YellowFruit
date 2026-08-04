/**
 * Rooms and scheduled matches have to survive the real save/load path, not just their own
 * `toYftFileObject`. These tests go through `Tournament.toFileObject`, a JSON round trip, and
 * `FileParser.parseYftTournament`, which is exactly what happens when a director saves a .yft file
 * and reopens it.
 */
import { describe, expect, test } from 'vitest';
import FileParser from '../renderer/DataModel/FileParsing';
import { IYftFileTournament } from '../renderer/DataModel/Tournament';
import { ScheduledMatch, ScheduledMatchStatus } from '../renderer/DataModel/ScheduledMatch';
import { TournamentRoom } from '../renderer/DataModel/TournamentRoom';
import { makeTestTournament, testTeamNames } from './TestFixtures';

/** Save a tournament to a .yft-shaped object and read it back, as opening a saved file would */
function saveAndReopen(configure: (tourn: ReturnType<typeof makeTestTournament>) => void) {
  const original = makeTestTournament();
  original.appVersion = '4.0.18';
  configure(original);

  const written = JSON.parse(JSON.stringify(original.toFileObject())) as IYftFileTournament;

  return { original, written, reopened: reopen(written) };
}

/** Parse a written .yft object, failing the test rather than returning null */
function reopen(written: IYftFileTournament) {
  const reopened = new FileParser({}).parseYftTournament(written, '4.0.18');
  if (reopened === null) throw new Error('the tournament file failed to parse');
  return reopened;
}

describe('rooms in the .yft file', () => {
  test('rooms are written and read back with their ids and tokens', () => {
    const { original, reopened } = saveAndReopen((tourn) => {
      tourn.rooms = [
        new TournamentRoom('Room 101', 0),
        new TournamentRoom('Library', 1),
        new TournamentRoom('Cafeteria Left', 2),
      ];
    });

    expect(reopened.rooms).toHaveLength(3);
    expect(reopened.rooms.map((r) => r.name)).toEqual(['Room 101', 'Library', 'Cafeteria Left']);
    expect(reopened.rooms.map((r) => r.id)).toEqual(original.rooms.map((r) => r.id));
    expect(reopened.rooms.map((r) => r.accessToken)).toEqual(original.rooms.map((r) => r.accessToken));
  });

  test('a paired Chromebook’s URL still works after a save and reopen', () => {
    const { original, reopened } = saveAndReopen((tourn) => {
      tourn.rooms = [new TournamentRoom('Room 101', 0)];
    });

    expect(reopened.rooms[0].url('http://192.168.1.50:4732')).toBe(original.rooms[0].url('http://192.168.1.50:4732'));
  });

  test('a disabled room stays disabled', () => {
    const { reopened } = saveAndReopen((tourn) => {
      const room = new TournamentRoom('Broken Projector Room', 0);
      room.enabled = false;
      room.description = 'No power outlet';
      tourn.rooms = [room];
    });

    expect(reopened.rooms[0].enabled).toBe(false);
    expect(reopened.rooms[0].description).toBe('No power outlet');
  });

  test('rooms come back in sort order', () => {
    const { reopened } = saveAndReopen((tourn) => {
      tourn.rooms = [new TournamentRoom('Third', 2), new TournamentRoom('First', 0), new TournamentRoom('Second', 1)];
    });

    expect(reopened.rooms.map((r) => r.name)).toEqual(['First', 'Second', 'Third']);
  });

  test('a tournament with no rooms writes no rooms key at all', () => {
    // A tournament that never touched the server should write the same file it always did.
    const { written } = saveAndReopen(() => {});

    expect(written.YfData.rooms).toBeUndefined();
    expect(written.YfData.scheduledMatches).toBeUndefined();
  });

  test('opening a file that predates rooms yields an empty list rather than undefined', () => {
    const { written } = saveAndReopen(() => {});
    delete written.YfData.rooms;

    const reopened = reopen(written);

    expect(reopened.rooms).toEqual([]);
    expect(reopened.scheduledMatches).toEqual([]);
  });

  test('a corrupt room entry is skipped without failing the whole file', () => {
    const { written } = saveAndReopen((tourn) => {
      tourn.rooms = [new TournamentRoom('Good Room', 0)];
    });
    written.YfData.rooms = [{ name: 42 } as any, ...(written.YfData.rooms ?? [])];

    const reopened = reopen(written);

    expect(reopened.rooms.map((r) => r.name)).toEqual(['Good Room']);
  });
});

describe('scheduled matches in the .yft file', () => {
  test('a scheduled match round-trips with its room, status, and result link', () => {
    const { original, reopened } = saveAndReopen((tourn) => {
      const room = new TournamentRoom('Room 101', 0);
      tourn.rooms = [room];

      const scheduled = new ScheduledMatch(1, testTeamNames[0], testTeamNames[1]);
      scheduled.phaseCode = '1';
      scheduled.poolName = 'Prelim Pool 1';
      scheduled.roomId = room.id;
      scheduled.status = ScheduledMatchStatus.Accepted;
      scheduled.resultMatchId = 'Match_3';
      scheduled.generated = true;
      tourn.scheduledMatches = [scheduled];
    });

    expect(reopened.scheduledMatches).toHaveLength(1);
    expect(reopened.scheduledMatches[0]).toEqual(original.scheduledMatches[0]);
    expect(reopened.scheduledMatches[0].roomId).toBe(reopened.rooms[0].id);
  });

  test('the accepted result link survives, so a duplicate accept stays detectable', () => {
    const { reopened } = saveAndReopen((tourn) => {
      const scheduled = new ScheduledMatch(2, testTeamNames[0], testTeamNames[1]);
      scheduled.status = ScheduledMatchStatus.Accepted;
      scheduled.resultMatchId = 'Match_9';
      tourn.scheduledMatches = [scheduled];
    });

    expect(reopened.scheduledMatches[0].isAccepted()).toBe(true);
    expect(reopened.scheduledMatches[0].resultMatchId).toBe('Match_9');
    expect(reopened.scheduledMatches[0].isPlayable()).toBe(false);
  });

  test('a submitted final awaiting review survives a restart', () => {
    const { reopened } = saveAndReopen((tourn) => {
      const scheduled = new ScheduledMatch(3, testTeamNames[2], testTeamNames[3]);
      scheduled.status = ScheduledMatchStatus.Submitted;
      tourn.scheduledMatches = [scheduled];
    });

    expect(reopened.scheduledMatches[0].status).toBe(ScheduledMatchStatus.Submitted);
  });

  test('a full round of scheduled matches round-trips', () => {
    const { reopened } = saveAndReopen((tourn) => {
      tourn.rooms = [new TournamentRoom('101', 0), new TournamentRoom('102', 1)];
      tourn.scheduledMatches = [
        (() => {
          const m = new ScheduledMatch(1, testTeamNames[0], testTeamNames[1]);
          m.roomId = tourn.rooms[0].id;
          return m;
        })(),
        (() => {
          const m = new ScheduledMatch(1, testTeamNames[2], testTeamNames[3]);
          m.roomId = tourn.rooms[1].id;
          return m;
        })(),
      ];
    });

    expect(reopened.scheduledMatches).toHaveLength(2);
    expect(new Set(reopened.scheduledMatches.map((m) => m.roomId)).size).toBe(2);
  });

  test('a corrupt scheduled match is skipped without failing the whole file', () => {
    const { written } = saveAndReopen((tourn) => {
      tourn.scheduledMatches = [new ScheduledMatch(1, testTeamNames[0], testTeamNames[1])];
    });
    written.YfData.scheduledMatches = [
      { roundNumber: 'not a round' } as any,
      ...(written.YfData.scheduledMatches ?? []),
    ];

    const reopened = reopen(written);

    expect(reopened.scheduledMatches).toHaveLength(1);
  });
});

describe('QBJ export stays clean', () => {
  test('rooms and scheduled matches are not written to QBJ', () => {
    const tourn = makeTestTournament();
    tourn.rooms = [new TournamentRoom('Room 101', 0)];
    tourn.scheduledMatches = [new ScheduledMatch(1, testTeamNames[0], testTeamNames[1])];

    // qbjOnly is what the QBJ export path passes; YellowFruit-specific metadata must not leak into a
    // file other programs will read.
    const qbj = JSON.stringify(tourn.toFileObject(true));

    expect(qbj).not.toContain('accessToken');
    expect(qbj).not.toContain('scheduledMatches');
    expect(qbj).not.toContain('YfData');
  });
});
