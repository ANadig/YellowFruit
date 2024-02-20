import { createContext } from 'react';
import { LeftOrRight, NullObjects } from '../Utils/UtilTypes';
import { Match } from '../DataModel/Match';
import { Team } from '../DataModel/Team';
import Tournament, { NullTournament } from '../DataModel/Tournament';
import { Phase } from '../DataModel/Phase';
import { MatchValidationType } from '../DataModel/MatchValidationMessage';
import { MatchPlayer } from '../DataModel/MatchPlayer';
import { PlayerAnswerCount } from '../DataModel/PlayerAnswerCount';

export class TempMatchManager {
  /** The Match being edited */
  tempMatch: Match = NullObjects.nullMatch;

  tournament: Tournament = NullTournament;

  /** Round number of the match being edited */
  round?: number;

  /** The round the match belonged to at the time the user opened it */
  originalRoundOpened?: number;

  /** Error to print next to the round field */
  roundFieldError?: string;

  modalIsOpen: boolean = false;

  errorDialogIsOpen: boolean = false;

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  constructor(tourn?: Tournament) {
    if (tourn) this.tournament = tourn;
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.tempMatch = NullObjects.nullMatch;
    delete this.roundFieldError;
  }

  /**
   * Get the form ready, and open it
   * @param match Existing match to edit, if any
   * @param round Round number to pre-populate
   * @param leftTeam Team to pre-populate in the left slot
   * @param rightTeam Team to pre-populate in the right slot
   */
  openModal(match?: Match, round?: number, leftTeam?: Team, rightTeam?: Team) {
    this.modalIsOpen = true;
    if (match) {
      this.loadMatch(match);
      this.round = round;
      this.originalRoundOpened = round;
    } else {
      this.createBlankMatch();
      this.round = round;
      if (leftTeam) this.tempMatch.setTeam('left', leftTeam, this.tournament.scoringRules.answerTypes);
      if (rightTeam) this.tempMatch.setTeam('right', rightTeam, this.tournament.scoringRules.answerTypes);
    }

    this.dataChangedReactCallback();
  }

  createBlankMatch() {
    this.tempMatch = new Match();
    if (!this.tournament.scoringRules.timed) {
      this.tempMatch.tossupsRead = this.tournament.scoringRules.regulationTossupCount;
    }
    this.dataChangedReactCallback();
  }

  private loadMatch(match: Match) {
    this.tempMatch = match.makeCopy();
  }

  /** Transfer data from temp objects to real objects */
  saveExistingMatch(targetMatch: Match) {
    if (!!this.round && !!this.originalRoundOpened && this.round !== this.originalRoundOpened) {
      this.tournament.deleteMatch(targetMatch, this.originalRoundOpened);
      this.tournament.addMatch(targetMatch, this.round);
    }
    targetMatch.copyFromMatch(this.tempMatch);
  }

  saveNewMatch() {
    if (this.round === undefined) return;
    this.tournament.addMatch(this.tempMatch, this.round);
  }

  closeModal() {
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  /** Clear the form and leave it open so another match can be entered */
  resetForNewMatch() {
    this.openModal();
  }

  /** Returns true if we can save the data */
  preSaveValidation() {
    this.tempMatch.validateAll(this.tournament.scoringRules);
    this.validateTeamPools(false);
    let errors: string[] = [];
    if (this.roundFieldError) errors.push(`Round number: ${this.roundFieldError}`);
    errors = errors.concat(this.tempMatch.getErrorMessages());
    if (errors.length > 0) {
      this.openErrorDialog(errors);
      return false;
    }
    return true;
  }

  setRoundNo(val: string) {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      if (val === '') {
        this.round = undefined;
      } // else don't change it (revert to last valid value)
    } else {
      this.round = parsed;
      this.removeBadCarryoverPhase();
    }
    this.validateRoundNo();
    this.dataChangedReactCallback();
    return this.round;
  }

  /** If the match's round is listed in its carryover phases, remove that phase from the list */
  removeBadCarryoverPhase() {
    if (this.round === undefined) return;
    const newPhase = this.tournament.whichPhaseIsRoundIn(this.round);
    if (newPhase === undefined) return;
    this.tempMatch.carryoverPhases = this.tempMatch.carryoverPhases.filter((ph) => ph !== newPhase);
  }

