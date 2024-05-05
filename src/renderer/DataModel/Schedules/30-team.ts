/** Standard schedules for 30-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched30Teams11Rounds2PPlusF: StandardSchedule = {
  fullName: '30 Teams - 5 Pools of 6 Teams, then 5 Pools of 6 Teams with Parallel Top Pools',
  shortName: '11 Rounds (2 Stages) + Finals',
  size: 30,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 15,
  minGames: 10,
  constructPhases: () => {
    // Prelim: 5 pools of 6
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2]);
    snakeSeed(prelimPools, 1, 30);

    // Playoffs: 4 tiers, with 2 pools in the top
    const playoffTopPools = makePoolSet(2, 6, 1, 'Championship ', []);
    const place13 = new Pool(6, 2, '13th Place');
    const place19 = new Pool(6, 3, '19th Place');
    const place25 = new Pool(6, 4, '25th Place');

    snakeSeed(playoffTopPools, 1, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 24);
    place25.setSeedRange(25, 30);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 1, numberOfTeams: 2 },
      { tier: 2, numberOfTeams: 6 },
      { tier: 3, numberOfTeams: 6 },
      { tier: 4, numberOfTeams: 6 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place13, place19, place25]);

    return [prelims, playoffs, finals];
  },
};

export const Sched30Teams13Rounds6to10: StandardSchedule = {
  fullName: '30 Teams - Pools of 6, then Playoff Pools of 10',
  shortName: '13 Rounds (Prelim Pools of 6)',
  size: 30,
  rounds: 13,
  rebracketAfter: [5],
  rooms: 15,
  minGames: 13,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 2, 2]);
    snakeSeed(prelimPools, 1, 30);

    const championship = new Pool(10, 1, 'Championship', true);
    const place11 = new Pool(10, 2, '11th Place', true);
    const place21 = new Pool(10, 3, '21st Place', true);

    championship.setSeedRange(1, 10);
    place11.setSeedRange(11, 20);
    place21.setSeedRange(21, 30);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place11, place21];

    return [prelims, playoffs];
  },
};

export const Sched30Teams13Rounds8to8: StandardSchedule = {
  fullName: '30 Teams - 4 Pools of 7 or 8, then 4 Pools of 7 or 8',
  shortName: '13 Rounds (Prelim Pools of 8)',
  size: 30,
  rounds: 13,
  rebracketAfter: [7],
  rooms: 15,
  minGames: 12,
  constructPhases: () => {
    const prelimPools = makePoolSet(4, 8, 1, 'Prelim ', [2, 2, 2, 2]);
    prelimPools[0].size = 7;
    prelimPools[1].size = 7;
    setAutoAdvanceRules(prelimPools[0], [2, 2, 2, 1]);
    setAutoAdvanceRules(prelimPools[1], [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 30);

    const championship = new Pool(8, 1, 'Championship', true, 1, 8);
    const place9 = new Pool(8, 2, '9th Place', true, 9, 16);
    const place17 = new Pool(8, 3, '17th Place', true, 17, 24);
    const place25 = new Pool(6, 4, '25th Place', false, 25, 30);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 13, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place9, place17, place25];

    return [prelims, playoffs];
  },
};
