import AnswerType from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, ValidationStatuses } from './Interfaces';
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

  get allValidators(): MatchValidationMessage[] {
    return [this.tuhValidation];
  }

  constructor(p: Player, answerTypes?: AnswerType[]) {
    this.player = p;
    this.tuhValidation = new MatchValidationMessage(MatchValidationType.PlayherTuhInvalid);

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

  getErrorMessages() {
    const errors: string[] = [];
    if (this.tuhValidation.status === ValidationStatuses.Error) {
      errors.push(this.tuhValidation.message);
    }
    return errors;
  }

  /**
   * Set the validation status of the player's tossups heard
   * @param isValid whether it's valid
   * @param message Error message, to which the players name is prepended, to override the default.
   */
  setTuhHeardValidation(isValid: boolean, message?: string) {
    if (!isValid) {
      const msg = `${this.player.name}: ${message || 'Value for tossups heard is invalid'}`;
      this.tuhValidation.setError(msg);
      return;
    }
    this.tuhValidation.setOk();
  }
}

export default MatchPlayer;
