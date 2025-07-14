import { createContext } from 'react';
import { Phase } from '../DataModel/Phase';

export default class SqbsExportModalManager {
  modalIsOpen: boolean = false;

  availablePhases: Phase[] = [];

  selectedPhases: Phase[] = [];

  combineFiles: boolean = false;

  dataChangedReactCallback: () => void;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.availablePhases = [];
    this.selectedPhases = [];
    this.combineFiles = false;
  }

  openModal(phases: Phase[]) {
    this.availablePhases = phases.slice();
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.reset();
  }

  handleSelectedPhaseChange(phase: Phase, checked: boolean) {
    if (checked && !this.selectedPhases.includes(phase)) {
      this.selectedPhases.push(phase);
    }
    if (!checked) {
      this.selectedPhases = this.selectedPhases.filter((ph) => ph !== phase);
    }
    this.dataChangedReactCallback();
  }

  handleCombineFilesChange(combineFiles: boolean) {
    this.combineFiles = combineFiles;
    this.dataChangedReactCallback();
  }
}

export const SqbsExportModalContext = createContext<SqbsExportModalManager>(new SqbsExportModalManager());
