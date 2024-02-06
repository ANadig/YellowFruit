import { sumReduce } from '../Utils/GeneralUtils';
import { NullDate, NullObjects } from '../Utils/UtilTypes';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { IQbjPhase, Phase, PhaseTypes } from './Phase';
import { QbjAudience, QbjContent, QbjLevel, QbjTypeNames } from './QbjEnums';
import { IQbjRanking, Ranking } from './Ranking';
import Registration, { IQbjRegistration } from './Registration';
import { CommonRuleSets, IQbjScoringRules, ScoringRules } from './ScoringRules';
import StandardSchedule from './StandardSchedule';
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
}

/** YellowFruit implementation of the Tournament object */
class Tournament implements IQbjTournament, IYftDataModelObject {
  name: string = '';

  /** QB schema requires a name, so use this when needed */
  static placeholderName = 'unnamed tournament';

  tournamentSite: TournamentSite;

  scoringRules: ScoringRules;

  startDate: Date = NullObjects.nullDate;

  registrations: Registration[] = [];

  phases: Phase[] = [];

  rankings: Ranking[] = [];

  questionSet: string = '';

  /** The list of teams ordered by their initial seed. This should NOT be the source of truth for what teams exist in general. */
  seeds: Team[] = [];

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
    this.tournamentSite = new TournamentSite();
    this.scoringRules = new ScoringRules(CommonRuleSets.NaqtUntimed);
  }

  toFileObject(qbjOnly = false, isTopLevel = true, isReferenced = false): IQbjTournament {
    const qbjObject: IQbjTournament = {
      name: this.name || Tournament.placeholderName,
      startDate: !NullDate.isNullDate(this.startDate) ? this.startDate : undefined,
      questionSet: this.questionSet || undefined,
      registrations: this.registrations.map((reg) => reg.toFileObject(qbjOnly)),
      phases: this.phases.map((ph) => ph.toFileObject(qbjOnly)),
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Tournament;
    if (isReferenced) qbjObject.id = 'Tournament';

    if (this.tournamentSite.name) qbjObject.tournamentSite = this.tournamentSite.toFileObject(qbjOnly);
    if (this.scoringRules) qbjObject.scoringRules = this.scoringRules.toFileObject(qbjOnly);

    if (qbjOnly) return qbjObject;

    const metadata: ITournamentExtraData = { YfVersion: '4.0.0' };
    const yftFileObj = { YfData: metadata, ...qbjObject };

    return yftFileObj;
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

  deleteRegistration(regToDelete: Registration) {
    if (regToDelete === null) return;
    this.registrations = this.registrations.filter((reg) => reg !== regToDelete);
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
  }

  /** Add all teams in a registration to the list of seeds, if they aren't already there */
  seedTeamsInRegistration(reg: Registration) {
    for (const tm of reg.teams) {
      if (!this.seeds.includes(tm)) this.seedAndAssignNewTeam(tm);
    }
  }

  setStandardSchedule(sched: StandardSchedule) {
    this.phases = sched.phases;
    this.getPrelimPhase()?.addTeamList(this.seeds);
  }
}

export default Tournament;
