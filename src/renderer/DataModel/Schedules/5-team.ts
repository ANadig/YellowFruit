/** Standard schedules for 5-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched5TeamsDoubleRR: StandardSchedule = {
  fullName: '5 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 5,
  rounds: 10,
  rebracketAfter: [],
  rooms: 2,
  minGames: 8,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(5, 2)];
  },
};

export const Sched5Teams13Rounds: StandardSchedule = {
  fullName: '5 Teams - Double Round Robin, Then 3/2 Split',
  shortName: '13 Rounds',
  size: 5,
  rounds: 13,
  rebracketAfter: [10],
  rooms: 2,
  minGames: 10,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(5, 2, [3, 2]);

    const championship = new Pool(3, 1, 'Championship', false, 1, 3);
    const place4 = new Pool(2, 2, '4th Place', false, 4, 5);
    place4.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');
    playoffs.pools = [championship, place4];

    return [prelims, playoffs];
  },
};
