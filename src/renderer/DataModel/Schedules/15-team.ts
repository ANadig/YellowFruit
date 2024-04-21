/** Standard schedules for 15-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched15Teams9Rounds implements StandardSchedule {
  readonly fullName = '15 Teams - Pools of 8 and 7, then 4/4/4/3';

  static shortName = '9 Rounds';

  readonly size = 15;

  readonly rounds = 9;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 8, then remove the last seed
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 15);

    // Playoffs: 4 tiers - 4/4/4/3
    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(3, 4, '13th Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 15);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13];

    this.phases = [prelims, playoffs];
  }
}

export class Sched15Teams10Rounds implements StandardSchedule {
  readonly fullName = '15 Teams - Pools of 8 and 7, then 6/6/3';

  static shortName = '10 Rounds';

  readonly size = 15;

  readonly rounds = 10;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 8, then remove the last seed
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [3, 3, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [3, 3, 1]);
    snakeSeed(prelimPools, 1, 15);

    // Playoffs: 3 tiers - 6/6/3
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(3, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 15);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    this.phases = [prelims, playoffs];
  }
}

export class Sched15Teams11Rounds implements StandardSchedule {
  readonly fullName = '15 Teams - Pools of 8 and 7, then Pools of 8 and 7';

  static shortName = '11 Rounds';

  readonly size = 15;

  readonly rounds = 11;

  readonly rebracketAfter = [7];

  readonly rooms = 7;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelim: 2 pools of 8, then remove the last seed
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [4, 4]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [4, 3]);
    snakeSeed(prelimPools, 1, 15);

    // Playoffs: 2 tiers - 8/7
    const championship = new Pool(8, 1, 'Championship', true);
    const place7 = new Pool(7, 2, '9th Place', true);

    championship.setSeedRange(1, 8);
    place7.setSeedRange(9, 15);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    this.phases = [prelims, playoffs];
  }
}
