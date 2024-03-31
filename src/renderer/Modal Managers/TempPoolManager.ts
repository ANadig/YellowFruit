import { createContext } from 'react';
import { Pool } from '../DataModel/Pool';

export default class TempPoolManager {
  /** The pool being edited */
  originalPoolOpened?: Pool;

  modalIsOpen: boolean = false;

  poolName: string = '';

  poolNameError: string = '';

  /** Names of other pool, for duplicate checking */
  otherPoolNames: string[] = [];

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  static readonly maxPoolNameLength = 200;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.poolName = '';
    delete this.originalPoolOpened;
    this.poolNameError = '';
  }

  openModal(pool: Pool, otherPoolNames: string[]) {
    this.modalIsOpen = true;
    this.originalPoolOpened = pool;
    this.poolName = pool.name;
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
  }

  hasAnyErrors() {
    return !!this.poolNameError;
  }

  validateAll() {
    this.validatePoolName();
  }

  setPoolName(val: string) {
    const trimmedName = val.trim();
    this.poolName = trimmedName;
    this.validatePoolName();
    this.dataChangedReactCallback();
  }

  validatePoolName() {
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
}

export const PoolEditModalContext = createContext<TempPoolManager>(new TempPoolManager());
