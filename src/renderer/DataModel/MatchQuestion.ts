import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';
import { IQbjPlayer, Player } from './Player';
import { ScoringRules } from './ScoringRules';
import { IQbjTeam, Team } from './Team';

export interface IQbjMatchQuestion extends IQbjObject {
  /** Number of the tossup-bonus cycle */
  questionNumber: number;
  /** Who scored how many points on the tossup */
  buzzes: IQbjMatchQuestionBuzz[];
  /** Who scored how many points on the bonus */
  bonus?: IQbjMatchQuestionBonus;
  /** Total bonus points, if bonus property not defined */
  bonusPoints?: number;
  /** Total bounceback points, if bonus property not defined */
  bonusBouncebackPoints?: number;
}

export interface IQbjMatchQuestionBuzz extends IQbjObject {
  team: IQbjTeam | IQbjRefPointer;
  player: IQbjPlayer | IQbjRefPointer;
  result: IQbjAnswerType | IQbjRefPointer;
}

export interface IQbjMatchQuestionBonus extends IQbjObject {
  parts: IQbjMatchQuestionBonusPart[];
}

export interface IQbjMatchQuestionBonusPart extends IQbjObject {
  controlledPoints: number;
  bouncebackPoints?: number;
}

export class MatchQuestion implements IQbjMatchQuestion, IYftDataModelObject {
  questionNumber: number;

  buzzes: MatchQuestionBuzz[] = [];

  bonus?: MatchQuestionBonus;

  bonusPoints?: number;

  bonusBouncebackPoints?: number;

  constructor(cycleNumber: number) {
    this.questionNumber = cycleNumber;
  }

  makeCopy() {
    const copy = new MatchQuestion(this.questionNumber);
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchQuestion) {
    this.buzzes = source.buzzes.map((bz) => bz.makeCopy());
    this.bonus = source.bonus?.makeCopy();
    this.bonusPoints = source.bonusPoints;
    this.bonusBouncebackPoints = source.bonusBouncebackPoints;
  }

  toFileObject() {
    const qbjObject: IQbjMatchQuestion = {
      questionNumber: this.questionNumber,
      buzzes: this.buzzes.map((bz) => bz.toFileObject()),
      bonus: this.bonus?.toFileObject(),
      bonusPoints: this.bonusPoints,
      bonusBouncebackPoints: this.bonusBouncebackPoints,
    };
    return qbjObject;
  }

  /** The number of points this team scored on this tossup-bonus cycle */
  getPoints(team: Team) {
    const tossupPoints = this.buzzes.find((bz) => bz.team === team)?.result.value;
    if (tossupPoints === undefined) return 0;

    const [controlled, bounceback] = this.bonus
      ? this.bonus.totalPoints()
      : [this.bonusPoints ?? 0, this.bonusBouncebackPoints ?? 0];
    if (tossupPoints > 0) {
      return tossupPoints + controlled;
    }
    return tossupPoints + bounceback;
  }

  /**
   * How many points each team scored
   * @returns [controlled points, bounceback points]
   */
  getBonusPoints() {
    if (this.bonus) return this.bonus.totalPoints();
    return [this.bonusPoints ?? 0, this.bonusBouncebackPoints ?? 0];
  }

  /**
   * Does the scoring for this question make sense?
   * @returns Error message if invalid; '' if valid
   */
  validate(rules: ScoringRules) {
    const shouldHaveBonus = rules.useBonuses && (this.bonus || this.bonusPoints !== undefined);
    const shouldHaveBounceback = shouldHaveBonus && rules.bonusesBounceBack;
    const hasBonus = (this.bonus && this.bonus?.parts.length > 0) || this.bonusPoints !== undefined;
    const missingBouncebacks =
      (!this.bonus || this.bonus.missingBouncebacks()) && this.bonusBouncebackPoints === undefined;
    const [controlledPts, bouncebackPoints] = this.getBonusPoints();

    if (shouldHaveBonus && !hasBonus) return 'Missing bonus information after a converted tossup.';
    if (!shouldHaveBonus && hasBonus && this.bonus && controlledPts > 0) return 'Dead tossup with nonzero bonus points';
    if (shouldHaveBounceback && missingBouncebacks) return 'Missing bonus bounceback information';
    if (!shouldHaveBounceback && bouncebackPoints > 0)
      return "Bonus bouceback information shouldn't exist for this question.";

    return '';
  }
}

export class MatchQuestionBuzz implements IQbjMatchQuestionBuzz, IYftDataModelObject {
  team: Team;

  player: Player;

  result: AnswerType;

  constructor(team: Team, player: Player, result: AnswerType) {
    this.team = team;
    this.player = player;
    this.result = result;
  }

  makeCopy() {
    return new MatchQuestionBuzz(this.team, this.player, this.result);
  }

  toFileObject() {
    const qbjObject: IQbjMatchQuestionBuzz = {
      team: this.team.toRefPointer(),
      player: this.player.toRefPointer(),
      result: this.result.toRefPointer(),
    };
    return qbjObject;
  }
}

export class MatchQuestionBonus implements IQbjMatchQuestionBonus, IYftDataModelObject {
  parts: MatchQuestionBonusPart[] = [];

  makeCopy() {
    const copy = new MatchQuestionBonus();
    copy.parts = this.parts.map((pt) => pt.makeCopy());
    return copy;
  }

  toFileObject() {
    const qbjObject: IQbjMatchQuestionBonus = {
      parts: this.parts.map((pt) => pt.toFileObject()),
    };
    return qbjObject;
  }

  /**
   * How many points each team scored
   * @returns [controlled points, bounceback points]
   */
  totalPoints() {
    let controlled = 0;
    let bounceback = 0;
    for (const pt of this.parts) {
      controlled += pt.controlledPoints;
      bounceback += pt.bouncebackPoints ?? 0;
    }
    return [controlled, bounceback];
  }

  controlledPoints() {
    let total = 0;
    for (const pt of this.parts) {
      total += pt.controlledPoints;
    }
    return total;
  }

  /** Are any of this bonus's parts missing bounceback data? */
  missingBouncebacks() {
    return !!this.parts.find((pt) => pt.bouncebackPoints === undefined);
  }
}

export class MatchQuestionBonusPart implements IQbjMatchQuestionBonusPart, IYftDataModelObject {
  controlledPoints: number = 0;

  bouncebackPoints?: number;

  constructor(controlledPts: number, bouncebackPts?: number) {
    this.controlledPoints = controlledPts;
    this.bouncebackPoints = bouncebackPts;
  }

  makeCopy() {
    return new MatchQuestionBonusPart(this.controlledPoints, this.bouncebackPoints);
  }

  toFileObject() {
    const qbjObject: IQbjMatchQuestionBonusPart = {
      controlledPoints: this.controlledPoints,
      bouncebackPoints: this.bouncebackPoints,
    };
    return qbjObject;
  }
}
