/** Standard schedules for 11-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched11TeamsSingleRR implements StandardSchedule {
  static fullName = '11 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 11;

  readonly rounds = 11;

  readonly rebracketAfter = [];

  readonly rooms = 5;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(11, 1, 'Round Robin');
    rrPool.setSeedRange(1, 11);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 11, 1, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
