/** Standard schedules for 10-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched10TeamsSingleRR implements StandardSchedule {
  static fullName = '10 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 10;

  readonly rounds = 9;

  readonly rebracketAfter = [];

  readonly rooms = 5;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(10, 1, 'Round Robin');
    rrPool.setSeedRange(1, 10);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 9, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched10Teams12Rounds433 implements StandardSchedule {
  static fullName = '10 Teams - Round Robin, Then 4/3/3 Split';

  static shortName = '12 Rounds, 4/3/3 split';

  readonly size = 10;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 5;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(10, 1, 'Prelims');
    rrPool.setSeedRange(1, 10);
    setAutoAdvanceRules(rrPool, [4, 3, 3]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);
    const place8 = new Pool(3, 3, '8th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);
    place8.setSeedRange(8, 10);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place8];

    this.phases = [prelims, playoffs];
  }
}

export class Sched10Teams12Rounds442 implements StandardSchedule {
  static fullName = '10 Teams - Round Robin, Then 4/4/2 Split';

  static shortName = '12 Rounds, 4/4/2 split';

  readonly size = 10;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 5;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    // Prelims: single round robin
    const rrPool = new Pool(10, 1, 'Prelims');
    rrPool.setSeedRange(1, 10);
    setAutoAdvanceRules(rrPool, [4, 4, 2]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);
    const place9 = new Pool(2, 3, '9th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 10);

    place9.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place9];

    this.phases = [prelims, playoffs];
  }
}
