import { describe, expect, test } from 'vitest';
import normalizeQbjMatch, { inferTossupsRead } from '../renderer/Services/QbjMatchNormalizer';
import { makeModaqCycleExport, makeStandardModaqMatch, testTeamNames } from './TestFixtures';

/** ACF-style: 20 tossups, overtime one question at a time */
const acf = { regulationTossupCount: 20, minimumOvertimeQuestionCount: 1 };

/** The scaffold packet's size for a 20-tossup format, from ScaffoldPacket's 20 questions of headroom */
const scaffoldSize = 40;

/** Cycle indices 0..n-1, i.e. "every question through the nth was played" */
const playedThrough = (count: number) => Array.from({ length: count }, (_, i) => i);

const starters = (teamIndex: number) => [
  `${testTeamNames[teamIndex]} Player 1`,
  `${testTeamNames[teamIndex]} Player 2`,
];

const twoFullRosters = {
  left: { name: testTeamNames[0], starters: starters(0) },
  right: { name: testTeamNames[1], starters: starters(1) },
};

describe('normalizeQbjMatch: counts MODAQ already gets right', () => {
  test('a normal 20-question game reports 20 and is left alone', () => {
    const match = makeModaqCycleExport({ cycleCount: 20, playedIndices: playedThrough(20), ...twoFullRosters });

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(20);
    expect(result.trimmedQuestionCount).toBe(0);
    expect(result.changed).toBe(false);
    expect(result.qbj.match_questions).toHaveLength(20);
  });

  test('a 20-question game with dead tossups at the end still reports 20', () => {
    // Regulation is read in full even when the last few tossups go dead.
    const match = makeModaqCycleExport({ cycleCount: 20, playedIndices: playedThrough(17), ...twoFullRosters });

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(20);
    expect(result.changed).toBe(false);
  });

  test('one overtime question reports 21', () => {
    // MODAQ truncates correctly here: the tie broke at the first overtime checkpoint.
    const match = makeModaqCycleExport({ cycleCount: 21, playedIndices: playedThrough(21), ...twoFullRosters });

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(21);
    expect(result.overtimeTossups).toBe(1);
    expect(result.trimmedQuestionCount).toBe(0);
  });

  test('three overtime questions report 23', () => {
    const match = makeModaqCycleExport({ cycleCount: 23, playedIndices: playedThrough(23), ...twoFullRosters });

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(23);
    expect(result.overtimeTossups).toBe(3);
  });
});

describe('normalizeQbjMatch: the scaffold-capacity bug', () => {
  test('a game tied to the end of play no longer reports the whole scaffold', () => {
    // MODAQ found a tie at every checkpoint, so playableCycles handed back all 40 padded cycles.
    // Only 23 were played.
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(23),
      ...twoFullRosters,
    });
    expect(match.tossups_read).toBe(scaffoldSize);

    const result = normalizeQbjMatch(match, acf);

    expect(result.reportedTossupsRead).toBe(scaffoldSize);
    expect(result.tossupsRead).toBe(23);
    expect(result.overtimeTossups).toBe(3);
    expect(result.trimmedQuestionCount).toBe(17);
    expect(result.changed).toBe(true);
  });

  test('one overtime question inside an inflated export reports 21', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(21),
      ...twoFullRosters,
    });

    expect(normalizeQbjMatch(match, acf).tossupsRead).toBe(21);
  });

  test('a tie that stands with no overtime played reports regulation only', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(20),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(20);
    expect(result.overtimeTossups).toBe(0);
    expect(result.trimmedQuestionCount).toBe(20);
  });

  test('match_questions is trimmed to the corrected count and keeps its numbering', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(22),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, acf);

    expect(result.qbj.match_questions).toHaveLength(22);
    expect(result.qbj.match_questions[0].question_number).toBe(1);
    expect(result.qbj.match_questions[21].question_number).toBe(22);
  });

  test('a thrown-out tossup with no buzz still counts as played', () => {
    // The replacement went dead, but a scorekeeper was clearly on that question.
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(21),
      thrownOutIndices: [21],
      ...twoFullRosters,
    });

    expect(normalizeQbjMatch(match, acf).tossupsRead).toBe(22);
  });
});

describe('normalizeQbjMatch: overtime periods longer than one question', () => {
  const threeQuestionOvertime = { regulationTossupCount: 20, minimumOvertimeQuestionCount: 3 };

  test('a partly played overtime period rounds up to the whole period', () => {
    // The format plays overtime in blocks of three, so all three are read even if the tie breaks
    // on the first. This is how MODAQ counts it too.
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(21),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, threeQuestionOvertime);

    expect(result.tossupsRead).toBe(23);
    expect(result.overtimeTossups).toBe(3);
  });

  test('two overtime periods report 26', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(24),
      ...twoFullRosters,
    });

    expect(normalizeQbjMatch(match, threeQuestionOvertime).tossupsRead).toBe(26);
  });

  test('an exactly complete overtime period is not rounded up further', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(23),
      ...twoFullRosters,
    });

    expect(normalizeQbjMatch(match, threeQuestionOvertime).tossupsRead).toBe(23);
  });
});

