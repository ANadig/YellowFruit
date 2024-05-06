/** Standard schedules for 6-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool, makePlacementPools } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched6TeamsDoubleRR: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 6,
  rounds: 10,
  rebracketAfter: [],
  rooms: 3,
  minGames: 10,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(6, 2)];
  },
};

export const Sched6Teams13RoundsSplit33: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin, Then 3/3 Split',
  shortName: '13 Rounds (3/3 Split)',
  size: 6,
  rounds: 13,
  rebracketAfter: [10],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(6, 2, [3, 3]);

    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');
    playoffs.pools = makePlacementPools(2, 3, 1, 1, 6, false);

    return [prelims, playoffs];
  },
};

export const Sched6Teams13RoundsSplit42: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin, Then 4/2 Split',
  shortName: '13 Rounds (4/2 Split)',
  size: 6,
  rounds: 13,
  rebracketAfter: [10],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(6, 2, [4, 2]);

    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(2, 2, '5th Place', false, 5, 6);
    place5.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};
