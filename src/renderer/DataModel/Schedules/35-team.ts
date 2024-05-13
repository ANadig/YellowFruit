/** Standard schedules for 36-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched35Teams10Rounds: StandardSchedule = {
  fullName: '35 Teams - 5 Pools of 7, then 9 Pools of 3 or 4 (Top 2 Parallel)',
  shortName: '10 Rounds + Finals',
  size: 35,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 17,
  minGames: 8,
  usesWC: true,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 7, 1, 'Prelim ', [1]);
    snakeSeed(prelimPools, 1, 35);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', []);
    snakeSeed(playoffTopPools, 1, 8);

    const place9 = new Pool(4, 2, '9th Place', false, 9, 12);
    const place13 = new Pool(4, 3, '13th Place', false, 13, 16);
    const place17 = new Pool(4, 4, '17th Place', false, 17, 20);
    const place21 = new Pool(4, 5, '21st Place', false, 21, 24);
    const place25 = new Pool(4, 6, '25th Place', false, 25, 28);
    const place29 = new Pool(4, 7, '29th Place', false, 29, 32);
    const place33 = new Pool(3, 8, '33rd Place', false, 33, 35);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 3 },
      { tier: 2, numberOfTeams: 4 },
      { tier: 3, numberOfTeams: 4 },
      { tier: 4, numberOfTeams: 4 },
      { tier: 5, numberOfTeams: 4 },
      { tier: 6, numberOfTeams: 4 },
      { tier: 7, numberOfTeams: 4 },
      { tier: 8, numberOfTeams: 3 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place9, place13, place17, place21, place25, place29, place33]);
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    return [prelims, playoffs, finals];
  },
};

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

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [2, 2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 0, 2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 3, 'Playoff 3', [0, 0, 0, 0, 0, 0, 2, 2, 2], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 0, 0, 0, 0, 2, 2, 1]);
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

export const Sched35Teams12RoundsRb5and9: StandardSchedule = {
  fullName: '35 Teams - 3 stages of 6 pools of 5 or 6',
  shortName: '12 Rounds (Rebracket After 5 and 9)',
  size: 35,
  rounds: 12,
  rebracketAfter: [5, 9],
  rooms: 17,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 35);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [3, 3, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 3, 'Playoff 3', [0, 0, 0, 0, 3, 3], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 0, 0, 3, 2]);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 35);

    const championship = new Pool(6, 1, 'Championship', true, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', true, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', true, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', true, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', true, 25, 30);
    const place31 = new Pool(5, 6, '31st Place', true, 31, 35);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 12, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched35Teams12RoundsRb5and8: StandardSchedule = {
  fullName: '35 Teams - 3 stages of 6 pools of 5 or 6',
  shortName: '12 Rounds (Rebracket After 5 and 8)',
  size: 35,
  rounds: 12,
  rebracketAfter: [5, 8],
  rooms: 17,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 35);

    const playoffTopPools = makePoolSet(3, 6, 1, 'Playoff 1', [2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(3, 6, 2, 'Playoff 3', [0, 0, 0, 2, 2, 2], true);
    playoffBottomPools[0].size = 5;
    setAutoAdvanceRules(playoffBottomPools[0], [0, 0, 0, 2, 2, 1]);
    snakeSeed(playoffTopPools, 1, 18);
    snakeSeed(playoffBottomPools, 19, 35);

    const championship = new Pool(6, 1, 'Championship', true, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', true, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', true, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', true, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', true, 25, 30);
    const place31 = new Pool(5, 6, '31st Place', true, 31, 35);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 9, 12, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs, superplayoffs];
  },
};
