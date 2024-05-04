/** Standard schedules for 7-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched7TeamsSingleRR: StandardSchedule = {
  fullName: '7 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 7,
  rounds: 7,
  rebracketAfter: [],
  rooms: 3,
  minGames: 6,
  constructPhases: () => {
    const rrPool = new Pool(7, 1, 'Round Robin');
    rrPool.setSeedRange(1, 7);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 7, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched7Teams10Rounds: StandardSchedule = {
  fullName: '7 Teams - Round Robin, Then 4/3 Split',
  shortName: '10 Rounds',
  size: 7,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 3,
  minGames: 8,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(7, 1, 'Prelims');
    rrPool.setSeedRange(1, 7);
    setAutoAdvanceRules(rrPool, [4, 3]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched7Teams13Rounds: StandardSchedule = {
  fullName: '7 Teams - Round Robin, Then 4/3 Split with Double Round Robin',
  shortName: '13 Rounds',
  size: 7,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 3,
  minGames: 10,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(7, 1, 'Prelims');
    rrPool.setSeedRange(1, 7);
    setAutoAdvanceRules(rrPool, [4, 3]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(3, 2, '5th Place', false);

    championship.roundRobins = 2;
    place5.roundRobins = 2;

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 7);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched7TeamsDoubleRR: StandardSchedule = {
  fullName: '7 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 7,
  rounds: 14,
  rebracketAfter: [],
  rooms: 3,
  minGames: 12,
  constructPhases: () => {
    const rrPool = new Pool(7, 1, 'Round Robin');
    rrPool.setSeedRange(1, 7);
    rrPool.roundRobins = 2;

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 14, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
