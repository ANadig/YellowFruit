/** Standard schedules for 6-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched6TeamsDoubleRR implements StandardSchedule {
  static fullName = '6 Teams - Double Round Robin';

  static shortName = 'Double Round Robin';

  readonly size = 6;

  readonly rounds = 10;

  readonly rebracketAfter = [];

  readonly rooms = 3;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(6, 1, 'Round Robin');
    rrPool.setSeedRange(1, 6);
    rrPool.roundRobins = 2;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 10, 1, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched6Teams13RoundsSplit33 implements StandardSchedule {
  static fullName = '6 Teams - Double Round Robin, Then 3/3 Split';

  static shortName = '13 Rounds (3/3 Split)';

  readonly size = 6;

  readonly rounds = 13;

  readonly rebracketAfter = [10];

  readonly rooms = 3;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    // Prelims: double round robin
    const rrPool = new Pool(6, 1, 'Prelims');
    rrPool.setSeedRange(1, 6);
    setAutoAdvanceRules(rrPool, [3, 3]);
    rrPool.roundRobins = 2;

    // Playoffs: 2 tiers
    const championship = new Pool(3, 1, 'Championship', false);
    const place4 = new Pool(3, 2, '4th Place', false);

    championship.setSeedRange(1, 3);
    place4.setSeedRange(4, 6);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 10, 1, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, 2, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place4];

    this.phases = [prelims, playoffs];
  }
}

export class Sched6Teams13RoundsSplit42 implements StandardSchedule {
  static fullName = '6 Teams - Double Round Robin, Then 4/2 Split';

  static shortName = '13 Rounds (4/2 Split)';

  readonly size = 6;

  readonly rounds = 13;

  readonly rebracketAfter = [10];

  readonly rooms = 3;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    // Prelims: double round robin
    const rrPool = new Pool(6, 1, 'Prelims');
    rrPool.setSeedRange(1, 6);
    setAutoAdvanceRules(rrPool, [4, 2]);
    rrPool.roundRobins = 2;

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(2, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 6);
    place5.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 10, 1, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, 2, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    this.phases = [prelims, playoffs];
  }
}
