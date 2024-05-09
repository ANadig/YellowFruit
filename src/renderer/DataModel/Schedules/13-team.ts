/** Standard schedules for 13-team tournaments */

import { simpleRoundRobinPrelims } from '../Phase';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched13TeamsSingleRR: StandardSchedule = {
  fullName: '13 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 13,
  rounds: 13,
  rebracketAfter: [],
  rooms: 6,
  minGames: 12,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(13, 1)];
  },
};
