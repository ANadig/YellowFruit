/** Data structures that hold compiled stats to be used stat reports */

import { LeftOrRight } from '../Utils/UtilTypes';
import { Match } from './Match';
import { Phase } from './Phase';
import { PlayerAnswerCount } from './PlayerAnswerCount';
import { Pool } from './Pool';
import Registration from './Registration';
import { Team } from './Team';

export type wlt = 'win' | 'loss' | 'tie';

export class PhaseStandings {
  phase: Phase;

  pools: PoolStats[] = [];

  constructor(phase: Phase) {
    this.phase = phase;
    this.pools = phase.pools.map((pool) => new PoolStats(pool));
  }

  compileStats() {
    for (const round of this.phase.rounds) {
      for (const match of round.matches) {
        this.addMatchToStats(match);
      }
    }
    for (const pool of this.pools) {
      pool.sortTeams();
    }
  }

  private addMatchToStats(match: Match) {
    const leftTeamStats = this.findPoolTeam(match.leftTeam.team);
    leftTeamStats?.addMatchTeam(match, 'left');
    const rightTeamStats = this.findPoolTeam(match.rightTeam.team);
    rightTeamStats?.addMatchTeam(match, 'right');
  }

  private findPoolTeam(team: Team | undefined): PoolTeamStats | undefined {
    if (!team) return undefined;
    for (const pool of this.pools) {
      const pt = pool.findTeam(team);
      if (pt) return pt;
    }
    return undefined;
  }
}

class PoolStats {
  poolTeams: PoolTeamStats[] = [];

  constructor(pool: Pool) {
    this.poolTeams = pool.poolTeams.map((pt) => new PoolTeamStats(pt.team));
  }

  sortTeams() {
    this.poolTeams.sort((a, b) => {
      const aWinPct = a.getWinPct();
      const bWinPct = b.getWinPct();
      if (aWinPct !== bWinPct) return aWinPct - bWinPct;
      let aPptuh = a.getPtsPerRegTuh();
      let bPptuh = b.getPtsPerRegTuh();
      if (Number.isNaN(aPptuh)) aPptuh = -9999999;
      if (Number.isNaN(bPptuh)) bPptuh = -9999999;
      return aPptuh - bPptuh;
    });
  }

  /** Is this team in this pool? */
  findTeam(team: Team) {
    return this.poolTeams.find((pt) => pt.team === team);
  }
}

class PoolTeamStats {
  registration?: Registration;

  team: Team;

  wins: number = 0;

  losses: number = 0;

  ties: number = 0;

  /** Including overtime */
  tuhTotal: number = 0;

  /** Not including overtime */
  tuhRegulation: number = 0;

  totalPoints: number = 0;

  tossupCounts: PlayerAnswerCount[] = [];

  bonusesHeard: number = 0;

  bonusPoints: number = 0;

  bounceBackPoints: number = 0;

  bounceBackPartsHeard: number = 0;

  lightningPoints: number = 0;

  constructor(team: Team) {
    this.team = team;
  }

  getWinPct() {
    const wins = this.wins + this.ties / 2;
    return wins / (this.wins + this.losses + this.ties);
  }

  /** Points per non-overtime tossup heard. Is NaN if tossups heard is zero! */
  getPtsPerRegTuh() {
    return this.totalPoints / this.tuhRegulation;
  }

  /** PPB. Is NaN if bonuses heard is zero! */
  getPtsPerBonus() {
    return this.bonusPoints / this.bonusesHeard;
  }

  addMatchTeam(match: Match, whichTeam: LeftOrRight) {
    const matchTeam = match.getMatchTeam(whichTeam);
    const result = getResult(match, whichTeam);
    this.tuhTotal += match.tossupsRead || 0;
    this.tuhRegulation += this.tuhTotal - match.overtimeTossupsRead;
    if (result === 'win') this.wins++;
    else if (result === 'loss') this.losses++;
    else if (result === 'tie') this.ties++;

    this.totalPoints += matchTeam.points || 0;
    this.bonusPoints += matchTeam.getBonusPoints();
    this.bonusesHeard += matchTeam.getBonusesHeard();
    this.lightningPoints += matchTeam.lightningPoints || 0;

    for (const matchPlayer of matchTeam.matchPlayers) {
      for (const answerCount of matchPlayer.answerCounts) {
        if (answerCount.number !== undefined) {
          this.addAnswerCount(answerCount);
        }
      }
    }
  }

  private addAnswerCount(answerCount: PlayerAnswerCount) {
    const tc = this.tossupCounts.find((ac) => ac.answerType.value === answerCount.answerType.value);
    if (!tc) {
      this.tossupCounts.push(new PlayerAnswerCount(answerCount.answerType, answerCount.number));
      return;
    }
    if (tc.number === undefined) {
      tc.number = answerCount.number;
    } else {
      tc.number += answerCount.number || 0;
    }
  }
}

function otherTeam(whichTeam: LeftOrRight): LeftOrRight {
  return whichTeam === 'left' ? 'right' : 'left';
}

/** Did this team win, lose, tie, or none of those (if double forfeit or invalid data) */
function getResult(match: Match, whichTeam: LeftOrRight): wlt | null {
  const matchTeam = match.getMatchTeam(whichTeam);
  const otherMatchTeam = match.getMatchTeam(otherTeam(whichTeam));
  if (matchTeam.forfeitLoss && !otherMatchTeam.forfeitLoss) return 'loss';
  if (otherMatchTeam.forfeitLoss && !matchTeam.forfeitLoss) return 'win';
  if (matchTeam.forfeitLoss && otherMatchTeam.forfeitLoss) return null;

  if (matchTeam.points === undefined || otherMatchTeam.points === undefined) return null;

  if (matchTeam.points > otherMatchTeam.points) return 'win';
  if (matchTeam.points < otherMatchTeam.points) return 'loss';
  return 'tie';
}
