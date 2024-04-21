/** Standard schedules for 24-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched24Teams11Rounds2Phases implements StandardSchedule {
  static fullName = '24 Teams - 4 Pools of 6 Teams, Then 3 Pools of 8 Teams';

  static shortName = '11 Rounds (2 Stages)';

  readonly size = 24;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 12;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    // Prelim: 4 pools of 6
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 24);

    // Playoffs: 3 tiers, each with 1 pool of 8
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(8, 2, '9th Place', true);
    const place17 = new Pool(8, 3, '17th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 16);
    place17.setSeedRange(17, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17];

    this.phases = [prelims, playoffs];
  }
}

export class Sched24Teams11Rounds3Phases implements StandardSchedule {
  static fullName =
    '24 Teams - 4 Pools of 6 Teams, Then 2 Sets of 2 Parallel Pools of 6 Teams, Then 4 Pools of 6 Teams';

  static shortName = '11 Rounds (3 Stages)';

  readonly size = 24;

  readonly rounds = 11;

  readonly rebracketAfter = [5, 8];

  readonly rooms = 12;

  readonly minGames = 11;

  phases: Phase[];

  constructor() {
    // Prelim: 4 pools of 6
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 24);

    // Playoffs: 2 tiers, each with 2 parallel pools of 6
    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs 1', [3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs 2', [0, 0, 3, 3], true);

    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffBottomPools, 13, 24);

    // playoffBottomPools[0].feederPools = [prelimPools[0], prelimPools[3]];
    // playoffBottomPools[1].feederPools = [prelimPools[1], prelimPools[2]];
    // playoffBottomPools[0].feederPools = [prelimPools[0], prelimPools[3]];
    // playoffBottomPools[1].feederPools = [prelimPools[1], prelimPools[2]];

    // Superplayoffs: 4 tiers, each with one pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(6, 4, '19th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 11, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    superPlayoffs.pools = [championship, place7, place13, place19];

    this.phases = [prelims, playoffs, superPlayoffs];
  }
}
