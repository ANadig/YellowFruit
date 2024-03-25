import { getAlphabetLetter } from '../Utils/GeneralUtils';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { IQbjPoolTeam, PoolTeam } from './PoolTeam';
import { QbjTypeNames } from './QbjEnums';
import { Team } from './Team';

/** How do we rank teams to determine who goes where in the next phase? */
enum AutoQualificationRankRules {
  /** Break ties at the buzzer if same record */
  RecordThenTB = 'RecordThenTB',
  /** Use PPG as tiebreaker, then break PPG ties at the buzzer */
  RecordThenPPGThenTB = 'RecordThenPPGThenTB',
  /** Use PPG as tiebreaker. If same PPG, use something other than TB games (powers, coin flip, etc.) */
  RecordThenPPGThenOther = 'RecordthenPPGThenOther',
}

const defaultAutoQualRankRule = AutoQualificationRankRules.RecordThenPPGThenOther;

/** One tier of the next phase that teams in a pool might advance to. */
interface AdvancementOpportunity {
  /** Which tier (pool position) in the next phase do we move teams to? */
  tier: number;
  /** Which rankings within the pool advance to the given tier? */
  ranksThatAdvance: number[];
  /** How do we rank teams to determine who goes where in the next phase? */
  rankingRule: AutoQualificationRankRules;
}

export function advOpportunityDisplay(ao: AdvancementOpportunity) {
  if (ao.ranksThatAdvance.length < 1) return '';
  if (ao.ranksThatAdvance.length === 1) return `Rank ${ao.ranksThatAdvance[0]} advances to tier ${ao.tier}`;
  return `Ranks ${ao.ranksThatAdvance.join(', ')} advance to tier ${ao.tier}`;
}

/** A group of teams, e.g. a single prelim bracket */
export interface IQbjPool extends IQbjObject {
  /** name of the pool */
  name: string;
  /** Further info about the pool */
  description?: string;
  /** The position/rank/tier of this Pool among all Pool objects used for its Phase. Need not be unique (e.g. in the case of parallel pools) */
  position?: number;
  /** The assignments of teams to pools for this phase */
  poolTeams?: IQbjPoolTeam[];
}

/** Pool object as written to a .yft file */
export interface IYftFilePool extends IQbjPool, IYftFileObject {
  YfData: IPoolExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IPoolExtraData {
  size: number;
  roundRobins: number;
  seeds: number[];
  hasCarryover: boolean;
  feederPools?: IQbjPool;
  autoAdvanceRules: AdvancementOpportunity[];
}

export class Pool implements IQbjPool, IYftDataModelObject {
  name: string = '';

  description: string = '';

  position: number;

  poolTeams: PoolTeam[] = [];

  /** The number of teams this pool is supposed to have. poolTeams might have fewer than this if
   * the user hasn't entered all teams yet */
  size: number;

  /** How many round robins does this pool play? This should usually be 1, but can be more.
   *  0 means we don't expect every team to play every other team, e.g. a consolation bracket
   *  with an unusual number of teams playing arbitrary matchups. If teams need to carry over
   *  games from the previous phase to complete the round robin, it still counts as a round robin.
   */
  roundRobins: number = 1;

  /** Numbered seeds this bracket contains, in ascending order. e.g. a 16-team tournament might have
   *  [1, 4, 5, 8, 9, 12, 13, 16] as the seeds of one of its prelim pools.
   */
  seeds: number[] = [];

  /** Does this pool carry over games from the previous phase? */
  hasCarryover: boolean = false;

  /** List of pools from the previous phase that this pool's teams should come from. Null if all pools supply
   *  (or potentially supply) teams to this pool. This property is needed for certain schedules with parallel
   *  playoff pools that require a certain number of prelim->playoff carryovers.
   */
  feederPools: Pool[] | null = null;

  /** Which ranks automatically go to which tiers in the next phase?
   *  Wild card situations are specified at the Phase level, not here.
   */
  autoAdvanceRules: AdvancementOpportunity[] = [];

  get id(): string {
    return `Pool_${this.name}`;
  }

