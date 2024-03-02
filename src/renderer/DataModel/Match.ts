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
import AnswerType from './AnswerType';
import { ScoringRules } from './ScoringRules';
import { MatchPlayer } from './MatchPlayer';

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
  tossupsRead?: number;

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

  /** Any other messages that should go at the bottom of the modal rather than a specific field */
  modalBottomValidation: MatchValidationCollection;

  /** counter to make sure match IDs are unique */
  private static idCounter = 1000;

  private idNumber: number;

  get id(): string {
    return `Match_${this.idNumber}`;
  }

  constructor(leftTeam?: Team, rightTeam?: Team, answerTypes?: AnswerType[]) {
    this.idNumber = Match.idCounter++;
    this.leftTeam = new MatchTeam(leftTeam, answerTypes);
    this.rightTeam = new MatchTeam(rightTeam, answerTypes);

    this.totalTuhFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTotalTuh);
    this.modalBottomValidation = new MatchValidationCollection();
  }

  makeCopy(): Match {
    const copy = new Match();
    copy.copyFromMatch(this);
    return copy;
  }

  copyFromMatch(source: Match) {
    this.leftTeam = source.leftTeam.makeCopy();
    this.rightTeam = source.rightTeam.makeCopy();
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
    this.modalBottomValidation = source.modalBottomValidation.makeCopy();
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

    const yfData: IMatchExtraData = { otherValidation: this.modalBottomValidation.toFileObject() };
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

  setTeam(
    whichTeam: LeftOrRight,
    team: Team,
    answerTypes: AnswerType[],
    maxPlayersSetting: number,
    tossupsHeard?: number,
    score?: number,
  ) {
    const newMatchTeam = new MatchTeam(team, answerTypes);
    if (score !== undefined) newMatchTeam.points = score;
    if (whichTeam === 'left') {
      this.leftTeam = newMatchTeam;
    } else {
      this.rightTeam = newMatchTeam;
    }
    if (tossupsHeard === undefined) return;

    for (let i = 0; i < maxPlayersSetting; i++) {
      if (i >= newMatchTeam.matchPlayers.length) break;
      newMatchTeam.matchPlayers[i].tossupsHeard = tossupsHeard;
    }
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
    errs = errs.concat(this.modalBottomValidation.getErrorMessages(ignoreHidden));
    errs = errs.concat(this.leftTeam.getErrorMessages(ignoreHidden));
    errs = errs.concat(this.rightTeam.getErrorMessages(ignoreHidden));
    return errs;
  }

  validateAll(scoringRules: ScoringRules) {
    this.validateTotalTuh(scoringRules);
    this.validateTeams();
    this.validateMatchTeams(scoringRules);
    this.validateTotalBuzzes();
    this.validateAllMatchPlayersTuh(scoringRules);
  }

  validateTotalTuh(scoringRules: ScoringRules) {
    if (this.tossupsRead === undefined) {
      this.totalTuhFieldValidation.setError('Field is required');
      return;
    }
    if (this.tossupsRead < 1 || this.tossupsRead > 999) {
      this.totalTuhFieldValidation.setError('Invalid number');
      return;
    }

    this.totalTuhFieldValidation.setOk();

    if (!scoringRules.timed && this.tossupsRead < scoringRules.regulationTossupCount) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.LowTotalTuh,
        ValidationStatuses.Warning,
        `Total tossups heard is less than ${scoringRules.regulationTossupCount}, the standard number for a game`,
        true,
      );
      return;
    }

    this.modalBottomValidation.clearMsgType(MatchValidationType.LowTotalTuh);
  }

  /** Validation about which teams are selected */
  validateTeams() {
    if (!this.leftTeam.team || !this.rightTeam.team) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.MissingTeams,
        ValidationStatuses.HiddenError,
        'Teams are required',
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.MissingTeams);

    if (this.leftTeam.team === this.rightTeam.team) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TeamPlayingItself,
        ValidationStatuses.Error,
        'A team cannot play itself',
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.TeamPlayingItself);
  }

  setSamePoolValidation(valid: boolean, unSuppress: boolean) {
    if (unSuppress) this.unSuppressMessageType(MatchValidationType.TeamsNotInSamePool);
    if (!valid) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TeamsNotInSamePool,
        ValidationStatuses.Warning,
        'These teams are not in the same pool for this round',
        true,
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.TeamsNotInSamePool);
  }

  /** Validate the team-level stats for both teams */
  validateMatchTeams(scoringRules: ScoringRules) {
    this.leftTeam.validateAll(scoringRules);
    this.rightTeam.validateAll(scoringRules);

    if (this.leftTeam.points !== undefined && this.leftTeam.points === this.rightTeam.points) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TieGame,
        ValidationStatuses.Warning,
        'This game is a tie',
        true,
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.TieGame);
    }
  }

  /** Validate stats for each individual player */
  validateAllMatchPlayersTuh(scoringRules: ScoringRules) {
    this.leftTeam.matchPlayers.forEach((mp) => this.validatePlayerTuh(mp));
    this.rightTeam.matchPlayers.forEach((mp) => this.validatePlayerTuh(mp));

    for (const matchTeam of [this.leftTeam, this.rightTeam]) {
      if (matchTeam.team === undefined) continue;

      const totalTUH = matchTeam.getTotalTossupsHeard();
      if (totalTUH < 1) {
        matchTeam.addValidationMessage(
          MatchValidationType.NoTossupsHeard,
          ValidationStatuses.Error,
          'No players have heard any tossups for this team',
        );
      } else {
        matchTeam.modalBottomValidation.clearMsgType(MatchValidationType.NoTossupsHeard);
      }

      const expectedTotalTUH =
        matchTeam.matchPlayers.length >= scoringRules.maximumPlayersPerTeam
          ? scoringRules.maximumPlayersPerTeam * (this.tossupsRead || 0)
          : matchTeam.matchPlayers.length * (this.tossupsRead || 0);
      if (this.tossupsRead !== undefined && totalTUH > expectedTotalTUH) {
        matchTeam.addValidationMessage(
          MatchValidationType.MoreThanAllowedTUH,
          ValidationStatuses.Error,
          `Players have heard more than ${expectedTotalTUH} tossups in aggregate`,
        );
      } else {
        matchTeam.modalBottomValidation.clearMsgType(MatchValidationType.MoreThanAllowedTUH);
      }
      if (this.tossupsRead !== undefined && totalTUH < expectedTotalTUH && totalTUH > 0) {
        matchTeam.addValidationMessage(
          MatchValidationType.FewerThanExpectedTUH,
          ValidationStatuses.Warning,
          `Players have heard fewer than ${expectedTotalTUH} tossups in aggregate`,
          true,
        );
      } else {
        matchTeam.modalBottomValidation.clearMsgType(MatchValidationType.FewerThanExpectedTUH);
      }
    }
  }

  validatePlayerTuh(matchPlayer: MatchPlayer) {
    const tuh = matchPlayer.tossupsHeard;
    if (tuh === undefined || this.tossupsRead === undefined) {
      matchPlayer.setTuhHeardValidation(true);
    } else if (tuh < 0) {
      matchPlayer.setTuhHeardValidation(false);
    } else if (tuh > this.tossupsRead) {
      matchPlayer.setTuhHeardValidation(false, 'Tossups heard is greater than the total tossups in the game');
    } else {
      matchPlayer.setTuhHeardValidation(true);
    }
  }

  validateTotalBuzzes() {
    const totalConvertedTU = this.leftTeam.getTotalBuzzes(true) + this.rightTeam.getTotalBuzzes(true);
    if (this.tossupsRead !== undefined && this.tossupsRead > 0 && totalConvertedTU > this.tossupsRead) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.MatchHasTooConvertedTU,
        ValidationStatuses.Error,
        `Total number of tossups converted (${totalConvertedTU}) exceeds the number of tossups in the game (${this.tossupsRead})`,
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.MatchHasTooConvertedTU);
    }

    for (const matchTeam of [this.leftTeam, this.rightTeam]) {
      const totalBuzzes = matchTeam.getTotalBuzzes();
      if (this.tossupsRead !== undefined && this.tossupsRead > 0 && totalBuzzes > this.tossupsRead) {
        matchTeam.addValidationMessage(
          MatchValidationType.TeamHasTooManyBuzzes,
          ValidationStatuses.Error,
          `Team's total buzzes (${totalBuzzes}) exceeds the number of tossups in the game (${this.tossupsRead})`,
        );
      } else {
        matchTeam.clearValidationMessage(MatchValidationType.TeamHasTooManyBuzzes);
      }
    }
  }

  suppressMessageType(type: MatchValidationType) {
    this.modalBottomValidation.suppressMessageType(type);
  }

  unSuppressMessageType(type: MatchValidationType) {
    this.modalBottomValidation.unSuppressMessageType(type);
  }
}
