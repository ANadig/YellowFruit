/** Standard schedules for 26-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched26Teams11RoundsWC implements StandardSchedule {
  readonly fullName = '26 Teams - Pools of 5 or 6 Teams, then 10/6/5/5 split';

  static shortName = '10 Rounds + Finals (wild card)';

  readonly size = 26;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 11;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 1]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    prelimPools[3].size = 5;
    snakeSeed(prelimPools, 1, 26);

    const playoffTopPools = makePoolSet(2, 5, 1, 'Championship ', []);
    const place11 = new Pool(6, 2, '11th Place');
    const place17 = new Pool(5, 3, '17th Place');
    const place22 = new Pool(5, 4, '22nd Place');

    snakeSeed(playoffTopPools, 1, 10);
    place11.setSeedRange(11, 16);
    place17.setSeedRange(17, 21);
    place22.setSeedRange(22, 26);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 1 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place11, place17, place22]);

    this.phases = [prelims, playoffs, finals];
  }
}

export class Sched26Teams11RoundsNoWC implements StandardSchedule {
  readonly fullName = '26 Teams - Pools of 5 or 6 Teams, then 10/5/5/6 split';

  static shortName = '10 Rounds + Finals (6 in bottom pool)';

  readonly size = 25;

  readonly rounds = 11;

  readonly rebracketAfter = [5];

  readonly rooms = 11;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
    // This is a 25-team schedule with an extra team at the bottom
    const prelimPools = makePoolSet(5, 5, 1, 'Prelim ', [2, 1, 1, 1]);
    prelimPools[4].size = 6;
    setAutoAdvanceRules(prelimPools[4], [2, 1, 1, 2]);
    snakeSeed(prelimPools, 1, 26);

    const playoffTopPools = makePoolSet(2, 5, 1, 'Playoffs 1', [], false);
    const place11 = new Pool(5, 2, '11th Place', false);
    const place16 = new Pool(5, 3, '16th Place', false);
    const place21 = new Pool(6, 4, '21st Place', false);

    snakeSeed(playoffTopPools, 1, 10);
    place11.setSeedRange(11, 15);
    place16.setSeedRange(16, 20);
    place21.setSeedRange(21, 26);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place11, place16, place21]);

    this.phases = [prelims, playoffs, finals];
  }
}