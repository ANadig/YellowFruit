import { NullDate, NullObjects } from '../Utils/UtilTypes';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { IQbjPhase, Phase } from './Phase';
import { QbjAudience, QbjContent, QbjLevel, QbjTypeNames } from './QbjEnums';
import { IQbjRanking, Ranking } from './Ranking';
import Registration from './Registration';
import { CommonRuleSets, IQbjScoringRules, ScoringRules } from './ScoringRules';
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
  registrations?: Registration[];
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
      phases: this.phases.map((ph) => ph.toFileObject(qbjOnly)),
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Tournament;
    if (isReferenced) qbjObject.id = 'Tournament';

    if (this.tournamentSite.name) qbjObject.tournamentSite = this.tournamentSite.toFileObject(qbjOnly);
    if (this.scoringRules) qbjObject.scoringRules = this.scoringRules.toFileObject(qbjOnly);

    if (qbjOnly) return qbjObject;

    const metadata: ITournamentExtraData = { YfVersion: '4.0.0' };
    const yftFIleObj = { YfData: metadata, ...qbjObject };

    return yftFIleObj;
  }

  /** Set the scoring rules for this tournament */
  applyRuleSet(rules: CommonRuleSets): void {
    this.scoringRules = new ScoringRules(rules);
  }
}

export default Tournament;
