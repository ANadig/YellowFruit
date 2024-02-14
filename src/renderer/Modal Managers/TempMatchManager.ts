import { createContext } from 'react';
import { NullObjects } from '../Utils/UtilTypes';
import { Match } from '../DataModel/Match';
import { Team } from '../DataModel/Team';

export class TempMatchManager {
  /** The Match being edited */
  tempMatch: Match = NullObjects.nullMatch;

  /** Round number of the match being edited */
  round?: number;

  modalIsOpen: boolean = false;

  errorDialogIsOpen: boolean = false;

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  constructor() {
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
