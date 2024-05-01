/** Standard schedules for 20-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched19Teams11Rounds implements StandardSchedule {
  readonly fullName = '19 Teams - Pools of 10 and 9, then Playoff Pools of 4/4/4/4/3';

  static shortName = '11 Rounds';

  readonly size = 19;

  readonly rounds = 11;

  readonly rebracketAfter = [9];

  readonly rooms = 9;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [2, 2, 2, 2, 2]);
    prelimPools[0].size = 9;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 19);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '8th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(3, 5, '17thPlace', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 19);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched19Teams12Rounds implements StandardSchedule {
  readonly fullName = '19 Teams - Pools of 10 and 9, then Playoff Pools of 6/6/4/3';

  static shortName = '12 Rounds';

  readonly size = 20;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 9;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [3, 3, 2, 2]);
    prelimPools[0].size = 9;
    setAutoAdvanceRules(prelimPools[0], [3, 3, 2, 1]);
    snakeSeed(prelimPools, 1, 19);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(4, 3, '13th Place', true);
    const place17 = new Pool(3, 4, '17th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 19);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched19Teams13Rounds implements StandardSchedule {
  readonly fullName = '19 Teams - Pools of 10 and 9, then Playoff Pools of 8/6/5';

  static shortName = '13 Rounds';

  readonly size = 20;

  readonly rounds = 13;

  readonly rebracketAfter = [9];

  readonly rooms = 9;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [4, 3, 3]);
    prelimPools[0].size = 9;
    setAutoAdvanceRules(prelimPools[0], [4, 3, 2]);
    snakeSeed(prelimPools, 1, 19);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(6, 2, '9th Place', true);
    const place15 = new Pool(5, 3, '15th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 14);
    place15.setSeedRange(15, 19);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place15];

    this.phases = [prelims, playoffs];
  }
}

export class Sched19Teams14Rounds implements StandardSchedule {
  readonly fullName = '19 Teams - Pools of 10 and 9, then Playoff Pools of 10 and 9';

  static shortName = '14 Rounds';

  readonly size = 20;

  readonly rounds = 14;

  readonly rebracketAfter = [9];

  readonly rooms = 9;

  readonly minGames = 13;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [5, 5]);
    prelimPools[0].size = 9;
    setAutoAdvanceRules(prelimPools[0], [5, 4]);
    snakeSeed(prelimPools, 1, 19);

    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(9, 2, '11th Place', true);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 19);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11];

    this.phases = [prelims, playoffs];
  }
}
