import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export const Sched25Teams10Rounds: StandardSchedule = {
  fullName: '25 Teams - 5 Pools of 5, then 5 Pools of 5',
  shortName: '10 Rounds',
  size: 25,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 10,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 5, 1, 'Prelim ', [1, 1, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 25);

    const championship = new Pool(5, 1, 'Championship', false);
    const place6 = new Pool(5, 2, '6th Place', false);
    const place11 = new Pool(5, 3, '11th Place', false);
    const place16 = new Pool(5, 4, '16th Place', false);
    const place21 = new Pool(5, 5, '21st Place', false);

    championship.setSeedRange(1, 5);
    place6.setSeedRange(6, 10);
    place11.setSeedRange(11, 15);
    place16.setSeedRange(16, 20);
    place21.setSeedRange(21, 25);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');

    prelims.pools = prelimPools;
    playoffs.pools = [championship, place6, place11, place16, place21];

    return [prelims, playoffs];
  },
};

export const Sched25Teams10RoundsTop2Parallel: StandardSchedule = {
  fullName: '25 Teams - 5 Pools of 5, then 5 Pools of 5 (2 Parallel Top Pools)',
  shortName: '10 Rounds + Finals (Parallel Top Pools)',
  size: 25,
  rounds: 10,
  rebracketAfter: [5],
  rooms: 10,
  minGames: 8,
  constructPhases: () => {
    const prelimPools = makePoolSet(5, 5, 1, 'Prelim ', [2, 1, 1, 1]);
    snakeSeed(prelimPools, 1, 25);

    const playoffTopPools = makePoolSet(2, 5, 1, 'Playoffs 1', [], false);
    const place11 = new Pool(5, 2, '11th Place', false);
    const place16 = new Pool(5, 3, '16th Place', false);
    const place21 = new Pool(5, 4, '21st Place', false);

    snakeSeed(playoffTopPools, 1, 10);
    place11.setSeedRange(11, 15);
    place16.setSeedRange(16, 20);
    place21.setSeedRange(21, 25);

    const prelims = new Phase(PhaseTypes.Prelim, 1, 5, '1');
    const playoffs = new Phase(PhaseTypes.Playoff, 6, 10, '2');
    const finals = new Phase(PhaseTypes.Finals, 11, 11, '3');

    prelims.pools = prelimPools;
    playoffs.pools = playoffTopPools.concat([place11, place16, place21]);

    return [prelims, playoffs, finals];
  },
};
