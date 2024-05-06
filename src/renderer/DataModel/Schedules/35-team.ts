/** Standard schedules for 36-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

// eslint-disable-next-line import/prefer-default-export
export const Sched35Teams11Rounds: StandardSchedule = {
  fullName: '35 Teams - 6 Pools of 5 or 6, then 6 Pools of 5 or 6, then 9 Pools of 3 or 4',
  shortName: '11 Rounds',
  size: 35,
  rounds: 11,
  rebracketAfter: [5, 9],
  rooms: 17,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 35);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [2, 2, 2], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [2, 2, 2], true);
    const playoffBottomPools = makePoolSet(2, 6, 3, 'Playoff 3', [2, 2, 2], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [2, 2, 1]);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 35);

    const championship = new Pool(4, 1, 'Championship', true, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', true, 5, 8);
    const place9 = new Pool(4, 3, '9th Place', true, 9, 12);
    const place13 = new Pool(4, 4, '13th Place', true, 13, 16);
    const place17 = new Pool(4, 5, '17th Place', true, 17, 20);
    const place21 = new Pool(4, 6, '21rd Place', true, 21, 24);
    const place25 = new Pool(4, 7, '25th Place', true, 25, 28);
    const place29 = new Pool(4, 8, '29th Place', true, 29, 32);
    const place33 = new Pool(3, 9, '33rd Place', true, 33, 35);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place5, place9, place13, place17, place21, place25, place29, place33];

    return [prelims, playoffs, superplayoffs];
  },
};
