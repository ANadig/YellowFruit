/** Standard schedules for 26-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, setAutoAdvanceRules, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched26Teams10RoundsWC: StandardSchedule = {
  fullName: '26 Teams - Pools of 5 or 6 Teams, then 10/6/5/5 split',
  shortName: '10 Rounds + Finals (wild card)',
  size: 26,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 11,
  minGames: 8,
  usesWC: true,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 6, 1, 'Prelim ', [2, 1]);
    prelimPools[0].size = 5;
    prelimPools[1].size = 5;
    prelimPools[2].size = 5;
    prelimPools[3].size = 5;
    snakeSeed(prelimPools, 1, 26);

    const playoffTopPools = makePoolSet(2, 5, 1, 'Championship ', []);
    const place11 = new Pool(6, 2, '11th Place', false, 11, 16);
    const place17 = new Pool(5, 3, '17th Place', false, 17, 21);
    const place22 = new Pool(5, 4, '22nd Place', false, 22, 26);

    snakeSeed(playoffTopPools, 1, 10);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 1 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place11, place17, place22]);

    return [prelims, playoffs, finals];
  },
};

export const Sched26Teams10RoundsNoWC: StandardSchedule = {
  fullName: '26 Teams - Pools of 5 or 6 Teams, then 10/5/5/6 split',
  shortName: '10 Rounds + Finals (6 in bottom pool)',
  size: 25,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 11,
  minGames: 8,
  constructPhases: () => {
    // This is a 25-team schedule with an extra team at the bottom
    const prelimPools = makePoolSet(5, 5, 1, 'Prelim ', [2, 1, 1, 1]);
    prelimPools[4].size = 6;
    setAutoAdvanceRules(prelimPools[4], [2, 1, 1, 2]);
    snakeSeed(prelimPools, 1, 26);

    const playoffTopPools = makePoolSet(2, 5, 1, 'Playoffs 1', [], false);
    const place11 = new Pool(5, 2, '11th Place', false, 11, 15);
    const place16 = new Pool(5, 3, '16th Place', false, 16, 20);
    const place21 = new Pool(6, 4, '21st Place', false, 21, 26);

    snakeSeed(playoffTopPools, 1, 10);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place11, place16, place21]);

    return [prelims, playoffs, finals];
  },
};
