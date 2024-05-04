/** Standard schedules for 16-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched16Teams9Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 4 Pools of 4',
  shortName: '9 Rounds',
  size: 16,
  rounds: 9,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 9,
  constructPhases: () => {
    // Prelim: 2 pools of 8
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    snakeSeed(prelimPools, 1, 16);

    // Playoffs: 4 tiers - 4/4/4/4
    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13];

    return [prelims, playoffs];
  },
};

export const Sched16Teams10Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 6/6/4',
  shortName: '10 Rounds',
  size: 16,
  rounds: 10,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 9,
  constructPhases: () => {
    // Prelim: 2 pools of 8
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [3, 3, 2]);
    snakeSeed(prelimPools, 1, 16);

    // Playoffs: 3 tiers - 6/6/4
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(4, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 16);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched16Teams11Rounds: StandardSchedule = {
  fullName: '16 Teams - 2 Pools of 8, then 2 Pools of 8',
  shortName: '11 Rounds',
  size: 16,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 8,
  minGames: 11,
  constructPhases: () => {
    // Prelim: 2 pools of 8
    const prelimPools = makePoolSet(2, 8, 1, 'Prelim ', [4, 4]);
    snakeSeed(prelimPools, 1, 16);

    // Playoffs: 2 tiers - 8/8
    const championship = new Pool(8, 1, 'Championship', true);
    const place7 = new Pool(8, 2, '9th Place', true);

    championship.setSeedRange(1, 8);
    place7.setSeedRange(9, 16);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7];

    return [prelims, playoffs];
  },
};
