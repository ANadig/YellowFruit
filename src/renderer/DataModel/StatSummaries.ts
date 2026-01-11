/** Data structures that hold compiled stats to be used in stat reports */

import { sumReduce } from '../Utils/GeneralUtils';
import { LeftOrRight } from '../Utils/UtilTypes';
import { Match, StatsValidity } from './Match';
import { MatchPlayer } from './MatchPlayer';
import { MatchTeam } from './MatchTeam';
import { Phase, WildCardRankingMethod } from './Phase';
import { Player } from './Player';
import { PlayerAnswerCount } from './PlayerAnswerCount';
import { Pool } from './Pool';
import { PoolTeam } from './PoolTeam';
import { Round } from './Round';
import { ScoringRules } from './ScoringRules';
import { Team } from './Team';

/** One big list of the cumulative stats for all teams */
export class AggregateStandings {
  teamStats: PoolTeamStats[];

  players: PlayerStats[] = [];

  rounds: RoundStats[] = [];

  /** Every game put together -- for the total row of the round report page */
  roundReportTotalStats: RoundStats;

  anyTiesExist: boolean = false;

  scoringRules: ScoringRules;

  constructor(teams: Team[], phases: Phase[], scoringRules: ScoringRules) {
    this.teamStats = teams.map((tm) => new PoolTeamStats(new PoolTeam(tm), scoringRules));
    this.scoringRules = scoringRules;
    this.roundReportTotalStats = new RoundStats(new Round(-1), scoringRules);

    for (const phase of phases) {
      for (const round of phase.rounds) {
        const roundStats = new RoundStats(round, scoringRules, phase);
        for (const match of round.matches) {
          if (match.statsValidity === StatsValidity.omit) continue;

          // we have to do this from scratch rather than adding together existing phases' stats
          // in order to avoid double-counting carryover matches
          this.addMatchToTeamStats(match, round, phase);
          this.addMatchTeamToIndividualStats(match, 'left', round, phase);
          this.addMatchTeamToIndividualStats(match, 'right', round, phase);
          roundStats.addMatch(match);
          this.roundReportTotalStats.addMatch(match);
        }
        if (roundStats.games > 0) this.rounds.push(roundStats);
      }
    }
    this.calcAnyTiesExist();
    this.sortPlayersByPptuh();
  }

  private addMatchToTeamStats(match: Match, round: Round, phase: Phase) {
    const leftTeamStats = this.findPoolTeam(match.leftTeam.team);
    leftTeamStats?.addMatchTeam(match, 'left', round, phase);
    const rightTeamStats = this.findPoolTeam(match.rightTeam.team);
    rightTeamStats?.addMatchTeam(match, 'right', round, phase);
  }

  private findPoolTeam(team: Team | undefined): PoolTeamStats | undefined {
    if (!team) return undefined;
    return this.teamStats.find((ptStats) => ptStats.team === team);
  }

  sortTeamsByPPB() {
    this.teamStats.sort(AggregateStandings.ppbCompare);
  }

  sortTeamsByPptuh() {
    this.teamStats.sort(AggregateStandings.pptuhCompare);
  }

  static ppbCompare(a: PoolTeamStats, b: PoolTeamStats) {
    let aPpb = a.getPtsPerBonus();
    let bPpb = b.getPtsPerBonus();
    if (Number.isNaN(aPpb)) aPpb = -9999999;
    if (Number.isNaN(bPpb)) bPpb = -9999999;
    return bPpb - aPpb;
  }

  static pptuhCompare(a: PoolTeamStats, b: PoolTeamStats) {
    let aPptuh = a.getPtsPerRegTuh();
    let bPptuh = b.getPtsPerRegTuh();
    if (Number.isNaN(aPptuh)) aPptuh = -9999999;
    if (Number.isNaN(bPptuh)) bPptuh = -9999999;
    return bPptuh - aPptuh;
  }

