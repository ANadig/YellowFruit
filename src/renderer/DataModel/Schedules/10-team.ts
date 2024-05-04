/** Standard schedules for 10-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched10TeamsSingleRR: StandardSchedule = {
  fullName: '10 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 10,
  rounds: 9,
  rebracketAfter: [],
  rooms: 5,
  minGames: 9,
  constructPhases: () => {
    const rrPool = new Pool(10, 1, 'Round Robin');
    rrPool.setSeedRange(1, 10);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched10Teams12Rounds433: StandardSchedule = {
  fullName: '10 Teams - Round Robin, Then 4/3/3 Split',
  shortName: '12 Rounds, 4/3/3 split',
  size: 10,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 5,
  minGames: 11,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(10, 1, 'Prelims');
    rrPool.setSeedRange(1, 10);
    setAutoAdvanceRules(rrPool, [4, 3, 3]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);
    const place8 = new Pool(3, 3, '8th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);
    place8.setSeedRange(8, 10);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place8];

    return [prelims, playoffs];
  },
};

export const Sched10Teams12Rounds442: StandardSchedule = {
  fullName: '10 Teams - Round Robin, Then 4/4/2 Split',
  shortName: '12 Rounds, 4/4/2 split',
  size: 10,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 5,
  minGames: 11,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(10, 1, 'Prelims');
    rrPool.setSeedRange(1, 10);
    setAutoAdvanceRules(rrPool, [4, 4, 2]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);
    const place9 = new Pool(2, 3, '9th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 10);

    place9.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place9];

    return [prelims, playoffs];
  },
};
