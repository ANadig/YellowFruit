import { createContext } from 'react';
import { NullObjects } from '../Utils/UtilTypes';
import { Match } from '../DataModel/Match';
import { Team } from '../DataModel/Team';
import Tournament, { NullTournament } from '../DataModel/Tournament';
import { Phase } from '../DataModel/Phase';
import { MatchValidationType } from '../DataModel/MatchValidationMessage';

export class TempMatchManager {
  /** The Match being edited */
  tempMatch: Match = NullObjects.nullMatch;

  tournament: Tournament = NullTournament;

  /** Round number of the match being edited */
  round?: number;

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
    } else {
      this.createBlankMatch();
      this.round = round;
      if (leftTeam) this.tempMatch.setLeftTeam(leftTeam);
      if (rightTeam) this.tempMatch.setRightTeam(rightTeam);
    }

    this.dataChangedReactCallback();
  }

  createBlankMatch() {
    this.tempMatch = new Match();
    this.tempMatch.tossupsRead = this.tournament.scoringRules.regulationTossupCount;
    this.dataChangedReactCallback();
  }

  loadMatch(match: Match) {
    this.tempMatch = match.makeCopy();
  }

  /** Transfer data from temp objects to real objects */
  saveMatch(targetMatch: Match) {
    targetMatch.copyFromMatch(this.tempMatch);
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

  setTotalTuh(val: string): number {
    let parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) parsed = this.tempMatch.tossupsRead;
    this.tempMatch.tossupsRead = parsed;
    this.tempMatch.validateTotalTuh(this.tournament.scoringRules.regulationTossupCount);
    this.dataChangedReactCallback();
    return parsed;
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
