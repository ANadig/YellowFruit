/** Standard schedules for 11-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { makePlacementPools, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
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
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 11);

    const playoffPools = makePlacementPools(2, 6, 1, 1, 11, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

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
    return [simpleRoundRobinPrelims(11, 1)];
  },
};
