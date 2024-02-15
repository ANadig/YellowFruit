import { createContext } from 'react';
import { NullObjects } from '../Utils/UtilTypes';
import { Match } from '../DataModel/Match';
import { Team } from '../DataModel/Team';
import Tournament, { NullTournament } from '../DataModel/Tournament';
import { Phase } from '../DataModel/Phase';

export class TempMatchManager {
  /** The Match being edited */
  tempMatch: Match = NullObjects.nullMatch;

  tournament: Tournament = NullTournament;

  /** Round number of the match being edited */
  round?: number;

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

  setRoundNo(num: number | undefined) {
    this.round = num;
    this.dataChangedReactCallback();
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
