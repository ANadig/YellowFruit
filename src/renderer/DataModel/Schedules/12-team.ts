/** Standard schedules for 12-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool, makePlacementPools, makePoolSet, snakeSeed } from '../Pool';
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
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    const playoffPools = makePlacementPools(2, 6, 1, 1, 12, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

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
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [4, 2]);
    snakeSeed(prelimPools, 1, 12);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(4, 2, '9th Place', false);

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
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    const playoffPools = makePlacementPools(2, 6, 1, 1, 12, false);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

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
    return [simpleRoundRobinPrelims(12, 1)];
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
    const prelims = simpleRoundRobinPrelims(12, 1, [4, 4, 4]);

    const playoffPools = makePlacementPools(3, 4, 1, 1, 12, false);

    const playoffs = new Phase(PhaseTypes.Playoff, 12, 14, '2');
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};
