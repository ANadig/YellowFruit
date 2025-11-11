import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, ValidationStatuses } from './Interfaces';
import MatchValidationMessage, { MatchValidationType } from './MatchValidationMessage';

export interface IQbjPlayerAnswerCount extends IQbjObject {
  /** Number of questions answered for this many points */
  number?: number;
  answerType: IQbjAnswerType | IQbjRefPointer;
}

export class PlayerAnswerCount implements IQbjPlayerAnswerCount, IYftDataModelObject {
  number?: number;

  answerType: AnswerType;

  validation: MatchValidationMessage;

  /** Don't allow numbers higher than this */
  static readonly maximumValue = 999;

  get allValidators(): MatchValidationMessage[] {
    return [this.validation];
  }

  get points() {
    if (this.number === undefined) return 0;
    return this.number * this.answerType.value;
  }

  constructor(answerType: AnswerType, number?: number) {
    this.answerType = answerType;
    this.number = number;
    this.validation = new MatchValidationMessage(MatchValidationType.PlayerAnswerCountInvalid);
  }

  makeCopy(): PlayerAnswerCount {
    const copy = new PlayerAnswerCount(this.answerType, this.number);
    return copy;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPlayerAnswerCount {
    const qbjObject: IQbjPlayerAnswerCount = {
      number: this.number || 0,
      answerType: this.answerType.toRefPointer(),
    };

    // this should not be a top-level or referenced object
    return qbjObject;
  }

  addToCount(numToAdd: number | undefined) {
    if (numToAdd === undefined) return;
    if (this.number === undefined) this.number = numToAdd;
    else this.number += numToAdd;
  }

  /**
   * Validate whether the current value is vaguely reasonable
   * @param playerName Player's name (or some other label), to which the error message is appended.
   */
  validateAll(playerName: string) {
    if (!this.numberIsValid()) {
      const msg = `${playerName}: Number of ${this.answerType.value}-point buzzes is invalid`;
      this.validation.setError(msg);
      return;
    }
    this.validation.setOk();
  }

  getErrorMessages(): string[] {
    if (this.validation.isError()) {
      return [this.validation.message];
    }
    return [];
  }

  getWarningMessages(): string[] {
    if (this.validation.status === ValidationStatuses.Warning) {
      return [this.validation.message];
    }
    return [];
  }

  getNumSuppressedMsgs() {
    return this.validation.isSuppressed ? 1 : 0;
  }

  restoreSuppressedMsgs() {
    this.validation.isSuppressed = false;
  }

  numberIsValid() {
    if (this.number === undefined) return true;
    return 0 <= this.number && this.number <= PlayerAnswerCount.maximumValue;
  }
}

/** Sort a list of answer counts. Descending order of point value, meaning powers first, negs last */
export function sortAnswerCounts(ary: PlayerAnswerCount[]) {
  ary.sort((a, b) => b.answerType.value - a.answerType.value);
}
