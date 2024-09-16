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

  roundRangeError: string = '';

  lowestPossibleRound: number = 1;

  highestPossibleRound: number = 999;

  lowestRequiredRound?: number;

  highestRequiredRound?: number;

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
    this.roundRangeError = '';
  }

  openModal(phase: Phase, otherPhaseNames: string[], roundLowerBound?: number, roundUpperBound?: number) {
    this.modalIsOpen = true;
    this.originalPhaseOpened = phase;
    this.phaseName = phase.name;
    this.firstRound = phase.firstRoundNumber();
    this.lastRound = phase.lastRoundNumber();
    this.lowestPossibleRound = roundLowerBound || 1;
    this.highestPossibleRound = roundUpperBound || 999;
    this.setRequiredRoundRange();
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
    if (this.firstRound && this.lastRound) {
      this.originalPhaseOpened.setRoundRange(this.firstRound, this.lastRound);
    }
  }

  hasAnyErrors() {
    return !!(this.phaseNameError || this.roundRangeError);
  }

  validateAll() {
    this.validatePhaseName();
    this.validateRoundRange();
  }

  setRequiredRoundRange() {
    const firstRound = this.originalPhaseOpened?.firstRoundNumberWithGames();
    if (firstRound !== undefined && firstRound > 0) {
      this.lowestRequiredRound = firstRound;
    }
    const lastRound = this.originalPhaseOpened?.lastRoundNumberWithGames();
    if (lastRound !== undefined && lastRound > 0) {
      this.highestRequiredRound = lastRound;
    }
  }

  shouldShowRoundFields() {
    return !!this.originalPhaseOpened?.usesNumericRounds();
  }

  setPhaseName(val: string) {
    const trimmedName = val.trim();
    this.phaseName = trimmedName;
    this.validatePhaseName();
    this.dataChangedReactCallback();
  }

  setFirstRound(val: string): number | undefined {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      this.firstRound = undefined;
    } else {
      this.firstRound = parsed;
    }
    this.validateRoundRange();
    this.dataChangedReactCallback();
    return this.firstRound;
  }

  setLastRound(val: string): number | undefined {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      this.lastRound = undefined;
    } else {
      this.lastRound = parsed;
    }
    this.validateRoundRange();
    this.dataChangedReactCallback();
    return this.lastRound;
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

  validateRoundRange() {
    if (this.firstRound === undefined || this.lastRound === undefined) {
      this.roundRangeError = 'Round numbers are required';
      return;
    }
    if (this.firstRound < this.lowestPossibleRound || this.lastRound > this.highestPossibleRound) {
      this.roundRangeError = `Rounds must be between ${this.lowestPossibleRound} and ${this.highestPossibleRound}`;
      return;
    }
    if (this.firstRound > this.lastRound) {
      this.roundRangeError = 'Round numbers are out of order';
      return;
    }
    if (this.lowestRequiredRound && this.firstRound > this.lowestRequiredRound) {
      this.roundRangeError = `Rounds ${this.lowestRequiredRound} through ${this.highestRequiredRound} must be included`;
      return;
    }
    if (this.highestRequiredRound && this.lastRound < this.highestRequiredRound) {
      this.roundRangeError = `Rounds ${this.lowestRequiredRound} through ${this.highestRequiredRound} must be included`;
      return;
    }
    this.roundRangeError = '';
  }
}

export const PhaseEditModalContext = createContext<TempPhaseManager>(new TempPhaseManager());
