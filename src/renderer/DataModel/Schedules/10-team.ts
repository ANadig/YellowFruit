/** Standard schedules for 10-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched10TeamsSingleRR implements StandardSchedule {
  static fullName = '10 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 10;

  readonly rounds = 9;

  readonly rebracketAfter = [];

  readonly rooms = 5;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(10, 1, 'Round Robin');
    rrPool.setSeedRange(1, 10);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, 1, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
