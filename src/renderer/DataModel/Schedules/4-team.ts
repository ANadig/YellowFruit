/** Standard schedules for 4-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched4TeamsTripleRR implements StandardSchedule {
  static fullName = '4 Teams - Triple Round Robin';

  static shortName = 'Triple Round Robin';

  readonly size = 4;

  readonly rounds = 9;

  readonly rebracketAfter = [];

  readonly rooms = 2;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    rrPool.roundRobins = 3;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, 1, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched4TeamsQuadRR implements StandardSchedule {
  static fullName = '4 Teams - Quadruple Round Robin';

  static shortName = 'Quadruple Round Robin';

  readonly size = 4;

  readonly rounds = 12;

  readonly rebracketAfter = [];

  readonly rooms = 2;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(4, 1, 'Round Robin');
    rrPool.setSeedRange(1, 4);
    rrPool.roundRobins = 4;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 12, 1, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
