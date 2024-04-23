/** Standard schedules for 13-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched13TeamsSingleRR implements StandardSchedule {
  readonly fullName = '13 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 13;

  readonly rounds = 13;

  readonly rebracketAfter = [];

  readonly rooms = 6;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(13, 1, 'Round Robin');
    rrPool.setSeedRange(1, 13);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 13, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
