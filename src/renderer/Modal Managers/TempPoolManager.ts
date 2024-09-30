import { createContext } from 'react';
import { Pool } from '../DataModel/Pool';
import { Phase, PhaseTypes } from '../DataModel/Phase';

export default class TempPoolManager {
  /** The pool being edited */
  originalPoolOpened?: Pool;

  phaseContainingPool?: Phase;

  modalIsOpen: boolean = false;

  allowCustomSchedule: boolean = false;

  poolName: string = '';

  poolNameError: string = '';

  numTeams?: number;

  numTeamsError: string = '';

  numRoundRobins?: number;

  hasCarryover: boolean = false;

  canSetCarryover: boolean = true;

  minRRs: number = 0;

  deletionDisabled: boolean = true;

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
    delete this.phaseContainingPool;
    this.poolNameError = '';
    this.numTeamsError = '';
    this.deletionDisabled = true;
  }

  openModal(pool: Pool, otherPoolNames: string[], phase: Phase, allowCustomSchedule: boolean) {
    this.modalIsOpen = true;
    this.originalPoolOpened = pool;
    this.phaseContainingPool = phase;
    this.poolName = pool.name;
    this.numTeams = pool.size;
    this.numRoundRobins = pool.roundRobins;
    this.hasCarryover = pool.hasCarryover;
    this.otherPoolNames = otherPoolNames;
    this.deletionDisabled = pool.poolTeams.length > 0 || phase.pools.length <= 1;
    this.allowCustomSchedule = allowCustomSchedule;

    const noMatchesYet = !phase.anyMatchesExist();
    this.minRRs = noMatchesYet ? 0 : pool.roundRobins;
    this.canSetCarryover = phase.phaseType === PhaseTypes.Playoff && noMatchesYet;

    this.carryoverScripting();
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
    if (this.numRoundRobins !== undefined) this.originalPoolOpened.roundRobins = this.numRoundRobins;
    this.originalPoolOpened.hasCarryover = this.hasCarryover;
  }

  hasAnyErrors() {
    return !!this.poolNameError;
  }

  validateAll() {
    this.validatePoolName();
    this.validateNumTeams();
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
    this.validateNumTeams();
    this.dataChangedReactCallback();
    return this.numTeams;
  }

  private validateNumTeams() {
    if (this.numTeams === undefined) {
      this.numTeamsError = 'Required';
      return;
    }
    if (this.numTeams < 1 || this.numTeams > TempPoolManager.maxNumTeams) {
      this.numTeamsError = 'Invalid number';
      return;
    }
    if (this.originalPoolOpened && this.numTeams < this.originalPoolOpened.poolTeams.length) {
      this.numTeamsError = `There are already ${this.originalPoolOpened.poolTeams.length} teams in this pool`;
      return;
    }
    this.numTeamsError = '';
  }

  private carryoverScripting() {
    if (this.numRoundRobins !== 1) {
      this.hasCarryover = false;
    }
  }

  setNumRoundRobins(val: number) {
    this.numRoundRobins = val;
    this.carryoverScripting();
    this.dataChangedReactCallback();
  }

  setHasCarryover(checked: boolean) {
    this.hasCarryover = checked;
    this.dataChangedReactCallback();
  }
}

export const PoolEditModalContext = createContext<TempPoolManager>(new TempPoolManager());
