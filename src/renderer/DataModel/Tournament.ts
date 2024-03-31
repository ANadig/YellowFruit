import { sumReduce } from '../Utils/GeneralUtils';
// eslint-disable-next-line import/no-cycle
import { NullDate, NullObjects } from '../Utils/UtilTypes';
// eslint-disable-next-line import/no-cycle
import HtmlReportGenerator from './HTMLReports';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { Match } from './Match';
import { IQbjPhase, Phase, PhaseTypes } from './Phase';
import { Player } from './Player';
import { Pool } from './Pool';
import { QbjAudience, QbjContent, QbjLevel, QbjTypeNames } from './QbjEnums';
import { IQbjRanking, Ranking } from './Ranking';
import Registration, { IQbjRegistration } from './Registration';
import { Round } from './Round';
import { CommonRuleSets, IQbjScoringRules, ScoringRules } from './ScoringRules';
import StandardSchedule from './StandardSchedule';
import { PhaseStandings } from './StatSummaries';
import { Team } from './Team';
import { IQbjTournamentSite, TournamentSite } from './TournamentSite';

/**
 * Represents the data for a tournament.
 * Corresponds to the Tournament schema object
 * https://schema.quizbowl.technology/tournament
 */
export interface IQbjTournament extends IQbjObject {
  type?: QbjTypeNames.Tournament;
  /** Free-text name of the tournament */
  name: string;
  /** An abbreviated version of the tournament's name */
  short_name?: string;
  /** Where the tournament happened */
  tournamentSite?: IQbjTournamentSite;
  /** Validation rules for scoring matches in this tournament */
  scoringRules?: IQbjScoringRules;
  /** Tournament's start date. We assume ISO 8601, though the schema doesn't specify. */
  startDate?: Date;
  /** Tournament's end date */
  endDate?: Date;
  /** The schools/organizations at this tournament */
  registrations?: IQbjRegistration[];
  /** Phases (prelims, playoffs, etc) of the tournament */
  phases?: IQbjPhase[];
  /** Ranking systems used at the tournament (overall, JV, etc) */
  rankings?: IQbjRanking[];
  /** Audience / level of the tournament */
  audience?: QbjAudience;
  /** Level of the tournament, within a given Audience */
  level?: QbjLevel;
  /** Name of the question set used */
  questionSet?: string;
  /** The subject matter of the tournament question set */
  content?: QbjContent;
  /** Other notes about the tournament */
  info?: string;
}

/** Tournament object as written to a .yft file */
export interface IYftFileTournament extends IQbjTournament, IYftFileObject {
  YfData: ITournamentExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface ITournamentExtraData {
  /** Version of this software used to write the file */
  YfVersion: string;
  seeds: IQbjRefPointer[];
  trackPlayerYear: boolean;
  trackSmallSchool: boolean;
  trackJV: boolean;
  trackUG: boolean;
  trackDiv2: boolean;
}

/** YellowFruit implementation of the Tournament object */
class Tournament implements IQbjTournament, IYftDataModelObject {
  name: string = '';

  /** QB schema requires a name, so use this when needed */
  static readonly placeholderName = 'unnamed tournament';

  tournamentSite: TournamentSite;

  scoringRules: ScoringRules;

  startDate: Date = NullObjects.nullDate;

  registrations: Registration[] = [];

  /** Phases (prelims, playoffs, etc) of the tournament. In YellowFruit, these must always be in chronological order! */
  phases: Phase[] = [];

  rankings: Ranking[] = [];

  questionSet: string = '';

  /** The list of teams ordered by their initial seed. This should NOT be the source of truth for what teams exist in general. */
  seeds: Team[] = [];

  trackPlayerYear: boolean = true;

  trackSmallSchool: boolean = false;

  trackJV: boolean = false;

  trackUG: boolean = false;

  trackDiv2: boolean = false;

  stats: PhaseStandings[] = [];

  hasMatchData: boolean = false;

  htmlGenerator: HtmlReportGenerator;

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
    this.tournamentSite = new TournamentSite();
    this.scoringRules = new ScoringRules(CommonRuleSets.NaqtUntimed);
    this.htmlGenerator = new HtmlReportGenerator(this);
  }

