/** Standard schedules for 28-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched28Teams11Rounds2PPlusF implements StandardSchedule {
  readonly fullName = '28 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 with Parallel Top Pools';

  static shortName = '11 Rounds (2 Stages, then Finals)';

  readonly size = 28;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 13;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    snakeSeed(prelimPools, 1, 28);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place');
    const place19 = new Pool(5, 3, '19th Place');
    const place24 = new Pool(5, 4, '24th Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 23);
    place24.setSeedRange(24, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place24]);

    this.phases = [prelims, playoffs, finals];
  }
}
