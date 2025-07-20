import { sumReduce, versionLt } from '../Utils/GeneralUtils';
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
import { IQbjRanking, OverallRanking, Ranking } from './Ranking';
import Registration, { IQbjRegistration } from './Registration';
import { Round } from './Round';
import { CommonRuleSets, IQbjScoringRules, ScoringRules } from './ScoringRules';
import StandardSchedule from './StandardSchedule';
import { AggregateStandings, PhaseStandings } from './StatSummaries';
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
  shortName?: string;
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
  standardRuleSet?: CommonRuleSets;
  seeds: IQbjRefPointer[];
  trackPlayerYear: boolean;
  trackSmallSchool: boolean;
  trackJV: boolean;
  trackUG: boolean;
  trackDiv2: boolean;
  finalRankingsReady?: boolean;
  usingScheduleTemplate?: boolean;
}

/** YellowFruit implementation of the Tournament object */
class Tournament implements IQbjTournament, IYftDataModelObject {
  name: string = '';

  /** QB schema requires a name, so use this when needed */
  static readonly placeholderName = 'unnamed tournament';

  tournamentSite: TournamentSite;

  scoringRules: ScoringRules;

  standardRuleSet?: CommonRuleSets;

  startDate: Date = NullObjects.nullDate;

  endDate: Date = NullObjects.nullDate;

  registrations: Registration[] = [];

  /** Phases (prelims, playoffs, etc) of the tournament. In YellowFruit, these must always be in chronological order!
   *  Furthermore, there must always be exactly one prelim phase, at index 0.
   */
  phases: Phase[] = [];

  usingScheduleTemplate: boolean = false;

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

  /** ungrouped dump of all teams with all the games they've played  */
  cumulativeStats?: AggregateStandings;

  /** Playoff standings with all prelim games carried over - for use when the prelim phase is a round robin with all teams */
  prelimsPlusPlayoffStats?: PhaseStandings;

  hasMatchData: boolean = false;

  finalRankingsReady: boolean = false;

  htmlGenerator: HtmlReportGenerator;

  appVersion: string = '';

