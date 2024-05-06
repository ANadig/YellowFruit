/** Standard schedules for 4-team tournaments */

import { simpleRoundRobinPrelims } from '../Phase';
import StandardSchedule from '../StandardSchedule';

export const Sched4TeamsTripleRR: StandardSchedule = {
  fullName: '4 Teams - Triple Round Robin',
  shortName: 'Triple Round Robin',
  size: 4,
  rounds: 9,
  rebracketAfter: [],
  rooms: 2,
  minGames: 9,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(4, 3)];
  },
};

export const Sched4TeamsQuadRR: StandardSchedule = {
  fullName: '4 Teams - Quadruple Round Robin',
  shortName: 'Quadruple Round Robin',
  size: 4,
  rounds: 12,
  rebracketAfter: [],
  rooms: 2,
  minGames: 12,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(4, 4)];
  },
};
