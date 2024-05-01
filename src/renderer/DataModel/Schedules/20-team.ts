/** Standard schedules for 20-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched20Teams9Rounds implements StandardSchedule {
  readonly fullName = '20 Teams - 5 Pools of 4 Teams, then 5 Pools of 4 Teams with Parallel Top Pools';

  static shortName = '8 Rounds + Finals';

  readonly size = 20;

  readonly rounds = 9;

  readonly rebracketAfter = [5];

  readonly rooms = 10;

  readonly minGames = 7;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 5, 1, 'Prelim ', [2, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 20);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', []);
    const place9 = new Pool(4, 2, '9th Place', false);
    const place13 = new Pool(4, 3, '13th Place', false);
    const place17 = new Pool(4, 4, '17th Place', false);

    playoffTopPools[0].seeds = [1, 4, 6, 7];
    playoffTopPools[1].seeds = [2, 3, 5, 8]; // not a normal snake seed, to avoid repeat matchups from prelims
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place9, place13, place17]);
    const finals = new Phase(PhaseTypes.Finals, 9, 9, '3');

    this.phases = [prelims, playoffs, finals];
  }
}

export class Sched20Teams11Rounds2x10 implements StandardSchedule {
  readonly fullName = '20 Teams - 2 Pools of 10, then 5 Pools of 4';

  static shortName = '11 Rounds - 2x10 to 4/4/4/4/4';

  readonly size = 20;

  readonly rounds = 11;

  readonly rebracketAfter = [9];

  readonly rooms = 10;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [2, 2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 20);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '8th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17thPlace', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched20Teams11Rounds4x5 implements StandardSchedule {
  readonly fullName = '20 Teams - 4 Pools of 5, then Playoff Pools of 8/8/4';

  static shortName = '11 Rounds - 4x5 to 8/8/4';

  readonly size = 20;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 10;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 5, 1, 'Prelim ', [2, 2, 1]);
    snakeSeed(prelimPools, 1, 20);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(8, 2, '9th Place', true);
    const place17 = new Pool(4, 3, '17th Place', false);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 16);
    place17.setSeedRange(17, 20);

    place17.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched20Teams12Rounds implements StandardSchedule {
  readonly fullName = '20 Teams - 2 Pools of 10, then Playoff Pools of 6/6/4/4';

  static shortName = '12 Rounds';

  readonly size = 20;

  readonly rounds = 12;

  readonly rebracketAfter = [9];

  readonly rooms = 10;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [3, 3, 2, 2]);
    snakeSeed(prelimPools, 1, 20);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(4, 3, '13th Place', true);
    const place17 = new Pool(4, 4, '17th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched20Teams13Rounds implements StandardSchedule {
  readonly fullName = '20 Teams - 2 Pools of 10, then Playoff Pools of 8/6/6';

  static shortName = '13 Rounds';

  readonly size = 20;

  readonly rounds = 13;

  readonly rebracketAfter = [9];

  readonly rooms = 10;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [4, 3, 3]);
    snakeSeed(prelimPools, 1, 20);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(6, 2, '9th Place', true);
    const place15 = new Pool(6, 3, '15th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 14);
    place15.setSeedRange(15, 20);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place15];

    this.phases = [prelims, playoffs];
  }
}

export class Sched20Teams14Rounds implements StandardSchedule {
  readonly fullName = '20 Teams - 2 Pools of 10, 2 Pools of 10';

  static shortName = '14 Rounds';

  readonly size = 20;

  readonly rounds = 14;

  readonly rebracketAfter = [9];

  readonly rooms = 10;

  readonly minGames = 14;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 10, 1, 'Prelim ', [5, 5]);
    snakeSeed(prelimPools, 1, 20);

    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(10, 2, '11th Place', true);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 20);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11];

    this.phases = [prelims, playoffs];
  }
}
