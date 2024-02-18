import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';

export interface IQbjPlayerAnswerCount extends IQbjObject {
  /** Number of questions answered for this many points */
  number: number;
  answerType: IQbjAnswerType | IQbjRefPointer;
}

export class TossupAnswerCount implements IQbjPlayerAnswerCount, IYftDataModelObject {
  number: number;

  answerType: AnswerType;

  get points() {
    return this.number * this.answerType.value;
  }

  constructor(answerType: AnswerType, number: number = 0) {
    this.answerType = answerType;
    this.number = number;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPlayerAnswerCount {
    const qbjObject: IQbjPlayerAnswerCount = {
      number: this.number,
      answerType: this.answerType.toRefPointer(),
    };

    // this should not be a top-level or referenced object
    return qbjObject;
  }
}
