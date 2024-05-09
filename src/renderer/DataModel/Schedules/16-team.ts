/** Standard schedules for 16-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { makePlacementPools, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched16Teams9Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 4 Pools of 4',
  shortName: '9 Rounds',
  size: 16,
  rounds: 9,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 16);

    const playoffPools = makePlacementPools(4, 4, 1, 1, 16, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};

export const Sched16Teams10Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 6/6/4',
  shortName: '10 Rounds',
  size: 16,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [3, 3, 2]);
    snakeSeed(prelimPools, 1, 16);

    const playoffPools = makePlacementPools(3, 6, 1, 1, 16, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};

export const Sched16Teams11Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 2 Pools of 8',
  shortName: '11 Rounds',
  size: 16,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [4, 4]);
    snakeSeed(prelimPools, 1, 16);

    const playoffPools = makePlacementPools(2, 8, 1, 1, 16, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};
