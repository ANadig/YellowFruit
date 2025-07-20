import { sumReduce } from '../Utils/GeneralUtils';
import { LeftOrRight } from '../Utils/UtilTypes';
import AnswerType from './AnswerType';
import { Match } from './Match';
import { MatchPlayer } from './MatchPlayer';
import { MatchTeam } from './MatchTeam';
import { Phase } from './Phase';
import { Player } from './Player';
import { Pool } from './Pool';
import { Round } from './Round';
import { Team } from './Team';
import Tournament from './Tournament';

export default class SqbsGenerator {
  tournament: Tournament;

  /** Which phases we're exporting */
  phases: Phase[] = [];

  /** Which phases we aren't exporting entirely, but might have games that carry over to phases that we are exporting  */
  carryoverSearchPhases: Phase[] = [];

  /** The list of teams in the exported file, in the exact order they're listed in the file */
  teamList: Team[] = [];

  /** The list of divisions in the exported file, in the exact order they're listed in the file */
  poolList: Pool[] = [];

  /** The list of tossup answer types in the exported file, in the exact order they're listed in the file */
  answerTypeList: AnswerType[] = [];

  /** The list of matches being exported */
  matchListByRound: { round: Round; matches: Match[] }[] = [];

  /** The contents of the file to write */
  fileOutput: string = '';

  /** Error message to show when it isn't possible to export the data */
  errorMessage: string = '';

  constructor(tourn: Tournament) {
    this.tournament = tourn;
  }

  generateFile(phases?: Phase[]) {
    this.fileOutput = '';
    this.errorMessage = '';
    this.phases = phases ?? this.tournament.phases;
    this.buildCarryoverSearchPhaseList();
    this.buildAnswerTypeList();
    this.buildPoolList();
    this.buildTeamList();
    this.buildMatchList();
    this.validateExportability();
    if (this.errorMessage !== '') return;

    this.addTeamList();
    this.addGameList();
    this.addMiscellaneousSettings();
    this.addDivisions();
    this.addTossupPointValues();
    this.addPackets();
    this.addExhibitionStatuses();
  }

  private validateExportability() {
    if (this.tournament.scoringRules.answerTypes.length > 4) {
      this.errorMessage = "SQBS doesn't support formats with more than 4 tossup point values";
      return;
    }
    for (const ph of this.phases) {
      for (const rd of ph.rounds) {
        for (const m of rd.matches) {
          if (matchTeamCantBeExported(m.leftTeam)) {
            this.errorMessage = "SQBS doesn't support matches that involve more than 8 players on one team";
            return;
          }
          if (matchTeamCantBeExported(m.rightTeam)) {
            this.errorMessage = "SQBS doesn't support matches that involve more than 8 players on one team";
            return;
          }
        }
      }
    }
  }

  /** Figure out which phases have games that carry over into the phases we're actually exporting */
  private buildCarryoverSearchPhaseList() {
    this.carryoverSearchPhases = [];
    for (const ph of this.tournament.phases) {
      if (!ph.isFullPhase() || this.phases.includes(ph)) {
        continue;
      }
      if (this.phaseIsPriorToAnExportedPhaseWithCarryover(ph)) {
        this.carryoverSearchPhases.push(ph);
      }
    }
  }

  private phaseIsPriorToAnExportedPhaseWithCarryover(phase: Phase) {
    const phasePos = this.tournament.phases.indexOf(phase);
    for (const otherPhase of this.phases) {
      if (!otherPhase.hasAnyCarryover()) continue;

      const otherPhasePos = this.tournament.phases.indexOf(otherPhase);
      if (phasePos < otherPhasePos) return true;
    }
    return false;
  }

  private buildTeamList() {
    this.teamList = [];
    for (const reg of this.tournament.registrations) {
      this.teamList = this.teamList.concat(reg.teams);
    }
  }

  private buildPoolList() {
    this.poolList = [];
    if (this.useDivisions()) {
      this.poolList = this.phases[0].pools.slice();
    }
  }

