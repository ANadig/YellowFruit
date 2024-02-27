import AnswerType from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject, ValidationStatuses } from './Interfaces';
import { MatchPlayer, IQbjMatchPlayer } from './MatchPlayer';
import MatchValidationMessage, { MatchValidationCollection, MatchValidationType } from './MatchValidationMessage';
import { IQbjPlayerAnswerCount, PlayerAnswerCount } from './PlayerAnswerCount';
import { IQbjTeam, Team } from './Team';

export interface IQbjMatchTeam extends IQbjObject {
  /** Which team this is */
  team?: IQbjTeam | IQbjRefPointer;
  /** Did this team forfeit the match? */
  forfeitLoss?: boolean;
  /** total number of points scored */
  points?: number;
  /** The number of points this team earned on bonuses */
  bonusPoints?: number;
  /** Number of tossups answered with no bonuses */
  correctTossupsWithoutBonuses?: number;
  /** The number of points this team earned on bonuses bounced back from the opponent */
  bonusBouncebackPoints?: number;
  /** The number of points this team earned on lightning questions */
  lightningPoints?: number;
  /** The performances of the players on this team */
  matchPlayers?: IQbjMatchPlayer[];
}

/** MatchTeam object as written to a .yft file */
export interface IYftFileMatchTeam extends IQbjMatchTeam, IYftFileObject {
  YfData: IMatchTeamExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IMatchTeamExtraData {
  overTimeBuzzes?: IQbjPlayerAnswerCount[];
}

/** One team's performance in one game */
export class MatchTeam implements IQbjMatchTeam, IYftDataModelObject {
  team?: Team;

  forfeitLoss: boolean = false;

  points?: number;

  get bonusPoints(): number {
    return (this.points || 0) - this.tossupPoints - (this.bonusBouncebackPoints || 0) - (this.lightningPoints || 0);
  }

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  get correctTossupsWithoutBonuses(): number {
    let total = 0;
    for (const ac of this.overTimeBuzzes || []) {
      if (ac.points > 0) {
        total += ac.number || 0;
      }
    }
    return total;
  }

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  get overtimePoints(): number {
    let total = 0;
    for (const ac of this.overTimeBuzzes || []) {
      total += ac.points;
    }
    return total;
  }

  /** What the team scored in overtime. Note that we don't actually track which player made this buzzes */
  overTimeBuzzes?: PlayerAnswerCount[];

  bonusBouncebackPoints?: number;

  lightningPoints?: number;

  /** Performances of each player. A player being listed here doesn't necessarily mean they actually played in this game. */
  matchPlayers: MatchPlayer[] = [];

  /** Number of points scored on tossups */
  get tossupPoints(): number {
    let total = 0;
    for (const p of this.matchPlayers) {
      total += p.points;
    }
    return total;
  }

  totalScoreFieldValidation: MatchValidationMessage;

  /** Any other messages that should go at the bottom of the modal rather than a specific field */
  modalBottomValidation: MatchValidationCollection;

  /** All messages that might need to appear at the bottom of the modal, including those of nested objects */
  get allValidators(): MatchValidationMessage[] {
    let ary = this.modalBottomValidation.validators.slice();
    for (const mp of this.matchPlayers) {
      ary = ary.concat(mp.allValidators);
    }
    return ary;
  }

  static minimumValidScore = -99999;

  static maximumValidScore = 99999;

  constructor(t?: Team, answerTypes?: AnswerType[]) {
    if (t) {
      this.team = t;
      this.matchPlayers = t.players.map((pl) => new MatchPlayer(pl, answerTypes));
    }
    this.totalScoreFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTeamScore);
    this.modalBottomValidation = new MatchValidationCollection();
  }

  makeCopy(): MatchTeam {
    const copy = new MatchTeam();
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchTeam) {
    this.team = source.team;
    this.matchPlayers = source.matchPlayers.map((mp) => mp.makeCopy());
    this.forfeitLoss = source.forfeitLoss;
    this.points = source.points;
    this.bonusBouncebackPoints = source.bonusBouncebackPoints;
    this.lightningPoints = source.lightningPoints;
    this.overTimeBuzzes = source.overTimeBuzzes?.slice(); // TODO: deep copy
    this.totalScoreFieldValidation = source.totalScoreFieldValidation.makeCopy();
    this.modalBottomValidation = source.modalBottomValidation.makeCopy();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatchTeam {
    const qbjObject: IQbjMatchTeam = {
      team: this.team?.toRefPointer(),
      forfeitLoss: this.forfeitLoss,
      points: this.points,
      bonusPoints: this.bonusPoints,
      correctTossupsWithoutBonuses: this.correctTossupsWithoutBonuses,
      bonusBouncebackPoints: this.bonusBouncebackPoints,
      lightningPoints: this.lightningPoints,
      matchPlayers: this.matchPlayers.map((mp) => mp.toFileObject(qbjOnly)),
    };

    // this should not be a top-level or referenced object
    if (qbjOnly) return qbjObject;

    const yfData: IMatchTeamExtraData = {
      overTimeBuzzes: this.overTimeBuzzes?.map((ac) => ac.toFileObject()),
    };
    const yftFileObj: IYftFileMatchTeam = { YfData: yfData, ...qbjObject };
    return yftFileObj;
  }

  /** The sum of all player tossups heard values */
  getTotalTossupsHeard() {
    let sum = 0;
    for (const mp of this.matchPlayers) {
      sum += mp.tossupsHeard || 0;
    }
    return sum;
  }

  getErrorMessages(ignoreHidden: boolean = false): string[] {
    let errs: string[] = [];
    if (this.totalScoreFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`${this.team?.name || 'Total'} score: ${this.totalScoreFieldValidation.message}`);
    }
    errs = errs.concat(this.modalBottomValidation.getErrorMessages(ignoreHidden));
    this.matchPlayers.forEach((mp) => {
      errs = errs.concat(mp.getErrorMessages());
    });
    return errs;
  }

  validateAll() {
    this.validateTotalPoints();
    this.validateAnswerCounts();
  }

  validateTotalPoints() {
    if (this.points === undefined) {
      this.addValidationMessage(
        MatchValidationType.MissingTotalPoints,
        ValidationStatuses.HiddenError,
        'Total score is required',
      );
      this.totalScoreFieldValidation.setOk();
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.MissingTotalPoints);

    if (this.points < MatchTeam.minimumValidScore || this.points > MatchTeam.maximumValidScore) {
      this.totalScoreFieldValidation.setError('Invalid number');
      return;
    }
    this.totalScoreFieldValidation.setOk();
  }

  validateAnswerCounts() {
    this.matchPlayers.forEach((mp) => mp.validateAnswerCounts());
  }

  addValidationMessage(
    type: MatchValidationType,
    status: ValidationStatuses,
    message: string,
    suppressable: boolean = false,
  ) {
    const fullMessage = `${this.team ? `${this.team.name}: ` : ''}${message}`;
    this.modalBottomValidation.addValidationMsg(type, status, fullMessage, suppressable);
  }
}

export default MatchTeam;
