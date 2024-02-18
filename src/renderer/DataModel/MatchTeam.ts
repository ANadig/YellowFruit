import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject, ValidationStatuses } from './Interfaces';
import { MatchPlayer, IQbjMatchPlayer } from './MatchPlayer';
import MatchValidationMessage, { MatchValidationCollection, MatchValidationType } from './MatchValidationMessage';
import { IQbjPlayerAnswerCount, TossupAnswerCount } from './PlayerAnswerCount';
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

  private _correctTossupsWithoutBonuses?: number;

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  get correctTossupsWithoutBonuses(): number {
    if (this._correctTossupsWithoutBonuses !== undefined) return this._correctTossupsWithoutBonuses;

    let total = 0;
    for (const ac of this.overTimeBuzzes || []) {
      if (ac.points > 0) {
        total += ac.number;
      }
    }
    return total;
  }

  set correctTossupsWithoutBonuses(num: number) {
    // if we already have specific information, always use that
    if (this.overTimeBuzzes !== undefined) return;

    this._correctTossupsWithoutBonuses = num;
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
  overTimeBuzzes?: TossupAnswerCount[];

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
  otherValidation: MatchValidationCollection;

  static minimumValidScore = -99999;

  static maximumValidScore = 99999;

  constructor(t?: Team) {
    if (t) {
      this.team = t;
      this.matchPlayers = t.players.map((pl) => new MatchPlayer(pl));
    }
    this.totalScoreFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTeamScore);
    this.otherValidation = new MatchValidationCollection();
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

  getErrorMessages(ignoreHidden: boolean = false): string[] {
    console.log(this.team);
    let errs: string[] = [];
    if (this.totalScoreFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`${this.team?.name || 'Total'} score: ${this.totalScoreFieldValidation.message}`);
    }
    errs = errs.concat(this.otherValidation.getErrorMessages(ignoreHidden));
    return errs;
  }

  validateAll() {
    this.validateTotalPoints();
  }

  validateTotalPoints() {
    if (this.points === undefined) {
      this.otherValidation.addValidationMsg(
        MatchValidationType.MissingTotalPoints,
        ValidationStatuses.HiddenError,
        `${this.team ? `${this.team.name} :` : ''} Total score is required`,
      );
      return;
    }
    this.otherValidation.clearMsgType(MatchValidationType.MissingTotalPoints);

    if (this.points < MatchTeam.minimumValidScore || this.points > MatchTeam.maximumValidScore) {
      this.totalScoreFieldValidation.setError('Invalid number');
      return;
    }
    this.totalScoreFieldValidation.setOk();
  }
}

export default MatchTeam;
