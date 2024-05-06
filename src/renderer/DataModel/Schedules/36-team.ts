/** Standard schedules for 36-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched36Teams10RoundsPlusF: StandardSchedule = {
  fullName: '36 Teams - 6 Pools of 6 Teams, then 6 Pools of 6 Teams with Parallel Top Pools',
  shortName: '10 Rounds + Finals',
  size: 36,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 18,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 36);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place', false, 13, 18);
    const place19 = new Pool(6, 3, '19th Place', false, 19, 24);
    const place25 = new Pool(6, 4, '25th Place', false, 25, 30);
    const place31 = new Pool(6, 5, '31st Place', false, 31, 36);

    playoffTopPools[0].seeds = [1, 4, 5, 7, 10, 11]; // not a normal snake seed to avoid rematches
    playoffTopPools[1].seeds = [2, 3, 6, 8, 9, 12];

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place25, place31]);

    return [prelims, playoffs, finals];
  },
};

export const Sched36Teams10Rounds: StandardSchedule = {
  fullName: '36 Teams - 6 Pools of 6 Teams, then 6 Pools of 6',
  shortName: '10 Rounds (No Parallel Top Pools)',
  size: 36,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 18,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [1, 1, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 36);

    const championship = new Pool(6, 1, 'Championship', false, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', false, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', false, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', false, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', false, 25, 30);
    const place31 = new Pool(6, 6, '31st Place', false, 31, 36);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs];
  },
};

export const Sched36Teams11Rounds: StandardSchedule = {
  fullName: '36 Teams - 6 Pools of 6 Teams, then 6 Pools of 6, then 9 Pools of 4',
  shortName: '11 Rounds',
  size: 36,
  rounds: 11,
  rebracketAfter: [5, 9],
  rooms: 18,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 36);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [2, 2, 2, 0, 0, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 0, 2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 3, 'Playoff 3', [0, 0, 0, 0, 0, 0, 2, 2, 2], true);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 36);

    const championship = new Pool(4, 1, 'Championship', true, 1, 4);
    const place5 = new Pool(4, 2, '5th Place', true, 5, 8);
    const place9 = new Pool(4, 3, '9th Place', true, 9, 12);
    const place13 = new Pool(4, 4, '13th Place', true, 13, 16);
    const place17 = new Pool(4, 5, '17th Place', true, 17, 20);
    const place21 = new Pool(4, 6, '21st Place', true, 21, 24);
    const place25 = new Pool(4, 7, '25th Place', true, 25, 28);
    const place29 = new Pool(4, 8, '29th Place', true, 29, 32);
    const place33 = new Pool(4, 9, '33rd Place', true, 33, 36);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place5, place9, place13, place17, place21, place25, place29, place33];

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched36Teams12RoundsRb5and9: StandardSchedule = {
  fullName: '36 Teams - 3 stages of 6 pools of 6',
  shortName: '12 Rounds (Rebracket After 5 and 9)',
  size: 36,
  rounds: 12,
  rebracketAfter: [5, 9],
  rooms: 18,
  minGames: 12,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 36);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Playoff 1', [3, 3, 0, 0, 0, 0], true);
    const playoffMiddlePools = makePoolSet(2, 6, 2, 'Playoff 2', [0, 0, 3, 3, 0, 0], true);
    const playoffBottomPools = makePoolSet(2, 6, 3, 'Playoff 3', [0, 0, 0, 0, 3, 3], true);
    snakeSeed(playoffTopPools, 1, 12);
    snakeSeed(playoffMiddlePools, 13, 24);
    snakeSeed(playoffBottomPools, 25, 36);

    const championship = new Pool(6, 1, 'Championship', true, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', true, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', true, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', true, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', true, 25, 30);
    const place31 = new Pool(6, 6, '31st Place', true, 31, 36);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 10, 12, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffMiddlePools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs, superplayoffs];
  },
};

export const Sched36Teams12RoundsRb5and8: StandardSchedule = {
  fullName: '36 Teams - 3 stages of 6 pools of 6',
  shortName: '12 Rounds (Rebracket After 5 and 8)',
  size: 36,
  rounds: 12,
  rebracketAfter: [5, 8],
  rooms: 18,
  minGames: 12,
  constructPhases: () => {
    const prelimPools = makePoolSet(6, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 36);

    const playoffTopPools = makePoolSet(3, 6, 1, 'Playoff 1', [2, 2, 2, 0, 0, 0], true);
    const playoffBottomPools = makePoolSet(3, 6, 2, 'Playoff 3', [0, 0, 0, 2, 2, 2], true);
    snakeSeed(playoffTopPools, 1, 18);
    snakeSeed(playoffBottomPools, 19, 36);

    const championship = new Pool(6, 1, 'Championship', true, 1, 6);
    const place7 = new Pool(6, 2, '7th Place', true, 7, 12);
    const place13 = new Pool(6, 3, '13th Place', true, 13, 18);
    const place19 = new Pool(6, 4, '19th Place', true, 19, 24);
    const place25 = new Pool(6, 5, '25th Place', true, 25, 30);
    const place31 = new Pool(6, 6, '31st Place', true, 31, 36);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 8, '2');
    const superplayoffs = new Phase(PhaseTypes.Playoff, 9, 12, '3');

    prelims.pools = prelimPools;
    playoffs.pools = [playoffTopPools, playoffBottomPools].flat();
    superplayoffs.pools = [championship, place7, place13, place19, place25, place31];

    return [prelims, playoffs, superplayoffs];
  },
};