describe('normalizeQbjMatch: games that end early', () => {
  test('a timed round reports the questions actually played', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(15),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, { ...acf, gameMayEndEarly: true });

    expect(result.tossupsRead).toBe(15);
    expect(result.qbj.match_questions).toHaveLength(15);
  });

  test('an explicit count from the scorekeeper wins over inference', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(15),
      ...twoFullRosters,
    });

    // Three tossups after the last buzz went dead before the round was called.
    const result = normalizeQbjMatch(match, { ...acf, tossupsHeardOverride: 18 });

    expect(result.tossupsRead).toBe(18);
  });

  test('an override can never exceed what MODAQ reported', () => {
    const match = makeModaqCycleExport({ cycleCount: 20, playedIndices: playedThrough(20), ...twoFullRosters });

    expect(normalizeQbjMatch(match, { ...acf, tossupsHeardOverride: 99 }).tossupsRead).toBe(20);
  });
});

describe('normalizeQbjMatch: player tossups heard stay consistent', () => {
  test('starters are credited with the corrected count, not the scaffold size', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(23),
      ...twoFullRosters,
    });
    // MODAQ inflated these along with tossups_read.
    expect(match.match_teams[0].match_players[0].tossups_heard).toBe(scaffoldSize);

    const result = normalizeQbjMatch(match, acf);

    for (const matchTeam of result.qbj.match_teams) {
      for (const matchPlayer of matchTeam.match_players) {
        expect(matchPlayer.tossups_heard).toBe(23);
      }
    }
  });

  test('a substitute is credited only for the questions they were in for', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(23),
      left: {
        name: testTeamNames[0],
        starters: starters(0),
        substitutes: [{ name: `${testTeamNames[0]} Player 3`, firstQuestion: 10 }],
      },
      right: { name: testTeamNames[1], starters: starters(1) },
    });

    const result = normalizeQbjMatch(match, acf);
    const players = result.qbj.match_teams[0].match_players;
    const substitute = players.find((p: any) => p.player.name === `${testTeamNames[0]} Player 3`);

    // In from question 10 through question 23 inclusive.
    expect(substitute.tossups_heard).toBe(14);
    expect(players[0].tossups_heard).toBe(23);
  });

  test('no player is ever credited with more tossups than the match had', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(20),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, acf);

    for (const matchTeam of result.qbj.match_teams) {
      for (const matchPlayer of matchTeam.match_players) {
        expect(matchPlayer.tossups_heard).toBeLessThanOrEqual(result.tossupsRead);
      }
    }
  });

  test('counts are clamped when lineup history is missing', () => {
    // Older fixtures and hand-written QBJ don't always carry lineups; clamping still keeps the
    // match internally consistent even though it can't be exact.
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(21),
      ...twoFullRosters,
    });
    for (const matchTeam of match.match_teams) delete matchTeam.lineups;

    const result = normalizeQbjMatch(match, acf);

    expect(result.tossupsRead).toBe(21);
    for (const matchTeam of result.qbj.match_teams) {
      for (const matchPlayer of matchTeam.match_players) {
        expect(matchPlayer.tossups_heard).toBe(21);
      }
    }
  });
});

describe('normalizeQbjMatch: robustness', () => {
  test('the input match is never mutated', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(21),
      ...twoFullRosters,
    });

    normalizeQbjMatch(match, acf);

    expect(match.tossups_read).toBe(scaffoldSize);
    expect(match.match_questions).toHaveLength(scaffoldSize);
    expect(match.match_teams[0].match_players[0].tossups_heard).toBe(scaffoldSize);
  });

  test('a match with no cycle data is passed through untouched', () => {
    // There is no evidence to reason from, so inventing a correction would be worse than nothing.
    const match = makeStandardModaqMatch(3);

    const result = normalizeQbjMatch(match, acf);

    expect(result.changed).toBe(false);
    expect(result.tossupsRead).toBe(20);
    expect(result.qbj.match_teams[0].match_players[0].tossups_heard).toBe(20);
  });

  test('non-object input does not throw', () => {
    expect(normalizeQbjMatch(null, acf).tossupsRead).toBe(0);
    expect(normalizeQbjMatch('nonsense', acf).changed).toBe(false);
  });

  test('a zero-length overtime period does not produce a division blowup', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(22),
      ...twoFullRosters,
    });

    const result = normalizeQbjMatch(match, { regulationTossupCount: 20, minimumOvertimeQuestionCount: 0 });

    expect(Number.isFinite(result.tossupsRead)).toBe(true);
    expect(result.tossupsRead).toBe(22);
  });

  test('inferTossupsRead agrees with the full normalization', () => {
    const match = makeModaqCycleExport({
      cycleCount: scaffoldSize,
      playedIndices: playedThrough(23),
      ...twoFullRosters,
    });

    const inferred = inferTossupsRead(match.match_questions, match.tossups_read, acf);

    expect(inferred.tossupsRead).toBe(normalizeQbjMatch(match, acf).tossupsRead);
  });
});
