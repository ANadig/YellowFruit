import Phase from './Phase';
import Registration from './Registration';
import { CommonRuleSets, ScoringRules } from './ScoringRules';
import { IRanking } from './Team';

/** The location where tournament happened. Corresponds to the Tournament Schema object */
interface IQbjTournamentSite {
  /** General name/description of where the tournament is happening */
  name: string;
  /** Specific location info such as an address */
  place?: string;
  /** The latitude of the tournament's site (for geolocation) */
  latitude?: Number;
  /** The longitude of the tournament's site (for geolocation) */
  longitude?: Number;
}

/** Audience / level of the tournament */
enum QbjAudience {
  ElementarySchool,
  MiddleSchool,
  HighSchool,
  CommunityCollege,
  College,
  Open,
  Other,
}

/** Level of the tournament, within a given Audience */
enum QbjLevel {
  Novice,
  Regular,
  Nationals,
  Other,
}

/** Kinds of question sets */
enum QbjContent {
  GeneralAcademic,
  SpecializedAcademic,
  Trash,
  Other,
}

/**
 * Represents the data for a tournament.
 * Corresponds to the Tournament schema object
 * https://schema.quizbowl.technology/tournament
 */
interface IQbjTournament {
  /** Free-text name of the tournament */
  name: string;
  /** An abbreviated version of the tournament's name */
  short_name?: string;
  /** Where the tournament happened */
  tournamentSite?: IQbjTournamentSite;
  /** Validation rules for scoring matches in this tournament */
  scoringRules?: ScoringRules;
  /** Tournament's start date */
  startDate?: Date | null;
  /** Tournament's end date */
  endDate?: Date | null;
  /** The schools/organizations at this tournament */
  registrations?: Registration[];
  /** Phases (prelims, playoffs, etc) of the tournament */
  phases?: Phase[];
  /** Ranking systems used at the tournament (overall, JV, etc) */
  rankings?: IRanking[];
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

/** YellowFruit implementation of the Tournament object */
class Tournament implements IQbjTournament {
  name: string = '';

  tournamentSite: IQbjTournamentSite = { name: '' };

  scoringRules?: ScoringRules;

  startDate: Date | null = null;

  registrations?: Registration[];

  phases: Phase[] = [];

  rankings: IRanking[] = [];

  questionSet: string = '';

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  /** Create an object that exactly complies with the tournament schema */
  toQbjObject(): IQbjTournament {
    const qbjObject: IQbjTournament = {
      name: this.name,
      tournamentSite: this.tournamentSite.name !== '' ? this.tournamentSite : undefined,
      scoringRules: this.scoringRules ? this.scoringRules : undefined,
      startDate: this.startDate ? this.startDate : undefined,
      questionSet: this.questionSet !== '' ? this.questionSet : undefined,
    };

    return qbjObject;
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules = new ScoringRules(rules);
  }
}

export default Tournament;
