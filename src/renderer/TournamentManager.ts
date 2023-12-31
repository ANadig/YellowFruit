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

  /** Display name for the file being edited */
  displayName: string = '';

  /** What to call this tournament when there's no file */
  static newTournamentName = 'New Tournament';

  /** Hook into the UI to tell it when it needs to update */
  dataChangedReactCallback: () => void;

  /** Is there data that hasn't been saved to a file? */
  unsavedData: boolean = false;

  readonly isNull: boolean = false;

  constructor() {
    this.tournament = new Tournament();
    this.dataChangedReactCallback = () => {};
    this.addIpcListeners();
    this.setWindowTitle();
  }

  addIpcListeners() {
    // needed so unit tests don't error out
    if (typeof window === 'undefined') {
      return;
    }

    window.electron.ipcRenderer.on(IpcMainToRend.openYftFile, (filePath, fileContents) => {
      this.openYftFile(filePath as string, fileContents as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.saveCurrentTournament, () => {
      this.saveYftFile();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.tournamentSavedSuccessfully, () => {
      this.onSuccessfulYftSave();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.newTournament, () => {
      this.newTournament();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.saveAsCommand, (filePath) => {
      this.yftSaveAs(filePath as string);
    });
  }

  private newTournament() {
    this.tournament = new Tournament();
    this.filePath = null;
    this.displayName = '';
    this.unsavedData = false;

    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  /** Parse file contents and load tournament for editing */
  private openYftFile(filePath: string, fileContents: string) {
    this.filePath = filePath as string;

    const objFromFile: IQbjObject[] = JSON.parse(fileContents, (key, value) => {
      if (TournamentManager.isNameOfDateField(key)) return dayjs(value).toDate(); // must be ISO 8601 format
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
    this.displayName = this.tournament.name || '';
    this.unsavedData = false;
    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  /** Is this a property in a JSON file that we should try to parse a date from? */
  static isNameOfDateField(key: string) {
    return key === 'startDate'; // additional fields in QBJ files aren't used or stored in YF
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

  /** Save the tournament to the given file and switch context to that file */
  yftSaveAs(filePath: string) {
    this.filePath = filePath;
    this.saveYftFile();
  }

  /** Write the current tournament to the current file */
  private saveYftFile() {
    if (this.filePath === null) {
      window.electron.ipcRenderer.sendMessage(IpcRendToMain.saveAsDialog);
      return;
    }

    const wholeFileObj = [this.tournament.toYftFileObject()];

    const fileContents = JSON.stringify(wholeFileObj, (key, value) => {
      if (TournamentManager.isNameOfDateField(key)) {
        if (value) return dayjs(value).toISOString();
        return undefined;
      }
      return value;
    });
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.saveFile, this.filePath, fileContents);
  }

  private onSuccessfulYftSave() {
    this.displayName = this.tournament.name || '';
    this.unsavedData = false;
    this.setWindowTitle();
    this.makeToast('Data saved');
  }

  /** Set the tournament's display name */
  setTournamentName(name: string): void {
    const trimmedName = name.trim();
    if (!textFieldChanged(this.tournament.name, trimmedName)) {
      return;
    }
    this.tournament.name = trimmedName;
    this.onDataChanged();
  }

  /** Set the free-text description of where the tournament is */
  setTournamentSiteName(siteName: string): void {
    const trimmedName = siteName.trim();
    if (!textFieldChanged(this.tournament.tournamentSite.name, trimmedName)) {
      return;
    }
    this.tournament.tournamentSite.name = trimmedName;
    this.onDataChanged();
  }

  setTournamentStartDate(dateFromUser: Dayjs | null) {
    const validDateOrNull = dateFromUser?.isValid() ? dateFromUser : null;
    if (!dateFieldChanged(dayjs(this.tournament.startDate), validDateOrNull)) {
      return;
    }
    this.tournament.startDate = validDateOrNull === null ? NullObjects.nullDate : validDateOrNull.toDate();
    this.onDataChanged();
  }

  /** Set the name of the question set used by the tournament */
  setQuestionSetname(setName: string): void {
    const trimmedName = setName.trim();
    if (!textFieldChanged(this.tournament.questionSet, trimmedName)) {
      return;
    }
    this.tournament.questionSet = trimmedName;
    this.onDataChanged();
  }

  /** Should be called anytime the user modifies something */
  private onDataChanged(doesntAffectFile = false) {
    this.dataChangedReactCallback();
    if (doesntAffectFile) return;

    this.unsavedData = true;
    this.setWindowTitle();
  }

  private makeToast(msg: string) {
    console.log(msg);
  }

  private setWindowTitle() {
    let title = this.getFileDisplayName();
    if (this.unsavedData) title = title.concat('*');
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.setWindowTitle, title);
  }

  private getFileDisplayName() {
    if (this.filePath === null) return TournamentManager.newTournamentName;
    if (this.displayName) return this.displayName;

    return this.filePath.substring(this.filePath.lastIndexOf('\\') + 1, this.filePath.lastIndexOf('.'));
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
