/** Standard schedules for 45-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { makePlacementPools, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched45Teams10RoundsPlusF: StandardSchedule = {
  fullName: '45 Teams - Pools of 6 Teams, then Pools of 6 Teams with Parallel Top Pools',
  shortName: '10 Rounds + Finals',
  size: 45,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 21,
  minGames: 8,
  usesWC: true,
  constructPhases: () => {
    const prelimPools = makePoolSet(8, 6, 1, 'Prelim ', [1]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    snakeSeed(prelimPools, 1, 45);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    let playoffLowerPools = makePlacementPools(3, 6, 2, 13, 30);
    playoffLowerPools = playoffLowerPools.concat(makePlacementPools(3, 5, 5, 31, 45));

    snakeSeed(playoffTopPools, 1, 12);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 4 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 6 },
      { tier: 4, numberOfTeams: 6 },
      { tier: 5, numberOfTeams: 5 },
      { tier: 6, numberOfTeams: 5 },
      { tier: 7, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffLowerPools);

    return [prelims, playoffs, finals];
  },
};
