/**
 * Classes representing the rules for a tournament
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/tournament
 */
import AnswerType from './AnswerType';

/** Common match formats to standardly implement */
export enum CommonRuleSets {
  NaqtUntimed,
  NaqtTimed,
  Acf,
  Pace,
}

/** Rules for how teams score points */
export class ScoringRules {
  /** Name of the rule set */
  name?: string;

  /** YF only supports 2-team matches */
  readonly teamsPerMatch = 2;

  /** Maximum number of players that can be active at once */
  maximumPlayersPerTeam: number = 4;

  /** The standard number of tossups heard in a match */
  regulationTossupCount: number = 20;

  /** The maximum number of tossups heard in a match that does not go into overtime. */
  maximumRegulationTossupCount: number;

  /** The smallest possible number of overtime tossups */
  minimumOvertimeQuestionCount: number;

  /** YF doesn't support bonuses in overtime */
  readonly overtimeIncludesBonuses = false;

  /** The largest integer that is guaranteed to be a factor of a valid final score for
   * one team in one match. */
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

  /** The maximum possible score on a single bonus. Omitting this means there are no bonuses. */
  maximumBonusScore: number = 30;

  /** The largest integer that is guaranteed to be a factor of a valid score on a single bonus. */
  get bonusDivisor(): number {
    return this.pointsPerBonusPart;
  }

  /** The smallest number of parts that may exist in one bonus */
  mimimumPartsPerBonus: number = 3;

  /** The greatest number of parts that may exist in one bonus. */
  maximumPartsPerBonus: number = 3;

  /** The number of points earned for a correct answer to one bonus part. */
  pointsPerBonusPart: number = 10;

  /** true if the non-controlling team has an opportunity to answer parts of a bonus that the
   * controlling team did not answer correctly */
  bonusesBounceBack: boolean = false;

  /** The number of lightning rounds received by each team in each game */
  lightningCountPerTeam: number = 0;

  /** The maximum possible score on a single lightning round */
  maximumLightningScore?: number;

  /** The largest integer that is guaranteed to be a factor of a valid score on a single lightning round */
  lightningDivisor?: number;

  /** true if the non-controlling team has an opportunity to answer parts of a lightning round that the
   * controlling team did not answer correctly */
  readonly lightningsBounceBack = false;

  /** The different answer types possible in this tournament */
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
}
