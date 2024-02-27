import AnswerType from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';
import MatchValidationMessage, { MatchValidationType } from './MatchValidationMessage';
import { Player, IQbjPlayer } from './Player';
import { IQbjPlayerAnswerCount, PlayerAnswerCount } from './PlayerAnswerCount';

export interface IQbjMatchPlayer extends IQbjObject {
  /** Which player this is referring to */
  player: IQbjPlayer | IQbjRefPointer;
  /** The number of tossups this player heard */
  tossupsHeard?: number;
  /** The number of this player's answers for each answer value */
  answerCounts: IQbjPlayerAnswerCount[];
}

/** One player's performance in one game */
export class MatchPlayer implements IQbjMatchPlayer, IYftDataModelObject {
  player: Player;

  tossupsHeard?: number;

  answerCounts: PlayerAnswerCount[] = [];

  /** total points for this player */
  get points(): number {
    let total = 0;
    for (const a of this.answerCounts) {
      total += a.points;
    }
    return total;
  }

  tuhValidation: MatchValidationMessage;

  totalBuzzesValidation: MatchValidationMessage;

  get allValidators(): MatchValidationMessage[] {
    let ary = [this.tuhValidation, this.totalBuzzesValidation];
    for (const ac of this.answerCounts) {
      ary = ary.concat(ac.allValidators);
    }
    return ary;
  }

  constructor(p: Player, answerTypes?: AnswerType[]) {
    this.player = p;
    this.tuhValidation = new MatchValidationMessage(MatchValidationType.PlayerTuhInvalid);
    this.totalBuzzesValidation = new MatchValidationMessage(MatchValidationType.PlayerHasTooManyBuzzes);

    if (!answerTypes) return;
    for (const aType of answerTypes) {
      this.answerCounts.push(new PlayerAnswerCount(aType));
    }
  }

  makeCopy(): MatchPlayer {
    const copy = new MatchPlayer(this.player);
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchPlayer) {
    this.player = source.player;
    this.tossupsHeard = source.tossupsHeard;
    this.answerCounts = source.answerCounts.map((ac) => ac.makeCopy());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatchPlayer {
    const qbjObject: IQbjMatchPlayer = {
      player: this.player.toRefPointer(),
      tossupsHeard: this.tossupsHeard || 0,
      answerCounts: this.answerCounts.map((ac) => ac.toFileObject(qbjOnly)),
    };

    // this should not be a top-level or referenced object
    return qbjObject;
  }

  setAnswerCount(answerType: AnswerType, count: number | undefined) {
    const answerCount = this.answerCounts.find((ac) => ac.answerType === answerType);
    if (!answerCount) return;
    answerCount.number = count;
  }

  getTotalBuzzes(positiveOnly: boolean = false) {
    let totalBuzzes = 0;
    this.answerCounts.forEach((ac) => {
      if (ac.answerType.value > 0 || !positiveOnly) totalBuzzes += ac.number || 0;
    });
    return totalBuzzes;
  }

  getErrorMessages() {
    let errors: string[] = [];
    if (this.tuhValidation.isError()) {
      errors.push(this.tuhValidation.message);
    }
    if (this.totalBuzzesValidation.isError()) {
      errors.push(this.totalBuzzesValidation.message);
    }
    this.answerCounts.forEach((ac) => {
      errors = errors.concat(ac.getErrorMessages());
    });
    return errors;
  }

  /**
   * Set the validation status of the player's tossups heard
   * @param isValid whether it's valid
   * @param message Error message, to which the player's name is prepended, to override the default.
   */
  setTuhHeardValidation(isValid: boolean, message?: string) {
    if (!isValid) {
      const msg = `${this.player.name}: ${message || 'Value for tossups heard is invalid'}`;
      this.tuhValidation.setError(msg);
      return;
    }
    this.tuhValidation.setOk();
  }

  validateAnswerCounts() {
    let totalBuzzes = 0;
    this.answerCounts.forEach((ac) => {
      ac.validateAll(this.player.name);
      totalBuzzes += ac.number || 0;
    });

    if (totalBuzzes > (this.tossupsHeard || 0)) {
      this.totalBuzzesValidation.setError(`${this.player.name}: Player has more buzzes than tossups heard`);
    } else {
      this.totalBuzzesValidation.setOk();
    }
  }
}

export default MatchPlayer;
