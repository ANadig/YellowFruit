/** Standard schedules for 4-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class sched4TeamsTripleRR implements StandardSchedule {
  readonly size = 4;

  readonly rounds = 9;

  readonly rebracketAfter = [];

  readonly rooms = 2;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, 1, '1');
    this.phases = [roundRobin];
  }
}

export class sched4TeamsQuadRR implements StandardSchedule {
  readonly size = 4;

  readonly rounds = 12;

  readonly rebracketAfter = [];

  readonly rooms = 2;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 12, 1, '1');
    this.phases = [roundRobin];
  }
}
