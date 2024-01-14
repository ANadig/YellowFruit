// eslint-disable-next-line import/no-cycle
import { Round } from './Round';
import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { IQbjPool, Pool } from './Pool';
import { QbjTypeNames } from './QbjEnums';

export enum PhaseTypes {
  /** The first phase of a tournament */
  Prelim,
  /** Subsequent main phases after the prelim phase  */
  Playoff,
  /** Used for determining the top several ranks */
  Finals,
  /** For breaking ties for advancing from one phase to another */
  Tiebreaker,
}

/** When a phase uses wild card advancement (as opposed to set numbers of teams advancing from each pool),
 *  How do rank wild card teams?
 */
enum WildCardRankingRules {
  /** Rank within the team's pool, then PPB. e.g. prioritize all 3rd place teams over all 4th place teams. */
  RankThenPPB,
  /** Strictly by PPB, without regard to record/rank */
  PpbOnly,
}

interface IWildCardAdvancementRule {
  /** Which tier (pool position) in the next phase do we move teams to? */
  tier: number;
  /** How many teams (across all pools) advance to this tier via wild card? */
  numberOfTeams: number;
}

export interface IQbjPhase extends IQbjObject {
  /** The name of the phase, such as "Preliminary Rounds" or "Playoffs" */
  name: string;
  /** A description of the phase. Might contain information like how teams are split into pools, etc */
  description?: string;
  /** Rounds this phase encompasses */
  rounds?: Round[];
  /** Pools teams are grouped into for this phase */
  pools?: IQbjPool[];
  /** Whether teams may trade cards during this phase */
  cardsTraded?: boolean;
}

export class Phase implements IQbjPhase, IYftDataModelObject {
  name: string = '';

  /** Is this phase prelims, playoffs, etc */
  phaseType: PhaseTypes;

  /** Code to help users understand the order of phases: 1, 2, 2A, etc. */
  code: string = '';

  /** The number of tiers. Should be consistent with the position property of the pools in this phase */
  tiers: number = 1;

  rounds: Round[];

  pools: Pool[] = [];

  /** How do we use wild cards to populate different tiers in the next phase? Empty array means no wildcards. */
  wildCardAdvancementRules: IWildCardAdvancementRule[] = [];

  /** How do we rank wild card teams to determine who has priority? */
  wildCardRankingMethod: WildCardRankingRules = WildCardRankingRules.RankThenPPB;

  constructor(type: PhaseTypes, firstRound: number, lastRound: number, tiers: number, code: string) {
    this.phaseType = type;
    this.rounds = [];
    this.tiers = tiers;
    this.code = code;
    for (let i = firstRound; i <= lastRound; i++) {
      this.rounds.push(new Round(i));
    }
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPhase {
    const qbjObject: IQbjPhase = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Phase;
    if (isReferenced) qbjObject.id = `Phase_${this.name}`;

    return qbjObject;
  }
}