  validateRoundNo() {
    if (this.round === undefined) {
      this.roundFieldError = 'Round number is required';
      return;
    }
    if (!this.tournament.whichPhaseIsRoundIn(this.round)) {
      this.roundFieldError = 'This round number is not a part of any Phase';
      return;
    }
    delete this.roundFieldError;
    this.validateTeamPools(false);
  }

  getMainPhaseName() {
    if (this.round === undefined) return '';
    const phase = this.tournament.whichPhaseIsRoundIn(this.round);
    if (!phase) return '';
    return phase.name;
  }

  getAvailableCarryOverPhases() {
    const playoffPhases = this.tournament.getPlayoffPhases();
    if (this.round === undefined) return playoffPhases;
    const curPhase = this.tournament.whichPhaseIsRoundIn(this.round);
    return playoffPhases.filter((ph) => ph !== curPhase);
  }

  setCarryoverPhases(phaseNames: string[]) {
    const phases: Phase[] = [];
    for (const str of phaseNames) {
      const matchingPhase = this.tournament.findPhaseByName(str);
      if (matchingPhase) phases.push(matchingPhase);
    }
    this.tempMatch.carryoverPhases = phases;
    this.dataChangedReactCallback();
  }

  setTotalTuh(val: string): number | undefined {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      this.tempMatch.tossupsRead = undefined;
    } else {
      this.tempMatch.tossupsRead = parsed;
    }
    this.tempMatch.validateTotalTuh(this.tournament.scoringRules);
    this.dataChangedReactCallback();
    return this.tempMatch.tossupsRead;
  }

  getSelectedTeam(whichTeam: LeftOrRight): Team | undefined {
    if (whichTeam === 'left') return this.tempMatch.leftTeam.team;
    return this.tempMatch.rightTeam.team;
  }

  setTeam(whichTeam: LeftOrRight, teamName: string) {
    const oldTeam = this.tempMatch.getMatchTeam(whichTeam).team;
    const oldScore = this.tempMatch.getMatchTeam(whichTeam).points;
    const matchingTeam = this.tournament.findTeamByName(teamName);
    if (!matchingTeam) {
      this.tempMatch.clearTeam(whichTeam);
      return;
    }
    if (oldTeam === matchingTeam) return;

    this.tempMatch.setTeam(whichTeam, matchingTeam, this.tournament.scoringRules.answerTypes, oldScore);
    this.tempMatch.validateTeams();
    this.validateTeamPools(true);
    this.dataChangedReactCallback();
  }

  validateTeamPools(unSuppress: boolean) {
    const leftTeam = this.tempMatch.leftTeam.team;
    const rightTeam = this.tempMatch.rightTeam.team;
    let valid = true;
    if (leftTeam && rightTeam && this.round !== undefined && leftTeam !== rightTeam) {
      const leftPool = this.tournament.findPoolWithTeam(leftTeam, this.round);
      const rightPool = this.tournament.findPoolWithTeam(rightTeam, this.round);
      if (leftPool && rightPool && leftPool !== rightPool) {
        valid = false;
      }
    }
    this.tempMatch.setSamePoolValidation(valid, unSuppress);
  }

  setTeamScore(whichTeam: LeftOrRight, val: string): number | undefined {
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    this.tempMatch.setTeamScore(whichTeam, valToSave);
    this.tempMatch.validateMatchTeams();
    this.dataChangedReactCallback();
    return valToSave;
  }

  setPlayerTuh(mPlayer: MatchPlayer, val: string): number | undefined {
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    mPlayer.tossupsHeard = valToSave;
    this.dataChangedReactCallback();
    return valToSave;
  }

  setPlayerAnswerCount(aCount: PlayerAnswerCount, val: string): number | undefined {
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    aCount.number = valToSave;
    this.dataChangedReactCallback();
    return valToSave;
  }

  suppressValidationMessage(type: MatchValidationType) {
    this.tempMatch.suppressMessageType(type);
    this.dataChangedReactCallback();
  }

  openErrorDialog(errs: string[]) {
    this.errorDialogIsOpen = true;
    this.errorDialogContents = errs;
    this.dataChangedReactCallback();
  }

  closeErrorDialog() {
    this.errorDialogIsOpen = false;
    this.errorDialogContents = [];
    this.dataChangedReactCallback();
  }
}

export const MatchEditModalContext = createContext<TempMatchManager>(new TempMatchManager());
