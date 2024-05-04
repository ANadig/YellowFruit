/** Standard schedules for 18-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched18Teams9Rounds: StandardSchedule = {
  fullName: '18 Teams - 3 Pools of 6 Teams, Then 3 Pools of 6 Teams',
  shortName: '9 Rounds',
  size: 18,
  rounds: 9,
  rebracketAfter: [5],
  rooms: 9,
  minGames: 9,

  constructPhases: () => {
    // Prelim: 3 pools of 6
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 18);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched18Teams10Rounds: StandardSchedule = {
  fullName: '18 Teams - 3 Pools of 6 Teams, Then 3 Pools of 6 Teams (No Carryover)',
  shortName: '10 Rounds',
  size: 18,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 9,
  minGames: 10,

  constructPhases: () => {
    // Prelim: 3 pools of 6
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 18);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(6, 2, '7th Place', false);
    const place13 = new Pool(6, 3, '13th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched18Teams12Rounds6to9: StandardSchedule = {
  fullName: '18 Teams - 3 Pools of 6 Teams, then 2 Pools of 9 Teams',
  shortName: '12 Rounds (Pools of 6, then 9)',
  size: 18,
  rounds: 12,
  rebracketAfter: [5],
  rooms: 9,
  minGames: 11,

  constructPhases: () => {
    // Prelim: 3 pools of 6
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [3, 3]);
    snakeSeed(prelimPools, 1, 18);

    // Playoffs: 2 tiers, each with 1 pool of 9
    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(9, 2, '10th Place', true);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 18);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10];

    return [prelims, playoffs];
  },
};

export const Sched18Teams12Rounds9to6: StandardSchedule = {
  fullName: '18 Teams - 2 Pools of 9 Teams, then 3 Pools of 6 Teams',
  shortName: '12 Rounds (Pools of 9, then 6)',
  size: 18,
  rounds: 12,
  rebracketAfter: [9],
  rooms: 9,
  minGames: 11,

  constructPhases: () => {
    // Prelim: 2 pools of 9
    const prelimPools = makePoolSet(2, 9, 1, 'Prelim ', [3, 3, 3]);
    snakeSeed(prelimPools, 1, 18);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched18Teams14Rounds: StandardSchedule = {
  fullName: '18 Teams - 2 Pools of 9 Teams, then Pools of 10 and 8',
  shortName: '14 Rounds',
  size: 18,
  rounds: 14,
  rebracketAfter: [9],
  rooms: 9,
  minGames: 12,

  constructPhases: () => {
    // Prelim: 2 pools of 9
    const prelimPools = makePoolSet(2, 9, 1, 'Prelim ', [5, 4]);
    snakeSeed(prelimPools, 1, 18);

    // Playoffs: Top pool of 10, bottom pool of 8
    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(8, 2, '11th Place', true);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 18);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11];

    return [prelims, playoffs];
  },
};
