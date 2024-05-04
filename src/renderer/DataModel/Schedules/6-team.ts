/** Standard schedules for 6-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched6TeamsDoubleRR: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 6,
  rounds: 10,
  rebracketAfter: [],
  rooms: 3,
  minGames: 10,
  constructPhases: () => {
    const rrPool = new Pool(6, 1, 'Round Robin');
    rrPool.setSeedRange(1, 6);
    rrPool.roundRobins = 2;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 10, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched6Teams13RoundsSplit33: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin, Then 3/3 Split',
  shortName: '13 Rounds (3/3 Split)',
  size: 6,
  rounds: 13,
  rebracketAfter: [10],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    // Prelims: double round robin
    const rrPool = new Pool(6, 1, 'Prelims');
    rrPool.setSeedRange(1, 6);
    setAutoAdvanceRules(rrPool, [3, 3]);
    rrPool.roundRobins = 2;

    // Playoffs: 2 tiers
    const championship = new Pool(3, 1, 'Championship', false);
    const place4 = new Pool(3, 2, '4th Place', false);

    championship.setSeedRange(1, 3);
    place4.setSeedRange(4, 6);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 10, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place4];

    return [prelims, playoffs];
  },
};

export const Sched6Teams13RoundsSplit42: StandardSchedule = {
  fullName: '6 Teams - Double Round Robin, Then 4/2 Split',
  shortName: '13 Rounds (4/2 Split)',
  size: 6,
  rounds: 13,
  rebracketAfter: [10],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    // Prelims: double round robin
    const rrPool = new Pool(6, 1, 'Prelims');
    rrPool.setSeedRange(1, 6);
    setAutoAdvanceRules(rrPool, [4, 2]);
    rrPool.roundRobins = 2;

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(2, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 6);
    place5.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 10, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 11, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};
