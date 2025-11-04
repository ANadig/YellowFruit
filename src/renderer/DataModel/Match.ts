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
import { LeftOrRight, wlt } from '../Utils/UtilTypes';
import AnswerType from './AnswerType';
import { ScoringRules } from './ScoringRules';
import { MatchPlayer } from './MatchPlayer';
import { IQbjMatchQuestion, MatchQuestion } from './MatchQuestion';

/** Different situations for whether it's okay to use a match to calculate stats */
export enum StatsValidity {
  /** A normal game with normal stats */
  valid,
  /** A game with a final score, but the player-specific stats should be ignored */
  noIndividuals,
  /** A game that is invalid and shouldn't be used in the standings at all */
  omit,
}

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
  /** Question-level data */
  matchQuestions?: IQbjMatchQuestion[];
}

/** Tournament object as written to a .yft file */
export interface IYftFileMatch extends IQbjMatch, IYftFileObject {
  YfData: IMatchExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IMatchExtraData {
  otherValidation: IYftFileMatchValidationMsg[];
  importedFile?: string;
}

/** A single match scheduled between two teams */
export class Match implements IQbjMatch, IYftDataModelObject {
  tossupsRead?: number;

  overtimeTossupsRead?: number;

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

  matchQuestions: MatchQuestion[] = [];

  /** The name of the file that the game was imported from */
  importedFile?: string;

  /** Whether this game should count towards stats */
  statsValidity: StatsValidity = StatsValidity.valid;

  /** Validation directly associated with the total TUH field */
  totalTuhFieldValidation: MatchValidationMessage;

  /** Validation directly associated with the overtime TUH field */
  overtimeTuhFieldValidation: MatchValidationMessage;

  /** Any other messages that should go at the bottom of the modal rather than a specific field */
  modalBottomValidation: MatchValidationCollection;

  private static readonly idCounterStartingValue = 1000;

  /** counter to make sure match IDs are unique */
  private static idCounter = Match.idCounterStartingValue;

  private idNumber: number;

  get id(): string {
    return `Match_${this.idNumber}~${this.leftTeam.team?.getLinkIdAbbrName() ?? ''}${
      this.rightTeam.team?.getLinkIdAbbrName() ?? ''
    }`;
  }