  /** Sort teams by their final rank. Then assign the rank display strings that indicate where there are ties */
  arrangeTeamsForFinalRanking() {
    this.teamStats.sort((a, b) => {
      const aRank = a.team.getOverallRank() || 9999;
      const bRank = b.team.getOverallRank() || 9999;
      if (aRank !== bRank) return aRank - bRank;
      return AggregateStandings.ppbCompare(a, b);
    });

    let lastRank = 0;
    for (let i = 0; i < this.teamStats.length; i++) {
      const thisTeamRank = this.teamStats[i].team.getOverallRank();
      if (thisTeamRank === undefined) continue;

      if (thisTeamRank === lastRank) {
        this.teamStats[i].rank = `${thisTeamRank}=`;
        this.teamStats[i - 1].rank = `${thisTeamRank}=`;
      } else this.teamStats[i].rank = thisTeamRank.toString();

      lastRank = thisTeamRank;
    }
  }

  private calcAnyTiesExist() {
    for (const pt of this.teamStats) {
      if (pt.ties > 0) {
        this.anyTiesExist = true;
        return;
      }
    }
  }

  private addMatchTeamToIndividualStats(match: Match, whichTeam: LeftOrRight, round: Round, phase: Phase) {
    const mt = match.getMatchTeam(whichTeam);
    const tossupsRead = match.tossupsRead ?? 0;
    if (!mt.team) return;
    for (const mp of mt.matchPlayers) {
      let playerStats = this.players.find((pStats) => pStats.player === mp.player);
      if (!playerStats) {
        playerStats = new PlayerStats(mp.player, mt.team, this.scoringRules);
        this.players.push(playerStats);
      }
      playerStats.addMatchPlayer(mp, tossupsRead);
      playerStats.addMatchResult(match, whichTeam, mp, round, phase);
    }
  }

  private sortPlayersByPptuh() {
    this.players.sort((a, b) => {
      const aPptuh = a.getPptuh() ?? -999999;
      const bPptuh = b.getPptuh() ?? -999999;
      if (aPptuh === bPptuh) {
        if (aPptuh > 0) return b.tossupsHeard - a.tossupsHeard;
        return a.tossupsHeard - b.tossupsHeard;
      }
      return bPptuh - aPptuh;
    });
  }
}

export class PhaseStandings {
  phase: Phase;

  pools: PoolStats[] = [];

  players: PlayerStats[] = [];

  carryoverMatches: Match[];

  /** Did any matches end in a tie? */
  anyTiesExist: boolean = false;

  scoringRules: ScoringRules;

  constructor(phase: Phase, carryoverMatches: Match[], rules: ScoringRules) {
    this.phase = phase;
    this.pools = phase.pools.map((pool) => new PoolStats(pool, rules));
    this.carryoverMatches = carryoverMatches;
    this.scoringRules = rules;
  }

  compileStats(sortByFinalRank: boolean = false) {
    for (const round of this.phase.rounds) {
      for (const match of round.matches) {
        this.addMatchToTeamStats(match);
      }
    }
    for (const match of this.carryoverMatches) {
      this.addMatchToTeamStats(match);
    }
    for (const pool of this.pools) {
      pool.sortTeams();
      pool.rankSortedTeams();
      if (!this.anyTiesExist && pool.getAnyTiesExist()) {
        this.anyTiesExist = true;
      }
    }
    this.assignWildCardSeeds();
    if (sortByFinalRank) {
      this.assignFinalTeamRanks();
      this.sortTeamsByFinalRank();
    }
  }