  private buildAnswerTypeList() {
    this.answerTypeList = [];
    for (const aType of this.tournament.scoringRules.answerTypes) {
      // SQBS doesn't support 0-point buzzes
      if (aType.value !== 0) this.answerTypeList.push(aType);
    }
  }

  buildMatchList() {
    this.matchListByRound = [];
    for (const ph of this.phases) {
      for (const rd of ph.rounds) {
        this.matchListByRound.push({ round: rd, matches: rd.matches });
      }
      /** Add the matches that carry over into this phase */
      for (const coPhase of this.carryoverSearchPhases) {
        for (const rd of coPhase.rounds) {
          const matchListThisRound = { round: rd, matches: [] as Match[] };
          for (const m of rd.matches) {
            if (m.carryoverPhases.includes(ph)) {
              matchListThisRound.matches.push(m);
            }
          }
          if (matchListThisRound.matches.length > 0) {
            this.matchListByRound.push(matchListThisRound);
          }
        }
      }
    }
  }

  /** The first part of the file, which defines teams and rosters */
  private addTeamList() {
    this.addLine(this.teamList.length);
    for (const tm of this.teamList) {
      const numPlayers = tm.players.length;
      this.addLine(numPlayers + 1);
      this.addLine(tm.name);
      for (const pl of tm.players) {
        let playerName = pl.name;
        if (pl.yearString !== '' && this.tournament.trackPlayerYear) playerName += ` (${pl.yearString})`;
        this.addLine(playerName);
      }
    }
  }

  private addGameList() {
    this.addLine(this.getTotalNumberOfGames());
    for (const obj of this.matchListByRound) {
      for (const m of obj.matches) {
        this.addOneMatch(m, obj.round);
      }
    }
  }

  private addMiscellaneousSettings() {
    this.addLine(this.tournament.scoringRules.useBonuses ? 1 : 0); // bonus conversion tracking
    this.addLine(this.tournament.scoringRules.bonusesBounceBack ? 3 : 1); // bonus conversion tracking (line 2)
    this.addLine(this.tournament.scoringRules.hasPowers() || this.tournament.scoringRules.hasNegs() ? 3 : 2); // whether to show power and neg stats
    this.addLine(this.tournament.scoringRules.lightningCountPerTeam > 0 ? 1 : 0); // whether lightning rounds exist

    this.addLine(1); // track tossups heard
    this.addLine(3); // needs to be 3 to allow packet names, apparently? This differs from QBWiki
    this.addLine(254); // turn on all validation warnings
    this.addLine(1); // enable round report
    this.addLine(1); // enable team standings report
    this.addLine(1); // enable individuals report
    this.addLine(1); // enable scoreboard report
    this.addLine(1); // enable team detail report
    this.addLine(1); // enable individual detail report
    this.addLine(1); // enable stat key
    this.addLine(0); // no custom stylesheet
    this.addLine(this.useDivisions() ? 1 : 0); // use divisions?
    this.addLine(1); // sort by record, then ppg

    this.addLine(this.tournament.name);
    this.addBlankLines(4); // FTP configuration. leave blank
    this.addLine(1); // weird FTP setting. This is the default

    // file suffixes
    this.addLine('_rounds.html');
    this.addLine('_standings.html');
    this.addLine('_individuals.html');
    this.addLine('_games.html');
    this.addLine('_teamdetail.html');
    this.addLine('_playerdetail.html');
    this.addLine('_statkey.html');

    this.addBlankLines(1); // style sheet file. Leave blank
  }

  private addDivisions() {
    // special case- no divisions, every team "assigned" to division "-1"
    if (!this.useDivisions()) {
      this.addLine(0);
      this.addLine(this.teamList.length);
      for (let i = 0; i < this.teamList.length; i++) {
        this.addLine(-1);
      }
      return;
    }
    // number of divisions
    this.addLine(this.phases[0].pools.length);
    // define division names
    for (const p of this.phases[0].pools) {
      this.addLine(p.name);
    }
    // number of teams
    this.addLine(this.teamList.length);
    // which teams are in which divisions
    for (let i = 0; i < this.teamList.length; i++) {
      const pool = this.phases[0].findPoolWithTeam(this.teamList[i]);
      const divId = pool ? this.sqbsDivisionId(pool) : -1;
      this.addLine(divId);
    }
  }

