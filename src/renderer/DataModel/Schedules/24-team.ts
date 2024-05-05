/** Standard schedules for 24-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched24Teams8Rounds: StandardSchedule = {
  fullName: '24 Teams - 4 Pools of 6 Teams, Then 6 Pools of 4 Teams (Top 2 Parallel)',
  shortName: '8 Rounds + Finals',
  size: 24,
  rounds: 9,
  rebracketAfter: [5],
  rooms: 12,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 24);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Championship ', [], false);
    const place9 = new Pool(4, 2, '9th Place');
    const place13 = new Pool(4, 3, '13th Place');
    const place17 = new Pool(4, 4, '17th Place');
    const place21 = new Pool(4, 5, '21st Place');

    playoffTopPools[0].seeds = [1, 4, 6, 7]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 5, 8];
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place9, place13, place17, place21]);
    const finals = new Phase(PhaseTypes.Finals, 9, 9, '3');

    return [prelims, playoffs, finals];
  },
};

export const Sched24Teams9Rounds: StandardSchedule = {
  fullName: '24 Teams - 4 Pools of 6 Teams, Then 3 Sets of 2 Parallel Pools of 4 Teams, Then 6 Pools of 4 Teams',
  shortName: '9 Rounds',
  size: 24,
  rounds: 9,
  rebracketAfter: [5, 7],
  rooms: 12,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 24);

    const playoffTopPools = makePoolSet(2, 4, 1, 'Playoffs 1', [2, 2, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 4, 2, 'Playoffs 2', [0, 0, 2, 2, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 4, 3, 'Playoffs 3', [0, 0, 0, 0, 2, 2], true);

    snakeSeed(playoffTopPools, 1, 8);
    snakeSeed(playoffMiddlePools, 9, 16);
    snakeSeed(playoffBottomPools, 17, 24);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(4, 6, '21st Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 7, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 8, 9, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superPlayoffs.pools = [championship, place5, place9, place13, place17, place21];

    return [prelims, playoffs, superPlayoffs];
  },
};

export const Sched24Teams10Rounds: StandardSchedule = {
  fullName: '24 Teams - 4 Pools of 6 Teams, Then 2 Sets of 2 Parallel Pools of 6 Teams, Then 6 Pools of 4 Teams',
  shortName: '10 Rounds',
  size: 24,
  rounds: 10,
  rebracketAfter: [5, 8],
  rooms: 12,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 24);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs 1', [2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs 2', [0, 0, 0, 2, 2, 2], true);

    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffBottomPools, 13, 24);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(4, 6, '21st Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 10, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    superPlayoffs.pools = [championship, place5, place9, place13, place17, place21];

    return [prelims, playoffs, superPlayoffs];
  },
};

export const Sched24Teams11Rounds2Phases5Prelim: StandardSchedule = {
  fullName: '24 Teams - 4 Pools of 6 Teams, Then 3 Pools of 8 Teams',
  shortName: '11 Rounds (2 Stages; 5 Prelim Rounds)',
  size: 24,
  rounds: 11,
  rebracketAfter: [5],
  rooms: 12,
  minGames: 11,
  constructPhases: () => {
    // Prelim: 4 pools of 6
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 24);

    // Playoffs: 3 tiers, each with 1 pool of 8
    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(8, 2, '9th Place', true);
    const place17 = new Pool(8, 3, '17th Place', true);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 16);
    place17.setSeedRange(17, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17];

    return [prelims, playoffs];
  },
};

export const Sched24Teams11Rounds2Phases7Prelim: StandardSchedule = {
  fullName: '24 Teams - Pools of 8, then Playoff Pools of 6',
  shortName: '11 Rounds (2 Stages; 7 Prelim Rounds)',
  size: 24,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 12,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 24);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(6, 4, '19th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19];

    return [prelims, playoffs];
  },
};

export const Sched24Teams11Rounds3Phases: StandardSchedule = {
  fullName: '24 Teams - 4 Pools of 6 Teams, Then 2 Sets of 2 Parallel Pools of 6 Teams, Then 4 Pools of 6 Teams',
  shortName: '11 Rounds (3 Stages)',
  size: 24,
  rounds: 11,
  rebracketAfter: [5, 8],
  rooms: 12,
  minGames: 11,
  constructPhases: () => {
    // Prelim: 4 pools of 6
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 24);

    // Playoffs: 2 tiers, each with 2 parallel pools of 6
    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoffs 1', [3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 2, 'Playoffs 2', [0, 0, 3, 3], true);

    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffBottomPools, 13, 24);

    // Superplayoffs: 4 tiers, each with one pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(6, 4, '19th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superPlayoffs = new Phase(PhaseTypes.Playoff, 9, 11, '3', 'Superplayoffs');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat(playoffBottomPools);
    superPlayoffs.pools = [championship, place7, place13, place19];

    return [prelims, playoffs, superPlayoffs];
  },
};

export const Sched24Teams14Rounds: StandardSchedule = {
  fullName: '24 Teams - Pools of 8, then Playoff Pools of 9/9/6',
  shortName: '14 Rounds',
  size: 24,
  rounds: 14,
  rebracketAfter: [7],
  rooms: 12,
  minGames: 12,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [3, 3, 2]);
    snakeSeed(prelimPools, 1, 24);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(9, 2, '10th Place', true);
    const place19 = new Pool(6, 3, '19th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 18);
    place19.setSeedRange(19, 24);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place19];

    return [prelims, playoffs];
  },
};
