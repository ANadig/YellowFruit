/** Standard schedules for 8-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool, makePlacementPools } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched8TeamsSingleRR: StandardSchedule = {
  fullName: '8 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 8,
  rounds: 7,
  rebracketAfter: [],
  rooms: 4,
  minGames: 7,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(8, 1)];
  },
};

export const Sched8Teams10Rounds: StandardSchedule = {
  fullName: '8 Teams - Round Robin, Then 4/4 Split',
  shortName: '10 Rounds',
  size: 8,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 4,
  minGames: 10,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(8, 1, [4, 4]);

    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');
    playoffs.pools = makePlacementPools(2, 4, 1, 1, 8);

    return [prelims, playoffs];
  },
};

export const Sched8Teams13Rounds: StandardSchedule = {
  fullName: '8 Teams - Round Robin, Then 4/4 Split with Double Round Robin',
  shortName: '13 Rounds',
  size: 8,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 4,
  minGames: 13,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(8, 1, [4, 4]);

    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', false, 5, 8);
    championship.roundRobins = 2;
    place5.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched8TeamsDoubleRR: StandardSchedule = {
  fullName: '8 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 8,
  rounds: 14,
  rebracketAfter: [],
  rooms: 4,
  minGames: 14,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(8, 2)];
  },
};
