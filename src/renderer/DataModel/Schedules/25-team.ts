import { Phase, PhaseTypes } from '../Phase';
import { Pool, makePoolSet, snakeSeed } from '../Pool';
import StandardSchedule from '../StandardSchedule';

export class Sched25Teams10Rounds implements StandardSchedule {
  readonly fullName = '25 Teams - 5 Pools of 5, then 5 Pools of 5';

  static shortName = '10 Rounds';

  readonly size = 25;

  readonly rounds = 10;

  readonly rebracketAfter = [5];

  readonly rooms = 10;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
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

    this.phases = [prelims, playoffs];
  }
}

export class Sched25Teams10RoundsTop2Parallel implements StandardSchedule {
  readonly fullName = '25 Teams - 5 Pools of 5, then 5 Pools of 5 (2 Parallel Top Pools)';

  static shortName = '10 Rounds + Finals (Parallel Top Pools)';

  readonly size = 25;

  readonly rounds = 10;

  readonly rebracketAfter = [5];

  readonly rooms = 10;

  readonly minGames = 8;

  phases: Phase[];

  constructor() {
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

    this.phases = [prelims, playoffs, finals];
  }
}
