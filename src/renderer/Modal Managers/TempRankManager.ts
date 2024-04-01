import { createContext } from 'react';
import { Team } from '../DataModel/Team';

export default class TempRankManager {
  /** The team whose rank is being modified */
  teamBeingEdited?: Team;

  modalIsOpen: boolean = false;

  /** Current value of the field */
  rank?: number;

  rankError: string = '';

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  static readonly minimumRankNo = 1;

  static readonly maximumRankNo = 999;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    delete this.rank;
    delete this.teamBeingEdited;
  }

  openModal(team: Team) {
    this.modalIsOpen = true;
    this.teamBeingEdited = team;
    this.rank = team.getOverallRank();
    this.validateAll();
    this.dataChangedReactCallback();
  }

  closeModal(shouldSave: boolean) {
    if (shouldSave) {
      this.validateAll();
      if (this.hasAnyErrors()) return;

      this.saveData();
    }
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  saveData() {
    if (!this.teamBeingEdited) return;
    if (this.rank) {
      this.teamBeingEdited.setOverallRank(this.rank);
    } else {
      this.teamBeingEdited.clearOverallRank();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  hasAnyErrors() {
    return !!this.rankError;
  }

  validateAll() {
    this.validateRank();
  }

  setRank(val: string): number | undefined {
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    this.rank = valToSave;
    this.validateRank();
    this.dataChangedReactCallback();
    return valToSave;
  }

  validateRank() {
    if (this.rank === undefined) {
      this.rankError = '';
      return;
    }
    if (this.rank > TempRankManager.maximumRankNo || this.rank < TempRankManager.minimumRankNo) {
      this.rankError = `Invalid value`;
      return;
    }
    this.rankError = '';
  }
}

export const RankEditModalContext = createContext<TempRankManager>(new TempRankManager());
