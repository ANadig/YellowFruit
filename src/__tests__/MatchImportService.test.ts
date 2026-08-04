import { describe, expect, test } from 'vitest';
import MatchImportService, { invalidJsonMessage } from '../renderer/Services/MatchImportService';
import { ImportResultStatus } from '../renderer/DataModel/MatchImportResult';
import MatchImportResultsManager from '../renderer/Modal Managers/MatchImportResultsManager';
import { StatsValidity } from '../renderer/DataModel/Match';
import { makeModaqQbjMatch, makeStandardModaqMatch, makeTestTournament, testTeamNames } from './TestFixtures';

/** Run one QBJ payload through the service */
function importOne(tournament: ReturnType<typeof makeTestTournament>, payload: unknown, filePath = 'game.qbj') {
  const contents = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return new MatchImportService(tournament).importMatches([{ filePath, fileContents: contents }]);
}

describe('valid MODAQ QBJ match', () => {
  test('parses to a successful result with the right teams and scores', () => {
    const tourn = makeTestTournament();
    const { results, hadInvalidJson } = importOne(tourn, makeStandardModaqMatch(1));

    expect(hadInvalidJson).toBe(false);
    expect(results).toHaveLength(1);

    const [result] = results;
    expect(result.status).toBe(ImportResultStatus.Success);
    expect(result.messages).toHaveLength(0);
    expect(result.proceedWithImport).toBe(true);
    expect(result.match?.leftTeam.team?.name).toBe(testTeamNames[0]);
    expect(result.match?.rightTeam.team?.name).toBe(testTeamNames[1]);
    expect(result.match?.leftTeam.points).toBe(265);
    expect(result.match?.rightTeam.points).toBe(155);
    expect(result.match?.tossupsRead).toBe(20);
  });

  test('records the source label so the statskeeper can see where it came from', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(1), 'Room 3 (session abc)');

    expect(results[0].filePath).toBe('Room 3 (session abc)');
  });

  test('does not insert anything into the tournament', () => {
    const tourn = makeTestTournament();
    importOne(tourn, makeStandardModaqMatch(1));

    // Two-stage safety model: parsing must never mutate the schedule. Only the user's explicit
    // accept (via MatchImportResultsManager) is allowed to add a match to a round.
    expect(tourn.getRoundObjByNumber(1)?.matches).toHaveLength(0);
  });
});

describe('MODAQ _round handling', () => {
  test('uses the _round value from the payload when no round is supplied', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(3));

    expect(results[0].round?.number).toBe(3);
    expect(results[0].status).toBe(ImportResultStatus.Success);
  });

  test('an explicit round wins over _round', () => {
    const tourn = makeTestTournament();
    const round2 = tourn.getRoundObjByNumber(2);
    const service = new MatchImportService(tourn);
    const { results } = service.importMatches(
      [{ filePath: 'game.qbj', fileContents: JSON.stringify(makeStandardModaqMatch(3)) }],
      round2,
    );

    expect(results[0].round?.number).toBe(2);
  });

  test('a missing _round is a fatal error, because MODAQ custom exports omit it', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(undefined));

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
    expect(results[0].messages[0]).toMatch(/round/i);
    expect(results[0].proceedWithImport).toBe(false);
  });
});

describe('unknown round', () => {
  test('a round number outside the schedule is a fatal error', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(99));

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
    expect(results[0].messages[0]).toBe("Couldn't determine a round for the game in this file");
    expect(results[0].match).toBeUndefined();
  });
});

