import { ValidationStatuses } from './Interfaces';

export enum MatchValidationType {
  lowTotalTuh,
}

export default class MatchValidationMessage {
  status: ValidationStatuses = ValidationStatuses.Ok;

  message: string = '';

  /** Can the user choose to hide the message? */
  suppressable: boolean = false;

  /** Did the user choose to hide the message? */
  isSuppressed: boolean = false;

  type?: MatchValidationType;

  constructor(
    status?: ValidationStatuses,
    message?: string,
    type?: MatchValidationType,
    suppressable: boolean = false,
  ) {
    if (status) this.status = status;
    if (message) this.message = message;
    if (type !== undefined) this.type = type;
    this.suppressable = suppressable;
  }

  makeCopy(): MatchValidationMessage {
    const copy = new MatchValidationMessage();
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
  ) {
    if (this.findMsgType(type)?.isSuppressed) return; // don't "unsuppress" things just because we noticed the issue still exists

    this.clearMsgType(type);
    this.validators.push(new MatchValidationMessage(status, message, type, suppressable));
  }

  clearMsgType(type: MatchValidationType) {
    this.validators = this.validators.filter((v) => v.type !== type);
  }

  suppressMessageType(type: MatchValidationType) {
    const message = this.findMsgType(type);
    if (message) message.suppress();
  }
}
