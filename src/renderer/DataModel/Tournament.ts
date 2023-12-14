import { NullDate, NullObjects } from '../Utils/UtilTypes';
import Phase from './Phase';
import { QbjAudience, QbjContent, QbjLevel, QbjTypeNames } from './QbjEnums';
import Registration from './Registration';
import { CommonRuleSets, ScoringRules } from './ScoringRules';
import { IRanking } from './Team';

/** Used for supplementing QBJ data types with additional YF-specific info */
export interface IYftFileObject {
  YfData?: object;
}

/**
 * Represents the data for a tournament.
 * Corresponds to the Tournament schema object
 * https://schema.quizbowl.technology/tournament
 */
interface IQbjTournament {
  type?: QbjTypeNames.Tournament;
  /** Free-text name of the tournament */
  name: string;
  /** An abbreviated version of the tournament's name */
  short_name?: string;
  /** Where the tournament happened */
  tournamentSite?: IQbjTournamentSite;
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
interface IYftFileTournament extends IQbjTournament, IYftFileObject {
  YfData: ITournamentExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface ITournamentExtraData {
  /** Version of this software used to write the file */
  YfVersion: String;
}

/** YellowFruit implementation of the Tournament object */
class Tournament implements IQbjTournament {
  name: string = '';

  tournamentSite: IQbjTournamentSite = { name: '' };

  scoringRules?: ScoringRules;

  startDate: Date = NullObjects.nullDate;

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
      type: QbjTypeNames.Tournament,
      name: this.name || 'unnamed tournament',
      tournamentSite: this.tournamentSite.name !== '' ? this.tournamentSite : undefined,
      scoringRules: this.scoringRules ? this.scoringRules : undefined,
      startDate: !NullDate.isNullDate(this.startDate) ? this.startDate : undefined,
      questionSet: this.questionSet !== '' ? this.questionSet : undefined,
    };

    return qbjObject;
  }

  toYftFileObject(): IYftFileTournament {
    const qbjObject = this.toQbjObject();
    const metadata: ITournamentExtraData = { YfVersion: '4.0.0' };

    return { YfData: metadata, ...qbjObject };
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules = new ScoringRules(rules);
  }
}

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

export default Tournament;
