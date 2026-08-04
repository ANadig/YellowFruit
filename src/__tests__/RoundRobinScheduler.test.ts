import { describe, expect, test } from 'vitest';
import {
  IPhasePairingRound,
  allocateRooms,
  generatePhasePairings,
  generatePoolRoundRobin,
} from '../renderer/Services/RoundRobinScheduler';

/** Team ids named A, B, C, ... so failures are readable */
const teams = (count: number) => Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));

/** An unordered key for a matchup, so A-vs-B and B-vs-A compare equal */
const pairKey = (left: string, right: string) => [left, right].sort().join('-');

/** Every matchup in a generated schedule, as unordered keys */
function allPairKeys(rounds: { pairings: { leftTeamId: string; rightTeamId: string }[] }[]): string[] {
  return rounds.flatMap((round) => round.pairings.map((p) => pairKey(p.leftTeamId, p.rightTeamId)));
}

/** Every unordered pair that a full round robin over these teams should contain */
function expectedPairKeys(teamIds: string[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) keys.push(pairKey(teamIds[i], teamIds[j]));
  }
  return keys;
}

/** Assert no team appears more than once in any round */
function expectNoDoubleBooking(rounds: { pairings: { leftTeamId: string; rightTeamId: string }[] }[]) {
  for (const round of rounds) {
    const seen = new Set<string>();
    for (const pairing of round.pairings) {
      expect(seen.has(pairing.leftTeamId)).toBe(false);
      expect(seen.has(pairing.rightTeamId)).toBe(false);
      seen.add(pairing.leftTeamId);
      seen.add(pairing.rightTeamId);
    }
  }
}

describe('generatePoolRoundRobin: even team counts', () => {
  test('a 4-team pool plays 3 rounds of 2 games', () => {
    const rounds = generatePoolRoundRobin(teams(4), 1);

    expect(rounds).toHaveLength(3);
    for (const round of rounds) expect(round.pairings).toHaveLength(2);
    expect(rounds.every((round) => round.byeTeamIds.length === 0)).toBe(true);
  });

  test('a 4-team pool pairs every team with every other exactly once', () => {
    const rounds = generatePoolRoundRobin(teams(4), 1);

    expect(allPairKeys(rounds).sort()).toEqual(expectedPairKeys(teams(4)).sort());
  });

  test('an 8-team pool plays 7 rounds of 4 games covering every pair once', () => {
    const rounds = generatePoolRoundRobin(teams(8), 1);

    expect(rounds).toHaveLength(7);
    for (const round of rounds) expect(round.pairings).toHaveLength(4);
    expect(allPairKeys(rounds).sort()).toEqual(expectedPairKeys(teams(8)).sort());
    expectNoDoubleBooking(rounds);
  });

  test('a 16-team pool covers all 120 pairs across 15 rounds', () => {
    const rounds = generatePoolRoundRobin(teams(16), 1);

    expect(rounds).toHaveLength(15);
    expect(allPairKeys(rounds)).toHaveLength(120);
    expect(new Set(allPairKeys(rounds)).size).toBe(120);
    expectNoDoubleBooking(rounds);
  });
});

describe('generatePoolRoundRobin: odd team counts and byes', () => {
  test('a 5-team pool plays 5 rounds with one bye each round', () => {
    const rounds = generatePoolRoundRobin(teams(5), 1);

    expect(rounds).toHaveLength(5);
    for (const round of rounds) {
      expect(round.pairings).toHaveLength(2);
      expect(round.byeTeamIds).toHaveLength(1);
    }
  });

  test('a 5-team pool still covers every pair exactly once', () => {
    const rounds = generatePoolRoundRobin(teams(5), 1);

    expect(allPairKeys(rounds).sort()).toEqual(expectedPairKeys(teams(5)).sort());
    expectNoDoubleBooking(rounds);
  });

  test('every team in a 5-team pool sits out exactly once', () => {
    const rounds = generatePoolRoundRobin(teams(5), 1);

    const byes = rounds.flatMap((round) => round.byeTeamIds).sort();
    expect(byes).toEqual(teams(5).sort());
  });

  test('the bye placeholder never leaks into a pairing', () => {
    const rounds = generatePoolRoundRobin(teams(7), 1);

    for (const round of rounds) {
      for (const pairing of round.pairings) {
        expect(pairing.leftTeamId.trim()).not.toBe('bye');
        expect(pairing.rightTeamId.trim()).not.toBe('bye');
        expect(teams(7)).toContain(pairing.leftTeamId);
        expect(teams(7)).toContain(pairing.rightTeamId);
      }
    }
  });

  test('a 9-team pool plays 9 rounds of 4 games with one bye', () => {
    const rounds = generatePoolRoundRobin(teams(9), 1);

    expect(rounds).toHaveLength(9);
    for (const round of rounds) {
      expect(round.pairings).toHaveLength(4);
      expect(round.byeTeamIds).toHaveLength(1);
    }
    expect(allPairKeys(rounds).sort()).toEqual(expectedPairKeys(teams(9)).sort());
  });
});

