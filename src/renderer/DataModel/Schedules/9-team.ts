/** Standard schedules for 9-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched9TeamsSingleRR implements StandardSchedule {
  static fullName = '9 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 9;

  readonly rounds = 9;

  readonly rebracketAfter = [];

  readonly rooms = 4;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(9, 1, 'Round Robin');
    rrPool.setSeedRange(1, 9);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched9Teams12Rounds333 implements StandardSchedule {
  static fullName = '9 Teams - Round Robin, Then 3/3/3 Split';

  static shortName = '12 Rounds (3/3/3 split)';

  readonly size = 9;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 4;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [3, 3, 3]);

    // Playoffs: 3 tiers
    const championship = new Pool(3, 1, 'Championship', false);
    const place4 = new Pool(3, 2, '4th Place', false);
    const place7 = new Pool(3, 3, '7th Place', false);

    championship.setSeedRange(1, 3);
    place4.setSeedRange(4, 6);
    place7.setSeedRange(7, 9);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place4, place7];

    this.phases = [prelims, playoffs];
  }
}

export class Sched9Teams12Rounds432 implements StandardSchedule {
  static fullName = '9 Teams - Round Robin, Then 4/3/2 Split';

  static shortName = '12 Rounds (4/3/2 split)';

  readonly size = 9;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 4;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [4, 3, 2]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);
    const place8 = new Pool(2, 3, '8th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);
    place8.setSeedRange(8, 9);

    place8.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place8];

    this.phases = [prelims, playoffs];
  }
}

export class Sched9Teams14Rounds implements StandardSchedule {
  static fullName = '9 Teams - Round Robin, Then 5/4 Split';

  static shortName = '14 Rounds';

  readonly size = 9;

  readonly rounds = 14;

  readonly rebracketAfter = [9];

  readonly rooms = 4;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(9, 1, 'Prelims');
    rrPool.setSeedRange(1, 9);
    setAutoAdvanceRules(rrPool, [5, 4]);

    // Playoffs: 3 tiers
    const championship = new Pool(5, 1, 'Championship', false);
    const place6 = new Pool(4, 2, '6th Place', false);

    championship.setSeedRange(1, 5);
    place6.setSeedRange(6, 9);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place6];

    this.phases = [prelims, playoffs];
  }
}
