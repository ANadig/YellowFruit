/** Standard schedules for 10-team tournaments */

import { Phase, PhaseTypes, simpleRoundRobinPrelims } from '../Phase';
import { Pool } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched10TeamsSingleRR: StandardSchedule = {
  fullName: '10 Teams - Single Round Robin',
  shortName: 'Single Round Robin',
  size: 10,
  rounds: 9,
  rebracketAfter: [],
  rooms: 5,
  minGames: 9,
  constructPhases: () => {
    return [simpleRoundRobinPrelims(10, 1)];
  },
};

export const Sched10Teams12Rounds433: StandardSchedule = {
  fullName: '10 Teams - Round Robin, Then 4/3/3 Split',
  shortName: '12 Rounds, 4/3/3 split',
  size: 10,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 5,
  minGames: 11,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(10, 1, [4, 3, 3]);

    // Playoffs: 3 tiers
    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(3, 2, '5th Place', false, 5, 7);
    const place8 = new Pool(3, 3, '8th Place', false, 8, 10);

    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');
    playoffs.pools = [championship, place5, place8];

    return [prelims, playoffs];
  },
};

export const Sched10Teams12Rounds442: StandardSchedule = {
  fullName: '10 Teams - Round Robin, Then 4/4/2 Split',
  shortName: '12 Rounds, 4/4/2 split',
  size: 10,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 5,
  minGames: 11,
  constructPhases: () => {
    const prelims = simpleRoundRobinPrelims(10, 1, [4, 4, 2]);

    const championship = new Pool(4, 1, 'Championship', false, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', false, 5, 8);
    const place9 = new Pool(2, 3, '9th Place', false, 9, 10);

    place9.roundRobins = 2;

    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');
    playoffs.pools = [championship, place5, place9];

    return [prelims, playoffs];
  },
};
