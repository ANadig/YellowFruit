/** Standard schedules for 24-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export default class sched24Teams2Phases11Rounds implements StandardSchedule {
  size = 24;

  rounds = 11;

  rooms = 12;

  phases: Phase[];

  constructor() {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim', [2, 2, 2]);

    const championship = new Pool(1, 8, 'Championship');
    const place9 = new Pool(1, 8, '9th Place');
    const place17 = new Pool(1, 8, '17th Place');

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, 1, '1');
    prelims.pools = prelimPools;
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, 3, '2');
    playoffs.pools = [championship, place9, place17];

    this.phases = [prelims, playoffs];
  }
}