  constructor(size: number, position: number, name?: string, hasCarryOver?: boolean) {
    this.position = position;
    this.size = size;
    this.hasCarryover = hasCarryOver ?? false;
    if (name) this.name = name;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPool {
    const qbjObject: IQbjPool = {
      name: this.name,
      description: this.description || undefined,
      position: this.position,
      poolTeams: this.poolTeams.map((pt) => pt.toFileObject(qbjOnly)),
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Pool;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    // TODO: feeder pools?
    const yfData: IPoolExtraData = {
      size: this.size,
      roundRobins: this.roundRobins,
      seeds: this.seeds,
      hasCarryover: this.hasCarryover,
      autoAdvanceRules: this.autoAdvanceRules,
    };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  /** Set this pool's seeds to the given range of numbers */
  setSeedRange(firstSeed: number, lastSeed: number) {
    this.seeds = [];
    for (let i = firstSeed; i <= lastSeed; i++) {
      this.seeds.push(i);
    }
  }

  addTeam(team: Team) {
    this.poolTeams.push(new PoolTeam(team));
  }

  removeTeam(team: Team) {
    this.poolTeams = this.poolTeams.filter((pt) => pt.team !== team);
  }

  clearTeams() {
    this.poolTeams = [];
  }

  /** Is this team in this pool? */
  includesTeam(team: Team) {
    return !!this.poolTeams.find((pt) => pt.team === team);
  }

  /** Given a rank, which numbered tier does that rank advance to? */
  getTierThatRankAdvancesTo(rank: number): number | undefined {
    const aoWithRank = this.autoAdvanceRules.find((ao) => ao.ranksThatAdvance.includes(rank));
    if (!aoWithRank) return undefined;
    return aoWithRank.tier;
  }

  /** The 1-indexed seed number assigned to a team of this rank within the pool. Return -1 if the rank is out of bounds */
  getSeedForRank(rank: number): number {
    return this.seeds[rank - 1] || -1;
  }
}

/**
 * Make a set of parallel pools
 * @param numPools how many pools to make
 * @param poolSize how many teams in each pool
 * @param position which tier these pools are in
 * @param nameStarter first part of the name for each pool; e.g. pass in "Prelim " to get "Prelim 1", "Prelim 2", etc.
 *  (you must include a space if you want one)
 * @param autoQualChunks in order, the number of teams qualifying for each subequent tier. e.g. [2, 2, 1]. You must
 * include zeroes for any phase the pool does not send teams to, e.g. [0, 0, 3, 3] for lower playoff pools that populate
 * the bottom two of four superplayoff pools
 * @param hasCarryOver does these pools carry over matches from the previous phase?
 * if the top 2 teams go to the top tier, next 2 to the middle, and last 1 to the bottom
 */
export function makePoolSet(
  numPools: number,
  poolSize: number,
  position: number,
  nameStarter: string,
  autoQualChunks: number[],
  hasCarryOver?: boolean,
): Pool[] {
  const pools: Pool[] = [];
  for (let i = 1; i <= numPools; i++) {
    const onePool = new Pool(poolSize, position, `${nameStarter}${getAlphabetLetter(i)}`, hasCarryOver);

    setAutoAdvanceRules(onePool, autoQualChunks);
    pools.push(onePool);
  }
  return pools;
}

export function setAutoAdvanceRules(pool: Pool, autoQualChunks: number[]) {
  let tier = 0;
  let curRank = 1;
  for (const c of autoQualChunks) {
    tier++;
    if (c === 0) continue;

    const ranksThatAdvance = [];
    for (let j = 1; j <= c; j++) {
      ranksThatAdvance.push(curRank);
      curRank++;
    }
    pool.autoAdvanceRules.push({
      tier,
      ranksThatAdvance,
      rankingRule: defaultAutoQualRankRule,
    });
  }
}

/**
 * Populate seeds array in the given pools. Caller is resonsible for making sure pools are in the desired order
 * and that numTeams is compatible with the list of pools.
 * @param pools List of pools. Should be in the same tier.
 * @param topSeed Highest seed involved (lowest number)
 * @param bottomSeed Lowest seed invovled (highest number)
 */
export function snakeSeed(pools: Pool[], topSeed: number, bottomSeed: number) {
  let seed = topSeed;
  let direction: 1 | -1 = 1;
  while (seed <= bottomSeed) {
    seedOneRow(pools, seed, bottomSeed, direction);
    seed += pools.length;
    direction = direction === 1 ? -1 : 1;
  }
}

// only exporting for unit tests
export function seedOneRow(pools: Pool[], firstSeed: number, maxSeed: number, direction: 1 | -1) {
  const poolStart = direction === 1 ? 0 : pools.length - 1;
  const poolEnd = direction === 1 ? pools.length - 1 : 0;
  let curSeed = firstSeed;
  for (let i = poolStart; ; i += direction) {
    if (curSeed > maxSeed) break;

    pools[i].seeds.push(curSeed);
    curSeed++;

    if (direction === 1 && i >= poolEnd) break;
    if (direction === -1 && i <= poolEnd) break;
  }
}
