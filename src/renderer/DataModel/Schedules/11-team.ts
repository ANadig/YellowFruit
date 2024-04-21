/** Standard schedules for 11-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched11Teams8Rounds implements StandardSchedule {
  static fullName = '11 Teams - Pools of 5 and 6, then Pools of 6 and 5';

  static shortName = '8 Rounds';

  readonly size = 11;

  readonly rounds = 8;

  readonly rebracketAfter = [5];

  readonly rooms = 5;

  readonly minGames = 7;

  phases: Phase[];

  constructor() {
    // Prelim: Make 2 pools of 6 then subtract one
    const prelimPools = makePoolSet(2, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 11);

    // Playoffs: 2 tiers, each with 1 pool
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(5, 2, '7th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 11);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    this.phases = [prelims, playoffs];
  }
}

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

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 11, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    this.phases = [roundRobin];
  }
}
