/** Standard schedules for 9-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched9TeamsSingleRR: StandardSchedule = {
  fullName: '9 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 9,
  rounds: 9,
  rebracketAfter: [],
  rooms: 4,
  minGames: 8,
  constructPhases: () => {
    const rrPool = new Pool(9, 1, 'Round Robin');
    rrPool.setSeedRange(1, 9);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched9Teams12Rounds333: StandardSchedule = {
  fullName: '9 Teams - Round Robin, Then 3/3/3 Split',
  shortName: '12 Rounds (3/3/3 split)',
  size: 9,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 4,
  minGames: 10,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [3, 3, 3]);

    // Playoffs: 3 tiers
    const championship = new Pool(3, 1, 'Championship', false);
    const place4 = new Pool(3, 2, '4th Place', false);
    const place7 = new Pool(3, 3, '7th Place', false);

    championship.setSeedRange(1, 3);
    place4.setSeedRange(4, 6);
    place7.setSeedRange(7, 9);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place4, place7];

    return [prelims, playoffs];
  },
};

export const Sched9Teams12Rounds432: StandardSchedule = {
  fullName: '9 Teams - Round Robin, Then 4/3/2 Split',
  shortName: '12 Rounds (4/3/2 split)',
  size: 9,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 4,
  minGames: 10,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [4, 3, 2]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);
    const place8 = new Pool(2, 3, '8th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);
    place8.setSeedRange(8, 9);

    place8.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place8];

    return [prelims, playoffs];
  },
};

export const Sched9Teams14Rounds: StandardSchedule = {
  fullName: '9 Teams - Round Robin, Then 5/4 Split',
  shortName: '14 Rounds',
  size: 9,
  rounds: 14,
  rebracketAfter: [9],
  rooms: 4,
  minGames: 11,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [5, 4]);

    // Playoffs: 3 tiers
    const championship = new Pool(5, 1, 'Championship', false);
    const place6 = new Pool(4, 2, '6th Place', false);

    championship.setSeedRange(1, 5);
    place6.setSeedRange(6, 9);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place6];

    return [prelims, playoffs];
  },
};