  private addMatchToTeamStats(match: Match) {
    if (match.statsValidity === StatsValidity.omit) return;

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

  private assignWildCardSeeds() {
    if (!this.phase.hasWildCards()) return;
    let curSeed = this.phase.getTopWildCardSeed();

    const teamsToSeed = this.listOfAllTeams().filter((pt) => pt.currentSeed && curSeed && pt.currentSeed >= curSeed);
    this.sortWildCardTeams(teamsToSeed);
    for (const oneTeam of teamsToSeed) {
      oneTeam.currentSeed = curSeed;
      oneTeam.advanceToTier = this.phase.getTierThatWCSeedAdvancesTo(curSeed);
      curSeed++;
    }
  }

  private sortWildCardTeams(teamsToSeed: PoolTeamStats[]) {
    teamsToSeed.sort((a, b) => {
      if (this.phase.wildCardRankingMethod === WildCardRankingMethod.RankThenPPB) {
        const aRank = a.rawRank ?? 99999;
        const bRank = b.rawRank ?? 99999;
        if (aRank !== bRank) return aRank - bRank;
      } else if (this.phase.wildCardRankingMethod === WildCardRankingMethod.RecordThanPPB) {
        let aWinPct = a.getWinPct();
        let bWinPct = b.getWinPct();
        if (Number.isNaN(aWinPct)) aWinPct = -1;
        if (Number.isNaN(bWinPct)) bWinPct = -1;
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      }

      let aPpb = a.getPtsPerBonus();
      let bPpb = b.getPtsPerBonus();
      if (Number.isNaN(aPpb)) aPpb = -9999999;
      if (Number.isNaN(bPpb)) bPpb = -9999999;
      return bPpb - aPpb;
    });
  }

  private listOfAllTeams() {
    const teams: PoolTeamStats[] = [];
    for (const pool of this.pools) {
      for (const pt of pool.poolTeams) {
        teams.push(pt);
      }
    }
    return teams;
  }

  /** Our best guess of what the final ranks should be */
  private assignFinalTeamRanks() {
    let teamsSoFar = 0;
    for (let tier = 1; ; tier++) {
      const poolsInTier = this.pools.filter((pStats) => pStats.pool.position === tier);
      if (poolsInTier.length === 0) break;

      let teamsInTier = 0;
      for (const pool of poolsInTier) {
        pool.calculateFinalRanks(teamsSoFar + 1, poolsInTier.length);
        teamsInTier += pool.poolTeams.length;
      }
      teamsSoFar += teamsInTier;
    }
  }

  sortTeamsByFinalRank() {
    this.pools.forEach((ps) => ps.sortByFinalRank());
  }

  compileIndividualStats() {
    for (const round of this.phase.rounds) {
      for (const match of round.matches) {
        this.addMatchToIndividualStats(match);
      }
    }
    for (const match of this.carryoverMatches) {
      this.addMatchToIndividualStats(match);
    }
    this.sortPlayersByPptuh();
    this.assignIndividualRanks();
  }

  private addMatchToIndividualStats(match: Match) {
    if (match.statsValidity === StatsValidity.omit) return;

    this.addMatchTeamToIndividualStats(match.leftTeam, match.tossupsRead ?? 0);
    this.addMatchTeamToIndividualStats(match.rightTeam, match.tossupsRead ?? 0);
  }

  private addMatchTeamToIndividualStats(mt: MatchTeam, tossupsRead: number) {
    if (!mt.team) return;
    for (const mp of mt.matchPlayers) {
      let playerStats = this.players.find((pStats) => pStats.player === mp.player);
      if (!playerStats) {
        playerStats = new PlayerStats(mp.player, mt.team, this.scoringRules);
        this.players.push(playerStats);
      }
      playerStats.addMatchPlayer(mp, tossupsRead);
    }
  }

  private sortPlayersByPptuh() {
    this.players.sort((a, b) => {
      const aPptuh = a.getPptuh() ?? -999999;
      const bPptuh = b.getPptuh() ?? -999999;
      if (aPptuh === bPptuh) {
        if (aPptuh > 0) return b.tossupsHeard - a.tossupsHeard;
        return a.tossupsHeard - b.tossupsHeard;
      }
      return bPptuh - aPptuh;
    });
  }

  private assignIndividualRanks() {
    let prevRank = 0;
    let playersSoFar = 0;
    let prevPptuh = 9999999;
    let prevPlayer;
    for (const onePlayer of this.players) {
      playersSoFar++;
      const curPptuh = onePlayer.getPptuh() ?? -999999;
      if (curPptuh === prevPptuh) {
        onePlayer.rank = prevRank.toString();
        onePlayer.rankTie = true;
        if (prevPlayer) prevPlayer.rankTie = true;
      } else {
        onePlayer.rank = playersSoFar.toString();
        prevRank = playersSoFar;
      }
      prevPptuh = curPptuh;
      prevPlayer = onePlayer;
    }
  }
}

export class PoolStats {
  pool: Pool;

  poolTeams: PoolTeamStats[] = [];

