/** Standard schedules for 22-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched22Teams11Rounds5Prelim: StandardSchedule = {
  fullName: '22 Teams - Pools of 5 or 6, then Playoff Pools of 8/8/6',
  shortName: '11 Rounds (5 Prelim Rounds)',
  size: 22,
  rounds: 11,
  rebracketAfter: [5],
  rooms: 11,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 22);

    const championship = new Pool(8, 1, 'Championship', true);
    const place9 = new Pool(8, 2, '9th Place', true);
    const place17 = new Pool(6, 3, '17th Place', false);

    championship.setSeedRange(1, 8);
    place9.setSeedRange(9, 16);
    place17.setSeedRange(17, 22);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17];

    return [prelims, playoffs];
  },
};

export const Sched22Teams11Rounds7Prelim: StandardSchedule = {
  fullName: '22 Teams - Pools of 7 or 8, then Playoff Pools of 6/6/6/4',
  shortName: '11 Rounds (7 Prelim Rounds)',
  size: 22,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 11,
  minGames: 9,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    prelimPools[1].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 22);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(4, 4, '19th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 22);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19];

    return [prelims, playoffs];
  },
};

export const Sched22Teams13Rounds: StandardSchedule = {
  fullName: '22 Teams - 2 pools of 11, then Playoff Pools of 4/4/4/4/4/2',
  shortName: '13 Rounds',
  size: 22,
  rounds: 13,
  rebracketAfter: [11],
  rooms: 11,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(2, 11, 1, 'Prelim ', [2, 2, 2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 22);

    const championship = new Pool(4, 1, 'Championship', true);
    const place5 = new Pool(4, 2, '5th Place', true);
    const place9 = new Pool(4, 3, '9th Place', true);
    const place13 = new Pool(4, 4, '13th Place', true);
    const place17 = new Pool(4, 5, '17th Place', true);
    const place21 = new Pool(2, 6, '21st Place', false);

    championship.setSeedRange(1, 4);
    place5.setSeedRange(5, 8);
    place9.setSeedRange(9, 12);
    place13.setSeedRange(13, 16);
    place17.setSeedRange(17, 20);
    place21.setSeedRange(21, 22);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 11, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 12, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place5, place9, place13, place17, place21];

    return [prelims, playoffs];
  },
};

export const Sched22Teams14Rounds967Split: StandardSchedule = {
  fullName: '22 Teams - Pools of 7 or 8, then Playoff Pools of 9/6/7',
  shortName: '14 Rounds (9/6/7 Split)',
  size: 22,
  rounds: 14,
  rebracketAfter: [7],
  rooms: 11,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [3, 2, 3]);
    prelimPools[0].size = 7;
    prelimPools[1].size = 7;
    setAutoAdvanceRules(prelimPools[0], [3, 2, 2]);
    setAutoAdvanceRules(prelimPools[1], [3, 2, 2]);
    snakeSeed(prelimPools, 1, 22);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(6, 2, '10th Place', false);
    const place16 = new Pool(7, 3, '16th Place', true);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 15);
    place16.setSeedRange(16, 22);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place16];

    return [prelims, playoffs];
  },
};

export const Sched22Teams14Rounds976Split: StandardSchedule = {
  fullName: '22 Teams - Pools of 7 or 8, then Playoff Pools of 9/7/6',
  shortName: '14 Rounds (9/7/6 Split)',
  size: 22,
  rounds: 14,
  rebracketAfter: [7],
  rooms: 11,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 8, 1, 'Prelim ', [3, 2]);
    prelimPools[0].size = 7;
    prelimPools[1].size = 7;
    snakeSeed(prelimPools, 1, 22);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(7, 2, '10th Place', false);
    const place17 = new Pool(6, 3, '17th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 16);
    place17.setSeedRange(17, 22);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 1 },
      { tier: 3, numberOfTeams: 6 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place17];

    return [prelims, playoffs];
  },
};
