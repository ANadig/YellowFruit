/** Standard schedules for 7-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched7TeamsSingleRR implements StandardSchedule {
  readonly fullName = '7 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 7;

  readonly rounds = 7;

  readonly rebracketAfter = [];

  readonly rooms = 3;

  readonly minGames = 6;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(7, 1, 'Round Robin');
    rrPool.setSeedRange(1, 7);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 7, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched7Teams10Rounds implements StandardSchedule {
  readonly fullName = '7 Teams - Round Robin, Then 4/3 Split';

  static shortName = '10 Rounds';

  readonly size = 7;

  readonly rounds = 10;

  readonly rebracketAfter = [7];

  readonly rooms = 3;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(7, 1, 'Prelims');
    rrPool.setSeedRange(1, 7);
    setAutoAdvanceRules(rrPool, [4, 3]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    this.phases = [prelims, playoffs];
  }
}

export default class Sched7Teams13Rounds implements StandardSchedule {
  readonly fullName = '7 Teams - Round Robin, Then 4/3 Split with Double Round Robin';

  static shortName = '13 Rounds';

  readonly size = 7;

  readonly rounds = 13;

  readonly rebracketAfter = [7];

  readonly rooms = 3;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(7, 1, 'Prelims');
    rrPool.setSeedRange(1, 7);
    setAutoAdvanceRules(rrPool, [4, 3]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);

    championship.roundRobins = 2;
    place5.roundRobins = 2;

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    this.phases = [prelims, playoffs];
  }
}

export class Sched7TeamsDoubleRR implements StandardSchedule {
  readonly fullName = '7 Teams - Double Round Robin';

  static shortName = 'Double Round Robin';

  readonly size = 7;

  readonly rounds = 14;

  readonly rebracketAfter = [];

  readonly rooms = 3;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(7, 1, 'Round Robin');
    rrPool.setSeedRange(1, 7);
    rrPool.roundRobins = 2;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 14, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
