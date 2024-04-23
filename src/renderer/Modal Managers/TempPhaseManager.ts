import { createContext } from 'react';
import { Phase, PhaseTypes } from '../DataModel/Phase';

export default class TempPhaseManager {
  /** The phase being edited */
  originalPhaseOpened?: Phase;

  modalIsOpen: boolean = false;

  phaseName: string = '';

  phaseNameError: string = '';

  firstRound?: number;

  lastRound?: number;

  firstRoundError: string = '';

  lastRoundError: string = '';

  lowestPossibleRound: number = 1;

  highestPossibleRound: number = 999;

  /** Names of other phases, for duplicate checking */
  otherPhaseNames: string[] = [];

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  static readonly maxPhaseNameLength = 200;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.phaseName = '';
    delete this.originalPhaseOpened;
    delete this.firstRound;
    delete this.lastRound;
    this.phaseNameError = '';
    this.firstRoundError = '';
    this.lastRoundError = '';
  }

  openModal(phase: Phase, otherPhaseNames: string[], roundLowerBound?: number, roundUpperBound?: number) {
    this.modalIsOpen = true;
    this.originalPhaseOpened = phase;
    this.phaseName = phase.name;
    this.lowestPossibleRound = roundLowerBound || 1;
    this.highestPossibleRound = roundUpperBound || 999;
    this.otherPhaseNames = otherPhaseNames;
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
    if (!this.originalPhaseOpened) return;
    this.originalPhaseOpened.name = this.phaseName;
    if (this.originalPhaseOpened.phaseType === PhaseTypes.Finals && !this.originalPhaseOpened.forceNumericRounds) {
      this.originalPhaseOpened.rounds[0].name = this.phaseName;
    }
  }

  hasAnyErrors() {
    return !!(this.phaseNameError || this.firstRoundError || this.lastRoundError);
  }

  validateAll() {
    this.validatePhaseName();
  }

  setPhaseName(val: string) {
    const trimmedName = val.trim();
    this.phaseName = trimmedName;
    this.validatePhaseName();
    this.dataChangedReactCallback();
  }

  validatePhaseName() {
    if (this.phaseName === '') {
      this.phaseNameError = 'Name is required';
      return;
    }
    if (this.phaseName.length > TempPhaseManager.maxPhaseNameLength) {
      this.phaseNameError = `Name cannot be more than ${TempPhaseManager.maxPhaseNameLength} characters`;
      return;
    }
    if (this.otherPhaseNames.includes(this.phaseName)) {
      this.phaseNameError = 'A stage with this name already exists';
      return;
    }
    this.phaseNameError = '';
  }
}

export const PhaseEditModalContext = createContext<TempPhaseManager>(new TempPhaseManager());
