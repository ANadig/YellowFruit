/** Standard schedules for 32-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePlacementPools, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched32Teams8Rounds: StandardSchedule = {
  fullName: '32 Teams - Card System, then 3 Playoff Rounds',
  shortName: '8 Rounds + Finals',
  size: 32,
  rounds: 8,
  rebracketAfter: [5],
  rooms: 16,
  minGames: 8,
  constructPhases: () => {
    const prelimPool = new Pool(32, 1, 'Card System', false, 1, 32);
    prelimPool.roundRobins = 0;

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', []);
    snakeSeed(playoffTopPools, 1, 8);
    const playoffLowerPools = makePlacementPools(6, 4, 2, 9, 32, false);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 8 },
      { tier: 2, numberOfTeams: 4 },
      { tier: 3, numberOfTeams: 4 },
      { tier: 4, numberOfTeams: 4 },
      { tier: 5, numberOfTeams: 4 },
      { tier: 6, numberOfTeams: 4 },
      { tier: 7, numberOfTeams: 4 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const finals = new Phase(PhaseTypes.Finals, 9, 9, '3');

    prelims.pools = [prelimPool];
    playoffs.pools = playoffTopPools.concat(playoffLowerPools);

    return [prelims, playoffs, finals];
  },
};

export const Sched32Teams9Rounds: StandardSchedule = {
  fullName: '32 Teams - Four stages',
  shortName: '9 Rounds',
  size: 32,
  rounds: 9,
  rebracketAfter: [3, 5, 7],
  rooms: 16,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(8, 4, 1, 'Prelim ', [2, 2]);
    snakeSeed(prelimPools, 1, 32);

    const playoff1TopPools = makePoolSet(4, 4, 1, 'Playoffs 1-1', [2, 2, 0, 0], true);
    const playoff1BottomPools = makePoolSet(4, 4, 2, 'Playoffs 1-2', [0, 0, 2, 2], true);
    snakeSeed(playoff1TopPools, 1, 16);
    snakeSeed(playoff1BottomPools, 17, 32);

    const playoff2Tier1Pools = makePoolSet(2, 4, 1, 'Playoffs 2-1', [2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoff2Tier2Pools = makePoolSet(2, 4, 2, 'Playoffs 2-2', [0, 0, 2, 2, 0, 0, 0, 0], true);
    const playoff2Tier3Pools = makePoolSet(2, 4, 3, 'Playoffs 2-3', [0, 0, 0, 0, 2, 2, 0, 0], true);
    const playoff2Tier4Pools = makePoolSet(2, 4, 4, 'Playoffs 2-4', [0, 0, 0, 0, 0, 0, 2, 2], true);
    snakeSeed(playoff2Tier1Pools, 1, 8);
    snakeSeed(playoff2Tier2Pools, 9, 16);
    snakeSeed(playoff2Tier3Pools, 17, 24);
    snakeSeed(playoff2Tier4Pools, 25, 32);

    const playoff3Pools = makePlacementPools(8, 4, 1, 1, 32, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 3, '1');
    const playoffs1 = new Phase(PhaseTypes.Playoff, 4, 5, '2', 'Playoff Stage 1');
    const playoffs2 = new Phase(PhaseTypes.Playoff, 6, 7, '3', 'Playoff Stage 2');
    const playoffs3 = new Phase(PhaseTypes.Playoff, 8, 9, '4', 'Playoff Stage 3');

    prelims.pools = prelimPools;
    playoffs1.pools = [playoff1TopPools, playoff1BottomPools].flat();
    playoffs2.pools = [playoff2Tier1Pools, playoff2Tier2Pools, playoff2Tier3Pools, playoff2Tier4Pools].flat();
    playoffs3.pools = playoff3Pools;

    return [prelims, playoffs1, playoffs2, playoffs3];
  },
};

export const Sched32Teams10Rounds8to4: StandardSchedule = {
  fullName: '32 Teams - 4 Pools of 8, then 8 Pools of 4 (Top 2 Parallel)',
  shortName: '10 Rounds + Finals (Prelim Pools of 8)',
  size: 32,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 16,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 1, 1, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 32);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', []);
    playoffTopPools[0].seeds = [1, 4, 6, 7]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 5, 8];

    const playoffLowerPools = makePlacementPools(6, 4, 2, 9, 32, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffLowerPools);
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    return [prelims, playoffs, finals];
  },
};

export const Sched32Teams10Rounds6to6: StandardSchedule = {
  fullName: '32 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 Teams with Parallel Top Pools',
  shortName: '10 Rounds + Finals (Prelim Pools of 5/6)',
  size: 32,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 14,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    prelimPools[3].size = 5;
    snakeSeed(prelimPools, 1, 32);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    playoffTopPools[0].seeds = [1, 4, 5, 7, 10, 11]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 6, 8, 9, 12];

    const playoffLowerPools = makePlacementPools(4, 5, 2, 13, 32, false);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 5 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
      { tier: 5, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffLowerPools);

    return [prelims, playoffs, finals];
  },
};

export const Sched32Teams11Rounds8to4to4: StandardSchedule = {
  fullName: '32 Teams - 4 Pools of 8, then 8 Pools of 4, then 8 Pools of 4',
  shortName: '11 Rounds (Prelim Pools of 8)',
  size: 32,
  rounds: 11,
  rebracketAfter: [7, 9],
  rooms: 16,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 32);

    const playoffTier1Pools = makePoolSet(2, 4, 1, 'Playoff 1', [2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoffTier2Pools = makePoolSet(2, 4, 2, 'Playoff 2', [0, 0, 2, 2, 0, 0, 0, 0], true);
    const playoffTier3Pools = makePoolSet(2, 4, 3, 'Playoff 3', [0, 0, 0, 0, 2, 2, 0, 0], true);
    const playoffTier4Pools = makePoolSet(2, 4, 4, 'Playoff 4', [0, 0, 0, 0, 0, 0, 2, 2], true);
    snakeSeed(playoffTier1Pools, 1, 8);
    snakeSeed(playoffTier2Pools, 9, 16);
    snakeSeed(playoffTier3Pools, 17, 24);
    snakeSeed(playoffTier4Pools, 25, 32);

    const superPlayoffPools = makePlacementPools(8, 4, 1, 1, 32, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTier1Pools, playoffTier2Pools, playoffTier3Pools, playoffTier4Pools].flat();
    superplayoffs.pools = superPlayoffPools;

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched32Teams13Rounds: StandardSchedule = {
  fullName: '32 Teams - 4 Pools of 8, then 4 Pools of 8',
  shortName: '13 Rounds',
  size: 32,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 16,
  minGames: 13,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 32);

    const playoffPools = makePlacementPools(4, 8, 1, 1, 32, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};
