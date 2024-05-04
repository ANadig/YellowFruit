/** Standard schedules for 23-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched23Teams8Rounds implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 5 or 6 Teams, Then Pools of 4 or 3 Teams (Top 2 Parallel)';

  static shortName = '8 Rounds + Finals';

  readonly size = 23;

  readonly rounds = 8;

  readonly rebracketAfter = [5];

  readonly rooms = 11;

  readonly minGames = 7;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 1, 1, 1, 1]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 23);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Playoffs 1', [], false);
    const place9 = new Pool(4, 2, '9th Place');
    const place13 = new Pool(4, 3, '13th Place');
    const place17 = new Pool(4, 4, '17th Place');
    const place21 = new Pool(3, 5, '21st Place');

    playoffTopPools[0].seeds = [1, 4, 6, 7]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 5, 8];
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place9, place13, place17, place21]);
    const finals = new Phase(PhaseTypes.Finals, 9, 9, '3');

    this.phases = [prelims, playoffs, finals];
  }
}

export class Sched23Teams9Rounds implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 5 or 6 Teams, Then 3 Sets of 2 Parallel Pools, Then 6 Pools of 3 or 4 Teams';

  static shortName = '9 Rounds';

  readonly size = 23;

  readonly rounds = 9;

  readonly rebracketAfter = [5, 7];

  readonly rooms = 11;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 23);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Playoffs 1', [2, 2, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 4, 2, 'Playoffs 2', [0, 0, 2, 2, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 4, 3, 'Playoffs 3', [0, 0, 0, 0, 2, 2], true);
    playoffBottomPools[0].size = 3;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 0, 0, 2, 1]);

    snakeSeed(playoffTopPools, 1, 8);
    snakeSeed(playoffMiddlePools, 9, 16);
    snakeSeed(playoffBottomPools, 17, 23);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(3, 6, '21st Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 7, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 8, 9, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superPlayoffs.pools = [championship, place5, place9, place13, place17, place21];

    this.phases = [prelims, playoffs, superPlayoffs];
  }
}

export class Sched23Teams10Rounds implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 5 or 6 Teams, Then 2 Sets of 2 Parallel Pools, Then 6 Pools of 3 or 4';

  static shortName = '10 Rounds';

  readonly size = 23;

  readonly rounds = 10;

  readonly rebracketAfter = [5, 8];

  readonly rooms = 11;

  readonly minGames = 9;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 23);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs 1', [2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs 2', [0, 0, 0, 2, 2, 2], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 0, 2, 2, 1]);

    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffBottomPools, 13, 23);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(3, 6, '21st Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 10, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    superPlayoffs.pools = [championship, place5, place9, place13, place17, place21];

    this.phases = [prelims, playoffs, superPlayoffs];
  }
}

export class Sched23Teams11Rounds2Phases5Prelim implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 5 or 6 Teams, Then 3 Pools of 7 or 8 Teams';

  static shortName = '11 Rounds (2 Stages; 5 Prelim Rounds)';

  readonly size = 23;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 11;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 23);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(8, 2, '9th Place', true);
    const place17 = new Pool(7, 3, '17th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 16);
    place17.setSeedRange(17, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched23Teams11Rounds2Phases7Prelim implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 7 or 8, then Playoff Pools of 5 or 6';

  static shortName = '11 Rounds (2 Stages; 7 Prelim Rounds)';

  readonly size = 23;

  readonly rounds = 11;

  readonly rebracketAfter = [7];

  readonly rooms = 11;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 23);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(5, 4, '19th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19];

    this.phases = [prelims, playoffs];
  }
}

export class Sched23Teams11Rounds3Phases implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 5 or 6, Then 2 Sets of 2 Parallel Pools, Then Pools of 5 or 6';

  static shortName = '11 Rounds (3 Stages)';

  readonly size = 23;

  readonly rounds = 11;

  readonly rebracketAfter = [5, 8];

  readonly rooms = 11;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 23);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs 1', [3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs 2', [0, 0, 3, 3], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 3, 2]);

    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffBottomPools, 13, 23);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(5, 4, '19th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 11, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    superPlayoffs.pools = [championship, place7, place13, place19];

    this.phases = [prelims, playoffs, superPlayoffs];
  }
}

export class Sched23Teams13Rounds implements StandardSchedule {
  readonly fullName = '23 Teams - Pools of 11 and 12, then Playoff Pools of 4/4/4/4/4/3';

  static shortName = '13 Rounds';

  readonly size = 23;

  readonly rounds = 13;

  readonly rebracketAfter = [11];

  readonly rooms = 11;

  readonly minGames = 12;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(2, 12, 1, 'Prelim ', [2, 2, 2, 2, 2, 2]);
    prelimPools[0].size = 11;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 23);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(3, 6, '21st Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 23);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 11, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 12, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13, place17, place21];

    this.phases = [prelims, playoffs];
  }
}
