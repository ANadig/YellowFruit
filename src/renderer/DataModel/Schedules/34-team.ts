/** Standard schedules for 34-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
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

export const Sched34Teams11Rounds: StandardSchedule = {
  fullName: '34 Teams - 6 Pools of 5 or 6, then 6 Pools of 5 or 6, then 9 Pools of 2 or 4',
  shortName: '11 Rounds',
  size: 34,
  rounds: 11,
  rebracketAfter: [5, 9],
  rooms: 17,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 34);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [2, 2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 0, 2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 5, 3, 'Playoff 3', [0, 0, 0, 0, 0, 0, 2, 2, 1], true);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 34);

    const championship = new Pool(4, 1, 'Championship', true, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', true, 5, 8);
    const place9 = new Pool(4, 3, '9th Place', true, 9, 12);
    const place13 = new Pool(4, 4, '13th Place', true, 13, 16);
    const place17 = new Pool(4, 5, '17th Place', true, 17, 20);
    const place21 = new Pool(4, 6, '21rd Place', true, 21, 24);
    const place25 = new Pool(4, 7, '25th Place', true, 25, 28);
    const place29 = new Pool(4, 8, '29th Place', true, 29, 32);
    const place33 = new Pool(2, 9, '33rd Place', false, 33, 34);
    place33.roundRobins = 2;

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place5, place9, place13, place17, place21, place25, place29, place33];

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched34Teams12Rounds: StandardSchedule = {
  fullName: '34 Teams - Pools of 5 or 6, then Pools of 5 or 6, then Pools of 4 or 6',
  shortName: '12 Rounds',
  size: 34,
  rounds: 12,
  rebracketAfter: [5, 9],
  rooms: 17,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 34);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [3, 3, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 5, 3, 'Playoff 3', [0, 0, 0, 0, 3, 2], true);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 34);

    const championship = new Pool(6, 1, 'Championship', true, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', true, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', true, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', true, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', true, 25, 30);
    const place31 = new Pool(4, 6, '31st Place', true, 31, 34);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 12, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs, superplayoffs];
  },
};
