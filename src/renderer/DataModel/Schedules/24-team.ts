/** Standard schedules for 24-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class sched24Teams2Phases11Rounds implements StandardSchedule {
  size = 24;

  rounds = 11;

  rooms = 12;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim', [2, 2, 2]);

    const championship = new Pool(8, 1, 'Championship');
    const place9 = new Pool(8, 2, '9th Place');
    const place17 = new Pool(8, 3, '17th Place');

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, 1, '1');
    prelims.pools = prelimPools;
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, 3, '2');
    playoffs.pools = [championship, place9, place17];

    this.phases = [prelims, playoffs];
  }
}

export default class sched24Teams3Phases11Rounds implements StandardSchedule {
  size = 24;

  rounds = 11;

  rooms = 12;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim', [3, 3]);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs Tier 1 Pool', [3, 3]);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs Tier 2 Pool', [3, 3]);

    const championship = new Pool(6, 1, 'Championship');
    const place7 = new Pool(6, 2, '7th Place');
    const place13 = new Pool(6, 3, '13th Place');
    const place19 = new Pool(6, 4, '19th Place');

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, 1, '1');
    prelims.pools = prelimPools;
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, 2, '2');
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 11, 4, '3');
    superPlayoffs.pools = [championship, place7, place13, place19];

    this.phases = [prelims, playoffs, superPlayoffs];
  }
}