  constructor(pool: Pool, rules: ScoringRules) {
    this.pool = pool;
    this.poolTeams = pool.poolTeams.map((pt) => new PoolTeamStats(pt, rules));
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
  rankSortedTeams(startingRank: number = 1) {
    let prevWinPct = 2;
    let teamsSoFar = 0;
    let prevRank = startingRank - 1;
    let prevTeam;
    for (const oneTeam of this.poolTeams) {
      teamsSoFar++;
      oneTeam.rawRank = teamsSoFar;
      const thisWinPct = oneTeam.getWinPct();
      if (thisWinPct === prevWinPct || (Number.isNaN(thisWinPct) && Number.isNaN(prevWinPct))) {
        const tiedRank = `${prevRank.toString()}=`;
        oneTeam.rank = tiedRank;
        if (prevTeam) prevTeam.rank = tiedRank;
      } else {
        oneTeam.rank = teamsSoFar.toString();
        prevRank = teamsSoFar;
      }
      // provisional rebracketing info, assuming for now that teams are correctly ordered
      oneTeam.advanceToTier = this.pool.getTierThatRankAdvancesTo(teamsSoFar);
      oneTeam.currentSeed = this.pool.getSeedForRank(teamsSoFar);
      prevWinPct = thisWinPct;
      prevTeam = oneTeam;
    }

    this.advancementTiersHandleTies();
  }

  /** Assuming teams have been assigned provisional tiers, remove them if we'd actually want to play a tiebreaker to figure this out */
  advancementTiersHandleTies() {
    let prevTeam = this.poolTeams[0];
    for (let i = 1; i < this.poolTeams.length; i++) {
      const oneTeam = this.poolTeams[i];
      if (oneTeam.needsTiebreakerWith(prevTeam)) {
        oneTeam.recordTieForAdvancement = true;
        oneTeam.ppgTieForAdvancement = oneTeam.getPtsPerRegTuh() === prevTeam.getPtsPerRegTuh();
      }
      prevTeam = oneTeam;
    }
    // now do it again going backwards to catch the rest
    prevTeam = this.poolTeams[this.poolTeams.length - 1];
    for (let i = this.poolTeams.length - 2; i >= 0; i--) {
      const oneTeam = this.poolTeams[i];
      if (oneTeam.needsTiebreakerWith(prevTeam)) {
        oneTeam.recordTieForAdvancement = true;
        oneTeam.ppgTieForAdvancement = oneTeam.getPtsPerRegTuh() === prevTeam.getPtsPerRegTuh();
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

  /**
   * Fugure out what we think final ranks should be based on the stats we have
   * @param startingRank highest possible rank in this pool
   * @param step How much to increment the rank by for each subsequent team; this should be the number of parallel pools in this pool's tier
   */
  calculateFinalRanks(startingRank: number, step: number = 1) {
    if (this.poolTeams.length === 0) return;
    let prevTeam = this.poolTeams[0];
    prevTeam.finalRankCalculated = startingRank;
    let teamsSoFar = step;
    for (let i = 1; i < this.poolTeams.length; i++) {
      const oneTeam = this.poolTeams[i];
      if (prevTeam.rank === oneTeam.rank) {
        oneTeam.finalRankCalculated = prevTeam.finalRankCalculated;
      } else {
        oneTeam.finalRankCalculated = startingRank + teamsSoFar;
      }
      prevTeam = oneTeam;
      teamsSoFar += step;
    }
  }

  sortByFinalRank() {
    this.poolTeams.sort((a, b) => {
      const aRank = a.team.getOverallRank() || a.finalRankCalculated || 9999;
      const bRank = b.team.getOverallRank() || b.finalRankCalculated || 9999;
      return aRank - bRank;
    });
  }
}

export interface TeamDetailMatchResult {
  match: Match;
  whichTeam: LeftOrRight;
  round: Round;
  phase?: Phase;
}

export class PoolTeamStats {
  team: Team;

  poolTeam: PoolTeam;

  /** The rank for display in the stat report, which might indclude a tie indicator, like "3=" */
  rank: string = '';

  /** The unique rank within the pool, that doesn't care about ties */
  rawRank: number = 0;

  finalRankCalculated?: number;

  finalRankTie: boolean = false;

  /** Seed team is in right now, for the purposes for rebracketing (not the seed they started with) */
  currentSeed?: number;

  advanceToTier?: number;

  /** Does this team have the same record as another, such that a tiebreaker might be needed (if not using PPG)? */
  recordTieForAdvancement: boolean = false;

  /** Does this team have the same record AND ppg as another, such that the user definitely needs to intervene to break the tie? */
  ppgTieForAdvancement: boolean = false;

  wins: number = 0;

  losses: number = 0;

  ties: number = 0;

  nonForfeitMatches: number = 0;

  /** Including overtime */
  tuhTotal: number = 0;

  /** Not including overtime */
  tuhRegulation: number = 0;

  totalPoints: number = 0;

  /** The number of points, minus points scored on overtime TUs that didn't have bonuses */
  totalPointsForPPG: number = 0;

  tossupCounts: PlayerAnswerCount[] = [];

  bonusesHeard: number = 0;

  bonusPoints: number = 0;

  bounceBackPoints: number = 0;

  bounceBackPartsHeard: number = 0;

  bounceBackPartsConverted: number = 0;

  lightningPoints: number = 0;

  /** Info needed for the Team Detail page */
  matches: TeamDetailMatchResult[] = [];

  scoringRules: ScoringRules;

  constructor(poolTeam: PoolTeam, rules: ScoringRules) {
    this.poolTeam = poolTeam;
    this.team = poolTeam.team;
    this.scoringRules = rules;
  }

  /** A string like "5-2", or "5-2-1" if there are ties */
  getRecord() {
    const wl = `${this.wins}-${this.losses}`;
    if (this.ties === 0) return wl;
    return `${wl}-${this.ties}`;
  }

  getWinPct() {
    const wins = this.wins + this.ties / 2;
    return wins / (this.wins + this.losses + this.ties);
  }

  getWinPctString() {
    const pct = this.getWinPct();
    if (Number.isNaN(pct)) return '-';
    return pct.toFixed(3).toString();
  }

  /** Get the total tossups heard value that we want to use for PPG stats */
  getCorrectTuh() {
    return this.scoringRules.useOvertimeInPPTUH() ? this.tuhTotal : this.tuhRegulation;
  }

  /** Points per non-overtime tossup heard. Is NaN if tossups heard is zero! */
  getPtsPerRegTuh() {
    return this.totalPointsForPPG / this.getCorrectTuh();
  }

  getPtsPerRegTuhString(regTuCount: number) {
    if (this.totalPointsForPPG === 0) return '-';
    return (this.getPtsPerRegTuh() * regTuCount).toFixed(1);
  }

  /** PPB. Is NaN if bonuses heard is zero! */
  getPtsPerBonus() {
    return this.bonusPoints / this.bonusesHeard;
  }

  getPtsPerBonusString() {
    const ppb = this.getPtsPerBonus();
    if (Number.isNaN(ppb)) return '-';
    return ppb.toFixed(2).toString();
  }

  getBouncebackConvPct() {
    if (!this.scoringRules.canCalculateBounceBackPartsHeard()) return Number.NaN;
    return Math.round((100 * this.bounceBackPartsConverted) / this.bounceBackPartsHeard);
  }

  getBouncebackConvPctString() {
    const bbConv = this.getBouncebackConvPct();
    if (Number.isNaN(bbConv)) return '-';
    return `${bbConv}%`;
  }

  getLightningPtsPerMatch() {
    return this.lightningPoints / this.nonForfeitMatches;
  }

  getLightningPtsPerMatchString() {
    const ppm = this.getLightningPtsPerMatch();
    if (Number.isNaN(ppm)) return '-';
    return ppm.toFixed(1).toString();
  }

  /** Do we need a tiebreaker with this team to determine where they advance to? */
  needsTiebreakerWith(other: PoolTeamStats) {
    if (this.rank !== other.rank) return false;
    if (this.advanceToTier === undefined && other.advanceToTier === undefined) return false;
    return this.advanceToTier !== other.advanceToTier || other.recordTieForAdvancement;
  }

  addMatchTeam(match: Match, whichTeam: LeftOrRight, round?: Round, phase?: Phase) {
    if (round) this.matches.push({ match, whichTeam, round, phase });
    this.tuhTotal += match.tossupsRead || 0;
    this.tuhRegulation += (match.tossupsRead || 0) - (match.overtimeTossupsRead || 0);
    const result = match.getResult(whichTeam);
    if (result === 'win') this.wins++;
    else if (result === 'loss') this.losses++;
    else if (result === 'tie') this.ties++;

    if (match.isForfeit()) return;

    this.nonForfeitMatches += 1;
    const matchTeam = match.getMatchTeam(whichTeam);
    this.totalPoints += matchTeam.points || 0;
    this.totalPointsForPPG += matchTeam.getPointsForPPG(this.scoringRules);
    this.bonusPoints += matchTeam.getBonusPoints();
    this.bonusesHeard += matchTeam.getBonusesHeard(this.scoringRules);
    if (this.scoringRules.bonusesBounceBack) {
      this.bounceBackPartsConverted +=
        (matchTeam.bonusBouncebackPoints || 0) / (this.scoringRules.pointsPerBonusPart || 10);
      this.bounceBackPartsHeard += match.getBouncebackPartsHeard(whichTeam, this.scoringRules) || 0;
      this.bounceBackPoints += matchTeam.bonusBouncebackPoints || 0;
    }
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

  /** Add another set of stats to this one */
  addOtherStats(other: PoolTeamStats) {
    this.wins += other.wins;
    this.losses += other.losses;
    this.ties += other.ties;
    this.tuhTotal += other.tuhTotal;
    this.tuhRegulation += other.tuhRegulation;
    this.totalPoints += other.totalPoints;
    this.totalPointsForPPG += other.totalPointsForPPG;
    this.bonusesHeard += other.bonusesHeard;
    this.bonusPoints += other.bonusPoints;
    this.bounceBackPoints += other.bounceBackPoints;
    this.bounceBackPartsHeard += other.bounceBackPartsHeard;
    this.bounceBackPartsConverted += other.bounceBackPartsConverted;
    this.lightningPoints += other.lightningPoints;
    for (const ac of other.tossupCounts) {
      this.addAnswerCount(ac);
    }
  }
}

export interface PlayerDetailMatchResult {
  match: Match;
  whichTeam: LeftOrRight;
  matchPlayer: MatchPlayer;
  round: Round;
  phase: Phase;
}

export class PlayerStats {
  player: Player;

  rank: string = '';

  rankTie: boolean = false;

  team: Team;

  gamesPlayed: number = 0;

  tossupCounts: PlayerAnswerCount[] = [];

  tossupsHeard: number = 0;

  /** Info needed for the player detail page */
  matches: PlayerDetailMatchResult[] = [];

  constructor(p: Player, team: Team, scoringRules: ScoringRules) {
    this.player = p;
    this.team = team;
    this.tossupCounts = scoringRules.answerTypes.map((at) => new PlayerAnswerCount(at, 0));
  }

  getTotalPoints() {
    return sumReduce(this.tossupCounts.map((ac) => ac.points));
  }

  /** Points per tossup heard. Is undefined if no tossups heard! */
  getPptuh() {
    if (this.tossupsHeard === 0) return undefined;
    return this.getTotalPoints() / this.tossupsHeard;
  }

  addMatchPlayer(mp: MatchPlayer, tossupsRead: number) {
    if (mp.tossupsHeard === undefined || mp.tossupsHeard === 0) {
      return;
    }

    this.gamesPlayed += mp.tossupsHeard / tossupsRead;
    this.tossupsHeard += mp.tossupsHeard;
    for (const ac of mp.answerCounts) {
      this.addAnswerCount(ac);
    }
  }

  /* Add info required for making the player detail page */
  addMatchResult(match: Match, whichTeam: LeftOrRight, matchPlayer: MatchPlayer, round: Round, phase: Phase) {
    if (matchPlayer.tossupsHeard === undefined || matchPlayer.tossupsHeard === 0) {
      return;
    }
    this.matches.push({ match, whichTeam, matchPlayer, round, phase });
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

export class RoundStats {
  round: Round;

  phase?: Phase;

  games: number = 0;

  tossupsHeardTotal: number = 0;

  tossupsHeardRegulation: number = 0;

  points: number = 0;

  tossupCounts: PlayerAnswerCount[] = [];

  bonusPoints: number = 0;

  lightningPoints: number = 0;

  /** Number of bonus parts converted by the rebounding team */
  bouncebackPartsConverted: number = 0;

  scoringRules: ScoringRules;

  constructor(round: Round, rules: ScoringRules, phase?: Phase) {
    this.round = round;
    this.scoringRules = rules;
    this.phase = phase;
  }

  getBonusesHeard() {
    return sumReduce(this.tossupCounts.map((ac) => (ac.answerType.value > 0 ? ac.number || 0 : 0)));
  }

  getBonusPartsHeard() {
    if (!this.scoringRules.bonusesAreRegular()) return Number.NaN;
    return this.getBonusesHeard() * this.scoringRules.maximumPartsPerBonus;
  }

  /** Number of bonus parts converted by the controlling team */
  getBonusPartsConvControlling() {
    if (!this.scoringRules.bonusesAreRegular()) return Number.NaN;
    return this.bonusPoints / (this.scoringRules.pointsPerBonusPart ?? 10);
  }

  getBouncebackPartsHeard() {
    if (!this.scoringRules.bonusesAreRegular()) return Number.NaN;
    return this.getBonusPartsHeard() - this.getBonusPartsConvControlling();
  }

  getPointsPerXTuh() {
    const tuh = this.scoringRules.useOvertimeInPPTUH() ? this.tossupsHeardTotal : this.tossupsHeardRegulation;
    return (this.scoringRules.regulationTossupCount * this.points) / tuh / 2;
  }

  getPowerPct() {
    const totalPowers = sumReduce(this.tossupCounts.map((ac) => (ac.answerType.isPower ? ac.number ?? 0 : 0)));
    return (100 * totalPowers) / this.tossupsHeardTotal;
  }

  getTossupConversionPct() {
    const totalTus = sumReduce(this.tossupCounts.map((ac) => (ac.answerType.value > 0 ? ac.number ?? 0 : 0)));
    return (100 * totalTus) / this.tossupsHeardTotal;
  }

  getNegsPerXTuh() {
    const totalNegs = sumReduce(this.tossupCounts.map((ac) => (ac.answerType.isNeg ? ac.number ?? 0 : 0)));
    const tuh = this.scoringRules.useOvertimeInPPTUH() ? this.tossupsHeardTotal : this.tossupsHeardRegulation;
    return (this.scoringRules.regulationTossupCount * totalNegs) / tuh / 2;
  }

  getPointsPerBonus() {
    return this.bonusPoints / this.getBonusesHeard();
  }

  getBounceBackConvPct() {
    return (100 * this.bouncebackPartsConverted) / this.getBouncebackPartsHeard();
  }

  getTotalBonusConvPct() {
    return (100 * (this.getBonusPartsConvControlling() + this.bouncebackPartsConverted)) / this.getBonusPartsHeard();
  }

  getLightningPointsPerTeamPerMatch() {
    return this.lightningPoints / this.games / 2;
  }

  addMatch(match: Match) {
    if (match.isForfeit()) return;

    this.games++;
    this.tossupsHeardTotal += match.tossupsRead ?? 0;
    this.tossupsHeardRegulation +=
      match.tossupsRead === undefined ? 0 : match.tossupsRead - (match.overtimeTossupsRead ?? 0);

    this.points += match.leftTeam.points ?? 0;
    this.points += match.rightTeam.points ?? 0;
    this.lightningPoints += match.leftTeam.lightningPoints ?? 0;
    this.lightningPoints += match.rightTeam.lightningPoints ?? 0;
    this.addMatchAnswerCounts(match);
    this.bonusPoints += match.leftTeam.getBonusPoints();
    this.bonusPoints += match.rightTeam.getBonusPoints();

    if (this.scoringRules.bonusesAreRegular()) {
      this.bouncebackPartsConverted +=
        (match.leftTeam.bonusBouncebackPoints ?? 0) / (this.scoringRules.pointsPerBonusPart ?? 0);
      this.bouncebackPartsConverted +=
        (match.rightTeam.bonusBouncebackPoints ?? 0) / (this.scoringRules.pointsPerBonusPart ?? 0);
    }
  }

  private addMatchAnswerCounts(match: Match) {
    for (const matchTeam of [match.leftTeam, match.rightTeam]) {
      for (const matchPlayer of matchTeam.matchPlayers) {
        for (const answerCount of matchPlayer.answerCounts) {
          if (answerCount.number !== undefined) {
            this.addAnswerCount(answerCount);
          }
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
