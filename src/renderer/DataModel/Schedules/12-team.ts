/** Standard schedules for 12-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched12Teams8Rounds: StandardSchedule = {
  fullName: '12 Teams - 2 Pools of 6, Then 2 Pools of 6',
  shortName: '8 Rounds',
  size: 12,
  rounds: 8,
  rebracketAfter: [5],
  rooms: 6,
  minGames: 8,
  constructPhases: () => {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    return [prelims, playoffs];
  },
};

export const Sched12Teams9Rounds: StandardSchedule = {
  fullName: '12 Teams - 2 Pools of 6, Then a Pool of 8 and a Pool of 4',
  shortName: '9 Rounds',
  size: 12,
  rounds: 9,
  rebracketAfter: [5],
  rooms: 6,
  minGames: 8,
  constructPhases: () => {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [4, 2]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers - 8/4
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(9, 2, '9th Place', false);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9];

    return [prelims, playoffs];
  },
};

export const Sched12Teams10Rounds: StandardSchedule = {
  fullName: '12 Teams - 2 Pools of 6, Then 2 Pools of 6 With No Carryover',
  shortName: '10 Rounds',
  size: 12,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 6,
  minGames: 10,
  constructPhases: () => {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(6, 2, '7th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    return [prelims, playoffs];
  },
};

export const Sched12TeamsSingleRR: StandardSchedule = {
  fullName: '12 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 12,
  rounds: 11,
  rebracketAfter: [],
  rooms: 6,
  minGames: 11,
  constructPhases: () => {
    const rrPool = new Pool(12, 1, 'Round Robin');
    rrPool.setSeedRange(1, 12);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 11, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched12Teams14Rounds: StandardSchedule = {
  fullName: '12 Teams - Full Round Robin, Then 3 Pools of 4',
  shortName: '14 Rounds',
  size: 12,
  rounds: 14,
  rebracketAfter: [11],
  rooms: 6,
  minGames: 14,
  constructPhases: () => {
    // Prelim: 2 pools of 6
    const rrPool = new Pool(12, 1, 'Round Robin');
    rrPool.setSeedRange(1, 12);
    setAutoAdvanceRules(rrPool, [4, 4, 4]);

    // Playoffs: 3 tiers, each with 1 pool of 4
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);
    const place9 = new Pool(4, 3, '9th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 11, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 12, 14, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place9];

    return [prelims, playoffs];
  },
};
