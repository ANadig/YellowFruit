/** Standard schedules for 21-team tournaments */

import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched21Teams11Rounds: StandardSchedule = {
  fullName: '21 Teams - 3 Pools of 7, then Playoff Pools of 6/6/6/3',
  shortName: '11 Rounds',
  size: 21,
  rounds: 11,
  rebracketAfter: [7],
  rooms: 10,
  minGames: 8,
  constructPhases() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [2, 2, 2, 1]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(6, 2, '7th Place', true);
    const place13 = new Pool(6, 3, '13th Place', true);
    const place19 = new Pool(3, 4, '19th Place', false);

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 12);
    place13.setSeedRange(13, 18);
    place19.setSeedRange(19, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 11, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place13, place19];

    return [prelims, playoffs];
  },
};

export const Sched21Teams12Rounds: StandardSchedule = {
  fullName: '21 Teams - 3 Pools of 7, then Playoff Pools of 6/5/5/5',
  shortName: '12 Rounds',
  size: 21,
  rounds: 12,
  rebracketAfter: [7],
  rooms: 9,
  minGames: 10,
  constructPhases() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(6, 1, 'Championship', true);
    const place7 = new Pool(5, 2, '7th Place');
    const place12 = new Pool(5, 3, '13th Place');
    const place17 = new Pool(5, 4, '19th Place');

    championship.setSeedRange(1, 6);
    place7.setSeedRange(7, 11);
    place12.setSeedRange(12, 16);
    place17.setSeedRange(17, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    prelims.wildCardAdvancementRules = [
      { tier: 2, numberOfTeams: 5 },
      { tier: 3, numberOfTeams: 5 },
      { tier: 4, numberOfTeams: 5 },
    ];
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 12, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place7, place12, place17];

    return [prelims, playoffs];
  },
};

export const Sched21Teams14Rounds: StandardSchedule = {
  fullName: '21 Teams - 3 Pools of 7, then Playoff Pools of 9/6/6 with Carryover',
  shortName: '14 Rounds (with carryover)',
  size: 21,
  rounds: 14,
  rebracketAfter: [7],
  rooms: 10,
  minGames: 10,
  constructPhases() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(6, 2, '10th Place', true);
    const place16 = new Pool(6, 3, '16th Place', true);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 15);
    place16.setSeedRange(16, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place16];

    return [prelims, playoffs];
  },
};

export const Sched21Teams14RoundsNoCO: StandardSchedule = {
  fullName: '21 Teams - 3 Pools of 7, then Playoff Pools of 9/6/6 (No carryover for consolation)',
  shortName: '14 Rounds (partial carryover)',
  size: 21,
  rounds: 14,
  rebracketAfter: [7],
  rooms: 10,
  minGames: 11,
  constructPhases() {
    const prelimPools = makePoolSet(3, 7, 1, 'Prelim ', [3, 2, 2]);
    snakeSeed(prelimPools, 1, 21);

    const championship = new Pool(9, 1, 'Championship', true);
    const place10 = new Pool(6, 2, '10th Place', false);
    const place16 = new Pool(6, 3, '16th Place', false);

    championship.setSeedRange(1, 9);
    place10.setSeedRange(10, 15);
    place16.setSeedRange(16, 21);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 7, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 8, 14, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place10, place16];

    return [prelims, playoffs];
  },
};
