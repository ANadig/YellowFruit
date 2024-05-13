/** Standard schedules for 31-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { makePlacementPools, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched31Teams9Rounds: StandardSchedule = {
  fullName: '31 Teams - Four stages',
  shortName: '9 Rounds',
  size: 31,
  rounds: 9,
  rebracketAfter: [3, 5, 7],
  rooms: 15,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(8, 4, 1, 'Prelim ', [2, 2]);
    prelimPools[0].size = 3;
    setAutoAdvanceRules(prelimPools[0], [2, 1]);
    snakeSeed(prelimPools, 1, 31);

    const playoff1TopPools = makePoolSet(4, 4, 1, 'Playoffs 1-1', [2, 2, 0, 0], true);
    const playoff1BottomPools = makePoolSet(4, 4, 2, 'Playoffs 1-2', [0, 0, 2, 2], true);
    playoff1BottomPools[0].size = 3;
    setAutoAdvanceRules(playoff1BottomPools[0], [0, 0, 2, 1]);
    snakeSeed(playoff1TopPools, 1, 16);
    snakeSeed(playoff1BottomPools, 17, 31);

    const playoff2Tier1Pools = makePoolSet(2, 4, 1, 'Playoffs 2-1', [2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoff2Tier2Pools = makePoolSet(2, 4, 2, 'Playoffs 2-2', [0, 0, 2, 2, 0, 0, 0, 0], true);
    const playoff2Tier3Pools = makePoolSet(2, 4, 3, 'Playoffs 2-3', [0, 0, 0, 0, 2, 2, 0, 0], true);
    const playoff2Tier4Pools = makePoolSet(2, 4, 4, 'Playoffs 2-4', [0, 0, 0, 0, 0, 0, 2, 2], true);
    playoff2Tier4Pools[0].size = 3;
    setAutoAdvanceRules(playoff2Tier4Pools[0], [0, 0, 0, 0, 0, 0, 2, 1]);
    snakeSeed(playoff2Tier1Pools, 1, 8);
    snakeSeed(playoff2Tier2Pools, 9, 16);
    snakeSeed(playoff2Tier3Pools, 17, 24);
    snakeSeed(playoff2Tier4Pools, 25, 31);

    const playoff3Pools = makePlacementPools(8, 4, 1, 1, 31, true);

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

export const Sched31Teams11Rounds: StandardSchedule = {
  fullName: '32 Teams - Pools of 7 or 8, then Pools of 3 or 4, then Pools of 3 or 4',
  shortName: '11 Rounds',
  size: 31,
  rounds: 11,
  rebracketAfter: [7, 9],
  rooms: 15,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 31);

    const playoffTier1Pools = makePoolSet(2, 4, 1, 'Playoff 1', [2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoffTier2Pools = makePoolSet(2, 4, 2, 'Playoff 2', [0, 0, 2, 2, 0, 0, 0, 0], true);
    const playoffTier3Pools = makePoolSet(2, 4, 3, 'Playoff 3', [0, 0, 0, 0, 2, 2, 0, 0], true);
    const playoffTier4Pools = makePoolSet(2, 4, 4, 'Playoff 4', [0, 0, 0, 0, 0, 0, 2, 2], true);
    playoffTier4Pools[0].size = 3;
    setAutoAdvanceRules(playoffTier4Pools[0], [0, 0, 0, 0, 0, 0, 2, 1]);
    snakeSeed(playoffTier1Pools, 1, 8);
    snakeSeed(playoffTier2Pools, 9, 16);
    snakeSeed(playoffTier3Pools, 17, 24);
    snakeSeed(playoffTier4Pools, 25, 31);

    const superPlayoffPools = makePlacementPools(8, 4, 1, 1, 31, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTier1Pools, playoffTier2Pools, playoffTier3Pools, playoffTier4Pools].flat();
    superplayoffs.pools = superPlayoffPools;

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched31Teams13Rounds: StandardSchedule = {
  fullName: '31 Teams - 4 Pools of 7 or 8, then 4 Pools of 7 or 8',
  shortName: '13 Rounds',
  size: 31,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 15,
  minGames: 12,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 31);

    const playoffPools = makePlacementPools(4, 8, 1, 1, 31, true);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffPools;

    return [prelims, playoffs];
  },
};