  /** Define which amounts of points you can score on tossups */
  private addTossupPointValues() {
    for (let i = 0; i < 4; i++) {
      const answerType = this.answerTypeList[i];
      this.addLine(answerType?.value ?? 0);
    }
  }

  private addPackets() {
    this.addLine(this.getNumPackets());
    for (const ph of this.phases) {
      for (const rd of ph.rounds) {
        this.addLine(rd.packet.name);
      }
    }
  }

  /** Define all teams as not being exhibition teams */
  private addExhibitionStatuses() {
    this.addLine(this.teamList.length);
    for (let i = 0; i < this.teamList.length; i++) {
      this.addLine(0);
    }
  }

  private addOneMatch(match: Match, round: Round) {
    if (match.leftTeam.forfeitLoss && match.rightTeam.forfeitLoss) {
      return; // SQBS doesn't support double forfeits
    }
    const rules = this.tournament.scoringRules;
    // Left (first) team is always the winner of a forfeit in SQBS
    const leftTeamWhich: LeftOrRight = match.leftTeam.forfeitLoss ? 'right' : 'left';
    const rightTeamWhich: LeftOrRight = leftTeamWhich === 'left' ? 'right' : 'left';
    const leftMatchTeam = match.getMatchTeam(leftTeamWhich);
    const rightMatchTeam = match.getMatchTeam(rightTeamWhich);
    if (!leftMatchTeam.team || !rightMatchTeam.team) return;

    const isForfeit = match.isForfeit();
    const leftTotalScore = isForfeit ? -1 : leftMatchTeam.points ?? 0;
    const rightTotalScore = isForfeit ? -1 : rightMatchTeam.points ?? 0;
    const tossupsHeard = isForfeit ? 0 : match.tossupsRead ?? 0;

    const leftMatchPlayers = leftMatchTeam.matchPlayers.filter((mp) => (mp.tossupsHeard ?? 0) > 0);
    const rightMatchPlayers = rightMatchTeam.matchPlayers.filter((mp) => (mp.tossupsHeard ?? 0) > 0);

    this.addLine(match.id);
    this.addLine(this.sqbsTeamId(leftMatchTeam.team));
    this.addLine(this.sqbsTeamId(rightMatchTeam.team));
    this.addLine(leftTotalScore);
    this.addLine(rightTotalScore);
    this.addLine(tossupsHeard);
    this.addLine(round.number);
    // bonuses
    if (rules.useBonuses && !rules.bonusesBounceBack) {
      this.addLine(leftMatchTeam.getBonusesHeard(rules));
      this.addLine(leftMatchTeam.getBonusPoints());
      this.addLine(rightMatchTeam.getBonusesHeard(rules));
      this.addLine(rightMatchTeam.getBonusPoints());
    } else if (rules.bonusesBounceBack) {
      this.addBonusesHeardLineForBouncebackFormat(leftMatchTeam, match.getBouncebackPartsHeard(leftTeamWhich, rules));
      this.addBonusPtsLineForBouncebackFormat(leftMatchTeam);
      this.addBonusesHeardLineForBouncebackFormat(rightMatchTeam, match.getBouncebackPartsHeard(rightTeamWhich, rules));
      this.addBonusPtsLineForBouncebackFormat(rightMatchTeam);
    } else {
      this.addLine(0); // placeholder lines for tossup-only formats
      this.addLine(0);
      this.addLine(0);
      this.addLine(0);
    }
    // overtime
    this.addLine(match.overtimeTossupsRead ?? 0);
    this.addLine(this.getOvertimeTossupsConverted(leftMatchTeam));
    this.addLine(this.getOvertimeTossupsConverted(rightMatchTeam));

    this.addLine(isForfeit ? 1 : 0);
    this.addLine(leftMatchTeam.lightningPoints ?? 0);
    this.addLine(rightMatchTeam.lightningPoints ?? 0);
    // players
    for (let i = 0; i < 8; i++) {
      this.addOneMatchPlayer(leftMatchPlayers, i, match, leftMatchTeam);
      this.addOneMatchPlayer(rightMatchPlayers, i, match, rightMatchTeam);
    }
  }