  /** Whether we should use question-by-question data from qbj/MODAQ files. Is always false until we develop features that use it. */
  readonly useQuestionLevelData = false;

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
    this.tournamentSite = new TournamentSite();
    this.scoringRules = new ScoringRules(CommonRuleSets.NaqtUntimed);
    this.htmlGenerator = new HtmlReportGenerator(this);
    this.addBlankPhase();
  }

  toFileObject(qbjOnly = false, isTopLevel = true, isReferenced = false): IQbjTournament {
    const qbjObject: IQbjTournament = {
      name: this.name || Tournament.placeholderName,
      startDate: !NullDate.isNullDate(this.startDate) ? this.startDate : undefined,
      endDate: !NullDate.isNullDate(this.endDate) ? this.endDate : undefined,
      questionSet: this.questionSet || undefined,
      registrations: this.registrations.map((reg) => reg.toFileObject(qbjOnly)),
      phases: this.phases.map((ph) => ph.toFileObject(qbjOnly, false, true)),
      rankings: [OverallRanking.toFileObject(qbjOnly, false, true)],
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Tournament;
    if (isReferenced) qbjObject.id = 'Tournament';

    if (this.tournamentSite.name) qbjObject.tournamentSite = this.tournamentSite.toFileObject(qbjOnly);
    if (this.scoringRules) qbjObject.scoringRules = this.scoringRules.toFileObject(qbjOnly);

    if (qbjOnly) return qbjObject;

    const metadata: ITournamentExtraData = {
      YfVersion: this.appVersion,
      standardRuleSet: this.standardRuleSet,
      seeds: this.seeds.map((team) => team.toRefPointer()),
      trackPlayerYear: this.trackPlayerYear,
      trackSmallSchool: this.trackSmallSchool,
      trackJV: this.trackJV,
      trackUG: this.trackUG,
      trackDiv2: this.trackDiv2,
      finalRankingsReady: this.finalRankingsReady,
      usingScheduleTemplate: this.usingScheduleTemplate,
    };
    const yftFileObj = { YfData: metadata, ...qbjObject };

    return yftFileObj;
  }

  compileStats(fullReport: boolean = false, sortByFinalRank: boolean = false) {
    this.stats = [];
    const lastPhase = this.getLastFullPhase();
    if (!lastPhase) return;
    this.phases.forEach((p) => {
      if (p.isFullPhase()) {
        this.stats.push(new PhaseStandings(p, this.getCarryoverMatches(p), this.scoringRules));
      }
    });
    this.stats.forEach((phaseSt, idx) => phaseSt.compileStats(sortByFinalRank && idx === this.stats.length - 1));
    if (this.allPrelimGamesCarryOver()) {
      const prelimMatches = this.getPrelimPhase()?.getAllMatches() ?? [];
      this.prelimsPlusPlayoffStats = new PhaseStandings(lastPhase, prelimMatches, this.scoringRules);
      this.prelimsPlusPlayoffStats.compileStats(sortByFinalRank);
    }

    if (fullReport) {
      this.compileAddlStatsForFullReport();
    }
  }

  /** Do additional work needed for the full stat report- cumulative stats, individual stats, etc. */
  private compileAddlStatsForFullReport() {
    this.cumulativeStats = new AggregateStandings(this.getListOfAllTeams(), this.phases, this.scoringRules);
    if (this.finalRankingsReady) this.cumulativeStats.arrangeTeamsForFinalRanking();
    else this.cumulativeStats.sortTeamsByPPB();

    this.stats.find((phSt) => phSt.phase.phaseType === PhaseTypes.Prelim)?.compileIndividualStats();
  }

  reSortStandingsByFinalRank() {
    const playoffStats = this.statsWithFinalRanks();
    if (this.getLastFullPhase() !== playoffStats.phase) return;

    playoffStats.sortTeamsByFinalRank();
  }

  statsWithFinalRanks() {
    const playoffStats = this.stats[this.stats.length - 1];
    if (this.allPrelimGamesCarryOver()) return this.prelimsPlusPlayoffStats ?? playoffStats;
    return playoffStats;
  }

  setHtmlFilePrefix(prefix?: string) {
    this.htmlGenerator.setFilePrefix(prefix);
  }

  makeHtmlStandings() {
    return this.htmlGenerator.generateStandingsPage();
  }

  makeHtmlIndividuals() {
    return this.htmlGenerator.generateIndividualsPage();
  }

  makeHtmlScoreboard() {
    return this.htmlGenerator.generateScoreboardPage();
  }

  makeHtmlTeamDetail() {
    return this.htmlGenerator.generateTeamDetailPage();
  }

  makeHtmlPlayerDetail() {
    return this.htmlGenerator.generatePlayerDetailPage();
  }

  makeHtmlRoundReport() {
    return this.htmlGenerator.generateRoundReportPage();
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules.applyRuleSet(rules);
    this.standardRuleSet = rules;
  }

  clearStdRuleSet() {
    delete this.standardRuleSet;
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

  /** Should we let the user start entering matches? */
  readyToAddMatches() {
    if (this.getNumberOfTeams() < 2) return false;

    return !this.anyPoolErrors();
  }

  /** Which phase is the prelim phase? */
  getPrelimPhase(): Phase | undefined {
    return this.phases.find((phase) => phase.phaseType === PhaseTypes.Prelim);
  }

  getPrevPhase(phase: Phase): Phase | undefined {
    const idx = this.phases.indexOf(phase) - 1;
    if (idx === -1) return undefined;
    return this.phases[idx];
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

  getLastFullPhase() {
    let idx = this.phases.length - 1;
    while (idx >= -1 && !this.phases[idx]?.isFullPhase()) {
      idx--;
    }
    if (idx === -1) return undefined;
    return this.phases[idx];
  }

  isLastFullPhase(phase: Phase) {
    return phase.isFullPhase() && this.getNextFullPhase(phase) === undefined;
  }

  whichPhaseIsRoundIn(round: Round): Phase | undefined {
    return this.phases.find((phase) => phase.includesRound(round));
  }

  whichPhaseIsRoundNumberIn(roundNo: number): Phase | undefined {
    return this.phases.find((phase) => phase.includesRoundNumber(roundNo));
  }

  getRoundObjByNumber(roundNo: number) {
    const phase = this.whichPhaseIsRoundNumberIn(roundNo);
    if (!phase) return undefined;

    return phase.rounds.find((rd) => rd.number === roundNo);
  }

  getPlayoffPhases() {
    return this.phases.filter((ph) => ph.phaseType === PhaseTypes.Playoff);
  }

  /** "Real" phases with pool play, as opposed to tiebreakers or finals */
  getFullPhases() {
    return this.phases.filter((ph) => ph.isFullPhase());
  }

  getNumericRoundPhases() {
    return this.phases.filter((ph) => ph.usesNumericRounds());
  }

  /** The list of tiebreaker and finals phases */
  getMinorPhases() {
    return this.phases.filter((ph) => !ph.isFullPhase());
  }

  getFinalsPhases() {
    return this.phases.filter((ph) => ph.phaseType === PhaseTypes.Finals);
  }

  findPhaseByName(str: string) {
    return this.phases.find((ph) => ph.name === str);
  }

  findPhaseByRound(round: Round) {
    return this.phases.find((ph) => ph.rounds.includes(round));
  }

  private nextPhaseCode(): string {
    return (this.lastPhaseCodeNo() + 1).toString();
  }

  private lastPhaseCodeNo(): number {
    for (let i = this.phases.length - 1; i >= 0; i--) {
      const ph = this.phases[i];
      if (ph.phaseType !== PhaseTypes.Tiebreaker) return parseInt(ph.code, 10);
    }
    return 0;
  }

  /** Recompute the code attribute for all phases */
  recomputePhaseCodes() {
    let idx = 1;
    for (const ph of this.phases) {
      if (ph.phaseType === PhaseTypes.Tiebreaker) {
        ph.code = `${idx}T`;
      } else {
        ph.code = idx.toString();
        idx++;
      }
    }
  }

  addTiebreakerAfter(phase: Phase) {
    const idx = this.phases.indexOf(phase);
    if (idx === -1) return;

    const lastRd = phase.lastRoundNumber();
    const tbPhase = new Phase(
      PhaseTypes.Tiebreaker,
      lastRd + 0.5,
      lastRd + 0.5,
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

  addFinalsPhase() {
    const roundNumber = this.phases[this.phases.length - 1].lastRoundNumber() + 1;
    const numFinalsAlready = this.getFinalsPhases().length;
    const phaseName = numFinalsAlready > 0 ? `Finals (${numFinalsAlready + 1})` : undefined;
    this.phases.push(new Phase(PhaseTypes.Finals, roundNumber, roundNumber, this.nextPhaseCode(), phaseName));
  }

  /** Would it ever make sense to try moving this phase up or down in the list? */
  static phaseCouldBeMoved(phase: Phase) {
    return phase.phaseType === PhaseTypes.Finals && !phase.usesNumericRounds();
  }

  /** Should we allow swapping this phase with the previous one in the list? */
  canMovePhaseUp(phase: Phase) {
    if (!Tournament.phaseCouldBeMoved(phase)) return false;
    const idx = this.phases.indexOf(phase);
    return idx >= 1 && Tournament.phaseCouldBeMoved(this.phases[idx - 1]);
  }

  /** Should we allow swapping this phase with the next one in the list? */
  canMovePhaseDown(phase: Phase) {
    if (!Tournament.phaseCouldBeMoved(phase)) return false;
    const idx = this.phases.indexOf(phase);
    return idx >= 0 && idx < this.phases.length - 1 && Tournament.phaseCouldBeMoved(this.phases[idx + 1]);
  }

  /** Move a phase up in the list (backwards chronologically). Only Finals phases are supportd */
  movePhaseUp(phase: Phase) {
    if (!this.canMovePhaseUp(phase)) return;

    const idx = this.phases.indexOf(phase);
    const phaseToSwitchWith = this.phases[idx - 1];
    this.phases[idx - 1] = phase;
    this.phases[idx] = phaseToSwitchWith;
  }

  /** Move a phase down in the list (forwards chronologically). Only Finals phases are supportd */
  movePhaseDown(phase: Phase) {
    if (!this.canMovePhaseDown(phase)) return;

    const idx = this.phases.indexOf(phase);
    const phaseToSwitchWith = this.phases[idx - 1];
    this.phases[idx - 1] = phase;
    this.phases[idx] = phaseToSwitchWith;
  }

  deletePhase(phase: Phase) {
    const idx = this.phases.indexOf(phase);
    if (idx === -1) return;

    if (phase.phaseType === PhaseTypes.Playoff) {
      this.clearAllCarryoverMatchesForPhase(phase);
    }

    const nextPhase = this.phases[idx + 1];

    this.phases.splice(idx, 1);
    if (nextPhase) {
      this.reassignRoundNumbers(nextPhase);
    }
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

  /** The lowest round that this phase could contain, given the surrounding phases */
  roundNumberLowerBound(phase: Phase): number {
    const numericPhases = this.getNumericRoundPhases();
    const idx = numericPhases.indexOf(phase);
    if (idx === -1 || idx === 0) return 1;

    return numericPhases[idx - 1].lastRoundNumber() + 1;
  }

  /** The highest round that this phase could contain, given the surrounding phases */
  roundNumberUpperBound(phase: Phase): number {
    const numericPhases = this.getNumericRoundPhases();
    const idx = numericPhases.indexOf(phase);
    if (idx === -1 || idx === numericPhases.length - 1) return 999;

    return numericPhases[idx + 1].firstRoundNumber() - 1;
  }

  /** Add an empty phase for the user to customize */
  addBlankPhase() {
    const startingRound = 1 + (this.getLastFullPhase()?.lastRoundNumber() || 0);
    const phaseType = startingRound === 1 ? PhaseTypes.Prelim : PhaseTypes.Playoff;
    const newPhaseName = this.getNewPhaseName();
    const newPhase = new Phase(phaseType, startingRound, startingRound, this.nextPhaseCode(), newPhaseName);
    newPhase.addBlankPool();

    if (this.phases.length === 0) {
      this.phases.push(newPhase);
      return;
    }

    let lastNonFinalsIdx = this.phases.length - 1;
    while (this.phases[lastNonFinalsIdx].phaseType === PhaseTypes.Finals) {
      lastNonFinalsIdx--;
    }

    this.phases.splice(lastNonFinalsIdx + 1, 0, newPhase);
  }

  /** Get an appropriate name for a newly-added blank phase */
  private getNewPhaseName() {
    const fullPhases = this.getFullPhases();
    if (fullPhases.find((ph) => ph.name === 'New Stage')) {
      for (let i = 2; ; i++) {
        const altName = `New Stage ${i}`;
        if (!fullPhases.find((ph) => ph.name === altName)) {
          return altName;
        }
      }
    }
    return 'New Stage';
  }

  /** Do any of the phases in this tournament carry over games to a subsequent phase? */
  hasAnyCarryover() {
    for (const ph of this.getFullPhases()) {
      if (ph.hasAnyCarryover()) return true;
    }
    return false;
  }

  /** Should all prelim games carry over to playoffs because every team played every other team? */
  allPrelimGamesCarryOver() {
    const prelims = this.getPrelimPhase();
    if (!prelims) return false;
    if (this.getFullPhases().length !== 2) return false; // <2: nothing to carry over to; >2: something weird I've never heard of and don't want to deal with
    return prelims.pools.length === 1 && prelims.pools[0].roundRobins >= 1;
  }

  findPoolByName(name: string) {
    for (const phase of this.getFullPhases()) {
      const matchingPool = phase.findPoolByName(name);
      if (matchingPool) return matchingPool;
    }
    return undefined;
  }

  findPoolWithTeam(team: Team, round: Round): Pool | undefined {
    const phase = this.whichPhaseIsRoundIn(round);
    if (!phase) return undefined;
    return phase.findPoolWithTeam(team);
  }

  /** Do any pools have errors that need to be corrected right now? */
  private anyPoolErrors() {
    return !!this.getPrelimPhase()?.anyPoolErrors(); // this only applies to prelim phase right now
  }

  /** Add a new registration, and a new team that should be contained in that registration */
  addRegAndTeam(regToAdd: Registration, teamToAdd: Team) {
    teamToAdd.removeNullPlayers(); // this should have happened already, but there seems to be some obscure race condition
    regToAdd.teams = [teamToAdd];
    this.addRegistration(regToAdd);
  }

  addRegistration(regToAdd: Registration) {
    this.registrations.push(regToAdd);
    this.sortRegistrations();
    this.seedTeamsInRegistration(regToAdd);
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
    if (this.usingScheduleTemplate) {
      this.getPrelimPhase()?.addSeededTeam(newTeam, seedNo);
    } else {
      this.addUnseededTeamToPrelims(newTeam);
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

  addUnseededTeamToPrelims(team: Team) {
    this.getPrelimPhase()?.addUnseededTeam(team);
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

    const phase = this.getPrelimPhase();
    if (!phase) return;

    phase.revalidateMatchesForPoolCompatFromSeed(seedA);
    phase.revalidateMatchesForPoolCompatFromSeed(seedB);
  }

  findTeamById(id: string): Team | undefined {
    for (const reg of this.registrations) {
      for (const tm of reg.teams) {
        if (tm.id === id) return tm;
      }
    }
    return undefined;
  }

  findPlayerByName(name: string): Player | undefined {
    for (const reg of this.registrations) {
      for (const tm of reg.teams) {
        const pl = tm.findPlayerByName(name);
        if (pl) return pl;
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

  /** Should we allow the user to move teams between prelim pools? */
  prelimSeedsReadOnly() {
    const secondPhase = this.getFullPhases()[1];
    if (!secondPhase) return false;

    return secondPhase.anyMatchesExist();
  }

  numberOfPhasesWithStats() {
    let num = 0;
    for (const phase of this.phases) {
      if (phase.anyMatchesExist()) num++;
    }
    return num;
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
    this.phases = sched.constructPhases();
    this.distributeSeeds();
    this.usingScheduleTemplate = true;
  }

  unlockCustomSchedule() {
    this.usingScheduleTemplate = false;
    for (const ph of this.phases) {
      ph.unlockCustomSchedule();
    }
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

  /**
   * Find a match where two teams played
   * @param team1 One team. Doesn't matter which order the teams are in
   * @param team2 The other team
   * @param phase Phase the match should have, either directly or by carryover
   * @param nthMatch How far to look for matches. e.g. pass 2 to find the second match. NOTE: This parameter is intended for pools with multiple
   * round robins, and as such we assume that such pools don't carry over any matches from previous pools.
   */
  findMatchBetweenTeams(team1: Team, team2: Team, phase: Phase, nthMatch: number = 1) {
    const matchInThisPhase = phase.findMatchBetweenTeams(team1, team2, nthMatch);
    if (matchInThisPhase) return matchInThisPhase;

    if (!phase.shouldLookForCarryover(team1, team2)) return undefined;

    const fullPhases = this.getFullPhases();
    for (let phaseIdx = fullPhases.indexOf(phase) - 1; phaseIdx >= 0; phaseIdx--) {
      const pastPhase = fullPhases[phaseIdx];

      const matchInPastPhase = pastPhase.findMatchBetweenTeamsWithCarryOver(team1, team2, phase);
      if (matchInPastPhase) return matchInPastPhase;

      // No need to go further back
      // (I'm not aware of any formats where phase A carries over to phase C but phase B doesn't)
      if (!pastPhase.hasAnyCarryover()) break;
    }

    return undefined;
  }

  /**
   * Determine whether a match's teams have already played in some other match in the same round, and update the Match's validation data accordingly
   * @param match Match to validate
   * @param round Round the match happened in
   * @param phase Phase that round is in
   * @param unSuppress True if we should ignore that this warning was previously suppressed
   * @param matchToIgnore Match that should be ignored if we find it (for use with temp matches being manually edited in the modal)
   */
  static validateHaveTeamsPlayedInRound(
    match: Match,
    round: Round | undefined,
    phase: Phase | undefined,
    unSuppress: boolean,
    matchToIgnore?: Match,
  ) {
    const leftTeam = match.leftTeam.team;
    const rightTeam = match.rightTeam.team;
    if (!round || (phase && !phase.isFullPhase())) {
      match.setAlreadyPlayedInRdValidation(true, '', unSuppress);
      return;
    }
    const leftHasPlayed = leftTeam ? round.teamHasPlayedIn(leftTeam, matchToIgnore) : false;
    const rightHasPlayed = rightTeam ? round.teamHasPlayedIn(rightTeam, matchToIgnore) : false;
    let message = '';
    if (leftHasPlayed && rightHasPlayed) {
      message = 'Both teams have already played a game in this round';
    } else if (leftHasPlayed) {
      message = `${leftTeam?.name} has already played a game in this round`;
    } else if (rightHasPlayed) {
      message = `${rightTeam?.name} has already played a game in this round`;
    }
    match.setAlreadyPlayedInRdValidation(message === '', message, unSuppress);
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

  clearAllCarryoverMatchesForPhase(playoffPhase: Phase) {
    for (const tm of this.getListOfAllTeams()) {
      this.clearCarryoverMatches(tm, playoffPhase);
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

  /** Set hasCarryover to true in the pools of phases to which matches were carried over */
  inferCarryoverStatus() {
    for (const ph of this.getFullPhases()) {
      for (const coPh of ph.getPhasesCarriedOverTo()) {
        if (coPh.hasAnyCarryover()) continue;

        for (const p of coPh.pools) {
          p.hasCarryover = true;
        }
      }
    }
  }

  confirmFinalRankings() {
    if (this.stats.length === 0) return;
    for (const poolStats of this.statsWithFinalRanks().pools) {
      for (const ptStats of poolStats.poolTeams) {
        const { team } = ptStats;
        if (team.getOverallRank()) continue;

        if (ptStats.finalRankCalculated) team.setOverallRank(ptStats.finalRankCalculated);
      }
    }
  }

  packetNamesExist() {
    return !!this.phases.find((ph) => ph.packetNamesExist());
  }

  /** Set the starting value for Match ID generation high enough not to collide with anything in this tournament. Used after opening a file. */
  setMatchIdCounter() {
    let maxId = 0;
    for (const ph of this.phases) {
      for (const rd of ph.rounds) {
        for (const m of rd.matches) {
          maxId = Math.max(maxId, m.getIdNumber());
        }
      }
    }
    if (maxId > 0) {
      // don't bother doing this if the tournament doesn't actually contain any matches
      Match.overrideIdCounter(maxId + 1);
    }
  }

  /** Convert data to the current version's format */
  conversions() {
    if (versionLt(this.appVersion, '4.0.1')) {
      this.conversion4x0x1();
    }
  }

  /** If 4.0.0, must have used a schedule template */
  private conversion4x0x1() {
    this.usingScheduleTemplate = true;
  }
}

export const NullTournament = new Tournament('Null Tournament');

export default Tournament;
