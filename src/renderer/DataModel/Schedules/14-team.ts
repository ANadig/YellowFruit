/** Standard schedules for 14-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched14Teams10Rounds implements StandardSchedule {
  readonly fullName = '14 Teams - 2 Pools of 7, Then Pools of 6, 4, and 4';

  static shortName = '10 Rounds';

  readonly size = 14;

  readonly rounds = 10;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 3 tiers - 6/4/4
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(4, 2, '7th Place', false);
    const place11 = new Pool(4, 3, '11th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 10);
    place11.setSeedRange(11, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place11];

    this.phases = [prelims, playoffs];
  }
}

export class Sched14Teams11Rounds implements StandardSchedule {
  readonly fullName = '14 Teams - 2 Pools of 7, Then Top 8/Bottom 6 with Carryover';

  static shortName = '11 Rounds';

  readonly size = 14;

  readonly rounds = 11;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [4, 3]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 2 tiers - 8/6
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(6, 2, '9th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9];

    this.phases = [prelims, playoffs];
  }
}

export class Sched14Teams12Rounds implements StandardSchedule {
  readonly fullName = '14 Teams - 2 Pools of 7, Then Top 6 (full RR)/Bottom 8';

  static shortName = '12 Rounds';

  readonly size = 14;

  readonly rounds = 12;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 7
    const prelimPools = makePoolSet(2, 7, 1, 'Prelim ', [3, 4]);
    snakeSeed(prelimPools, 1, 14);

    // Playoffs: 2 tiers - 6/8
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(8, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 14);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    this.phases = [prelims, playoffs];
  }
}

export class Sched14TeamsSingleRR implements StandardSchedule {
  readonly fullName = '14 Teams - Single Round Robin';

  static shortName = 'Single Round Robin';

  readonly size = 14;

  readonly rounds = 13;

  readonly rebracketAfter = [];

  readonly rooms = 7;

  readonly minGames = 13;

  phases: Phase[];

  constructor() {
    const rrPool = new Pool(14, 1, 'Round Robin');
    rrPool.setSeedRange(1, 14);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 13, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
