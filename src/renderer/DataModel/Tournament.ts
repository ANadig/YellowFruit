import { versionLt } from '../Utils/GeneralUtils';
import { NullDate, NullObjects } from '../Utils/UtilTypes';
import { IIndeterminateQbj, IQbjObject, IRefTargetDict, IYftDataModelObject, IYftFileObject } from './Interfaces';
import Phase from './Phase';
import { QbjAudience, QbjContent, QbjLevel, QbjTypeNames } from './QbjEnums';
import Registration from './Registration';
import { CommonRuleSets, IQbjScoringRules, ScoringRules } from './ScoringRules';
import { IRanking } from './Team';
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
    this.tournamentSite = new TournamentSite();
  }

  static fromYftFileObject(obj: IYftFileTournament, refTargets: IRefTargetDict): Tournament | null {
    const version = obj.YfData?.YfVersion;
    if (!version) return null;
    if (versionLt('4.0.0', version)) return null;

    return this.fromQbjObject(obj, refTargets);
  }

  toQbjObject(): IQbjTournament {
    const qbjObject: IQbjTournament = {
      type: QbjTypeNames.Tournament,
      name: this.name || Tournament.placeholderName,
      tournamentSite: this.tournamentSite.toQbjObject(),
      scoringRules: this.scoringRules || undefined,
      startDate: !NullDate.isNullDate(this.startDate) ? this.startDate : undefined,
      questionSet: this.questionSet || undefined,
    };

    return qbjObject;
  }

  static fromQbjObject(obj: IQbjTournament, refTargets: IRefTargetDict): Tournament {
    const tourn = new Tournament();

    if (obj.name && obj.name !== this.placeholderName) tourn.name = obj.name;

    const site = obj.tournamentSite;
    if (site) tourn.tournamentSite = TournamentSite.fromQbjObject(site as IIndeterminateQbj, refTargets);
    else tourn.tournamentSite = new TournamentSite();

    if (obj.startDate) tourn.startDate = obj.startDate;

    if (obj.questionSet) tourn.questionSet = obj.questionSet;

    // TODO: scoring rules

    return tourn;
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

export default Tournament;
