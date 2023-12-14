import { createContext } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Tournament from './DataModel/Tournament';
import { dateFieldChanged, textFieldChanged } from './Utils/GeneralUtils';
import IpcChannels from '../IPCChannels';
import { NullObjects } from './Utils/UtilTypes';

/** Holds the tournament the application is currently editing */
export class TournamentManager {
  /** The tournament being edited */
  tournament: Tournament;

  /** name of the currently-open file */
  fileName: string | null = null;

  /** Hook into the UI to tell it when it needs to update */
  dataChangedCallback: () => void;

  /** Is there data that hasn't been saved to a file? */
  unsavedData: boolean = false;

  readonly isNull: boolean = false;

  constructor() {
    this.tournament = new Tournament();
    this.dataChangedCallback = () => {};
    this.addIpcListeners();
  }

  addIpcListeners() {
    // needed so unit tests don't error out
    if (typeof window === 'undefined') {
      return;
    }

    console.log('addipclisteners');

    window.electron.ipcRenderer.on(IpcChannels.openYftFile, (fileName) => {
      this.openYftFile(fileName as string);
    });
    window.electron.ipcRenderer.on(IpcChannels.saveCurrentTournament, () => {
      this.saveYftFile();
    });
    window.electron.ipcRenderer.on(IpcChannels.tournamentSavedSuccessfully, () => {
      this.onSuccessfulYftSave();
    });
  }

  /** Open the file at the given path for editing */
  openYftFile(fileName: string) {
    this.fileName = fileName as string;
  }

  /** Write the current tournament to the current file */
  saveYftFile() {
    if (this.fileName === null) return;

    const fileContents = JSON.stringify(this.tournament.toYftFileObject());
    window.electron.ipcRenderer.sendMessage(IpcChannels.saveFile, this.fileName, fileContents);
  }

  onSuccessfulYftSave() {
    this.unsavedData = false;
    this.makeToast('Data saved');
  }

  /** Set the tournament's display name */
  setTournamentName(name: string): void {
    const trimmedName = name.trim();
    if (!textFieldChanged(this.tournament.name, trimmedName)) {
      return;
    }
    this.tournament.name = trimmedName;
    this.unsavedData = true;
    this.dataChangedCallback();
  }

  /** Set the free-text description of where the tournament is */
  setTournamentSiteName(siteName: string): void {
    const trimmedName = siteName.trim();
    if (!textFieldChanged(this.tournament.tournamentSite.name, trimmedName)) {
      return;
    }
    this.tournament.tournamentSite.name = trimmedName;
    this.unsavedData = true;
    this.dataChangedCallback();
  }

  setTournamentStartDate(dateFromUser: Dayjs | null) {
    const validDateOrNull = dateFromUser?.isValid() ? dateFromUser : null;
    if (!dateFieldChanged(dayjs(this.tournament.startDate), validDateOrNull)) {
      return;
    }
    this.tournament.startDate = validDateOrNull === null ? NullObjects.nullDate : validDateOrNull.toDate();
    this.unsavedData = true;
    this.dataChangedCallback();
  }

  /** Set the name of the question set used by the tournament */
  setQuestionSetname(setName: string): void {
    const trimmedName = setName.trim();
    if (!textFieldChanged(this.tournament.questionSet, trimmedName)) {
      return;
    }
    this.tournament.questionSet = trimmedName;
    this.unsavedData = true;
    this.dataChangedCallback();
  }

  makeToast(msg: string) {
    console.log(msg);
  }
}

/** Represents an error state where we haven't properly created or loaded a tournament to edit */
class NullTournamentManager extends TournamentManager {
  readonly isNull: boolean = true;

  constructor() {
    super();
    this.tournament.name = 'NullTournamentManager';
  }

  // eslint-disable-next-line class-methods-use-this
  addIpcListeners(): void {}
}

export const TournamentContext = createContext<TournamentManager>(new NullTournamentManager());
