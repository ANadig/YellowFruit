/** Standard schedules for 5-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched5TeamsDoubleRR implements StandardSchedule {
  readonly fullName = '5 Teams - Double Round Robin';

  static shortName = 'Double Round Robin';

  readonly size = 5;

  readonly rounds = 10;

  readonly rebracketAfter = [];

  readonly rooms = 2;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(5, 1, 'Round Robin');
    rrPool.setSeedRange(1, 5);
    rrPool.roundRobins = 2;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 10, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched5Teams13Rounds implements StandardSchedule {
  readonly fullName = '5 Teams - Double Round Robin, Then 3/2 Split';

  static shortName = '13 Rounds';

  readonly size = 5;

  readonly rounds = 13;

  readonly rebracketAfter = [10];

  readonly rooms = 2;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelims: double round robin
    const rrPool = new Pool(5, 1, 'Prelims');
    rrPool.setSeedRange(1, 5);
    setAutoAdvanceRules(rrPool, [3, 2]);
    rrPool.roundRobins = 2;

    // Playoffs: 2 tiers
    const championship = new Pool(3, 1, 'Championship', false);
    const place4 = new Pool(2, 2, '4th Place', false);

    championship.setSeedRange(1, 3);
    place4.setSeedRange(4, 5);
    place4.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 10, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place4];

    this.phases = [prelims, playoffs];
  }
}