import { ValidationStatuses } from './Interfaces';

export enum MatchValidationType {
  LowTotalTuh = 'LowTotalTuh',
  InvalidTotalTuh = 'InvalidTotalTuh',
  MissingTeams = 'MissingTeams',
  MissingTotalPoints = 'MissingTotalPoints',
  TeamPlayingItself = 'TeamPlayingItself',
  InvalidTeamScore = 'InvalidTeamScore',
  TeamsNotInSamePool = 'TeamsNotInSamePool',
  PlayerTuhInvalid = 'PlayherTuhInvalid',
  TieGame = 'TieGame',
  NoTossupsHeard = 'NoTossupsHeard',
  FewerThanExpectedTUH = 'FewerThanExpectedTUH',
  MoreThanAllowedTUH = 'MoreThanAllowedTUH',
  PlayerAnswerCountInvalid = 'PlayerAnswerCountInvalid',
  PlayerHasTooManyBuzzes = 'PlayerHasTooManyBuzzes',
  MatchHasTooConvertedTU = 'MatchHasTooConvertedTU',
  TeamHasTooManyBuzzes = 'TeamHasTooManyBuzzes',
  NegativeBonusPoints = 'NegativeBonusPoints',
  BonusPointsTooHigh = 'BonusPointsTooHigh',
  BonusDivisorMismatch = 'BonusDivisorMismatch',
  DoubleForfeit = 'DoubleForfeit',
  InvalidOvertimeTuh = 'InvalidOvertimeTuh',
  OtButRegScoreNotTied = 'OtButRegScoreNotTied',
  RegulationTuhNotStandard = 'RegulationTuhNotStandard',
  TotalOtBuzzesExceedsTuh = 'TotalOtBuzzesExceedsTuh',
  OtTuhLessThanMinimum = 'OtTuhLessThanMinimum',
  TeamAlreadyPlayedInRound = 'TeamAlreadyPlayedInRound',
  InvalidBouncebackPoints = 'InvalidBouncebackPoints',
  BouncebackConvOver100 = 'BouncebackConvOver100',
  TotalScoreAndTuPtsMismatch = 'TotalScoreAndTuPtsMismatch',
  ImportTwoMatchesSameTeam = 'ImportTwoMatchesSameTeam',
  TuPlusLtngNotEqualTotal = 'TuPlusLtngNotEqualTotal',
  LightningDivisorMismatch = 'LightningDivisorMismatch',
  BouncebackDivisorMismatch = 'BouncebackDivisorMismatch',
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

  /** True/false, whether this kind of validation message should normally be suppressable */
  static getDefaultSuppressableStatus(status: ValidationStatuses) {
    if (status === ValidationStatuses.Warning) return true;
    return false;
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

  /** Is this validator in a status where we should force the user to resolve? */
  isError() {
    return this.status === ValidationStatuses.Error || this.status === ValidationStatuses.HiddenError;
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

  unSuppress() {
    this.isSuppressed = false;
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

  getErrorMessages(ignoreHidden: boolean = false): string[] {
    const errorsToShow = this.validators.filter((v) => {
      if (v.isSuppressed) return false;
      if (v.status === ValidationStatuses.Error) return true;
      if (ignoreHidden) return false;
      return v.status === ValidationStatuses.HiddenError;
    });
    return errorsToShow.map((v) => v.message);
  }

  getWarningMessages(): string[] {
    const warningsToShow = this.validators.filter((v) => v.status === ValidationStatuses.Warning && !v.isSuppressed);
    return warningsToShow.map((v) => v.message);
  }

  findMsgType(type: MatchValidationType) {
    return this.validators.find((v) => v.type === type);
  }

  /**
   * Add a new message to the collection
   * @param type The kind of issue
   * @param status Error/warning/etc
   * @param message user-facing text
   * @param suppressable Whether it can be dismissed by the user. Default is yes if warning, no if anything else
   * @param isSuppressed True if it should start suppressed
   */
  addValidationMsg(
    type: MatchValidationType,
    status: ValidationStatuses,
    message: string,
    suppressable?: boolean,
    isSuppressed: boolean = false,
  ) {
    if (this.findMsgType(type)?.isSuppressed) return; // don't "unsuppress" things just because we noticed the issue still exists

    this.clearMsgType(type);
    const suppressableAct =
      suppressable !== undefined ? suppressable : MatchValidationMessage.getDefaultSuppressableStatus(status);
    this.validators.push(new MatchValidationMessage(type, status, message, suppressableAct, isSuppressed));
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

  unSuppressMessageType(type: MatchValidationType) {
    const message = this.findMsgType(type);
    if (message) message.unSuppress();
  }
}