  private addOneMatchPlayer(matchPlayers: MatchPlayer[], idx: number, match: Match, matchTeam: MatchTeam) {
    const matchPlayer = matchPlayers[idx];
    if (matchPlayer === undefined || !matchTeam.team) {
      this.addEmptyMatchPlayerSpot();
      return;
    }

    this.addLine(sqbsPlayerId(matchPlayer.player, matchTeam.team));
    this.addLine(((matchPlayer.tossupsHeard ?? 0) / (match.tossupsRead ?? 0)).toFixed(2)); // games played
    for (let i = 0; i < 4; i++) {
      const answerType = this.answerTypeList[i];
      if (answerType === undefined) {
        this.addLine(0);
      } else {
        this.addLine(matchPlayer.answerCounts.find((ac) => ac.answerType.value === answerType.value)?.number ?? 0);
      }
    }
    this.addLine(matchPlayer.points);
  }

  private addEmptyMatchPlayerSpot() {
    this.addLine(-1);
    this.addLine(0);

    this.addLine(0);
    this.addLine(0);
    this.addLine(0);
    this.addLine(0);

    this.addLine(0);
  }

  /** A line of the file with bonus and bouncebacks heard info in SQBS's weird format */
  private addBonusesHeardLineForBouncebackFormat(matchTeam: MatchTeam, bouncebacksHeard: number) {
    this.addLine(10000 * bouncebacksHeard + matchTeam.getBonusesHeard(this.tournament.scoringRules));
  }

  /** A line of the file with bonus and bouncebacks points info in SQBS's weird format */
  private addBonusPtsLineForBouncebackFormat(matchTeam: MatchTeam) {
    this.addLine(10000 * (matchTeam.bonusBouncebackPoints ?? 0) + matchTeam.getBonusPoints());
  }

  /** In SQBS, only count overtime tossups if overtime doesn't use bonuses */
  private getOvertimeTossupsConverted(matchTeam: MatchTeam) {
    if (this.tournament.scoringRules.overtimeIncludesBonuses || !this.tournament.scoringRules.useBonuses) {
      return 0;
    }
    return matchTeam.getCorrectTossupsWithoutBonuses();
  }

  private useDivisions() {
    return this.phases.length === 1 && this.phases[0].pools.length > 1;
  }

  /** The number of packets we're defining. This is equal to the number of rounds we're exporting */
  private getNumPackets() {
    return sumReduce(this.phases.map((ph) => ph.rounds.length));
  }

  private getTotalNumberOfGames() {
    return sumReduce(this.matchListByRound.map((obj) => obj.matches.length));
  }

  /** The ID used in the file to identify a team in a match */
  private sqbsTeamId(team: Team) {
    return this.teamList.indexOf(team);
  }

  private sqbsDivisionId(pool: Pool) {
    return this.poolList.indexOf(pool);
  }

  private addBlankLines(num: number) {
    for (let i = 0; i < num; i++) {
      this.addLine('');
    }
  }

  private addLine(newLine: string | number) {
    if (this.fileOutput === '') this.fileOutput = newLine.toString();
    else this.fileOutput += `\n${newLine}`;
  }
}

/** SQBS can't store matches where more than 8 players on one team heard tossups */
function matchTeamCantBeExported(matchTeam: MatchTeam) {
  return matchTeam.matchPlayers.filter((mp) => (mp.tossupsHeard ?? 0) > 0).length > 8;
}

/** The ID used in the file to identify a player in a match */
function sqbsPlayerId(player: Player, team: Team) {
  return team.players.indexOf(player);
}