describe('generatePoolRoundRobin: double round robins', () => {
  test('a 4-team double round robin plays 6 rounds', () => {
    const rounds = generatePoolRoundRobin(teams(4), 2);

    expect(rounds).toHaveLength(6);
    expect(rounds.map((r) => r.roundIndex)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('every pair meets exactly twice', () => {
    const rounds = generatePoolRoundRobin(teams(6), 2);

    const counts = new Map<string, number>();
    for (const key of allPairKeys(rounds)) counts.set(key, (counts.get(key) ?? 0) + 1);

    expect([...counts.keys()].sort()).toEqual(expectedPairKeys(teams(6)).sort());
    for (const count of counts.values()) expect(count).toBe(2);
  });

  test('the two meetings put the teams on opposite sides', () => {
    const rounds = generatePoolRoundRobin(teams(4), 2);

    const sides = new Map<string, string[]>();
    for (const round of rounds) {
      for (const pairing of round.pairings) {
        const key = pairKey(pairing.leftTeamId, pairing.rightTeamId);
        sides.set(key, (sides.get(key) ?? []).concat(pairing.leftTeamId));
      }
    }

    for (const [, leftTeams] of sides) {
      expect(new Set(leftTeams).size).toBe(2);
    }
  });

  test('no pairing repeats in back-to-back rounds', () => {
    const rounds = generatePoolRoundRobin(teams(6), 2);

    for (let i = 1; i < rounds.length; i++) {
      const previous = new Set(rounds[i - 1].pairings.map((p) => pairKey(p.leftTeamId, p.rightTeamId)));
      for (const pairing of rounds[i].pairings) {
        expect(previous.has(pairKey(pairing.leftTeamId, pairing.rightTeamId))).toBe(false);
      }
    }
  });

  test('a triple round robin covers every pair three times', () => {
    const rounds = generatePoolRoundRobin(teams(4), 3);

    expect(rounds).toHaveLength(9);
    const counts = new Map<string, number>();
    for (const key of allPairKeys(rounds)) counts.set(key, (counts.get(key) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBe(3);
  });
});

describe('generatePoolRoundRobin: degenerate input', () => {
  test('zero round robins generates nothing', () => {
    // A consolation bracket with arbitrary matchups; the director enters those by hand.
    expect(generatePoolRoundRobin(teams(6), 0)).toEqual([]);
  });

  test('a pool with fewer than two teams generates nothing', () => {
    expect(generatePoolRoundRobin([], 1)).toEqual([]);
    expect(generatePoolRoundRobin(['A'], 1)).toEqual([]);
  });

  test('a 2-team pool plays one game', () => {
    const rounds = generatePoolRoundRobin(teams(2), 1);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].pairings).toHaveLength(1);
  });

  test('duplicate team ids are collapsed rather than scheduled against themselves', () => {
    const rounds = generatePoolRoundRobin(['A', 'B', 'A', 'C'], 1);

    for (const round of rounds) {
      for (const pairing of round.pairings) {
        expect(pairing.leftTeamId).not.toBe(pairing.rightTeamId);
      }
    }
    expect(allPairKeys(rounds).sort()).toEqual(expectedPairKeys(['A', 'B', 'C']).sort());
  });

  test('generation is deterministic', () => {
    const first = generatePoolRoundRobin(teams(7), 2);
    const second = generatePoolRoundRobin(teams(7), 2);

    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  test('no team is ever scheduled against itself', () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8, 11, 12]) {
      for (const pairing of generatePoolRoundRobin(teams(count), 2).flatMap((r) => r.pairings)) {
        expect(pairing.leftTeamId).not.toBe(pairing.rightTeamId);
      }
    }
  });
});

describe('generatePhasePairings: multiple pools', () => {
  test('two 4-team pools run their round robins side by side', () => {
    const rounds = generatePhasePairings([
      { poolId: 'p1', teamIds: ['A', 'B', 'C', 'D'], roundRobins: 1 },
      { poolId: 'p2', teamIds: ['E', 'F', 'G', 'H'], roundRobins: 1 },
    ]);

    expect(rounds).toHaveLength(3);
    for (const round of rounds) expect(round.pairings).toHaveLength(4);
    expectNoDoubleBooking(rounds);
  });

  test('teams never cross between pools', () => {
    const poolOne = ['A', 'B', 'C', 'D'];
    const poolTwo = ['E', 'F', 'G', 'H'];
    const rounds = generatePhasePairings([
      { poolId: 'p1', teamIds: poolOne, roundRobins: 1 },
      { poolId: 'p2', teamIds: poolTwo, roundRobins: 1 },
    ]);

    for (const pairing of rounds.flatMap((r) => r.pairings)) {
      const members = pairing.poolId === 'p1' ? poolOne : poolTwo;
      expect(members).toContain(pairing.leftTeamId);
      expect(members).toContain(pairing.rightTeamId);
    }
  });

  test('the phase runs as long as its longest pool', () => {
    // A 6-team pool needs 5 rounds; a 4-team pool only 3, and simply has no games in rounds 4-5.
    const rounds = generatePhasePairings([
      { poolId: 'big', teamIds: teams(6), roundRobins: 1 },
      { poolId: 'small', teamIds: ['W', 'X', 'Y', 'Z'], roundRobins: 1 },
    ]);

    expect(rounds).toHaveLength(5);
    expect(rounds[0].pairings).toHaveLength(5);
    expect(rounds[4].pairings.every((p) => p.poolId === 'big')).toBe(true);
  });

  test('each pairing carries the pool it came from', () => {
    const rounds = generatePhasePairings([
      { poolId: 'alpha', teamIds: ['A', 'B'], roundRobins: 1 },
      { poolId: 'beta', teamIds: ['C', 'D'], roundRobins: 1 },
    ]);

    expect(rounds[0].pairings.map((p) => p.poolId).sort()).toEqual(['alpha', 'beta']);
  });

  test('byes from every pool are reported together', () => {
    const rounds = generatePhasePairings([
      { poolId: 'p1', teamIds: teams(5), roundRobins: 1 },
      { poolId: 'p2', teamIds: ['V', 'W', 'X', 'Y', 'Z'], roundRobins: 1 },
    ]);

    for (const round of rounds) expect(round.byeTeamIds).toHaveLength(2);
  });

  test('no pools produces no rounds', () => {
    expect(generatePhasePairings([])).toEqual([]);
  });
});

describe('allocateRooms', () => {
  const rooms = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `room-${i + 1}`, sortOrder: i + 1 }));

  /** An 8-team single round robin: 7 rounds of 4 games */
  const eightTeamPhase = () => generatePhasePairings([{ poolId: 'p1', teamIds: teams(8), roundRobins: 1 }]);

  test('with enough rooms every game gets one and no room is doubled up', () => {
    const phase = eightTeamPhase();

    const { assignments, errors } = allocateRooms(phase, rooms(4));

    expect(errors).toEqual([]);
    expect(assignments).toHaveLength(28);
    for (const round of phase) {
      const inRound = assignments.filter((a) => a.roundIndex === round.roundIndex);
      expect(inRound).toHaveLength(4);
      expect(new Set(inRound.map((a) => a.roomId)).size).toBe(4);
    }
  });

  test('too few rooms is reported rather than dropping games silently', () => {
    const phase = eightTeamPhase();

    const { assignments, errors } = allocateRooms(phase, rooms(3));

    expect(errors).toHaveLength(7);
    expect(errors[0]).toEqual({ roundIndex: 1, gamesNeeded: 4, roomsAvailable: 3 });
    expect(assignments).toHaveLength(0);
  });

  test('no rooms at all is reported for every round that has games', () => {
    const { assignments, errors } = allocateRooms(eightTeamPhase(), []);

    expect(assignments).toEqual([]);
    expect(errors).toHaveLength(7);
    expect(errors.every((e) => e.roomsAvailable === 0)).toBe(true);
  });

  test('spare rooms are simply left unused', () => {
    const { assignments, errors } = allocateRooms(eightTeamPhase(), rooms(10));

    expect(errors).toEqual([]);
    expect(assignments).toHaveLength(28);
    // Only as many rooms as there are concurrent games should ever be in play.
    for (const round of eightTeamPhase()) {
      const inRound = assignments.filter((a) => a.roundIndex === round.roundIndex);
      expect(new Set(inRound.map((a) => a.roomId)).size).toBe(4);
    }
  });

  test('rooms are offered in sort order, so the lowest-numbered rooms fill first', () => {
    const phase = generatePhasePairings([{ poolId: 'p1', teamIds: teams(4), roundRobins: 1 }]);

    const { assignments } = allocateRooms(phase, rooms(6));

    expect(new Set(assignments.map((a) => a.roomId))).toEqual(new Set(['room-1', 'room-2']));
  });

  test('each pool keeps its own block of rooms across the phase', () => {
    const phase = generatePhasePairings([
      { poolId: 'p1', teamIds: teams(4), roundRobins: 1 },
      { poolId: 'p2', teamIds: ['W', 'X', 'Y', 'Z'], roundRobins: 1 },
    ]);

    const { assignments, errors } = allocateRooms(phase, rooms(4));

    expect(errors).toEqual([]);
    const roomsFor = (poolId: string) => new Set(assignments.filter((a) => a.poolId === poolId).map((a) => a.roomId));
    const first = roomsFor('p1');
    const second = roomsFor('p2');
    expect(first.size).toBe(2);
    expect(second.size).toBe(2);
    // Blocks must not overlap, so a scorekeeper sees one pool all phase.
    for (const roomId of first) expect(second.has(roomId)).toBe(false);
  });

  test('pools share rooms when there are not enough to give each a block', () => {
    // Two 4-team pools want 2 rooms each; only 3 exist. Every round still fits in 3 rooms because
    // the two pools alternate, so this must succeed rather than error.
    const phase: IPhasePairingRound[] = [
      {
        roundIndex: 1,
        byeTeamIds: [],
        pairings: [
          { poolId: 'p1', roundIndex: 1, roundRobin: 1, leftTeamId: 'A', rightTeamId: 'B' },
          { poolId: 'p1', roundIndex: 1, roundRobin: 1, leftTeamId: 'C', rightTeamId: 'D' },
          { poolId: 'p2', roundIndex: 1, roundRobin: 1, leftTeamId: 'W', rightTeamId: 'X' },
        ],
      },
    ];

    const { assignments, errors } = allocateRooms(phase, rooms(3));

    expect(errors).toEqual([]);
    expect(assignments).toHaveLength(3);
    expect(new Set(assignments.map((a) => a.roomId)).size).toBe(3);
  });

  test('teams stay in the same room when the format allows it', () => {
    const phase = generatePhasePairings([{ poolId: 'p1', teamIds: teams(8), roundRobins: 1 }]);

    const { assignments } = allocateRooms(phase, rooms(4));

    // Count how often a team changes room between consecutive rounds. A round robin forces plenty of
    // movement, but the preference should keep it well below "every team moves every round".
    let moves = 0;
    let opportunities = 0;
    const lastRoom = new Map<string, string>();
    for (const assignment of assignments) {
      for (const teamId of [assignment.leftTeamId, assignment.rightTeamId]) {
        const previous = lastRoom.get(teamId);
        if (previous !== undefined) {
          opportunities++;
          if (previous !== assignment.roomId) moves++;
        }
        lastRoom.set(teamId, assignment.roomId);
      }
    }

    expect(opportunities).toBeGreaterThan(0);
    expect(moves).toBeLessThan(opportunities);
  });

  test('allocation is deterministic', () => {
    const first = allocateRooms(eightTeamPhase(), rooms(4));
    const second = allocateRooms(eightTeamPhase(), rooms(4));

    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  test('room order, not array order, decides which rooms are used', () => {
    const phase = generatePhasePairings([{ poolId: 'p1', teamIds: teams(4), roundRobins: 1 }]);
    const shuffled = [
      { id: 'room-c', sortOrder: 3 },
      { id: 'room-a', sortOrder: 1 },
      { id: 'room-b', sortOrder: 2 },
    ];

    const { assignments } = allocateRooms(phase, shuffled);

    expect(new Set(assignments.map((a) => a.roomId))).toEqual(new Set(['room-a', 'room-b']));
  });

  test('every assignment keeps the pairing it came from intact', () => {
    const phase = eightTeamPhase();

    const { assignments } = allocateRooms(phase, rooms(4));

    const original = new Set(
      phase.flatMap((r) => r.pairings.map((p) => `${p.roundIndex}:${p.leftTeamId}:${p.rightTeamId}`)),
    );
    for (const assignment of assignments) {
      expect(original.has(`${assignment.roundIndex}:${assignment.leftTeamId}:${assignment.rightTeamId}`)).toBe(true);
    }
  });
});
