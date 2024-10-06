import { createContext } from 'react';
import { Phase } from '../DataModel/Phase';
import { Pool } from '../DataModel/Pool';
import { Team } from '../DataModel/Team';

export default class PoolAssignmentModalManager {
  modalIsOpen: boolean = false;

  phase?: Phase;

  teamBeingAssigned?: Team;

  originalPoolAssigned?: Pool;

  selectedPool?: Pool;

  reset() {
    delete this.teamBeingAssigned;
    delete this.selectedPool;
  }

  openModal(team: Team, originalPool: Pool, phase: Phase) {
    this.teamBeingAssigned = team;
    this.originalPoolAssigned = originalPool;
    this.selectedPool = originalPool;
    this.phase = phase;
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
    if (!this.teamBeingAssigned) return;

    this.originalPoolAssigned?.removeTeam(this.teamBeingAssigned);
    this.selectedPool?.addTeam(this.teamBeingAssigned);
  }

  setSelectedPool(poolName: string) {
    this.selectedPool = this.phase?.findPoolByName(poolName);
  }
}

export const PoolAssignmentModalContext = createContext<PoolAssignmentModalManager>(new PoolAssignmentModalManager());