  toFileObject(qbjOnly = false, isTopLevel = true, isReferenced = false): IQbjTournament {
    const qbjObject: IQbjTournament = {
      name: this.name || Tournament.placeholderName,
      startDate: !NullDate.isNullDate(this.startDate) ? this.startDate : undefined,
      questionSet: this.questionSet || undefined,
      registrations: this.registrations.map((reg) => reg.toFileObject(qbjOnly)),
      phases: this.phases.map((ph) => ph.toFileObject(qbjOnly, false, true)),
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Tournament;
    if (isReferenced) qbjObject.id = 'Tournament';

    if (this.tournamentSite.name) qbjObject.tournamentSite = this.tournamentSite.toFileObject(qbjOnly);
    if (this.scoringRules) qbjObject.scoringRules = this.scoringRules.toFileObject(qbjOnly);

    if (qbjOnly) return qbjObject;

    const metadata: ITournamentExtraData = {
      YfVersion: '4.0.0',
      seeds: this.seeds.map((team) => team.toRefPointer()),
      trackPlayerYear: this.trackPlayerYear,
      trackSmallSchool: this.trackSmallSchool,
      trackJV: this.trackJV,
      trackUG: this.trackUG,
      trackDiv2: this.trackDiv2,
    };
    const yftFileObj = { YfData: metadata, ...qbjObject };

    return yftFileObj;
  }

  compileStats() {
    this.stats = [];
    this.phases.forEach((p) => {
      if (p.isFullPhase()) {
        this.stats.push(new PhaseStandings(p, this.getCarryoverMatches(p), this.scoringRules));
      }
    });
    this.stats.forEach((phaseSt) => phaseSt.compileStats());
  }

  makeHtmlStandings() {
    return this.htmlGenerator.generateStandingsPage();
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules = new ScoringRules(rules);
  }

  /** The total number of teams that currently exist. */
  getNumberOfTeams() {
    const regSizes: number[] = this.registrations.map((reg) => reg.teams.length);
    return sumReduce(regSizes);
  }

  getListOfAllTeams(): Team[] {
    const teamLists = this.registrations.map((reg) => reg.teams);
    return teamLists.flat();
  }

  findTeamByName(name: string) {
    for (const reg of this.registrations) {
      const matchingTeam = reg.teams.find((tm) => tm.name === name);
      if (matchingTeam) return matchingTeam;
    }
    return undefined;
  }

  findRegistrationByTeam(searchTeam: Team) {
    for (const reg of this.registrations) {
      const matchingTeam = reg.teams.find((tm) => tm === searchTeam);
      if (matchingTeam) return reg;
    }
    return undefined;
  }

  /** How many teams there's room for based on the pools that exist.
   *  We assume all teams play in the prelim phase.
   *  Returns null if there isn't enough information to calculate.
   */
  getExpectedNumberOfTeams(): number | null {
    const prelimPhase = this.getPrelimPhase();
    if (!prelimPhase) return null;

    const poolSizes = prelimPhase.pools.map((pool) => pool.size);
    return sumReduce(poolSizes);
  }

  /** Which phase is the prelim phase? */
  getPrelimPhase(): Phase | undefined {
    return this.phases.find((phase) => phase.phaseType === PhaseTypes.Prelim);
  }

  /** Get the prelim or playoff phase that preceded this one */
  getPrevFullPhase(phase: Phase): Phase | undefined {
    let idx = this.phases.indexOf(phase) - 1;
    while (idx >= -1 && !this.phases[idx]?.isFullPhase()) {
      idx--;
    }
    if (idx === -1) return undefined;
    return this.phases[idx];
  }

  /** Get that playoff phase that the given phase feeds into */
  getNextFullPhase(phase: Phase): Phase | undefined {
    const idx = this.phases.indexOf(phase);
    if (idx === -1) return undefined;

    let searchIdx = idx + 1;
    while (searchIdx < this.phases.length && this.phases[searchIdx].phaseType !== PhaseTypes.Playoff) {
      searchIdx++;
    }
    return this.phases[searchIdx];
  }

  whichPhaseIsRoundIn(round: Round): Phase | undefined {
    return this.phases.find((phase) => phase.includesRound(round));
  }

  whichPhaseIsRoundNumberIn(roundNo: number): Phase | undefined {
    return this.phases.find((phase) => phase.includesRoundNumber(roundNo));
  }

  getPlayoffPhases() {
    return this.phases.filter((ph) => ph.phaseType === PhaseTypes.Playoff);
  }

  /** "Real" phases with pool play, as oppsed to tiebreakers or finals */
  getFullPhases() {
    return this.phases.filter((ph) => ph.isFullPhase());
  }

  findPhaseByName(str: string) {
    return this.phases.find((ph) => ph.name === str);
  }

  addTiebreakerAfter(phase: Phase) {
    const idx = this.phases.indexOf(phase);
    if (idx === -1) return;

    const lastRd = phase.lastRoundNumber();
    const tbPhase = new Phase(
      PhaseTypes.Tiebreaker,
      lastRd + 0.5,
      lastRd + 0.5,
      1,
      `${phase.code}T`,
      `${phase.name} Tiebreakers`,
    );
    this.phases.splice(idx + 1, 0, tbPhase);
  }

  /** Is there a tiebreaker phase immediately after this phase? */
  hasTiebreakerAfter(phase: Phase) {
    return !!this.getTiebreakerPhaseFor(phase);
  }

  getTiebreakerPhaseFor(fullPhase: Phase) {
    const idx = this.phases.indexOf(fullPhase);
    if (idx === -1 || idx === this.phases.length - 1) return undefined;

    const nextPhase = this.phases[idx + 1];
    if (nextPhase.phaseType === PhaseTypes.Tiebreaker) return nextPhase;
    return undefined;
  }

  deletePhase(phase: Phase) {
    const idx = this.phases.indexOf(phase);
    if (idx === -1) return;
    this.phases.splice(idx, 1);
  }

  forcePhaseToBeNumeric(tbOrFinalsPhase: Phase) {
    if (tbOrFinalsPhase.usesNumericRounds()) return;

    const lastRoundNo = this.getPrevFullPhase(tbOrFinalsPhase)?.lastRoundNumber();
    if (!lastRoundNo) return;
    tbOrFinalsPhase.forceNumericRounds = true;
    this.reassignRoundNumbers(tbOrFinalsPhase);
  }

  undoForcePhaseToBeNumeric(tbOrFinalsPhase: Phase) {
    if (tbOrFinalsPhase.isFullPhase()) return;
    tbOrFinalsPhase.forceNumericRounds = false;
    this.reassignRoundNumbers(tbOrFinalsPhase);
    tbOrFinalsPhase.reassignRoundNumbers(tbOrFinalsPhase.rounds[0].number + 0.5); // for consistency, put back our fractional pseudo round number
  }

  /** Find the last round of the given phase, and line up the round numbers in subsequent phases based on that */
  reassignRoundNumbers(startingWithPhase: Phase) {
    const prevPhase = this.getPrevFullPhase(startingWithPhase);
    if (!prevPhase) return;

    let lastRoundNo = prevPhase.lastRoundNumber();
    const startIdx = this.phases.indexOf(prevPhase) + 1;
    if (startIdx < 1) return;
    for (let i = startIdx; i < this.phases.length; i++) {
      if (this.phases[i].usesNumericRounds()) {
        this.phases[i].reassignRoundNumbers(lastRoundNo + 1);
        lastRoundNo = this.phases[i].lastRoundNumber();
      }
    }
  }

  findPoolWithTeam(team: Team, round: Round): Pool | undefined {
    const phase = this.whichPhaseIsRoundIn(round);
    if (!phase) return undefined;
    return phase.findPoolWithTeam(team);
  }

  /** Add a new registration, and a team that should be contained in that registration */
  addRegAndTeam(regToAdd: Registration, teamToAdd: Team) {
    regToAdd.teams = [teamToAdd];
    this.addRegistration(regToAdd);
    this.seedAndAssignNewTeam(teamToAdd);
  }

  addRegistration(regToAdd: Registration) {
    this.registrations.push(regToAdd);
    this.sortRegistrations();
  }

  sortRegistrations() {
    this.registrations.sort((a, b) => a.name.localeCompare(b.name));
  }

  findRegistration(name: string) {
    return this.registrations.find((reg) => reg.name === name);
  }

  deleteRegistration(regToDelete: Registration) {
    if (regToDelete === null) return;
    this.registrations = this.registrations.filter((reg) => reg !== regToDelete);
  }

  deleteTeam(reg: Registration, team: Team) {
    this.deleteTeamFromSeeds(team);
    reg.deleteTeam(team);
    if (reg.teams.length === 0) {
      this.deleteRegistration(reg);
    }
  }

  /** Give a new team a seed and assign them to the appropriate prelim pool. Returns the seed number. */
  seedAndAssignNewTeam(newTeam: Team) {
    const seedNo = this.seeds.push(newTeam);
    const prelimPhase = this.getPrelimPhase();
    if (prelimPhase) {
      prelimPhase.addSeededTeam(newTeam, seedNo);
    }
  }

  deleteTeamFromSeeds(deletedTeam: Team) {
    this.seeds = this.seeds.filter((tm) => tm !== deletedTeam);
    const prelimPhase = this.getPrelimPhase();
    if (prelimPhase) prelimPhase.removeTeam(deletedTeam);
    this.distributeSeeds();
  }

  /** Add all teams in a registration to the list of seeds, if they aren't already there */
  seedTeamsInRegistration(reg: Registration) {
    for (const tm of reg.teams) {
      if (!this.seeds.includes(tm)) this.seedAndAssignNewTeam(tm);
    }
  }

  /** Swap the team at the given seed with the team above it.
   *  @param seedNo 1-indexed seed number
   */
  shiftSeedUp(seedNo: number) {
    if (seedNo < 2) return;
    const idx = seedNo - 1;
    const teamToMoveUp = this.seeds[idx];
    this.seeds[idx] = this.seeds[idx - 1];
    this.seeds[idx - 1] = teamToMoveUp;
    this.distributeSeeds();
  }

  /**
   * Swap the team at the given seed with the team below it.
   * @param seedNo 1-indexed seed number
   */
  shiftSeedDown(seedNo: number) {
    const idx = seedNo - 1;
    const teamToMoveDown = this.seeds[idx];
    this.seeds[idx] = this.seeds[idx + 1];
    this.seeds[idx + 1] = teamToMoveDown;
    this.distributeSeeds();
  }

  /**
   * Move the given seed to a new position, shifting other teams as needed.
   * @param seedToMove 1-indexed seed that we are moving somewhere else
   * @param newPosition 1-indexed seed where that team should now be
   */
  insertSeedAtPosition(seedToMove: number, newPosition: number) {
    if (seedToMove === newPosition) return;
    const idxToMove = seedToMove - 1;
    const newIdx = newPosition - 1;

    const [teamToMove] = this.seeds.splice(idxToMove, 1);
    this.seeds.splice(newIdx, 0, teamToMove);
    this.distributeSeeds();
  }

  swapSeeds(seedA: number, seedB: number) {
    if (seedA === seedB) return;
    const seedBTeam = this.seeds[seedB - 1];
    this.seeds[seedB - 1] = this.seeds[seedA - 1];
    this.seeds[seedA - 1] = seedBTeam;
    this.distributeSeeds();
  }

  findTeamById(id: string): Team | undefined {
    for (const reg of this.registrations) {
      for (const tm of reg.teams) {
        if (tm.id === id) return tm;
      }
    }
    return undefined;
  }

  teamHasPlayedAnyMatch(team: Team) {
    for (const ph of this.phases) {
      if (ph.teamHasPlayedAnyMatches(team)) return true;
    }
    return false;
  }

  /** Determine whether any matches have been entered */
  calcHasMatchData() {
    this.hasMatchData = this.getPrelimPhase()?.anyMatchesExist() || false;
  }

  /** Which players on this team have played, ever? */
  getPlayersWithData(team: Team) {
    const players: Player[] = [];
    for (const ph of this.phases) {
      const inThisRound = ph.getPlayersWithData(team);
      inThisRound.forEach((player) => {
        if (!players.includes(player)) players.push(player);
      });
    }
    return players;
  }

  setStandardSchedule(sched: StandardSchedule) {
    this.phases = sched.phases;
    this.distributeSeeds();
  }

  /** Take the list of seeds and populate prelim pools with them */
  distributeSeeds() {
    this.getPrelimPhase()?.setTeamList(this.seeds);
  }

  addMatch(match: Match, round: Round) {
    const phase = this.whichPhaseIsRoundIn(round);
    if (!phase) return;

    round.addMatch(match);
  }

  findMatchBetweenTeams(team1: Team, team2: Team, phase: Phase) {
    const matchInThisPhase = phase.findMatchBetweenTeams(team1, team2);
    if (matchInThisPhase) return matchInThisPhase;

    if (!phase.shouldLookForCarryover(team1, team2)) return undefined;

    const fullPhases = this.getFullPhases();
    for (let phaseIdx = fullPhases.indexOf(phase) - 1; phaseIdx >= 0; phaseIdx--) {
      const pastPhase = fullPhases[phaseIdx];

      const matchInPastPhase = pastPhase.findMatchBetweenTeams(team1, team2, phase);
      if (matchInPastPhase) return matchInPastPhase;

      // No need to go further back
      // (I'm not aware of any formats where phase A carries over to phase C but phase B doesn't)
      if (!pastPhase.hasAnyCarryover()) break;
    }

    return undefined;
  }

  /** Carry over matches from previous phases to this one */
  carryOverMatches(nextPhase: Phase, teams: Team[]) {
    if (!nextPhase.hasAnyCarryover()) return;

    const fullPhases = this.getFullPhases();
    for (let phaseIdx = fullPhases.indexOf(nextPhase) - 1; phaseIdx >= 0; phaseIdx--) {
      const pastPhase = fullPhases[phaseIdx];

      for (let i = 0; i < teams.length - 1; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const team1 = teams[i];
          const team2 = teams[j];
          if (!nextPhase.shouldLookForCarryover(team1, team2)) continue;
          if (!pastPhase.teamsAreInSamePool(team1, team2)) continue;
          const match = pastPhase.findMatchBetweenTeams(team1, team2);
          if (match) match.addCarryoverPhase(nextPhase);
        }
      }
      // No need to go further back
      // (I'm not aware of any formats where phase A carries over to phase C but phase B doesn't)
      if (!pastPhase.hasAnyCarryover()) break;
    }
  }

