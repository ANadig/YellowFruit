import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';

/** Common match formats to standardly implement */
export enum CommonRuleSets {
  NaqtUntimed = 'NaqtUntimed',
  NaqtTimed = 'NaqtTimed',
  Acf = 'Acf',
  AcfPowers = 'mAcfPowers',
}

/**
 * The rules for a tournament. Corresponds to qb schema objects
 * https://schema.quizbowl.technology/tournament
 */
export interface IQbjScoringRules extends IQbjObject {
  /** Name of the rule set */
  name: string;
  /** YF only supports 2-team matches */
  teamsPerMatch?: number;
  /** Maximum number of players that can be active at once */
  maximumPlayersPerTeam?: number;
  /** The standard number of tossups heard in a match */
  regulationTossupCount?: number;
  /** The maximum number of tossups heard in a match that does not go into overtime. */
  maximumRegulationTossupCount?: number;
  /** The smallest possible number of overtime tossups. 1 for sudden-death */
  minimumOvertimeQuestionCount?: number;
  /** Are bonuses used in overtime? */
  overtimeIncludesBonuses?: boolean;
  /** The largest integer that always evenly divides a score */
  totalDivisor?: number;
  /** The most points a team can get on a single bonus */
  maximumBonusScore?: number;
  /** The largest integers that always divides a bonus score */
  bonusDivisor?: number;
  /** Bonuses always have at least this many parts */
  minimumPartsPerBonus?: number;
  /** Bonuses have at most this many parts */
  maximumPartsPerBonus?: number;
  /** Number of points for each bonus part, if always the same */
  pointsPerBonusPart?: number;
  /** Whether incorrect bonus parts rebound to the other team */
  bonusesBounceBack?: boolean;
  /** Number of lightning rounds per team per round */
  lightningCountPerTeam?: number;
  /** Highest score for a single lightning round */
  maximumLightningScore?: number;
  /** The largest number that always evenly divides a lightning round score */
  lightningDivisor?: number;
  /** Whether incorrect lightning round parts rebound to the other team */
  lightningsBounceBack?: boolean;
  /** Different things that can happen when someone answers a tossup */
  answerTypes: IQbjAnswerType[];
}

/** Scoring rules object as written to a .yft file */
export interface IYftFileScoringRules extends IQbjScoringRules, IYftFileObject {
  YfData: IScoringRulesExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IScoringRulesExtraData {
  timed: boolean;
}

/** YellowFruit implementation of the ScoringRules object */
export class ScoringRules implements IQbjScoringRules, IYftDataModelObject {
  name: string = '';

  readonly teamsPerMatch = 2; /** YF only supports 2-team matches */

  static readonly defaultMaximumPlayersPerTeam = 4;

  maximumPlayersPerTeam: number = 4;

  /** The most players that YF will let you put on one team */
  static readonly maximumAllowedRosterSize: number = 30;

  /** Timed rounds? If no, assume all rounds have the same number of TU in regulation */
  timed: boolean = false;

  /** Assume this many tossups unless overridden */
  static readonly defaultRegulationTossupCount = 20;

  get regulationTossupCount(): number {
    if (this.timed) return ScoringRules.defaultRegulationTossupCount; // in the future, maybe support setting this manually
    return this.maximumRegulationTossupCount;
  }

  maximumRegulationTossupCount: number = 20; // for untimed rounds, this is the only allowed regulation number for non-tiebreakers

  minimumOvertimeQuestionCount: number = 1;

  static readonly defaultNonSuddenDeathTuCount: number = 3;

  overtimeIncludesBonuses = false;

  get totalDivisor(): number {
    let divisor = 10;
    for (const ans of this.answerTypes) {
      if (ans.value % 5) {
        return 1;
      }
      if (ans.value % 10) {
        divisor = 5;
      }
    }
    if (this.bonusDivisor % 5) {
      return 1;
    }
    if (this.bonusDivisor % 10) {
      divisor = 5;
    }
    if (this.lightningCountPerTeam > 0) {
      if (this.lightningDivisor % 5) return 1;
      if (this.lightningDivisor % 10) divisor = 5;
    }
    return divisor;
  }

  maximumBonusScore: number = 30;

  /** YF-internal explicit flag */
  useBonuses: boolean = true;

  bonusDivisor: number = 10;

  minimumPartsPerBonus: number = 3;

  maximumPartsPerBonus: number = 3;

  pointsPerBonusPart?: number = 10;

  bonusesBounceBack: boolean = false;

  lightningCountPerTeam: number = 0;

  lightningDivisor: number = 10;

  answerTypes: AnswerType[] = [];

  get id(): string {
    return `ScoringRules_${this.name}`;
  }

  /** The maximum number of answer types that can be defined for a single tournament */
  static maximumAnswerTypes = 6;

  constructor(ruleSet: CommonRuleSets = CommonRuleSets.AcfPowers) {
    this.applyRuleSet(ruleSet);
  }

