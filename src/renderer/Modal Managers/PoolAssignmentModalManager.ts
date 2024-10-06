import { createContext } from 'react';
import { Phase, PhaseTypes } from '../DataModel/Phase';
import { Pool } from '../DataModel/Pool';
import { Team } from '../DataModel/Team';

export default class PoolAssignmentModalManager {
  modalIsOpen: boolean = false;

  phase?: Phase;

  teamBeingAssigned?: Team;

  originalPoolAssigned?: Pool;

  selectedPool?: Pool;

  showNoneOption: boolean = false;

  acceptCallback: () => void;

  static readonly noneOptionKey = 'none-pool-radio-option';

  constructor() {
    this.acceptCallback = () => {};
  }

  reset() {
    delete this.teamBeingAssigned;
    delete this.selectedPool;
  }

  openModal(team: Team, phase: Phase, acceptCallback: () => void, originalPool?: Pool) {
    this.teamBeingAssigned = team;
    this.originalPoolAssigned = originalPool;
    this.selectedPool = originalPool;
    this.phase = phase;
    this.showNoneOption = phase.phaseType === PhaseTypes.Playoff;
    this.acceptCallback = acceptCallback;
    this.modalIsOpen = true;
  }

  closeModal(shouldSave: boolean) {
    if (shouldSave) {
      this.saveData();
    }
    this.modalIsOpen = false;
    this.reset();
  }

  saveData() {
    this.acceptCallback();
  }

  /** A function that just removes the team from the old pool and adds to the new. Available for use as an accept callback. */
  simplePoolSwitch() {
    if (!this.teamBeingAssigned) return;

    this.originalPoolAssigned?.removeTeam(this.teamBeingAssigned);
    this.selectedPool?.addTeam(this.teamBeingAssigned);
  }

  setSelectedPool(optionKey: string) {
    if (optionKey === PoolAssignmentModalManager.noneOptionKey) {
      delete this.selectedPool;
      return;
    }
    this.selectedPool = this.phase?.findPoolByName(optionKey);
  }
}

export const PoolAssignmentModalContext = createContext<PoolAssignmentModalManager>(new PoolAssignmentModalManager());
