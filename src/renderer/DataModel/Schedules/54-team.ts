/** Standard schedules for 54-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { makePlacementPools, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched54Teams10RoundsPlusF: StandardSchedule = {
  fullName: '54 Teams - Pools of 6 Teams, then Pools of 6 Teams with Parallel Top Pools',
  shortName: '10 Rounds + Finals',
  size: 54,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 27,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(9, 6, 1, 'Prelim ', [1]);
    snakeSeed(prelimPools, 1, 54);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const playoffLowerPools = makePlacementPools(7, 6, 2, 13, 54);

    snakeSeed(playoffTopPools, 1, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 3 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 6 },
      { tier: 4, numberOfTeams: 6 },
      { tier: 5, numberOfTeams: 6 },
      { tier: 6, numberOfTeams: 6 },
      { tier: 7, numberOfTeams: 6 },
      { tier: 8, numberOfTeams: 6 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffLowerPools);

    return [prelims, playoffs, finals];
  },
};