  constructor(leftTeam?: Team, rightTeam?: Team, answerTypes?: AnswerType[], idNumber?: number) {
    if (idNumber !== undefined) this.idNumber = idNumber;
    else this.idNumber = Match.idCounter++;
    this.leftTeam = new MatchTeam(leftTeam, answerTypes);
    this.rightTeam = new MatchTeam(rightTeam, answerTypes);

    this.totalTuhFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTotalTuh);
    this.overtimeTuhFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidOvertimeTuh);
    this.modalBottomValidation = new MatchValidationCollection();
  }

  /** Get the numeric part of the Match id */
  getIdNumber() {
    return this.idNumber;
  }

  /** Set the counter of match ID numbers to a specific value. Use this if opening a file to make sure new match IDs don't collide with existing ones. */
  static overrideIdCounter(newStartingNumber: number) {
    this.idCounter = newStartingNumber;
  }

  /** If given an string of the form "Match_<positive integer>" or "Match_<positive integer>~<addl chars>", set the ID number to that integer */
  tryToSetId(id: string) {
    if (id.search(/^Match_(\d+$|\d+~)/) === -1) return;

    this.idNumber = parseInt(id.replace(/^Match_/, ''), 10);
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
    this.matchQuestions = this.matchQuestions.map((mq) => mq.makeCopy());
    this.statsValidity = source.statsValidity;
    this.importedFile = source.importedFile;

    this.totalTuhFieldValidation = source.totalTuhFieldValidation.makeCopy();
    this.overtimeTuhFieldValidation = source.overtimeTuhFieldValidation.makeCopy();
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
      matchQuestions: this.matchQuestions.length > 0 ? this.matchQuestions.map((mq) => mq.toFileObject()) : undefined,
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Match;
    if (isReferenced) qbjObject.id = this.id;
    if (qbjOnly) return qbjObject;

    const yfData: IMatchExtraData = {
      otherValidation: this.modalBottomValidation.toFileObject(),
      importedFile: this.importedFile,
    };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  /** The result of the game, such as "Memorial 315, Riverview 180" */
  getScoreString() {
    if (!this.leftTeam.team || !this.rightTeam.team) {
      return 'Incomplete game';
    }
    const leftForfeit = this.leftTeam.forfeitLoss;
    const rightForfeit = this.rightTeam.forfeitLoss;
    if (leftForfeit && rightForfeit) {
      return `${this.leftTeam.team.name} vs. ${this.rightTeam.team.name} - Not played`;
    }
    if (leftForfeit || rightForfeit) {
      const winner = rightForfeit ? this.leftTeam.team.name : this.rightTeam.team.name;
      const loser = rightForfeit ? this.rightTeam.team.name : this.leftTeam.team.name;
      return `${winner} defeats ${loser} by forfeit`;
    }

    const leftPts = this.leftTeam.points;
    const rightPts = this.rightTeam.points;
    if (leftPts === undefined || rightPts === undefined) {
      return `${this.leftTeam.team.name} vs. ${this.rightTeam.team.name}`;
    }
    const winner = rightPts > leftPts ? this.rightTeam : this.leftTeam;
    const loser = winner === this.leftTeam ? this.rightTeam : this.leftTeam;
    const ot = this.overtimeTossupsRead ? ' (OT)' : '';
    return `${winner.team?.name} ${winner.points}, ${loser.team?.name} ${loser.points}${ot}`;
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

  /** Given a number of tossups heard, fill in that number for the first x players of each team,
   *  according to tournament settings, as long as no player has a tossups heard value yet.
   */
  fillInTossupsHeard(numPlayers: number, tossupsHeard: number) {
    for (const mt of [this.leftTeam, this.rightTeam]) {
      if (!mt.matchPlayers.find((mp) => mp.tossupsHeard !== undefined)) {
        for (let i = 0; i < numPlayers; i++) {
          if (i >= mt.matchPlayers.length) break;
          mt.matchPlayers[i].tossupsHeard = tossupsHeard;
        }
      }
    }
  }

  clearInactivePlayers() {
    this.leftTeam.clearInactivePlayers();
    this.rightTeam.clearInactivePlayers();
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

  getOpponent(whichTeam: LeftOrRight) {
    if (whichTeam === 'left') return this.rightTeam;
    return this.leftTeam;
  }

  includesTeam(team: Team) {
    return this.leftTeam.team === team || this.rightTeam.team === team;
  }

  setTeamScore(whichTeam: LeftOrRight, points: number | undefined) {
    const mt = this.getMatchTeam(whichTeam);
    mt.points = points;
  }

  setBouncebackPoints(whichTeam: LeftOrRight, points: number | undefined, scoringRules: ScoringRules) {
    const mt = this.getMatchTeam(whichTeam);
    mt.bonusBouncebackPoints = points;
    mt.validateBouncebackPoints(scoringRules);
  }

  setLightningPoints(whichTeam: LeftOrRight, points: number | undefined) {
    const mt = this.getMatchTeam(whichTeam);
    mt.lightningPoints = points;
  }

  setForfeit(whichTeam: LeftOrRight, isForfeit: boolean) {
    const mt = this.getMatchTeam(whichTeam);
    mt.forfeitLoss = isForfeit;
  }

  isForfeit() {
    return this.leftTeam.forfeitLoss || this.rightTeam.forfeitLoss;
  }

  addCarryoverPhase(phase: Phase) {
    if (this.carryoverPhases.includes(phase)) return;
    this.carryoverPhases.push(phase);
  }

  removeCarryoverPhase(phase: Phase) {
    this.carryoverPhases = this.carryoverPhases.filter((ph) => ph !== phase);
  }

  /** Number of tossups heard in regulation */
  getRegulationTuh() {
    return (this.tossupsRead ?? 0) - (this.overtimeTossupsRead ?? 0);
  }

  /** The total number of tossups answered correctly */
  getTotalTuConverted() {
    return this.leftTeam.getTotalBuzzes(true) + this.rightTeam.getTotalBuzzes(true);
  }

  /** The total number of tossups answered correctly in regulation */
  getRegulationTuConverted() {
    return this.getTotalTuConverted() - this.getOvertimeTuConverted();
  }

  /** The total number of tossups answered correctly in overtime */
  getOvertimeTuConverted() {
    return this.leftTeam.getCorrectTossupsWithoutBonuses() + this.rightTeam.getCorrectTossupsWithoutBonuses();
  }

  getBouncebackPartsHeard(whichTeam: LeftOrRight, scoringRules: ScoringRules): number {
    if (!scoringRules.canCalculateBounceBackPartsHeard()) return Number.NaN;
    const otherMT = this.getOpponent(whichTeam);
    const availPts = otherMT.getBonusesHeard(scoringRules) * scoringRules.maximumBonusScore - otherMT.getBonusPoints();
    return availPts / (scoringRules.pointsPerBonusPart || 10);
  }

  getBouncebackConvPct(whichTeam: LeftOrRight, scoringRules: ScoringRules, bbPartsHrd?: number) {
    const heard = bbPartsHrd !== undefined ? bbPartsHrd : this.getBouncebackPartsHeard(whichTeam, scoringRules);
    if (Number.isNaN(heard)) return 0;
    const partsConverted =
      (this.getMatchTeam(whichTeam).bonusBouncebackPoints || 0) / (scoringRules.pointsPerBonusPart || 10);
    return Math.round((100 * partsConverted) / heard);
  }

  /** Tuple of [bounceback parts heard, bounceback conversion percentage] */
  getBouncebackStatsString(whichTeam: LeftOrRight, scoringRules: ScoringRules): [string, string] {
    const bbPartsHrd = this.getBouncebackPartsHeard(whichTeam, scoringRules);
    if (Number.isNaN(bbPartsHrd)) return ['-', '-'];
    if (bbPartsHrd === 0) return ['0', '-'];
    return [bbPartsHrd.toString(), this.getBouncebackConvPct(whichTeam, scoringRules, bbPartsHrd).toString()];
  }

  /** String of the format "Central def. Washington" */
  getWinnerLoserString() {
    const leftScore = this.leftTeam.points;
    const rightScore = this.rightTeam.points;
    if (leftScore === undefined || rightScore === undefined) return '';

    const leftName = this.leftTeam.team?.name;
    const rightName = this.rightTeam.team?.name;
    if (leftScore === rightScore) return `${leftName} tied ${rightName}`;
    const winner = leftScore > rightScore ? leftName : rightName;
    const loser = leftScore > rightScore ? rightName : leftName;
    return `${winner} def. ${loser}`;
  }

  /** The score in a format like "W 355-200", from the perspective of the team passed as the parameter */
  getShortScore(team: Team) {
    let whichTeam: LeftOrRight | null = null;
    if (this.leftTeam.team === team) {
      whichTeam = 'left';
    }
    if (this.rightTeam.team === team) {
      whichTeam = 'right';
    }
    if (!whichTeam) return '';
    const resultDisp = this.getResultDisplay(whichTeam);
    const score = this.getScoreOnly(whichTeam);
    if (resultDisp === '') return score;
    if (this.isForfeit()) return `${resultDisp} (${score})`;
    return `${resultDisp} ${score}`;
  }

  getScoreOnly(whichTeam: LeftOrRight, showOT: boolean = false) {
    const thisTeam = this.getMatchTeam(whichTeam);
    const opponent = this.getOpponent(whichTeam);
    if (thisTeam.forfeitLoss && opponent.forfeitLoss) return 'Not played';
    if (this.isForfeit()) return 'Forfeit';
    const pts = addParensToNegative(thisTeam.points);
    const oppPts = addParensToNegative(opponent.points);
    const ot = showOT && !!this.overtimeTossupsRead ? ' (OT)' : '';
    return `${pts} - ${oppPts}${ot}`;
  }

  /** 'W', 'L', or 'T' */
  getResultDisplay(whichTeam: LeftOrRight) {
    switch (this.getResult(whichTeam)) {
      case 'win':
        return 'W';
      case 'loss':
        return 'L';
      case 'tie':
        return 'T';
      default:
        return '';
    }
  }

  /** Did this team win, lose, tie, or none of those (if double forfeit or invalid data) */
  getResult(whichTeam: LeftOrRight): wlt | null {
    const matchTeam = this.getMatchTeam(whichTeam);
    const otherMatchTeam = this.getOpponent(whichTeam);
    if (matchTeam.forfeitLoss && !otherMatchTeam.forfeitLoss) return 'loss';
    if (otherMatchTeam.forfeitLoss && !matchTeam.forfeitLoss) return 'win';
    if (matchTeam.forfeitLoss && otherMatchTeam.forfeitLoss) return null;

    if (matchTeam.points === undefined || otherMatchTeam.points === undefined) return null;

    if (matchTeam.points > otherMatchTeam.points) return 'win';
    if (matchTeam.points < otherMatchTeam.points) return 'loss';
    return 'tie';
  }

  getOvertimeSummary() {
    if (!this.overtimeTossupsRead || this.overtimeTossupsRead < 1) {
      return 'None';
    }
    if (!this.leftTeam.team || !this.rightTeam.team) return '';

    return `${this.overtimeTossupsRead} TU read,
      ${this.leftTeam.team.getTruncatedName(25)} ${this.leftTeam.getOvertimePoints()} pts,
      ${this.rightTeam.team.getTruncatedName(25)} ${this.rightTeam.getOvertimePoints()} pts`;
  }

  /** Get the list of previously calculated error messages (does NOT revalidate) */
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

  /** Get the list of previously calculated warning messages (does NOT revalidate) */
  getWarningMessages(): string[] {
    let warnings: string[] = [];
    if (this.totalTuhFieldValidation.status === ValidationStatuses.Warning) {
      warnings.push(`Tossups heard: ${this.totalTuhFieldValidation.message}`);
    }
    warnings = warnings.concat(this.modalBottomValidation.getWarningMessages());
    warnings = warnings.concat(this.leftTeam.getWarningMessages());
    warnings = warnings.concat(this.rightTeam.getWarningMessages());
    return warnings;
  }

  /** Determine whether the match is in an error state, warning state, or OK, based on existing validation results (does NOT re-validate) */
  getOverallValidationStatus() {
    if (this.getErrorMessages().length > 0) return ValidationStatuses.Error;
    if (this.getWarningMessages().length > 0) return ValidationStatuses.Warning;
    return ValidationStatuses.Ok;
  }

  determineStatsValidity() {
    if (this.getOverallValidationStatus() === ValidationStatuses.Error) {
      this.statsValidity = StatsValidity.omit;
    } else {
      this.statsValidity = StatsValidity.valid;
    }
  }

  validateAll(scoringRules: ScoringRules) {
    this.validateTotalTuh(scoringRules);
    this.validateTeams();
    this.validateMatchTeams(scoringRules);
    this.validateTotalBuzzes();
    this.validateAllMatchPlayersTuh(scoringRules);
    this.validateForfeit();
    this.validateOvertimeTuhField(scoringRules);
    this.validateTotalAndOtTuhRelationship(scoringRules);
    this.validateOvertimeBuzzes();
    this.validateOvertimeScoreMath(scoringRules);
    this.validateBouncebackConversion(scoringRules);
  }

  validateTotalTuh(scoringRules: ScoringRules) {
    if (this.isForfeit()) {
      this.totalTuhFieldValidation.setOk();
      return;
    }
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
      );
      // this warning is redundant in this case
      this.modalBottomValidation.clearMsgType(MatchValidationType.RegulationTuhNotStandard);
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
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.TeamsNotInSamePool);
  }

  setAlreadyPlayedInRdValidation(valid: boolean, message: string, unSuppress: boolean) {
    if (unSuppress) this.modalBottomValidation.clearMsgType(MatchValidationType.TeamAlreadyPlayedInRound);
    if (!valid) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TeamAlreadyPlayedInRound,
        ValidationStatuses.Warning,
        message,
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.TeamAlreadyPlayedInRound);
  }

  /** Validate the team-level stats for both teams */
  validateMatchTeams(scoringRules: ScoringRules) {
    if (this.isForfeit()) {
      this.leftTeam.clearValidation();
      this.rightTeam.clearValidation();
      return;
    }
    this.leftTeam.validateAll(scoringRules);
    this.rightTeam.validateAll(scoringRules);

    if (this.leftTeam.points !== undefined && this.leftTeam.points === this.rightTeam.points) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TieGame,
        ValidationStatuses.Warning,
        'This game is a tie',
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.TieGame);
    }
  }

  /** Validate stats for each individual player */
  validateAllMatchPlayersTuh(scoringRules: ScoringRules) {
    if (this.isForfeit()) {
      this.leftTeam.clearValidationMessage(MatchValidationType.NoTossupsHeard);
      this.rightTeam.clearValidationMessage(MatchValidationType.NoTossupsHeard);
      return;
    }

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
    const totalConvertedTU = this.getTotalTuConverted();
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

  validateForfeit() {
    if (this.leftTeam.forfeitLoss && this.rightTeam.forfeitLoss) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.DoubleForfeit,
        ValidationStatuses.Info,
        'This game will be recorded as "not played" and won\'t count as a win, loss, or tie for either team',
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.DoubleForfeit);
    }
  }

  validateOvertimeTuhField(scoringRules: ScoringRules) {
    if (this.overtimeTossupsRead === undefined || this.overtimeTossupsRead === 0) {
      this.overtimeTuhFieldValidation.setOk();
      this.modalBottomValidation.clearMsgType(MatchValidationType.OtTuhLessThanMinimum);
      return;
    }
    if (this.overtimeTossupsRead < 0 || this.overtimeTossupsRead > 999) {
      this.overtimeTuhFieldValidation.setError('Overtime tossups read is invalid');
      return;
    }
    this.overtimeTuhFieldValidation.setOk();

    if (this.overtimeTossupsRead < scoringRules.minimumOvertimeQuestionCount) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.OtTuhLessThanMinimum,
        ValidationStatuses.Warning,
        `Overtime tossups heard is less than the minimum of ${scoringRules.minimumOvertimeQuestionCount}`,
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.OtTuhLessThanMinimum);
    }

    const regulationTuh = this.getRegulationTuh();
    const regulationConv = this.getRegulationTuConverted();
    if (regulationConv > regulationTuh) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.OvertimeTuhTooHigh,
        ValidationStatuses.Error,
        `Based on overtime stats, ${regulationConv} tossups were answered correctly in regulation, but only ${regulationTuh} were read in regulation.`,
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.OvertimeTuhTooHigh);
    }
  }

  validateTotalAndOtTuhRelationship(scoringRules: ScoringRules) {
    if (
      this.tossupsRead === undefined ||
      (this.tossupsRead === 0 && this.isForfeit()) ||
      this.modalBottomValidation.findMsgType(MatchValidationType.LowTotalTuh)
    ) {
      this.modalBottomValidation.clearMsgType(MatchValidationType.RegulationTuhNotStandard);
      return;
    }
    const regulationTuh = this.tossupsRead - (this.overtimeTossupsRead || 0);
    if (regulationTuh > scoringRules.maximumRegulationTossupCount) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.RegulationTuhNotStandard,
        ValidationStatuses.Error,
        `Tossups read in regulation is ${regulationTuh}, but the maximum allowed is ${scoringRules.maximumRegulationTossupCount}`,
      );
      return;
    }
    if (!scoringRules.timed && !this.tiebreaker && regulationTuh < scoringRules.regulationTossupCount) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.RegulationTuhNotStandard,
        ValidationStatuses.Warning,
        `Tossups read in regulation is ${regulationTuh}, which is less than the standard number of ${scoringRules.maximumRegulationTossupCount}`,
      );
    } else {
      this.modalBottomValidation.clearMsgType(MatchValidationType.RegulationTuhNotStandard);
    }
  }

  validateOvertimeBuzzes() {
    if (this.overtimeTossupsRead === undefined) {
      this.modalBottomValidation.clearMsgType(MatchValidationType.TotalOtBuzzesExceedsTuh);
      return;
    }
    if (
      this.leftTeam.getNumOvertimeBuzzes(true) + this.rightTeam.getNumOvertimeBuzzes(true) >
      this.overtimeTossupsRead
    ) {
      this.modalBottomValidation.addValidationMsg(
        MatchValidationType.TotalOtBuzzesExceedsTuh,
        ValidationStatuses.Error,
        `More tossups were converted than read in overtime`,
      );
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.TotalOtBuzzesExceedsTuh);
  }

  validateOvertimeScoreMath(scoringRules: ScoringRules) {
    if (
      this.leftTeam.points === undefined ||
      this.rightTeam.points === undefined ||
      this.overtimeTossupsRead === undefined ||
      this.overtimeTossupsRead === 0 ||
      scoringRules.overtimeIncludesBonuses
    ) {
      this.modalBottomValidation.clearMsgType(MatchValidationType.OtButRegScoreNotTied);
    } else {
      const leftTeamRegScore = this.leftTeam.points - this.leftTeam.getOvertimePoints();
      const rightTeamRegScore = this.rightTeam.points - this.rightTeam.getOvertimePoints();
      if (leftTeamRegScore !== rightTeamRegScore) {
        this.modalBottomValidation.addValidationMsg(
          MatchValidationType.OtButRegScoreNotTied,
          ValidationStatuses.Warning,
          "Game went to overtime but the score wasn't tied after regulation, based on each team's overtime stats",
        );
      } else {
        this.modalBottomValidation.clearMsgType(MatchValidationType.OtButRegScoreNotTied);
      }
    }
  }

  validateBouncebackConversion(scoringRules: ScoringRules) {
    if (!scoringRules.bonusesBounceBack) return;
    const leftPct = this.getBouncebackConvPct('left', scoringRules);
    const rightPct = this.getBouncebackConvPct('right', scoringRules);
    if (!Number.isNaN(leftPct) && leftPct > 100) {
      this.leftTeam.addValidationMessage(
        MatchValidationType.BouncebackConvOver100,
        ValidationStatuses.Error,
        'Bounceback conversion is greater than 100%',
      );
    } else {
      this.leftTeam.clearValidationMessage(MatchValidationType.BouncebackConvOver100);
    }
    if (!Number.isNaN(rightPct) && rightPct > 100) {
      this.rightTeam.addValidationMessage(
        MatchValidationType.BouncebackConvOver100,
        ValidationStatuses.Error,
        'Bounceback conversion is greater than 100%',
      );
    } else {
      this.rightTeam.clearValidationMessage(MatchValidationType.BouncebackConvOver100);
    }
  }

  suppressMessageType(type: MatchValidationType, whichTeam?: LeftOrRight) {
    if (whichTeam) {
      this.getMatchTeam(whichTeam).suppressMessageType(type);
    } else {
      this.modalBottomValidation.suppressMessageType(type);
    }
  }

  unSuppressMessageType(type: MatchValidationType) {
    this.modalBottomValidation.unSuppressMessageType(type);
  }
}

export function otherTeam(whichTeam: LeftOrRight): LeftOrRight {
  return whichTeam === 'left' ? 'right' : 'left';
}

function addParensToNegative(score: number | undefined): string {
  if (score === undefined) return '';
  if (score >= 0) return score.toString();
  return `(${score})`;
}
