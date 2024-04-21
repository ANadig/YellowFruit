/** Standard schedules for 12-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched12Teams8Rounds implements StandardSchedule {
  static fullName = '12 Teams - 2 Pools of 6, Then 2 Pools of 6';

  static shortName = '8 Rounds';

  readonly size = 12;

  readonly rounds = 8;

  readonly rebracketAfter = [5];

  readonly rooms = 6;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    this.phases = [prelims, playoffs];
  }
}

export class Sched12Teams9Rounds implements StandardSchedule {
  static fullName = '12 Teams - 2 Pools of 6, Then a Pool of 8 and a Pool of 4';

  static shortName = '9 Rounds';

  readonly size = 12;

  readonly rounds = 9;

  readonly rebracketAfter = [5];

  readonly rooms = 6;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [4, 2]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers - 8/4
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(9, 2, '9th Place', false);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9];

    this.phases = [prelims, playoffs];
  }
}

export class Sched12Teams10Rounds implements StandardSchedule {
  static fullName = '12 Teams - 2 Pools of 6, Then 2 Pools of 6 With No Carryover';

  static shortName = '10 Rounds';

  readonly size = 12;

  readonly rounds = 10;

  readonly rebracketAfter = [5];

  readonly rooms = 6;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 6
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 12);

    // Playoffs: 2 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(6, 2, '7th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    this.phases = [prelims, playoffs];
  }
}

export class Sched12TeamsSingleRR implements StandardSchedule {
  static fullName = '12 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 12;

  readonly rounds = 11;

  readonly rebracketAfter = [];

  readonly rooms = 6;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(12, 1, 'Round Robin');
    rrPool.setSeedRange(1, 12);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 11, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}

export class Sched12Teams14Rounds implements StandardSchedule {
  static fullName = '12 Teams - Full Round Robin, Then 3 Pools of 4';

  static shortName = '14 Rounds';

  readonly size = 12;

  readonly rounds = 14;

  readonly rebracketAfter = [11];

  readonly rooms = 6;

  readonly minGames = 14;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 6
    const rrPool = new Pool(12, 1, 'Round Robin');
    rrPool.setSeedRange(1, 12);
    setAutoAdvanceRules(rrPool, [4, 4, 4]);

    // Playoffs: 3 tiers, each with 1 pool of 4
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);
    const place9 = new Pool(4, 3, '9th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 11, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 12, 14, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5, place9];

    this.phases = [prelims, playoffs];
  }
}
