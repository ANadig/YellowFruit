import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import Team from './Team';

/** How do we rank teams to determine who goes where in the next phase? */
enum AutoQualificationRankRules {
  /** Break ties at the buzzer if same record */
  RecordThenTB,
  /** Use PPG as tiebreaker, then break PPG ties at the buzzer */
  RecordThenPPGThenTB,
  /** Use PPG as tiebreaker. If same PPG, use something other than TB games (powers, coin flip, etc.) */
  RecordThenPPGThenOther,
}

/** A group of teams, e.g. a single prelim bracket */
export interface IQbjPool extends IQbjObject {
  /** name of the pool */
  name?: string;
  /** Further info about the pool */
  description?: string;
  /** The position/rank of this Pool among all Pool objects used for its Phase. Need not be unique (e.g. in the case of parallel pools) */
  position?: number;
  /** The assignments of teams to pools for this phase */
  poolTeams?: IQbjPoolTeam[];
}

// TODO: make a separate PoolTeam file?
/** A single team's assignment to a single pool */
interface IQbjPoolTeam extends IQbjObject {
  team: Team;
  /** The final position/rank of this Team within this Pool */
  position: number;
}

export class Pool implements IQbjPool, IYftDataModelObject {
  name: string = '';

  description: string = '';

  position: number;

  /** The number of teams this pool is supposed to have. poolTeams might have fewer than this if
   * the user hasn't entered all teams yet */
  size: number;

  /** Which ranks automatically go to which tiers in the next phase?
   *  Wild card situations are specified at the Phase level, not here.
   */
  autoAdvanceRules: AdvancementOpportunity[] = [];

  constructor(position: number, size: number, name?: string) {
    this.position = position;
    this.size = size;
    if (name) this.name = name;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPool {
    const qbjObject: IQbjPool = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Pool;
    if (isReferenced) qbjObject.id = `Pool_${this.name}`;

    return qbjObject;
  }
}

/** One tier of the next phase that teams in a pool might advance to. */
interface AdvancementOpportunity {
  /** Which tier (pool position) in the next phase do we move teams to? */
  tier: number;
  /** Which rankings within the pool advance to tier? */
  ranksThatAdvance: number[];
  /** How do we rank teams to determine who goes where in the next phase? */
  rankingRule: AutoQualificationRankRules;
}

/**
 * Make a set of parallel pools
 * @param numPools how many pools to make
 * @param poolSize how many teams in each pool
 * @param position which tier these pools are in
 * @param nameStarter first part of the name for each pool; e.g. pass in "Prelim" to get "Prelim 1", "Prelim 2", etc.
 * @param autoQualChunks in order, the number of teams qualifying for each subequent tier. e.g. [2, 2, 1]
 * if the top 2 teams go to the top tier, next 2 to the middle, and last 1 to the bottom
 */
export function makePoolSet(
  numPools: number,
  poolSize: number,
  position: number,
  nameStarter: string,
  autoQualChunks: number[],
): Pool[] {
  const pools: Pool[] = [];
  for (let i = 1; i <= numPools; i++) {
    const onePool = new Pool(position, poolSize);
    onePool.name = `${nameStarter} ${i}`;

    let tier = 1;
    let curRank = 1;
    for (const c of autoQualChunks) {
      const ranksThatAdvance = [];
      for (let j = 1; j <= c; j++) {
        ranksThatAdvance.push(curRank);
        curRank++;
      }
      onePool.autoAdvanceRules.push({
        tier,
        ranksThatAdvance,
        rankingRule: AutoQualificationRankRules.RecordThenPPGThenOther,
      });
      tier++;
    }
    pools.push(onePool);
  }
  return pools;
}
