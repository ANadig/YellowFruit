/** Standard schedules for 27-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched27Teams11Rounds2PPlusF implements StandardSchedule {
  readonly fullName = '27 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 with Parallel Top Pools';

  static shortName = '11 Rounds (2 Stages, then Finals)';

  readonly size = 27;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 12;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    snakeSeed(prelimPools, 1, 27);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(5, 2, '13th Place');
    const place18 = new Pool(5, 3, '18th Place');
    const place23 = new Pool(5, 4, '23rd Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 17);
    place18.setSeedRange(18, 22);
    place23.setSeedRange(23, 27);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 5 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place18, place23]);

    this.phases = [prelims, playoffs, finals];
  }
}
