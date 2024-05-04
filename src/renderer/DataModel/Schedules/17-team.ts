/** Standard schedules for 17-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched17Teams9Rounds: StandardSchedule = {
  fullName: '17 Teams - Pools of 5 or 6, Then Pools of 6/6/5',
  shortName: '9 Rounds',
  size: 17,
  rounds: 9,
  rebracketAfter: [5],
  rooms: 8,
  minGames: 8,
  constructPhases: () => {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(5, 3, '13th Place', true);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 9, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched17Teams10Rounds: StandardSchedule = {
  fullName: '17 Teams - Pools of 5 or 6, Then Pools of 6/6/5 (No Carryover)',
  shortName: '10 Rounds',
  size: 17,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 8,
  minGames: 9,
  constructPhases: () => {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 3 tiers, each with 1 pool of 6
    const championship = new Pool(6, 1, 'Championship', false);
    const place7 = new Pool(6, 2, '7th Place', false);
    const place13 = new Pool(5, 3, '13th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13];

    return [prelims, playoffs];
  },
};

export const Sched17Teams12Rounds: StandardSchedule = {
  fullName: '17 Teams - Pools of 5 or 6, then Top 9 and bottom 8',
  shortName: '12 Rounds',
  size: 17,
  rounds: 12,
  rebracketAfter: [5],
  rooms: 8,
  minGames: 10,
  constructPhases: () => {
    // Prelim: 3 pools of 6, then take out the last seed
    const prelimPools = makePoolSet(3, 6, 1, 'Prelim ', [3, 3]);
    prelimPools[0].size = 5;
    setAutoAdvanceRules(prelimPools[0], [3, 2]);
    snakeSeed(prelimPools, 1, 17);

    // Playoffs: 2 tiers, each with 1 pool of 9
    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(8, 2, '10th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 17);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10];

    return [prelims, playoffs];
  },
};
