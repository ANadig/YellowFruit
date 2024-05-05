/** Standard schedules for 34-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched34Teams10RoundsPlusF: StandardSchedule = {
  fullName: '34 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 Teams with Parallel Top Pools',
  shortName: '10 Rounds + Finals',
  size: 34,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 16,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 1, 1]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    snakeSeed(prelimPools, 1, 34);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place', false, 13, 18);
    const place19 = new Pool(6, 3, '19th Place', false, 19, 24);
    const place25 = new Pool(5, 4, '25th Place', false, 25, 29);
    const place30 = new Pool(5, 5, '30th Place', false, 30, 34);

    playoffTopPools[0].seeds = [1, 4, 5, 7, 10, 11]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 6, 8, 9, 12];

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 4, numberOfTeams: 5 },
      { tier: 5, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place25, place30]);

    return [prelims, playoffs, finals];
  },
};