  applyRuleSet(ruleSet: CommonRuleSets) {
    const ten = new AnswerType(10);
    const power15 = new AnswerType(15);
    const neg = new AnswerType(-5);

    switch (ruleSet) {
      case CommonRuleSets.AcfPowers:
        this.timed = false;
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 1;
        this.useBonuses = true;
        this.bonusesBounceBack = false;
        this.answerTypes = [power15, ten, neg];
        break;
      case CommonRuleSets.Acf:
        this.timed = false;
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 1;
        this.useBonuses = true;
        this.bonusesBounceBack = false;
        this.answerTypes = [ten, neg];
        break;
      case CommonRuleSets.NaqtTimed:
        this.timed = true;
        this.maximumRegulationTossupCount = 24;
        this.minimumOvertimeQuestionCount = 3;
        this.useBonuses = true;
        this.bonusesBounceBack = false;
        this.answerTypes = [power15, ten, neg];
        break;
      case CommonRuleSets.NaqtUntimed:
      default:
        this.timed = false;
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 3;
        this.useBonuses = true;
        this.bonusesBounceBack = false;
        this.answerTypes = [power15, ten, neg];
        break;
    }

    // common settings to all standard rule sets
    this.maximumPlayersPerTeam = 4;
    this.overtimeIncludesBonuses = false;
    this.maximumBonusScore = 30;
    this.bonusDivisor = 10;
    this.minimumPartsPerBonus = 3;
    this.maximumPartsPerBonus = 3;
    this.pointsPerBonusPart = 10;
    this.lightningCountPerTeam = 0;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjScoringRules {
    const qbjObject: IQbjScoringRules = {
      name: this.name,
      answerTypes: this.answerTypes.map((aType) => aType.toFileObject(qbjOnly, false, true)),
      maximumRegulationTossupCount: this.maximumRegulationTossupCount,
      maximumPlayersPerTeam: this.maximumPlayersPerTeam,
      minimumOvertimeQuestionCount: this.minimumOvertimeQuestionCount,
      overtimeIncludesBonuses: this.overtimeIncludesBonuses,
      lightningCountPerTeam: this.lightningCountPerTeam,
      totalDivisor: this.totalDivisor,
    };

    if (this.useBonuses) {
      qbjObject.bonusesBounceBack = this.bonusesBounceBack;
      qbjObject.maximumBonusScore = this.maximumBonusScore;
      qbjObject.minimumPartsPerBonus = this.minimumPartsPerBonus;
      qbjObject.maximumPartsPerBonus = this.maximumPartsPerBonus;
      qbjObject.pointsPerBonusPart = this.pointsPerBonusPart;
      qbjObject.bonusDivisor = this.bonusDivisor;
    }
    if (this.useLightningRounds()) {
      qbjObject.lightningDivisor = this.lightningDivisor;
    }

    if (isTopLevel) qbjObject.type = QbjTypeNames.ScoringRules;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) {
      qbjObject.regulationTossupCount = this.regulationTossupCount;
      return qbjObject;
    }

    const yfData: IScoringRulesExtraData = { timed: this.timed };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  static getRuleSetName(ruleSet: CommonRuleSets) {
    switch (ruleSet) {
      case CommonRuleSets.AcfPowers:
        return 'ACF with powers';
      case CommonRuleSets.Acf:
        return 'ACF (standard)';
      case CommonRuleSets.NaqtTimed:
        return 'NAQT (timed)';
      case CommonRuleSets.NaqtUntimed:
        return 'NAQT (untimed)';
      default:
        return 'Custom';
    }
  }

  /** If true, val is a valid setting for maximum regulation tossups */
  static validateMaxRegTuCount(val: number) {
    return 1 <= val && val <= 100;
  }

  /** If true, val is a valid setting for maximum players */
  static validateMaxPlayerCount(val: number) {
    return 1 <= val && val <= this.maximumAllowedRosterSize;
  }

  /** If true, val is a valid setting for minimum overtime tossups */
  static validateMinOvertimeTuCount(val: number) {
    return 1 <= val && val <= 100;
  }

  /** Assume anything more than 10 is a power */
  hasPowers() {
    return !!this.answerTypes.find((at) => at.isPower);
  }

  hasNegs() {
    return !!this.answerTypes.find((at) => at.isNeg);
  }

  /** Are the bonuses here always the same number of parts for the same number of points? */
  bonusesAreRegular() {
    return this.pointsPerBonusPart !== undefined && this.minimumPartsPerBonus === this.maximumPartsPerBonus;
  }

  canCalculateBounceBackPartsHeard() {
    return this.bonusesAreRegular();
  }

  useLightningRounds() {
    return this.lightningCountPerTeam > 0;
  }

  useOvertimeInPPTUH() {
    return this.overtimeIncludesBonuses || !this.useBonuses;
  }

  setUseBonuses(useBonuses: boolean) {
    this.useBonuses = useBonuses;
    if (!useBonuses) {
      this.bonusesBounceBack = false;
      this.overtimeIncludesBonuses = false;
    }
  }

  findAnswerTypeById(id: string) {
    for (const at of this.answerTypes) {
      if (at.id === id) return at;
    }
    return undefined;
  }
}
