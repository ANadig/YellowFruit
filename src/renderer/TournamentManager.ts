import { createContext } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Tournament, { IQbjTournament, IYftFileTournament } from './DataModel/Tournament';
import { dateFieldChanged, textFieldChanged } from './Utils/GeneralUtils';
import { NullObjects } from './Utils/UtilTypes';
import { IpcMainToRend, IpcRendToMain } from '../IPCChannels';
import { IQbjObject, IQbjWholeFile, IRefTargetDict } from './DataModel/Interfaces';
import { QbjTypeNames } from './DataModel/QbjEnums';
import { collectRefTargets } from './DataModel/QbjUtils';
import AnswerType from './DataModel/AnswerType';
import { parseYftTournament } from './DataModel/FileParsing';
import StandardSchedule from './DataModel/StandardSchedule';
import { Team } from './DataModel/Team';
import Registration from './DataModel/Registration';
import { TempTeamManager } from './Modal Managers/TempTeamManager';
import { GenericModalManager } from './Modal Managers/GenericModalManager';

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

  genericModalManager: GenericModalManager;

  // properties for managing the Team/Registration edit workflow

  teamModalManager: TempTeamManager;

  /** The existing registration that we are editing a copy of, if any */
  registrationBeingModified: Registration | null = null;

  /** The existing team that we are editing a copy of, if any */
  teamBeingModified: Team | null = null;

  readonly isNull: boolean = false;

  constructor() {
    this.tournament = new Tournament();
    this.dataChangedReactCallback = () => {};
    this.addIpcListeners();
    this.setWindowTitle();
    this.genericModalManager = new GenericModalManager();

    this.teamModalManager = new TempTeamManager();
  }

  protected addIpcListeners() {
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
    let objFromFile: IQbjObject[] = [];
    try {
      objFromFile = JSON.parse(fileContents, (key, value) => {
        if (TournamentManager.isNameOfDateField(key)) return dayjs(value).toDate(); // must be ISO 8601 format
        return value;
      });
    } catch (err: any) {
      this.openGenericModal('Invalid File', 'This file does not contain valid JSON.');
    }

    if (objFromFile.length < 1) return;

    const loadedTournament = this.loadTournamentFromQbjObjects(objFromFile);
    if (loadedTournament === null) {
      return;
    }

    this.filePath = filePath as string;
    this.tournament = loadedTournament;
    this.displayName = this.tournament.name || '';
    this.unsavedData = false;
    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  /** Given an array of Qbj/Yft objects, parse them and create a tournament from the info */
  loadTournamentFromQbjObjects(objFromFile: IQbjObject[]): Tournament | null {
    const tournamentObj = TournamentManager.findTournamentObject(objFromFile);
    if (tournamentObj === null) {
      this.openGenericModal('Invalid File', 'This file doesn\'t contain a "Tournament" object.');
      return null;
    }

    let refTargets: IRefTargetDict = {};
    try {
      refTargets = collectRefTargets(objFromFile);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
    }
    console.log(refTargets);

    let loadedTournament: Tournament | null = null;
    try {
      loadedTournament = parseYftTournament(tournamentObj as IYftFileTournament, refTargets);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
    }

    return loadedTournament;
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

    const wholeFileObj = [this.tournament.toFileObject(false, true)];

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
    // this.makeToast('Data saved');
  }

  // #region Functions for changing the data from the UI

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

  setAnswerTypes(answerTypes: AnswerType[]) {
    this.tournament.scoringRules.answerTypes = answerTypes;
    this.onDataChanged();
  }

  setTimedRoundSetting(checked: boolean) {
    this.tournament.scoringRules.timed = checked;
    this.onDataChanged();
  }

  setNumTusPerRound(numTus: number) {
    if (numTus === this.tournament.scoringRules.maximumRegulationTossupCount) {
      return;
    }
    this.tournament.scoringRules.maximumRegulationTossupCount = numTus;
    this.onDataChanged();
  }

  setUseBonuses(checked: boolean) {
    this.tournament.scoringRules.useBonuses = checked;
    this.onDataChanged();
  }

  setBonusesBounceBack(checked: boolean) {
    this.tournament.scoringRules.bonusesBounceBack = checked;
    this.onDataChanged();
  }

  setMaxBonusScore(val: number) {
    if (this.tournament.scoringRules.maximumBonusScore === val) return;
    this.tournament.scoringRules.maximumBonusScore = val;
    this.onDataChanged();
  }

  setMinPartsPerBonus(val: number) {
    if (this.tournament.scoringRules.minimumPartsPerBonus === val) return;
    this.tournament.scoringRules.minimumPartsPerBonus = val;
    this.onDataChanged();
  }

  setMaxPartsPerBonus(val: number) {
    if (this.tournament.scoringRules.maximumPartsPerBonus === val) return;
    this.tournament.scoringRules.maximumPartsPerBonus = val;
    this.onDataChanged();
  }

  setPtsPerBonusPart(val: number | undefined) {
    if (this.tournament.scoringRules.pointsPerBonusPart === val) return;
    this.tournament.scoringRules.pointsPerBonusPart = val;
    this.onDataChanged();
  }

  setBonusDivisor(val: number) {
    if (this.tournament.scoringRules.bonusDivisor === val) return;
    this.tournament.scoringRules.bonusDivisor = val;
    this.onDataChanged();
  }

  setMaxPlayers(val: number) {
    if (this.tournament.scoringRules.maximumPlayersPerTeam === val) return;
    this.tournament.scoringRules.maximumPlayersPerTeam = val;
    this.onDataChanged();
  }

  setMinOverTimeTossupCount(val: number) {
    if (this.tournament.scoringRules.minimumOvertimeQuestionCount === val) return;
    this.tournament.scoringRules.minimumOvertimeQuestionCount = val;
    this.onDataChanged();
  }

  setOvertimeUsesBonuses(checked: boolean) {
    this.tournament.scoringRules.overtimeIncludesBonuses = checked;
    this.onDataChanged();
  }

  setUseLightning(checked: boolean) {
    this.tournament.scoringRules.lightningCountPerTeam = checked ? 1 : 0;
    this.onDataChanged();
  }

  setStandardSchedule(sched: StandardSchedule) {
    this.tournament.phases = sched.phases;
    this.onDataChanged();
  }

  tryDeleteTeam(reg: Registration, team: Team) {
    this.genericModalManager.open('Delete Team', `Are you sure you want to delete ${team.name}?`, 'No', 'Yes', () => {
      this.deleteTeam(reg, team);
    });
  }

  deleteTeam(reg: Registration, team: Team) {
    this.tournament.deleteTeamFromSeeds(team);
    reg.deleteTeam(team);
    if (reg.teams.length === 0) {
      this.tournament.deleteRegistration(reg);
    }
    this.onDataChanged();
  }

  // #endregion

  // #region Functions for handling temporary data used by dialogs

  /** Open with a new blank team */
  openTeamEditModalNewTeam() {
    this.teamModalManager.openModal();
  }

  openTeamEditModalExistingTeam(reg: Registration, team: Team) {
    this.teamModalManager.openModal(reg, team);
    this.registrationBeingModified = reg;
    this.teamBeingModified = team;
  }

  /** In the modal form, queue up a team of the given letter for the given registration */
  startNextTeamForRegistration(reg: Registration, letter: string) {
    this.teamModalManager.openModal(reg, undefined, letter);
    this.registrationBeingModified = reg;
    this.teamBeingModified = null;
  }

  /** Called when the team name in the team edit form is changed */
  onTeamRegistrationNameUpdate() {
    this.teamModalManager.copyDataFromOtherRegistration(this.registrationBeingModified, this.tournament.registrations);
    this.teamModalManager.checkForDuplicateTeam(this.tournament.registrations, this.teamBeingModified);
  }

  /** Called when the team letter field in the team edit form is changed */
  onTeamLetterUpdate() {
    this.teamModalManager.checkForDuplicateTeam(this.tournament.registrations, this.teamBeingModified);
  }

  teamEditModalAttemptToSave() {
    if (this.teamModalManager.preSaveValidation()) {
      this.teamModalSave();
    }
  }

  private teamModalSave() {
    // changing the team name means we might need to save to a different registration than we opened
    const actualRegToModify = this.teamModalManager.getRegistrationToSaveTo(
      this.registrationBeingModified,
      this.tournament.registrations,
    );
    const registrationSwitched = this.registrationBeingModified !== actualRegToModify;

    if (this.registrationBeingModified !== null && registrationSwitched) {
      this.registrationBeingModified.deleteTeam(this.teamBeingModified);
    }

    if (actualRegToModify === null) {
      this.tournament.addRegAndTeam(this.teamModalManager.tempRegistration, this.teamModalManager.tempTeam);
    } else if (this.teamBeingModified === null || registrationSwitched) {
      this.teamModalManager.saveRegistration(actualRegToModify, true);
      this.tournament.seedTeamsInRegistration(actualRegToModify);
    } else {
      this.teamModalManager.saveTeam(actualRegToModify, this.teamBeingModified);
    }
    this.teamEditModalClose(true);
    this.onDataChanged();
  }

  /** Close without saving */
  teamEditModalClose(skipOnDataChanged?: boolean) {
    this.registrationBeingModified = null;
    this.teamBeingModified = null;
    this.teamModalManager.closeModal();
    if (!skipOnDataChanged) this.onDataChanged(true);
  }

  // #endregion

  /** Should be called anytime the user modifies something */
  private onDataChanged(doesntAffectFile = false) {
    this.dataChangedReactCallback();
    if (doesntAffectFile) return;

    this.unsavedData = true;
    this.setWindowTitle();
  }

  protected setWindowTitle() {
    let title = this.getFileDisplayName();
    if (this.unsavedData) title = title.concat('*');
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.setWindowTitle, title);
  }

  private getFileDisplayName() {
    if (this.filePath === null) return TournamentManager.newTournamentName;
    if (this.displayName) return this.displayName;

    return this.filePath.substring(this.filePath.lastIndexOf('\\') + 1, this.filePath.lastIndexOf('.'));
  }

  openGenericModal(title: string, contents: string) {
    this.genericModalManager.open(title, contents);
    this.dataChangedReactCallback();
  }

  closeGenericModal() {
    this.genericModalManager.close();
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

  // eslint-disable-next-line class-methods-use-this
  protected setWindowTitle(): void {}
}

/** React context that elements can use to access the TournamentManager and its data without
 * having to thread data and data-changing functions up and down the react tree
 */
export const TournamentContext = createContext<TournamentManager>(new NullTournamentManager());
