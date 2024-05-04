/** Standard schedules for 28-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched28Teams11Rounds2PPlusF: StandardSchedule = {
  fullName: '28 Teams - Pools of 5 or 6 Teams, then Pools of 5 or 6 with Parallel Top Pools',
  shortName: '11 Rounds (2 Stages, then Finals)',
  size: 28,
  rounds: 11,
  rebracketAfter: [5],
  rooms: 13,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    snakeSeed(prelimPools, 1, 28);

    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place');
    const place19 = new Pool(5, 3, '19th Place');
    const place24 = new Pool(5, 4, '24th Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 23);
    place24.setSeedRange(24, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place24]);

    return [prelims, playoffs, finals];
  },
};

export const Sched28Teams13Rounds6to10: StandardSchedule = {
  fullName: '28 Teams - Pools of 5 or 6, then Playoff Pools of 10/10/8',
  shortName: '13 Rounds (prelim pools of 5/6)',
  size: 28,
  rounds: 13,
  rebracketAfter: [5],
  rooms: 14,
  minGames: 11,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 2, 2]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 1]);
    snakeSeed(prelimPools, 1, 28);

    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(10, 2, '11th Place', true);
    const place21 = new Pool(8, 3, '21st Place', false);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 20);
    place21.setSeedRange(21, 28);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11, place21];

    return [prelims, playoffs];
  },
};
