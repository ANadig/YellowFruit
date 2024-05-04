/** Standard schedules for 4-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
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
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    rrPool.roundRobins = 3;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
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
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    rrPool.roundRobins = 4;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 12, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
