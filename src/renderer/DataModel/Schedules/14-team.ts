/** Standard schedules for 14-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched14Teams10Rounds: StandardSchedule = {
  fullName: '14 Teams - 2 Pools of 7, Then Pools of 6, 4, and 4',
  shortName: '10 Rounds',
  size: 14,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 9,
  constructPhases: () => {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 3 tiers - 6/4/4
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(4, 2, '7th Place', false);
    const place11 = new Pool(4, 3, '11th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 10);
    place11.setSeedRange(11, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place11];

    return [prelims, playoffs];
  },
};

export const Sched14Teams11Rounds: StandardSchedule = {
  fullName: '14 Teams - 2 Pools of 7, Then Top 8/Bottom 6 with Carryover',
  shortName: '11 Rounds',
  size: 14,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 9,
  constructPhases: () => {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [4, 3]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 2 tiers - 8/6
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(6, 2, '9th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9];

    return [prelims, playoffs];
  },
};

export const Sched14Teams12Rounds: StandardSchedule = {
  fullName: '14 Teams - 2 Pools of 7, Then Top 6 (full RR)/Bottom 8',
  shortName: '12 Rounds',
  size: 14,
  rounds: 12,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 10,
  constructPhases: () => {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [3, 4]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 2 tiers - 6/8
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(8, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    return [prelims, playoffs];
  },
};

export const Sched14TeamsSingleRR: StandardSchedule = {
  fullName: '14 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 14,
  rounds: 13,
  rebracketAfter: [],
  rooms: 7,
  minGames: 13,
  constructPhases: () => {
    const rrPool = new Pool(14, 1, 'Round Robin');
    rrPool.setSeedRange(1, 14);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 13, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
