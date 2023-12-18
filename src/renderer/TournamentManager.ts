import { createContext } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Tournament, { IQbjTournament, IYftFileTournament } from './DataModel/Tournament';
import { dateFieldChanged, textFieldChanged } from './Utils/GeneralUtils';
import { NullObjects } from './Utils/UtilTypes';
import { IpcMainToRend, IpcRendToMain } from '../IPCChannels';
import { IQbjObject, IQbjWholeFile } from './DataModel/Interfaces';
import { QbjTypeNames } from './DataModel/QbjEnums';
import { collectRefTargets } from './DataModel/QbjUtils';

/** Holds the tournament the application is currently editing */
export class TournamentManager {
  /** The tournament being edited */
  tournament: Tournament;

  /** name of the currently-open file */
  filePath: string | null = null;

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

    window.electron.ipcRenderer.on(IpcMainToRend.openYftFile, (filePath, fileContents) => {
      this.openYftFile(filePath as string, fileContents as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.saveCurrentTournament, () => {
      this.saveYftFile();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.tournamentSavedSuccessfully, () => {
      this.onSuccessfulYftSave();
    });
  }

  /** Is this a property in a JSON file that we should try to parse into a date? */
  static isNameOfDateField(key: string) {
    return key === 'startDate'; // additional fields in QBJ files aren't used or stored in YF
  }

  /** Parse file contents and load tournament for editing */
  private openYftFile(filePath: string, fileContents: string) {
    this.filePath = filePath as string;

    const objFromFile: IQbjObject[] = JSON.parse(fileContents, (key, value) => {
      if (TournamentManager.isNameOfDateField(key)) return dayjs(value).toDate; // must be ISO 8601 format
      return value;
    });

    const tournamentObj = TournamentManager.findTournamentObject(objFromFile);
    if (tournamentObj === null) {
      return; // TODO: some sort of error
    }

    const refTargets = collectRefTargets(objFromFile);
    const loadedTournament = Tournament.fromYftFileObject(tournamentObj as IYftFileTournament, refTargets);
    if (loadedTournament === null) return;
    this.tournament = loadedTournament;
  }

  private static getTournamentFromQbjFile(fileObj: IQbjWholeFile): IQbjTournament | null {
    if (!fileObj.objects) return null;
    return this.findTournamentObject(fileObj.objects);
  }

  private static findTournamentObject(objects: IQbjObject[]): IQbjTournament | null {
    for (const obj of objects) {
      if (obj.type === QbjTypeNames.Tournament) return obj as IQbjTournament;
    }
    return null;
  }

  /** Write the current tournament to the current file */
  private saveYftFile() {
    if (this.filePath === null) return;

    const wholeFileObj = [this.tournament.toYftFileObject()];

    const fileContents = JSON.stringify(wholeFileObj, (key, value) => {
      if (TournamentManager.isNameOfDateField(key)) return dayjs(value).toISOString();
      return value;
    });
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.saveFile, this.filePath, fileContents);
  }

  private onSuccessfulYftSave() {
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
