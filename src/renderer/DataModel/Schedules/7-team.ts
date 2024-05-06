/** Standard schedules for 7-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool, makePlacementPools } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched7TeamsSingleRR: StandardSchedule = {
  fullName: '7 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 7,
  rounds: 7,
  rebracketAfter: [],
  rooms: 3,
  minGames: 6,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(7, 1)];
  },
};

export const Sched7Teams10Rounds: StandardSchedule = {
  fullName: '7 Teams - Round Robin, Then 4/3 Split',
  shortName: '10 Rounds',
  size: 7,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 3,
  minGames: 8,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(7, 1, [4, 3]);

    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');
    playoffs.pools = makePlacementPools(2, 4, 1, 1, 7, false);

    return [prelims, playoffs];
  },
};

export const Sched7Teams13Rounds: StandardSchedule = {
  fullName: '7 Teams - Round Robin, Then 4/3 Split with Double Round Robin',
  shortName: '13 Rounds',
  size: 7,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 3,
  minGames: 10,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(7, 1, [4, 3]);

    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(3, 2, '5th Place', false, 5, 7);
    championship.roundRobins = 2;
    place5.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched7TeamsDoubleRR: StandardSchedule = {
  fullName: '7 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 7,
  rounds: 14,
  rebracketAfter: [],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(7, 2)];
  },
};
