import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { MatchPlayer, IQbjMatchPlayer } from './MatchPlayer';
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

  lightningPoints: number = 0;

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

  constructor(t?: Team) {
    if (!t) return;
    this.team = t;
    this.matchPlayers = t.players.map((pl) => new MatchPlayer(pl));
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
}

export default MatchTeam;
