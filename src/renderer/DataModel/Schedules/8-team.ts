/** Standard schedules for 8-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, setAutoAdvanceRules } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched8TeamsSingleRR: StandardSchedule = {
  fullName: '8 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 8,
  rounds: 7,
  rebracketAfter: [],
  rooms: 4,
  minGames: 7,
  constructPhases: () => {
    const rrPool = new Pool(8, 1, 'Round Robin');
    rrPool.setSeedRange(1, 8);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 7, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};

export const Sched8Teams10Rounds: StandardSchedule = {
  fullName: '8 Teams - Round Robin, Then 4/4 Split',
  shortName: '10 Rounds',
  size: 8,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 4,
  minGames: 10,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(8, 1, 'Prelims');
    rrPool.setSeedRange(1, 8);
    setAutoAdvanceRules(rrPool, [4, 4]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched8Teams13Rounds: StandardSchedule = {
  fullName: '8 Teams - Round Robin, Then 4/4 Split with Double Round Robin',
  shortName: '13 Rounds',
  size: 8,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 4,
  minGames: 13,
  constructPhases: () => {
    // Prelims: single round robin
    const rrPool = new Pool(8, 1, 'Prelims');
    rrPool.setSeedRange(1, 8);
    setAutoAdvanceRules(rrPool, [4, 4]);

    // Playoffs: 2 tiers
    const championship = new Pool(4, 1, 'Championship', false);
    const place5 = new Pool(4, 2, '5th Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);

    championship.roundRobins = 2;
    place5.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = [rrPool];
    playoffs.pools = [championship, place5];

    return [prelims, playoffs];
  },
};

export const Sched8TeamsDoubleRR: StandardSchedule = {
  fullName: '8 Teams - Double Round Robin',
  shortName: 'Double Round Robin',
  size: 8,
  rounds: 14,
  rebracketAfter: [],
  rooms: 4,
  minGames: 14,
  constructPhases: () => {
    const rrPool = new Pool(8, 1, 'Round Robin');
    rrPool.setSeedRange(1, 8);

    const roundRobin = new Phase(PhaseTypes.Prelim, 1, 14, '1', 'Round Robin');
    roundRobin.pools = [rrPool];
    return [roundRobin];
  },
};
