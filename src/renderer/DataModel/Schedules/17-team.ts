/** Standard schedules for 17-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched17Teams9Rounds implements StandardSchedule {
  readonly fullName = '17 Teams - Pools of 5 or 6, Then Pools of 6/6/5';

  static shortName = '9 Rounds';

  readonly size = 17;

  readonly rounds = 9;

  readonly rebracketAfter = [5];

  readonly rooms = 8;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(5, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    this.phases = [prelims, playoffs];
  }
}

export class Sched17Teams10Rounds implements StandardSchedule {
  readonly fullName = '17 Teams - Pools of 5 or 6, Then Pools of 6/6/5 (No Carryover)';

  static shortName = '10 Rounds';

  readonly size = 17;

  readonly rounds = 10;

  readonly rebracketAfter = [5];

  readonly rooms = 8;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(6, 2, '7th Place', false);
    const place13 = new Pool(5, 3, '13th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    this.phases = [prelims, playoffs];
  }
}

export class Sched17Teams12Rounds implements StandardSchedule {
  readonly fullName = '17 Teams - Pools of 5 or 6, then Top 9 and bottom 8';

  static shortName = '12 Rounds';

  readonly size = 17;

  readonly rounds = 12;

  readonly rebracketAfter = [5];

  readonly rooms = 8;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 2 tiers, each with 1 pool of 9
    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(8, 2, '10th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10];

    this.phases = [prelims, playoffs];
  }
}
