/** Data structures that hold compiled stats to be used stat reports */

import { LeftOrRight } from '../Utils/UtilTypes';
import { Match } from './Match';
import { Phase } from './Phase';
import { PlayerAnswerCount } from './PlayerAnswerCount';
import { Pool } from './Pool';
import Registration from './Registration';
import { Team } from './Team';

export class PhaseStandings {
  phase: Phase;

  pools: PoolStats[] = [];

  anyTiesExist: boolean = false;

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
      pool.rankSortedTeams(true);
      if (!this.anyTiesExist && pool.getAnyTiesExist()) {
        this.anyTiesExist = true;
      }
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

export class PoolStats {
  pool: Pool;

  poolTeams: PoolTeamStats[] = [];

  constructor(pool: Pool) {
    this.pool = pool;
    this.poolTeams = pool.poolTeams.map((pt) => new PoolTeamStats(pt.team));
  }

  sortTeams() {
    this.poolTeams.sort((a, b) => {
      let aWinPct = a.getWinPct();
      let bWinPct = b.getWinPct();
      if (Number.isNaN(aWinPct)) aWinPct = -1;
      if (Number.isNaN(bWinPct)) bWinPct = -1;
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;

      let aPptuh = a.getPtsPerRegTuh();
      let bPptuh = b.getPtsPerRegTuh();
      if (Number.isNaN(aPptuh)) aPptuh = -9999999;
      if (Number.isNaN(bPptuh)) bPptuh = -9999999;
      return bPptuh - aPptuh;
    });
  }

  /** Assuming teams are sorted already, determine their ranks and the tiers they would advance to */
  rankSortedTeams(sameRecordTies: boolean = false, startingRank: number = 1) {
    let prevWinPct = 2;
    let teamsSoFar = 0;
    let prevRank = startingRank - 1;
    let prevTeam;
    for (const oneTeam of this.poolTeams) {
      teamsSoFar++;
      const thisWinPct = oneTeam.getWinPct();
      if (sameRecordTies && thisWinPct === prevWinPct) {
        const tiedRank = `${prevRank.toString()}=`;
        oneTeam.rank = tiedRank;
        if (prevTeam) prevTeam.rank = tiedRank;
      } else {
        oneTeam.rank = teamsSoFar.toString();
        prevRank = teamsSoFar;
      }
      // caller is responsible for revising tier assignments if ties should be broken at the buzzer.
      oneTeam.advanceToTier = this.pool.getTierThatRankAdvancesTo(teamsSoFar);
      prevWinPct = thisWinPct;
      prevTeam = oneTeam;
    }

    if (sameRecordTies) this.advancementTiersHandleTies();
  }

  /** Assuming teams have been assigned provisional tiers, remove them if we'd actually want to play a tiebreaker to figure this out */
  advancementTiersHandleTies() {
    let prevTeam = this.poolTeams[0];
    for (let i = 1; i < this.poolTeams.length; i++) {
      const oneTeam = this.poolTeams[i];
      if (!prevTeam) {
        prevTeam = oneTeam;
        continue;
      }
      if (oneTeam.needsTiebreakerWith(prevTeam)) {
        oneTeam.advancementIsAmbiguous = true;
      }
      prevTeam = oneTeam;
    }
    // now do it again going backwards to catch the rest
    prevTeam = this.poolTeams[this.poolTeams.length - 1];
    for (let i = this.poolTeams.length - 2; i >= 0; i--) {
      const oneTeam = this.poolTeams[i];
      if (!prevTeam) {
        prevTeam = oneTeam;
        continue;
      }
      if (oneTeam.needsTiebreakerWith(prevTeam)) {
        oneTeam.advancementIsAmbiguous = true;
      }
      prevTeam = oneTeam;
    }
  }

  /** Is this team in this pool? */
  findTeam(team: Team) {
    return this.poolTeams.find((pt) => pt.team === team);
  }

  getAnyTiesExist() {
    for (const pt of this.poolTeams) {
      if (pt.ties > 0) return true;
    }
    return false;
  }
}

export class PoolTeamStats {
  registration?: Registration;

  team: Team;

  rank: string = '';

  advanceToTier?: number;

  advancementIsAmbiguous: boolean = false;

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

  /** Do we need a tiebreaker with this team to determine where they advance to? */
  needsTiebreakerWith(other: PoolTeamStats) {
    if (this.rank !== other.rank) return false;
    return this.advanceToTier !== other.advanceToTier || other.advancementIsAmbiguous;
  }

  addMatchTeam(match: Match, whichTeam: LeftOrRight) {
    this.tuhTotal += match.tossupsRead || 0;
    this.tuhRegulation += (match.tossupsRead || 0) - (match.overtimeTossupsRead || 0);
    const result = match.getResult(whichTeam);
    if (result === 'win') this.wins++;
    else if (result === 'loss') this.losses++;
    else if (result === 'tie') this.ties++;

    if (match.isForfeit()) return;

    const matchTeam = match.getMatchTeam(whichTeam);
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
