import MatchPlayer from './MatchPlayer';
import Team from './Team';

/** One team's performance in one game */
class MatchTeam {
  /** Which team this is */
  team: Team;

  /** Did this team forfeit the match? */
  forfeitLoss: boolean = false;

  /** total number of points scored */
  get points(): number {
    if (this.totalPointsOverride !== undefined) {
      return this.totalPointsOverride;
    }
    return this.tossupPoints + this.bonusPoints + this.bonusBouncebackPoints + this.lightningPoints;
  }

  /** The number of points this team earned on bonuses */
  bonusPoints: number = 0;

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  get correctTossupsWithoutBonuses(): number {
    return this.overtimeTens + this.overtimePowers + this.overtimeNegs;
  }

  /** Number of 10-point TUs the team got in OT */
  overtimeTens: number = 0;

  /** Number of powers the team got in OT */
  overtimePowers: number = 0;

  /** Number of negs for the team in OT */
  overtimeNegs: number = 0;

  /** The number of points this team earned on bonuses bounced back from the opponent */
  bonusBouncebackPoints: number = 0;

  /** The number of points this team earned on lightning questions */
  lightningPoints: number = 0;

  /** The performances of the players on this team */
  matchPlayers: MatchPlayer[];

  /** Number of points scored on tossups */
  get tossupPoints(): number {
    let total = 0;
    for (const p of this.matchPlayers) {
      total += p.points;
    }
    return total;
  }

  /** Override the calculated number of points. Use for games with no individual stats */
  totalPointsOverride: number | undefined;

  constructor(t: Team) {
    this.team = t;
    this.matchPlayers = [];
  }
}

export default MatchTeam;
