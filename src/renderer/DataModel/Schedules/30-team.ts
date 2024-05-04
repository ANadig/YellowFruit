/** Standard schedules for 30-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export class Sched30Teams11Rounds2PPlusF implements StandardSchedule {
  readonly fullName = '30 Teams - 5 Pools of 6 Teams, then 5 Pools of 6 Teams with Parallel Top Pools';

  static shortName = '11 Rounds (2 Stages, then Finals)';

  readonly size = 30;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 15;

  readonly minGames = 10;

  phases: Phase[];

  constructor() {
    // Prelim: 5 pools of 6
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    snakeSeed(prelimPools, 1, 30);

    // Playoffs: 4 tiers, with 2 pools in the top
    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place');
    const place19 = new Pool(6, 3, '19th Place');
    const place25 = new Pool(6, 4, '25th Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);
    place25.setSeedRange(25, 30);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 6 },
      { tier: 4, numberOfTeams: 6 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place25]);

    this.phases = [prelims, playoffs, finals];
  }
}
