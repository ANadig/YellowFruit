/**
 * Classes representing matches
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/match
 */

// eslint-disable-next-line import/no-cycle
import { IQbjPhase, Phase } from './Phase';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject, ValidationStatuses } from './Interfaces';
import { MatchTeam, IQbjMatchTeam } from './MatchTeam';
import { Team } from './Team';
import { QbjTypeNames } from './QbjEnums';
import MatchValidationMessage, {
  IYftFileMatchValidationMsg,
  MatchValidationCollection,
  MatchValidationType,
} from './MatchValidationMessage';

export interface IQbjMatch extends IQbjObject {
  /** The number of tossups read, including any tossups read in overtime */
  tossupsRead?: number;
  /** number of TU read in overtime */
  overtimeTossupsRead?: number;
  /** Room number or other location where the match was played */
  location?: string;
  /** Override the packet indicated by the Round the match was played in */
  packets?: string;
  /** Was this match a tiebreaker? */
  tiebreaker?: boolean;
  /** Name of the moderator */
  moderator?: string;
  /** Name of the scorekeeper */
  scorekeeper?: string;
  /** "For control room use only"-type serial number. */
  serial?: string;
  /** The performances of the teams in this match */
  matchTeams: IQbjMatchTeam[];
  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases?: IQbjPhase[] | IQbjRefPointer[];
  /** Additional notes about this match */
  notes?: string;
}

/** Tournament object as written to a .yft file */
export interface IYftFileMatch extends IQbjMatch, IYftFileObject {
  YfData: IMatchExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IMatchExtraData {
  otherValidation: IYftFileMatchValidationMsg[];
}

/** A single match scheduled between two teams */
export class Match implements IQbjMatch, IYftDataModelObject {
  tossupsRead: number = 0;

  overtimeTossupsRead: number = 0;

  location?: string;

  packets?: string;

  tiebreaker: boolean = false;

  moderator?: string;

  scorekeeper?: string;

  serial?: string;

  matchTeams: MatchTeam[] = [];

  /** The first team in the match */
  // team1?: MatchTeam;

  /** The second team in the match */
  // team2?: MatchTeam;

  // get matchTeams(): MatchTeam[] {
  //   if (!this.team1 || !this.team2) return [];
  //   return [this.team1, this.team2];
  // }

  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases: Phase[] = [];

  notes?: string;

  /** Validation directly associated with the total TUH field */
  totalTuhFieldValidation: MatchValidationMessage;

  /** Any other messages that should go at the bottom of the modal rather than  */
  otherValidation: MatchValidationCollection;

  /** counter to make sure match IDs are unique */
  private static idCounter = 1000;

  private idNumber: number;

  get id(): string {
    return `Match__${this.idNumber}`;
  }

  constructor(team1?: Team, team2?: Team) {
    this.idNumber = Match.idCounter++;
    if (team1) this.matchTeams = [new MatchTeam(team1)];
    if (team2) this.matchTeams.push(new MatchTeam(team2));

    this.totalTuhFieldValidation = new MatchValidationMessage();
    this.otherValidation = new MatchValidationCollection();
  }

  makeCopy(): Match {
    const copy = new Match();
    copy.copyFromMatch(this);
    return copy;
  }

  copyFromMatch(source: Match) {
    this.matchTeams = source.matchTeams.slice(); // TODO: deep copy
    this.carryoverPhases = source.carryoverPhases.slice(); // don't need deep copy here
    this.idNumber = source.idNumber;
    this.tossupsRead = source.tossupsRead;
    this.overtimeTossupsRead = source.overtimeTossupsRead;
    this.tiebreaker = source.tiebreaker;
    this.location = source.location;
    this.packets = source.packets;
    this.moderator = source.moderator;
    this.scorekeeper = source.scorekeeper;
    this.serial = source.serial;
    this.notes = source.notes;

    this.totalTuhFieldValidation = source.totalTuhFieldValidation;
    this.otherValidation = source.otherValidation.makeCopy();
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatch {
    const qbjObject: IQbjMatch = {
      matchTeams: this.matchTeams.map((mt) => mt.toFileObject(qbjOnly)),
      carryoverPhases: this.carryoverPhases.map((ph) => ph.toRefPointer()),
      tossupsRead: this.tossupsRead,
      overtimeTossupsRead: this.overtimeTossupsRead,
      tiebreaker: this.tiebreaker,
      location: this.location,
      packets: this.packets,
      moderator: this.moderator,
      scorekeeper: this.scorekeeper,
      serial: this.serial,
      notes: this.notes,
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Match;
    if (isReferenced) qbjObject.id = this.id;
    if (qbjOnly) return qbjObject;

    const yfData: IMatchExtraData = { otherValidation: this.otherValidation.toFileObject() };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  setLeftTeam(team: Team) {
    this.matchTeams[0] = new MatchTeam(team);
  }

  setRightTeam(team: Team) {
    this.matchTeams[1] = new MatchTeam(team);
  }

  getErrorMessages(): string[] {
    let errs: string[] = [];
    if (this.totalTuhFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`Tossups heard: ${this.totalTuhFieldValidation.message}`);
    }
    errs = errs.concat(this.otherValidation.getErrorMessages());
    return errs;
  }

  validateAll(regTossups?: number) {
    this.validateTotalTuh(regTossups);
  }

  validateTotalTuh(regTossups?: number) {
    if (this.tossupsRead < 1 || this.tossupsRead > 999) {
      this.totalTuhFieldValidation.setError('Invalid number');
      return;
    }

    this.totalTuhFieldValidation.setOk();

    if (!!regTossups && this.tossupsRead < regTossups) {
      this.otherValidation.addValidationMsg(
        MatchValidationType.lowTotalTuh,
        ValidationStatuses.Warning,
        `Total tossups heard is less than ${regTossups}, the standard number for a game`,
        true,
      );
      return;
    }

    this.otherValidation.clearMsgType(MatchValidationType.lowTotalTuh);
  }

  suppressMessageType(type: MatchValidationType) {
    this.otherValidation.suppressMessageType(type);
  }
}
