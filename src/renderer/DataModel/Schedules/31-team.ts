/** Standard schedules for 31-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
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

    const championship = new Pool(4, 1, 'Championship', true, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', true, 5, 8);
    const place9 = new Pool(4, 3, '9th Place', true, 9, 12);
    const place13 = new Pool(4, 4, '13th Place', true, 13, 16);
    const place17 = new Pool(4, 5, '17th Place', true, 17, 20);
    const place21 = new Pool(4, 6, '21st Place', true, 21, 24);
    const place25 = new Pool(4, 7, '25th Place', true, 25, 28);
    const place29 = new Pool(3, 8, '29th Place', true, 29, 31);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 3, '1');
    const playoffs1 = new Phase(PhaseTypes.Playoff, 4, 5, '2', 'Playoff Stage 1');
    const playoffs2 = new Phase(PhaseTypes.Playoff, 6, 7, '3', 'Playoff Stage 2');
    const playoffs3 = new Phase(PhaseTypes.Playoff, 8, 9, '4', 'Playoff Stage 3');

    prelims.pools = prelimPools;
    playoffs1.pools = [playoff1TopPools, playoff1BottomPools].flat();
    playoffs2.pools = [playoff2Tier1Pools, playoff2Tier2Pools, playoff2Tier3Pools, playoff2Tier4Pools].flat();
    playoffs3.pools = [championship, place5, place9, place13, place17, place21, place25, place29];

    return [prelims, playoffs1, playoffs2, playoffs3];
  },
};
