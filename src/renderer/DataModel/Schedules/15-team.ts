/** Standard schedules for 15-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { makePlacementPools, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched15Teams9Rounds: StandardSchedule = {
  fullName: '15 Teams - Pools of 8 and 7, then 4/4/4/3',
  shortName: '9 Rounds',
  size: 15,
  rounds: 9,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 15);

    const playoffPools = makePlacementPools(4, 4, 1, 1, 15, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};

export const Sched15Teams10Rounds: StandardSchedule = {
  fullName: '15 Teams - Pools of 8 and 7, then 6/6/3',
  shortName: '10 Rounds',
  size: 15,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [3, 3, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [3, 3, 1]);
    snakeSeed(prelimPools, 1, 15);

    const playoffPools = makePlacementPools(3, 6, 1, 1, 15, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};

export const Sched15Teams11Rounds: StandardSchedule = {
  fullName: '15 Teams - Pools of 8 and 7, then Pools of 8 and 7',
  shortName: '11 Rounds',
  size: 15,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 7,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [4, 4]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [4, 3]);
    snakeSeed(prelimPools, 1, 15);

    const playoffPools = makePlacementPools(2, 8, 1, 1, 15, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};
