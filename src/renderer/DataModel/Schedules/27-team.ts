/** Standard schedules for 27-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched27Teams11Rounds2PPlusF: StandardSchedule = {
  fullName: '27 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 with Parallel Top Pools',
  shortName: '11 Rounds (2 Stages, then Finals)',
  size: 27,
  rounds: 11,
  rebracketAfter: [5],
  rooms: 12,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    snakeSeed(prelimPools, 1, 27);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(5, 2, '13th Place');
    const place18 = new Pool(5, 3, '18th Place');
    const place23 = new Pool(5, 4, '23rd Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 17);
    place18.setSeedRange(18, 22);
    place23.setSeedRange(23, 27);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 5 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place18, place23]);

    return [prelims, playoffs, finals];
  },
};

export const Sched27Teams13Rounds9to6: StandardSchedule = {
  fullName: '27 Teams - 3 Pools of 9 Teams, then Playoff Pools of 6/6/6/6/3',
  shortName: '13 Rounds (prelim pools of 9)',
  size: 27,
  rounds: 13,
  rebracketAfter: [9],
  rooms: 13,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 9, 1, 'Prelim ', [2, 2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 27);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(6, 4, '19th Place', true);
    const place25 = new Pool(3, 5, '25th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);
    place25.setSeedRange(25, 27);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19, place25];

    return [prelims, playoffs];
  },
};

export const Sched27Teams13Rounds6to10: StandardSchedule = {
  fullName: '27 Teams - Pools of 5 or 6, then Playoff Pools of 10/10/7',
  shortName: '13 Rounds (prelim pools of 5/6)',
  size: 27,
  rounds: 13,
  rebracketAfter: [5],
  rooms: 13,
  minGames: 10,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[2], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 27);

    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(10, 2, '11th Place', true);
    const place21 = new Pool(7, 3, '21st Place', false);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 20);
    place21.setSeedRange(21, 27);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11, place21];

    return [prelims, playoffs];
  },
};

export const Sched27Teams16Rounds: StandardSchedule = {
  fullName: '27 Teams - 3 Pools of 9 Teams, then 3 Pools of 9 Teams',
  shortName: '16 Rounds',
  size: 27,
  rounds: 16,
  rebracketAfter: [9],
  rooms: 12,
  minGames: 14,
  constructPhases: () => {
    const prelimPools = makePoolSet(3, 9, 1, 'Prelim ', [3, 3, 3]);
    snakeSeed(prelimPools, 1, 27);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(9, 2, '10th Place', true);
    const place19 = new Pool(9, 3, '19th Place', true);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 18);
    place19.setSeedRange(19, 27);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 9, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 10, 16, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place19];

    return [prelims, playoffs];
  },
};
