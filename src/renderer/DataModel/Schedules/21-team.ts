/** Standard schedules for 21-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched21Teams11Rounds implements StandardSchedule {
  readonly fullName = '21 Teams - 3 Pools of 7, then Playoff Pools of 6/6/6/3';

  static shortName = '11 Rounds';

  readonly size = 21;

  readonly rounds = 11;

  readonly rebracketAfter = [7];

  readonly rooms = 10;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(3, 4, '19th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19];

    this.phases = [prelims, playoffs];
  }
}

export class Sched21Teams12Rounds implements StandardSchedule {
  readonly fullName = '21 Teams - 3 Pools of 7, then Playoff Pools of 6/5/5/5';

  static shortName = '12 Rounds';

  readonly size = 21;

  readonly rounds = 12;

  readonly rebracketAfter = [7];

  readonly rooms = 9;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(5, 2, '7th Place');
    const place12 = new Pool(5, 3, '13th Place');
    const place17 = new Pool(5, 4, '19th Place');

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 11);
    place12.setSeedRange(12, 16);
    place17.setSeedRange(17, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 5 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place12, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched21Teams14Rounds implements StandardSchedule {
  readonly fullName = '21 Teams - 3 Pools of 7, then Playoff Pools of 9/6/6 with Carryover';

  static shortName = '14 Rounds (with carryover)';

  readonly size = 21;

  readonly rounds = 14;

  readonly rebracketAfter = [7];

  readonly rooms = 10;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(6, 2, '10th Place', true);
    const place16 = new Pool(6, 3, '16th Place', true);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 15);
    place16.setSeedRange(16, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place16];

    this.phases = [prelims, playoffs];
  }
}

export class Sched21Teams14RoundsNoCO implements StandardSchedule {
  readonly fullName = '21 Teams - 3 Pools of 7, then Playoff Pools of 9/6/6 (No carryover for consolation)';

  static shortName = '14 Rounds (partial carryover)';

  readonly size = 21;

  readonly rounds = 14;

  readonly rebracketAfter = [7];

  readonly rooms = 10;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(6, 2, '10th Place', false);
    const place16 = new Pool(6, 3, '16th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 15);
    place16.setSeedRange(16, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place16];

    this.phases = [prelims, playoffs];
  }
}
