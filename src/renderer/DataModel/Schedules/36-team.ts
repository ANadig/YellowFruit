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
