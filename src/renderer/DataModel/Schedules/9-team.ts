/** Standard schedules for 9-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool, makePlacementPools } from '../Pool';
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
    return [simpleRoundRobinPrelims(9, 1)];
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
    const prelims = simpleRoundRobinPrelims(9, 1, [3, 3, 3]);

    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');
    playoffs.pools = makePlacementPools(3, 3, 1, 1, 9, false);

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
    const prelims = simpleRoundRobinPrelims(9, 1, [4, 3, 2]);

    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(3, 2, '5th Place', false, 5, 7);
    const place8 = new Pool(2, 3, '8th Place', false, 8, 9);
    place8.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');
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
    const prelims = simpleRoundRobinPrelims(9, 1, [5, 4]);

    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');
    playoffs.pools = makePlacementPools(2, 5, 1, 1, 9, false);

    return [prelims, playoffs];
  },
};
