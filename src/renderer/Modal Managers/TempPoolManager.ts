import { createContext } from 'react';
import { Pool } from '../DataModel/Pool';

export default class TempPoolManager {
  /** The pool being edited */
  originalPoolOpened?: Pool;

  modalIsOpen: boolean = false;

  poolName: string = '';

  poolNameError: string = '';

  numTeams?: number;

  numTeamsError: string = '';

  /** Names of other pool, for duplicate checking */
  otherPoolNames: string[] = [];

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  static readonly maxPoolNameLength = 200;

  static readonly maxNumTeams = 999;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.poolName = '';
    delete this.numTeams;
    delete this.originalPoolOpened;
    this.poolNameError = '';
    this.numTeamsError = '';
  }

  openModal(pool: Pool, otherPoolNames: string[]) {
    this.modalIsOpen = true;
    this.originalPoolOpened = pool;
    this.poolName = pool.name;
    this.numTeams = pool.size;
    this.otherPoolNames = otherPoolNames;
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
    if (!this.originalPoolOpened) return;
    this.originalPoolOpened.name = this.poolName;
    if (this.numTeams !== undefined) this.originalPoolOpened.size = this.numTeams;
  }

  hasAnyErrors() {
    return !!this.poolNameError;
  }

  validateAll() {
    this.validatePoolName();
    this.validateNumRounds();
  }

  setPoolName(val: string) {
    const trimmedName = val.trim();
    this.poolName = trimmedName;
    this.validatePoolName();
    this.dataChangedReactCallback();
  }

  private validatePoolName() {
    if (this.poolName === '') {
      this.poolNameError = 'Name is required';
      return;
    }
    if (this.poolName.length > TempPoolManager.maxPoolNameLength) {
      this.poolNameError = `Name cannot be more than ${TempPoolManager.maxPoolNameLength} characters`;
      return;
    }
    if (this.otherPoolNames.includes(this.poolName)) {
      this.poolNameError = 'A pool with this name already exists';
      return;
    }
    this.poolNameError = '';
  }

  setNumTeams(val: string) {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      this.numTeams = undefined;
    } else {
      this.numTeams = parsed;
    }
    this.validateNumRounds();
    this.dataChangedReactCallback();
    return this.numTeams;
  }

  private validateNumRounds() {
    if (this.numTeams === undefined) {
      this.numTeamsError = 'Required';
      return;
    }
    if (this.numTeams < 1 || this.numTeams > TempPoolManager.maxNumTeams) {
      this.numTeamsError = 'Invalid number';
      return;
    }
    this.numTeamsError = '';
  }
}

export const PoolEditModalContext = createContext<TempPoolManager>(new TempPoolManager());
