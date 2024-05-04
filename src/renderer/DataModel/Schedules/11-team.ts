/** Standard schedules for 11-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched11Teams8Rounds: StandardSchedule = {
  fullName: '11 Teams - Pools of 5 and 6, then Playoff Pools of 6/5',
  shortName: '8 Rounds',
  size: 11,
  rounds: 8,
  rebracketAfter: [5],
  rooms: 5,
  minGames: 7,
  constructPhases: () => {
    // Prelim: Make 2 pools of 6 then subtract one
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 11);

    // Playoffs: 2 tiers, each with 1 pool
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(5, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 11);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    return [prelims, playoffs];
  },
};

export const Sched11TeamsSingleRR: StandardSchedule = {
  fullName: '11 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 11,
  rounds: 11,
  rebracketAfter: [],
  rooms: 5,
  minGames: 10,
  constructPhases: () => {
    const rrPool = new Pool(11, 1, 'Round Robin');
    rrPool.setSeedRange(1, 11);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 11, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
