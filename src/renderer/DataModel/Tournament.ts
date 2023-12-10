import Phase from './Phase';
import Registration from './Registration';
import { CommonRuleSets, ScoringRules } from './ScoringRules';
import { IRanking } from './Team';

interface ITournamentSite {
  /** General name/description of where the tournament is happening */
  name: string;
  /** Specific location info such as an address */
  place?: string;
}

/** Audience / level of the tournament */
enum Audience {
  ElementarySchool,
  MiddleSchool,
  HighSchool,
  CommunityCollege,
  College,
  Open,
  Other,
}

/** Level of the tournament, within a given Audience */
enum Level {
  Novice,
  Regular,
  Nationals,
  Other,
}

/** Kinds of question sets */
enum Content {
  GeneralAcademic,
  SpecializedAcademic,
  Trash,
  Other,
}

/**
 * Class representing the data for a tournament
 * Corresponds with the Tournament schema object
 * https://schema.quizbowl.technology/tournament
 */
class Tournament {
  /** Free-text name of the tournament */
  name: string = '';

  /** Where the tournament happened */
  tournamentSite: ITournamentSite = { name: '' };

  /** Validation rules for scoring matches in this tournament */
  scoringRules?: ScoringRules;

  /** Tournament's start date */
  startDate?: Date;

  /** Tournament's end date */
  endDate?: Date;

  /** The schools/organizations at this tournament */
  registrations?: Registration[];

  /** Phases (prelims, playoffs, etc) of the tournament */
  phases?: Phase[];

  /** Ranking systems used at the tournament (overall, JV, etc) */
  rankings?: IRanking[];

  /** Audience / level of the tournament */
  audience?: Audience;

  /** Level of the tournament, within a given Audience */
  level?: Level;

  /** Name of the question set used */
  questionSet: string = '';

  /** The subject matter of the tournament question set */
  content?: Content;

  /** Other notes about the tournament */
  info?: string;

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules = new ScoringRules(rules);
  }
}

export default Tournament;
