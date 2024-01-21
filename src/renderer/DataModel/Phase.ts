// eslint-disable-next-line import/no-cycle
import { IQbjRound, Round } from './Round';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
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

function defaultPhaseName(type: PhaseTypes) {
  switch (type) {
    case PhaseTypes.Prelim:
      return 'Prelims';
    case PhaseTypes.Playoff:
      return 'Playoffs';
    case PhaseTypes.Finals:
      return 'Finals';
    case PhaseTypes.Tiebreaker:
      return 'Tiebreaker';
    default:
      return '';
  }
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
  rounds?: IQbjRound[];
  /** Pools teams are grouped into for this phase */
  pools?: IQbjPool[];
  /** Whether teams may trade cards during this phase */
  cardsTraded?: boolean;
}

/** Pool object as written to a .yft file */
export interface IYftFilePhase extends IQbjPhase, IYftFileObject {
  YfData: IPhaseExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IPhaseExtraData {
  phaseType: PhaseTypes;
  code: string;
  tiers: number;
  wildCardAdvancementRules?: IWildCardAdvancementRule[];
  wildCardRankingMethod?: WildCardRankingRules;
}

export class Phase implements IQbjPhase, IYftDataModelObject {
  name: string = '';

  description: string = '';

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

  constructor(type: PhaseTypes, firstRound: number, lastRound: number, tiers: number, code: string, name?: string) {
    this.phaseType = type;
    this.name = name || defaultPhaseName(type);
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
      description: this.description || undefined,
      rounds: this.rounds.map((rd) => rd.toFileObject(qbjOnly)),
      pools: this.pools.map((pool) => pool.toFileObject(qbjOnly)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Phase;
    if (isReferenced) qbjObject.id = `Phase_${this.name}`;

    if (qbjOnly) return qbjObject;

    const yfData: IPhaseExtraData = {
      phaseType: this.phaseType,
      code: this.code,
      tiers: this.tiers,
      wildCardAdvancementRules: this.wildCardAdvancementRules,
      wildCardRankingMethod: this.wildCardRankingMethod,
    };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }
}
