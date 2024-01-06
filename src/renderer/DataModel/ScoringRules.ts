import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';

/** Common match formats to standardly implement */
export enum CommonRuleSets {
  NaqtUntimed,
  NaqtTimed,
  Acf,
  Pace,
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
  /** The smallest possible number of overtime tossups */
  minimumOvertimeQuestionCount?: number;
  /** Are bonuses used in overtime? */
  overtimeIncludesBonuses?: boolean;
  /** The largest integer that always evenly divides a score */
  totalDivisor?: number;
  /** The largest integers that always divides a bonus score */
  bonusDivisor?: number;
  /** Bonuses always have at least this many parts */
  minimumPartsPerBonus?: number;
  /** Number of points for each bonus part, if always the same */
  pointsPerBonuspart?: number;
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

/** YellowFruit implementation of the ScoringRules object */
export class ScoringRules implements IQbjScoringRules, IYftDataModelObject {
  name: string = '';

  readonly teamsPerMatch = 2; /** YF only supports 2-team matches */

  maximumPlayersPerTeam: number = 4;

  maximumRegulationTossupCount: number = 20;

  minimumOvertimeQuestionCount: number;

  readonly overtimeIncludesBonuses = false; /** YF doesn't support bonuses in overtime */

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
    return divisor;
  }

  maximumBonusScore: number = 30;

  get bonusDivisor(): number {
    return this.pointsPerBonusPart;
  }

  mimimumPartsPerBonus: number = 3;

  maximumPartsPerBonus: number = 3;

  pointsPerBonusPart: number = 10;

  bonusesBounceBack: boolean = false;

  lightningCountPerTeam: number = 0;

  maximumLightningScore?: number;

  lightningDivisor?: number;

  readonly lightningsBounceBack = false;

  answerTypes: AnswerType[];

  constructor(ruleSet: CommonRuleSets = CommonRuleSets.NaqtUntimed) {
    const ten = new AnswerType(10);
    const power15 = new AnswerType(15);
    const power20 = new AnswerType(20);
    const neg = new AnswerType(-5);

    switch (ruleSet) {
      case CommonRuleSets.Acf:
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 1;
        this.answerTypes = [ten, neg];
        break;
      case CommonRuleSets.Pace:
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 1;
        this.bonusesBounceBack = true;
        this.answerTypes = [power20, ten];
        break;
      case CommonRuleSets.NaqtTimed:
        this.maximumRegulationTossupCount = 24;
        this.minimumOvertimeQuestionCount = 3;
        this.answerTypes = [power15, ten, neg];
        break;
      case CommonRuleSets.NaqtUntimed:
      default:
        this.maximumRegulationTossupCount = 20;
        this.minimumOvertimeQuestionCount = 3;
        this.answerTypes = [power15, ten, neg];
        break;
    }
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjScoringRules {
    const qbjObject: IQbjScoringRules = {
      name: this.name,
      answerTypes: this.answerTypes.map((aType) => aType.toFileObject(qbjOnly)),
      // TODO: all the other properties
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.ScoringRules;
    if (isReferenced) qbjObject.id = `ScoringRules_${this.name}`;

    return qbjObject;
  }

  static getRuleSetName(ruleSet: CommonRuleSets) {
    switch (ruleSet) {
      case CommonRuleSets.Acf:
        return 'ACF';
      case CommonRuleSets.Pace:
        return 'PACE NSC';
      case CommonRuleSets.NaqtTimed:
        return 'NAQT (timed)';
      case CommonRuleSets.NaqtUntimed:
        return 'NAQT (untimed)';
      default:
        return 'Custom';
    }
  }
}