  clearCarryoverMatches(team: Team, playoffPhase: Phase) {
    if (!playoffPhase.hasAnyCarryover()) return;

    const fullPhases = this.getFullPhases();
    for (let phaseIdx = fullPhases.indexOf(playoffPhase) - 1; phaseIdx >= 0; phaseIdx--) {
      const pastPhase = fullPhases[phaseIdx];
      pastPhase.clearCarryoverPhase(team, playoffPhase);

      if (!pastPhase.hasAnyCarryover()) break;
    }
  }

  /** Find the round number of this match, if we don't already know what phase it's in */
  getRoundOfMatch(match: Match) {
    for (const phase of this.phases) {
      const round = phase.getRoundOfMatch(match);
      if (round) return round;
    }
    return undefined;
  }

  getCarryoverMatches(playoffPhase: Phase): Match[] {
    if (playoffPhase.phaseType !== PhaseTypes.Playoff) return [];
    let matches: Match[] = [];
    let curPhase = this.getPrevFullPhase(playoffPhase);
    while (curPhase !== undefined) {
      matches = matches.concat(curPhase.getCarryoverMatches(playoffPhase));
      curPhase = this.getPrevFullPhase(curPhase);
    }
    return matches;
  }
  //
}

export const NullTournament = new Tournament('Null Tournament');

export default Tournament;
