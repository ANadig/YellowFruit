/** Standard schedules for 28-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched28Teams10RoundsPlusF: StandardSchedule = {
  fullName: '28 Teams - 4 Pools of 7 Teams, then 7 Pools of 4 (Top 2 Parallel)',
  shortName: '10 Rounds + Finals',
  size: 28,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 14,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 7, 1, 'Prelim ', [2, 1, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 28);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', []);
    playoffTopPools[0].seeds = [1, 4, 6, 7]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 5, 8];
    const place9 = new Pool(4, 2, '9th Place', false, 9, 12);
    const place13 = new Pool(4, 3, '13th Place', false, 13, 16);
    const place17 = new Pool(4, 4, '17th Place', false, 17, 20);
    const place21 = new Pool(4, 5, '21st Place', false, 21, 24);
    const place25 = new Pool(4, 6, '25th Place', false, 25, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 9, 9, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place9, place13, place17, place21, place25]);

    return [prelims, playoffs, finals];
  },
};

export const Sched28Teams11Rounds2PPlusF: StandardSchedule = {
  fullName: '28 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 with Parallel Top Pools',
  shortName: '11 Rounds (2 Stages) + Finals',
  size: 28,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 13,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    snakeSeed(prelimPools, 1, 28);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    snakeSeed(playoffTopPools, 1, 12);
    const place13 = new Pool(6, 2, '13th Place', false, 13, 18);
    const place19 = new Pool(5, 3, '19th Place', false, 19, 23);
    const place24 = new Pool(5, 4, '24th Place', false, 24, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place24]);

    return [prelims, playoffs, finals];
  },
};

export const Sched28Teams13Rounds6to10: StandardSchedule = {
  fullName: '28 Teams - Pools of 5 or 6, then Playoff Pools of 10/10/8',
  shortName: '13 Rounds (prelim pools of 5/6)',
  size: 28,
  rounds: 13,
  rebracketAfter: [5],
  rooms: 14,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 28);

    const championship = new Pool(10, 1, 'Championship', true, 1, 10);
    const place11 = new Pool(10, 2, '11th Place', true, 11, 20);
    const place21 = new Pool(8, 3, '21st Place', false, 21, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11, place21];

    return [prelims, playoffs];
  },
};
