import { ValidationStatuses } from './Interfaces';

export enum MatchValidationType {
  lowTotalTuh,
  invalidTotalTuh,
}

export interface IYftFileMatchValidationMsg {
  status: ValidationStatuses;
  message: string;
  suppressable: boolean;
  isSuppressed: boolean;
  type: MatchValidationType;
}

export default class MatchValidationMessage {
  status: ValidationStatuses = ValidationStatuses.Ok;

  message: string = '';

  /** Can the user choose to hide the message? */
  suppressable: boolean = false;

  /** Did the user choose to hide the message? */
  isSuppressed: boolean = false;

  type: MatchValidationType;

  constructor(
    type: MatchValidationType,
    status?: ValidationStatuses,
    message?: string,
    suppressable: boolean = false,
    isSuppressed: boolean = false,
  ) {
    this.type = type;
    if (status) this.status = status;
    if (message) this.message = message;
    this.suppressable = suppressable;
    this.isSuppressed = isSuppressed;
  }

  makeCopy(): MatchValidationMessage {
    const copy = new MatchValidationMessage(this.type);
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchValidationMessage) {
    this.status = source.status;
    this.message = source.message;
    this.suppressable = source.suppressable;
    this.isSuppressed = source.isSuppressed;
    this.type = source.type;
  }

  toFileObject(): IYftFileMatchValidationMsg {
    // yellow-fruit only - no need to worry about qbj schema
    return {
      status: this.status,
      message: this.message,
      suppressable: this.suppressable,
      isSuppressed: this.isSuppressed,
      type: this.type,
    };
  }

  setOk() {
    this.status = ValidationStatuses.Ok;
    this.message = '';
  }

  setError(msg: string) {
    this.status = ValidationStatuses.Error;
    this.message = msg;
  }

  setWarning(msg: string) {
    this.status = ValidationStatuses.Warning;
    this.message = msg;
  }

  suppress() {
    if (!this.suppressable) {
      return;
    }
    this.isSuppressed = true;
  }
}

export class MatchValidationCollection {
  validators: MatchValidationMessage[] = [];

  makeCopy(): MatchValidationCollection {
    const copy = new MatchValidationCollection();
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchValidationCollection) {
    this.validators = source.validators.map((v) => v.makeCopy());
  }

  toFileObject(): IYftFileMatchValidationMsg[] {
    return this.validators.map((v) => v.toFileObject());
  }

  getErrorMessages(): string[] {
    const unsuppressedErrs = this.validators.filter((v) => !v.isSuppressed && v.status === ValidationStatuses.Error);
    return unsuppressedErrs.map((v) => v.message);
  }

  findMsgType(type: MatchValidationType) {
    return this.validators.find((v) => v.type === type);
  }

  addValidationMsg(
    type: MatchValidationType,
    status: ValidationStatuses,
    message: string,
    suppressable: boolean = false,
    isSuppressed: boolean = false,
  ) {
    if (this.findMsgType(type)?.isSuppressed) return; // don't "unsuppress" things just because we noticed the issue still exists

    this.clearMsgType(type);
    this.validators.push(new MatchValidationMessage(type, status, message, suppressable, isSuppressed));
  }

  clearMsgType(type: MatchValidationType) {
    this.validators = this.validators.filter((v) => v.type !== type);
  }

  addFromFileObjects(ary: IYftFileMatchValidationMsg[]) {
    for (const obj of ary) {
      this.addValidationMsg(obj.type, obj.status, obj.message, obj.suppressable, obj.isSuppressed);
    }
  }

  suppressMessageType(type: MatchValidationType) {
    const message = this.findMsgType(type);
    if (message) message.suppress();
  }
}