describe('unknown team', () => {
  test('a team that is not in the tournament is a fatal error naming the team', () => {
    const tourn = makeTestTournament();
    const match = makeModaqQbjMatch({
      round: 1,
      left: {
        name: 'Zzyzx Institute of Nothing',
        bonusPoints: 100,
        players: [{ name: 'Somebody', tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[1],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[1]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    const { results } = importOne(tourn, match);

    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
    expect(results[0].messages[0]).toContain('Zzyzx Institute of Nothing');
    expect(results[0].proceedWithImport).toBe(false);
  });

  test('near-miss team names still resolve, since YF matches on string similarity', () => {
    const tourn = makeTestTournament();
    const match = makeModaqQbjMatch({
      round: 1,
      left: {
        name: 'Ninety Six A ', // trailing space
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[1],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[1]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    const { results } = importOne(tourn, match);

    expect(results[0].match?.leftTeam.team?.name).toBe(testTeamNames[0]);
  });
});

describe('malformed QBJ', () => {
  test('invalid JSON aborts the whole batch without producing results', () => {
    const tourn = makeTestTournament();
    const { results, hadInvalidJson } = importOne(tourn, '{ this is not json ');

    expect(hadInvalidJson).toBe(true);
    expect(results).toHaveLength(0);
  });

  test('one bad payload discards the good ones in the same batch, as manual import always has', () => {
    const tourn = makeTestTournament();
    const batch = new MatchImportService(tourn).importMatches([
      { filePath: 'good.qbj', fileContents: JSON.stringify(makeStandardModaqMatch(1)) },
      { filePath: 'bad.qbj', fileContents: 'not json at all' },
    ]);

    expect(batch.hadInvalidJson).toBe(true);
    expect(batch.results).toHaveLength(0);
  });

  test('an empty batch is a no-op', () => {
    const tourn = makeTestTournament();
    const batch = new MatchImportService(tourn).importMatches([]);

    expect(batch.results).toHaveLength(0);
    expect(batch.hadInvalidJson).toBe(false);
  });

  test('a JSON payload with no recognizable match data is fatal, not a crash', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, { hello: 'world' });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
  });

  test('invalidJsonMessage is the message the UI shows for unparseable payloads', () => {
    expect(invalidJsonMessage).toBe('This file does not contain valid JSON.');
  });
});

describe('duplicate team/game conditions', () => {
  test('two games for the same team in one round produce an overrideable warning', () => {
    const tourn = makeTestTournament();
    const secondGame = makeModaqQbjMatch({
      round: 1,
      left: {
        name: testTeamNames[0], // already playing in the other round-1 game
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 1`, tossupsHeard: 20, buzzes: [[10, 10]] }],
      },
      right: {
        name: testTeamNames[2],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[2]} Player 1`, tossupsHeard: 20, buzzes: [[10, 10]] }],
      },
    });

    const batch = new MatchImportService(tourn).importMatches([
      { filePath: 'a.qbj', fileContents: JSON.stringify(makeStandardModaqMatch(1)) },
      { filePath: 'b.qbj', fileContents: JSON.stringify(secondGame) },
    ]);

    expect(batch.results).toHaveLength(2);
    const dupResult = batch.results[1];
    expect(dupResult.status).toBe(ImportResultStatus.Warning);
    expect(dupResult.messages.join(' ')).toContain(testTeamNames[0]);
    // A warning is overrideable, so the user is still allowed to go ahead with it.
    expect(dupResult.proceedWithImport).toBe(true);
  });

  test('a team playing itself is an error', () => {
    const tourn = makeTestTournament();
    const match = makeModaqQbjMatch({
      round: 1,
      left: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 2`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    const { results } = importOne(tourn, match);

    expect(results[0].status).toBe(ImportResultStatus.ErrNonFatal);
    expect(results[0].proceedWithImport).toBe(false);
  });

  test('a match against a team already scheduled in that round warns about replaying', () => {
    const tourn = makeTestTournament();
    // Accept a round-1 game first, so the round genuinely contains it.
    const first = importOne(tourn, makeStandardModaqMatch(1));
    const mgr = new MatchImportResultsManager();
    mgr.openModal(first.results, undefined);
    mgr.closeModal(true);
    expect(tourn.getRoundObjByNumber(1)?.matches).toHaveLength(1);

    // Now importing the same pairing again should be flagged.
    const second = importOne(tourn, makeStandardModaqMatch(1));
    expect(second.results[0].status).not.toBe(ImportResultStatus.Success);
  });
});

describe('whole-qbj file import', () => {
  /** A minimal but schema-valid qbj file containing one match in round 2 */
  function wholeFile() {
    return {
      version: '2.1.1',
      objects: [
        {
          type: 'Tournament',
          name: 'Some Other Tournament',
          phases: [
            {
              name: 'Prelims',
              rounds: [{ name: '2', matches: [makeStandardModaqMatch()] }],
            },
          ],
        },
      ],
    };
  }

  test('matches nested in a qbj tournament object are found and validated', () => {
    const tourn = makeTestTournament();
    const { results, hadInvalidJson } = importOne(tourn, wholeFile(), 'whole.qbj');

    expect(hadInvalidJson).toBe(false);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.Success);
    expect(results[0].round?.number).toBe(2);
    expect(results[0].match?.leftTeam.points).toBe(265);
  });

  test('an unsupported schema version is rejected for the whole file', () => {
    const tourn = makeTestTournament();
    const file = { ...wholeFile(), version: '1.0.0' };
    const { results } = importOne(tourn, file, 'whole.qbj');

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
    expect(results[0].messages[0]).toContain("doesn't use a supported version");
  });

  test('a qbj file with no Match objects is rejected', () => {
    const tourn = makeTestTournament();
    const file = {
      version: '2.1.1',
      objects: [{ type: 'Tournament', name: 'Empty', phases: [{ name: 'Prelims', rounds: [] }] }],
    };
    const { results } = importOne(tourn, file, 'empty.qbj');

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe(ImportResultStatus.FatalErr);
    expect(results[0].messages[0]).toContain('contains no Match objects');
  });
});

describe('successful import still behaves like the old manual import path', () => {
  test('accepting a parsed result adds the match to the round and labels its source', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(2), '/tmp/exports/round2game.qbj');

    const round2 = tourn.getRoundObjByNumber(2);
    expect(round2?.matches).toHaveLength(0);

    // This is exactly what TournamentManager.closeMatchImportModal(true) drives.
    const mgr = new MatchImportResultsManager();
    mgr.openModal(results, undefined);
    mgr.closeModal(true);

    expect(round2?.matches).toHaveLength(1);
    const inserted = round2!.matches[0];
    expect(inserted.leftTeam.team?.name).toBe(testTeamNames[0]);
    expect(inserted.rightTeam.team?.name).toBe(testTeamNames[1]);
    expect(inserted.leftTeam.points).toBe(265);
    // The file name (not the full path) is what shows up in the UI.
    expect(inserted.importedFile).toBe('round2game.qbj');
    expect(inserted.statsValidity).toBe(StatsValidity.valid);
  });

  test('declining a parsed result leaves the round untouched', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(2));

    const mgr = new MatchImportResultsManager();
    mgr.openModal(results, undefined);
    mgr.setProceedWithImport(results[0], false);
    mgr.closeModal(true);

    expect(tourn.getRoundObjByNumber(2)?.matches).toHaveLength(0);
  });

  test('closing without saving never inserts, even for a clean match', () => {
    const tourn = makeTestTournament();
    const { results } = importOne(tourn, makeStandardModaqMatch(2));

    const mgr = new MatchImportResultsManager();
    mgr.openModal(results, undefined);
    mgr.closeModal(false);

    expect(tourn.getRoundObjByNumber(2)?.matches).toHaveLength(0);
  });

  test('a match accepted despite non-fatal errors is omitted from stats', () => {
    const tourn = makeTestTournament();
    // Same team on both sides is a non-fatal error.
    const match = makeModaqQbjMatch({
      round: 1,
      left: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 2`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    const { results } = importOne(tourn, match);
    expect(results[0].status).toBe(ImportResultStatus.ErrNonFatal);

    // "Accept anyway"
    const mgr = new MatchImportResultsManager();
    mgr.openModal(results, undefined);
    mgr.setProceedWithImport(results[0], true);
    mgr.closeModal(true);

    const inserted = tourn.getRoundObjByNumber(1)!.matches[0];
    expect(inserted.statsValidity).toBe(StatsValidity.omit);
  });
});
