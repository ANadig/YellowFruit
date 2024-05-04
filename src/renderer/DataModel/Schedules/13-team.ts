/** Standard schedules for 13-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
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
    const rrPool = new Pool(13, 1, 'Round Robin');
    rrPool.setSeedRange(1, 13);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 13, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
