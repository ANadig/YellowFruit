/** Standard schedules for 8-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched8TeamsSingleRR implements StandardSchedule {
  static fullName = '8 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 8;

  readonly rounds = 7;

  readonly rebracketAfter = [];

  readonly rooms = 4;

  readonly minGames = 7;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(8, 1, 'Round Robin');
    rrPool.setSeedRange(1, 8);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 7, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched8Teams10Rounds implements StandardSchedule {
  static fullName = '8 Teams - Round Robin, Then 4/4 Split';

  static shortName = '10 Rounds';

  readonly size = 8;

  readonly rounds = 10;

  readonly rebracketAfter = [7];

  readonly rooms = 4;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(8, 1, 'Prelims');
    rrPool.setSeedRange(1, 8);
    setAutoAdvanceRules(rrPool, [4, 4]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    this.phases = [prelims, playoffs];
  }
}

export class Sched8Teams13Rounds implements StandardSchedule {
  static fullName = '8 Teams - Round Robin, Then 4/4 Split with Double Round Robin';

  static shortName = '13 Rounds';

  readonly size = 8;

  readonly rounds = 13;

  readonly rebracketAfter = [7];

  readonly rooms = 4;

  readonly minGames = 13;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(8, 1, 'Prelims');
    rrPool.setSeedRange(1, 8);
    setAutoAdvanceRules(rrPool, [4, 4]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);

    championship.roundRobins = 2;
    place5.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    this.phases = [prelims, playoffs];
  }
}

export class Sched8TeamsDoubleRR implements StandardSchedule {
  static fullName = '8 Teams - Double Round Robin';

  static shortName = 'Double Round Robin';

  readonly size = 8;

  readonly rounds = 14;

  readonly rebracketAfter = [];

  readonly rooms = 4;

  readonly minGames = 14;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(8, 1, 'Round Robin');
    rrPool.setSeedRange(1, 8);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 14, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
