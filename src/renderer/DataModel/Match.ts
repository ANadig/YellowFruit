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
// eslint-disable-next-line import/no-cycle
import { LeftOrRight } from '../Utils/UtilTypes';

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

  /** The first team in the match */
  leftTeam: MatchTeam;

  /** The second team in the match */
  rightTeam: MatchTeam;

  get matchTeams(): MatchTeam[] {
    return [this.leftTeam, this.rightTeam];
  }

  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases: Phase[] = [];

  /** For use during file parsing to hold pointers to phases we haven't parsed yet, due to the
   *  Phase -> Round -> Match -> Phase circular dependency
   */
  coPhaseQbjIds: IQbjRefPointer[] = [];

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

  constructor(leftTeam?: Team, rightTeam?: Team) {
    this.idNumber = Match.idCounter++;
    this.leftTeam = new MatchTeam(leftTeam);
    this.rightTeam = new MatchTeam(rightTeam);

    this.totalTuhFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTotalTuh);
    this.otherValidation = new MatchValidationCollection();
  }

  makeCopy(): Match {
    const copy = new Match();
    copy.copyFromMatch(this);
    return copy;
  }

  copyFromMatch(source: Match) {
    this.leftTeam = source.leftTeam; // TODO: deep copy
    this.rightTeam = source.rightTeam;
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

  /** The result of the game, such as "Memorial 315, Riverview 180" */
  getScoreString() {
    if (!this.leftTeam.team || !this.rightTeam.team) {
      return 'Incomplete game';
    }
    const leftPts = this.leftTeam.points;
    const rightPts = this.rightTeam.points;
    if (leftPts === undefined || rightPts === undefined) {
      return `${this.leftTeam.team.name} vs. ${this.rightTeam.team.name}`;
    }
    const winner = rightPts > leftPts ? this.rightTeam : this.leftTeam;
    const loser = winner === this.leftTeam ? this.rightTeam : this.leftTeam;
    return `${winner.team?.name} ${winner.points}, ${loser.team?.name} ${loser.points}`;
  }

  listCarryoverPhases() {
    return this.carryoverPhases.map((ph) => ph.name).join(', ');
  }

  setTeam(whichTeam: LeftOrRight, team: Team) {
    if (whichTeam === 'left') {
      this.setLeftTeam(team);
    } else {
      this.setRightTeam(team);
    }
  }

  setLeftTeam(team: Team) {
    this.leftTeam = new MatchTeam(team);
  }

  setRightTeam(team: Team) {
    this.rightTeam = new MatchTeam(team);
  }

  clearTeam(whichTeam: LeftOrRight) {
    if (whichTeam === 'left') this.leftTeam = new MatchTeam();
    else {
      this.rightTeam = new MatchTeam();
    }
  }

  getMatchTeam(whichTeam: LeftOrRight) {
    if (whichTeam === 'left') return this.leftTeam;
    return this.rightTeam;
  }

  setTeamScore(whichTeam: LeftOrRight, points: number | undefined) {
    const mt = this.getMatchTeam(whichTeam);
    mt.points = points;
  }

  getErrorMessages(ignoreHidden: boolean = false): string[] {
    let errs: string[] = [];
    if (this.totalTuhFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`Tossups heard: ${this.totalTuhFieldValidation.message}`);
    }
    errs = errs.concat(this.otherValidation.getErrorMessages(ignoreHidden));
    errs = errs.concat(this.leftTeam.getErrorMessages(ignoreHidden));
    errs = errs.concat(this.rightTeam.getErrorMessages(ignoreHidden));
    return errs;
  }

  validateAll(regTossups: number) {
    this.validateTotalTuh(regTossups);
    this.validateTeams();
    this.validateMatchTeams();
  }

  validateTotalTuh(regTossups: number) {
    if (this.tossupsRead < 1 || this.tossupsRead > 999) {
      this.totalTuhFieldValidation.setError('Invalid number');
      return;
    }

    this.totalTuhFieldValidation.setOk();

    if (this.tossupsRead < regTossups) {
      this.otherValidation.addValidationMsg(
        MatchValidationType.LowTotalTuh,
        ValidationStatuses.Warning,
        `Total tossups heard is less than ${regTossups}, the standard number for a game`,
        true,
      );
      return;
    }

    this.otherValidation.clearMsgType(MatchValidationType.LowTotalTuh);
  }

  /** Validation about which teams are selected */
  validateTeams() {
    if (!this.leftTeam.team || !this.rightTeam.team) {
      this.otherValidation.addValidationMsg(
        MatchValidationType.MissingTeams,
        ValidationStatuses.HiddenError,
        'Teams are required',
      );
      return;
    }
    this.otherValidation.clearMsgType(MatchValidationType.MissingTeams);

    if (this.leftTeam.team === this.rightTeam.team) {
      this.otherValidation.addValidationMsg(
        MatchValidationType.TeamPlayingItself,
        ValidationStatuses.Error,
        'A team cannot play itself',
      );
      return;
    }
    this.otherValidation.clearMsgType(MatchValidationType.TeamPlayingItself);
  }

  /** Validate the stats for each team */
  validateMatchTeams() {
    this.leftTeam.validateAll();
    this.rightTeam.validateAll();
  }

  suppressMessageType(type: MatchValidationType) {
    this.otherValidation.suppressMessageType(type);
  }
}
