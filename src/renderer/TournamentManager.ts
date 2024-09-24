import { createContext } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Tournament, { IQbjTournament, IYftFileTournament, NullTournament } from './DataModel/Tournament';
import { dateFieldChanged, getFileNameFromPath, textFieldChanged } from './Utils/GeneralUtils';
import { NullObjects } from './Utils/UtilTypes';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain } from '../IPCChannels';
import { IQbjWholeFile, IRefTargetDict } from './DataModel/Interfaces';
import AnswerType from './DataModel/AnswerType';
import StandardSchedule from './DataModel/StandardSchedule';
import { Team } from './DataModel/Team';
import Registration from './DataModel/Registration';
import { TempTeamManager } from './Modal Managers/TempTeamManager';
import { GenericModalManager } from './Modal Managers/GenericModalManager';
import { collectRefTargets, findTournamentObject } from './DataModel/QbjUtils2';
import FileParser from './DataModel/FileParsing';
import { TempMatchManager } from './Modal Managers/TempMatchManager';
import { Match } from './DataModel/Match';
import { FileSwitchActions, IYftBackupFile, StatReportHtmlPage } from '../SharedUtils';
import { StatReportFileNames, StatReportPages } from './Enums';
import { Pool } from './DataModel/Pool';
import { PoolStats } from './DataModel/StatSummaries';
import { Phase, WildCardRankingMethod } from './DataModel/Phase';
import { Round } from './DataModel/Round';
import TempPhaseManager from './Modal Managers/TempPhaseManager';
import TempPoolManager from './Modal Managers/TempPoolManager';
import TempRankManager from './Modal Managers/TempRankManager';
import { snakeCaseToCamelCase, camelCaseToSnakeCase } from './DataModel/CaseConversion';
import { CommonRuleSets } from './DataModel/ScoringRules';
import { qbjFileValidVersion } from './DataModel/QbjUtils';

/** Holds the tournament the application is currently editing */
export class TournamentManager {
  /** The tournament being edited */
  tournament: Tournament = NullTournament;

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

  currentTeamsPageView: number = 0;

  currentGamesPageView: number = 0;

  genericModalManager: GenericModalManager;

  // properties for managing the Team/Registration edit workflow

  teamModalManager: TempTeamManager;

  /** The existing registration that we are editing a copy of, if any */
  registrationBeingModified: Registration | null = null;

  /** The existing team that we are editing a copy of, if any */
  teamBeingModified: Team | null = null;

  // properties for managing the Match edit workflow
  matchModalManager: TempMatchManager;

  matchBeingModified: Match | null = null;

  phaseModalManager: TempPhaseManager;

  poolModalManager: TempPoolManager;

  rankModalManager: TempRankManager;

  /** When did we last update the stat report? */
  inAppStatReportGenerated: Date;

  recoveredBackup?: IYftBackupFile;

  readonly isNull: boolean = false;

  constructor() {
    this.dataChangedReactCallback = () => {};
    this.addIpcListeners();

    this.genericModalManager = new GenericModalManager();
    this.teamModalManager = new TempTeamManager();
    this.matchModalManager = new TempMatchManager();
    this.phaseModalManager = new TempPhaseManager();
    this.poolModalManager = new TempPoolManager();
    this.rankModalManager = new TempRankManager();
    this.inAppStatReportGenerated = new Date();

    this.newTournament();

    window.electron.ipcRenderer.sendMessage(IpcBidirectional.LoadBackup);
  }

  protected addIpcListeners() {
    window.electron.ipcRenderer.on(IpcMainToRend.CheckForUnsavedData, (action) => {
      this.checkForUnsavedData(action as FileSwitchActions);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.openYftFile, (filePath, fileContents, curYfVersion) => {
      this.openYftFile(filePath as string, fileContents as string, curYfVersion as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.saveCurrentTournament, () => {
      this.saveYftFile();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.tournamentSavedSuccessfully, (filePath) => {
      this.onSuccessfulYftSave(filePath as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.newTournament, () => {
      this.newTournament();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.saveAsCommand, (filePath) => {
      this.yftSaveAs(filePath as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.GeneratedInAppStatReport, () => {
      this.onFinishInAppStatReport();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.RequestStatReport, (filePathStart) => {
      this.generateHtmlReport(filePathStart as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.GenerateBackup, () => {
      this.saveBackup();
    });
    window.electron.ipcRenderer.on(IpcBidirectional.LoadBackup, (contents) => {
      this.parseBackup(contents as string);
    });
    window.electron.ipcRenderer.on(IpcBidirectional.ExportQbjFile, (filePath) => {
      this.exportQbjFile(filePath as string);
    });
  }

  private checkForUnsavedData(action: FileSwitchActions) {
    if (!this.unsavedData) {
      window.electron.ipcRenderer.sendMessage(IpcRendToMain.ContinueWithAction, action);
      return;
    }

    this.genericModalManager.openUnsavedDataDialog(action, (saveData: boolean = false) => {
      if (saveData) {
        this.saveYftFile(action);
      } else {
        window.electron.ipcRenderer.sendMessage(IpcRendToMain.ContinueWithAction, action);
      }
    });
  }

  private newTournament() {
    this.tournament = new Tournament();
    this.modalManagersSetTournament();
    this.filePath = null;
    this.displayName = '';
    this.unsavedData = false;

    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  /** Parse file contents and load tournament for editing */
  private openYftFile(filePath: string, fileContents: string, curYfVersion: string) {
    const objFromFile = this.parseJSON(fileContents);
    if (!objFromFile) return;
    this.parseObjectFromFile(filePath, objFromFile, curYfVersion);
  }

  private parseObjectFromFile(filePath: string, objFromFile: object, curYfVersion?: string) {
    snakeCaseToCamelCase(objFromFile);
    const loadedTournament = this.loadTournamentFromQbjObjects(objFromFile as IQbjWholeFile, curYfVersion);
    if (loadedTournament === null) {
      return;
    }

    this.filePath = filePath as string;
    this.tournament = loadedTournament;
    this.modalManagersSetTournament();
    this.displayName = this.tournament.name || '';
    this.unsavedData = false;
    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  private parseJSON(fileContents: string) {
    let objFromFile: object | null = null;
    try {
      objFromFile = JSON.parse(fileContents, (key, value) => {
        if (TournamentManager.isNameOfDateField(key)) return dayjs(value).toDate(); // must be ISO 8601 format
        return value;
      });
    } catch (err: any) {
      this.openGenericModal('Invalid File', 'This file does not contain valid JSON.');
    }
    return objFromFile;
  }

  /** Given an array of Qbj/Yft objects, parse them and create a tournament from the info */
  loadTournamentFromQbjObjects(objFromFile: IQbjWholeFile, curYfVersion?: string): Tournament | null {
    if (!qbjFileValidVersion(objFromFile)) {
      this.openGenericModal('Invalid File', "This file doesn't use a supported version of the tournament schema.");
      return null;
    }
    const objectList = objFromFile.objects;
    if (!objectList) {
      this.openGenericModal('Invalid File', "This file doesn't contain any tournament schema objects.");
      return null;
    }
    const tournamentObj = findTournamentObject(objectList);
    if (tournamentObj === null) {
      this.openGenericModal('Invalid File', 'This file doesn\'t contain a "Tournament" object.');
      return null;
    }

    let refTargets: IRefTargetDict = {};
    try {
      refTargets = collectRefTargets(objectList);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
    }

    const parser = new FileParser(refTargets);
    let loadedTournament: Tournament | null = null;
    try {
      loadedTournament = parser.parseYftTournament(tournamentObj as IYftFileTournament, curYfVersion);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
    }

    return loadedTournament;
  }

  /** Is this a property in a JSON file that we should try to parse a date from? */
  static isNameOfDateField(key: string) {
    return (
      key === 'startDate' || key === 'endDate' || key === 'start_date' || key === 'end_date' || key === 'savedAtTime'
    );
  }

  private static getTournamentFromQbjFile(fileObj: IQbjWholeFile): IQbjTournament | null {
    if (!fileObj.objects) return null;
    return findTournamentObject(fileObj.objects);
  }

  /** Save the tournament to the given file and switch context to that file */
  yftSaveAs(filePath: string) {
    this.filePath = filePath;
    this.saveYftFile();
  }

  /** Write the current tournament to the current file */
  private saveYftFile(subsequentAction?: FileSwitchActions) {
    const fileObj = this.generateWholeFileObj();
    const fileContents = TournamentManager.makeJSON(fileObj);
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.saveFile, this.filePath, fileContents, subsequentAction);
  }

  private exportQbjFile(filePath: string) {
    const fileObj = this.generateWholeFileObj(true);
    const fileContents = TournamentManager.makeJSON(fileObj);
    window.electron.ipcRenderer.sendMessage(IpcBidirectional.ExportQbjFile, filePath, fileContents);
  }

  private saveBackup() {
    const fileContents = this.generateWholeFileObj();
    const backupObj: IYftBackupFile = {
      filePath: this.filePath || '',
      savedAtTime: new Date(),
      fileContents,
    };
    const backupFileContents = TournamentManager.makeJSON(backupObj);
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.SaveBackup, backupFileContents);
  }

  private parseBackup(fileContents: string) {
    if (fileContents === '') {
      window.electron.ipcRenderer.sendMessage(IpcRendToMain.StartAutosave);
      return;
    }
    const objFromFile = this.parseJSON(fileContents);
    if (!objFromFile) {
      window.electron.ipcRenderer.sendMessage(IpcRendToMain.StartAutosave);
      return;
    }

    this.recoveredBackup = objFromFile as IYftBackupFile;
    this.onDataChanged(true);
  }

  useRecoveredBackup() {
    if (!this.recoveredBackup) return;
    this.parseObjectFromFile(this.recoveredBackup.filePath, this.recoveredBackup.fileContents);
    if (this.recoveredBackup.filePath !== '') this.saveYftFile();
    this.discardRecoveredBackup();
  }

  discardRecoveredBackup() {
    delete this.recoveredBackup;
    this.onDataChanged(true);
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.StartAutosave);
  }

  private generateWholeFileObj(qbjOnly: boolean = false) {
    const wholeFileObj: IQbjWholeFile = { version: '2.1.1', objects: [this.tournament.toFileObject(qbjOnly, true)] };
    camelCaseToSnakeCase(wholeFileObj);
    return wholeFileObj;
  }

  private static makeJSON(obj: object) {
    return JSON.stringify(obj, (key, value) => {
      if (TournamentManager.isNameOfDateField(key)) {
        if (value) return dayjs(value).toISOString();
        return undefined;
      }
      return value;
    });
  }

  private onSuccessfulYftSave(filePath?: string) {
    this.displayName = this.tournament.name || '';
    if (filePath) this.setFilePath(filePath);
    this.unsavedData = false;
    this.setWindowTitle();
    // this.makeToast('Data saved');
  }

  private setFilePath(path: string) {
    this.filePath = path ?? null;
  }

  compileStats() {
    this.tournament.compileStats(false, true);
    this.onFinishInAppStatReport();
  }

  /**
   * Generate html reports and direct the main process to write them to files
   * @param filePathStart The full file path, minus the identifier of the specific page (e.g. _standing.html), if saving externally. E.g. C:\mydata\mystatreport.
   * If saving to the in-app stat report, should be undefined
   */
  generateHtmlReport(filePathStart?: string) {
    let filePrefix;
    if (filePathStart) filePrefix = getFileNameFromPath(filePathStart);

    this.tournament.setHtmlFilePrefix(filePrefix);

    this.tournament.compileStats(true);
    const reports: StatReportHtmlPage[] = [
      { fileName: StatReportFileNames[StatReportPages.Standings], contents: this.tournament.makeHtmlStandings() },
      { fileName: StatReportFileNames[StatReportPages.Individuals], contents: this.tournament.makeHtmlIndividuals() },
      { fileName: StatReportFileNames[StatReportPages.Scoreboard], contents: this.tournament.makeHtmlScoreboard() },
      { fileName: StatReportFileNames[StatReportPages.TeamDetails], contents: this.tournament.makeHtmlTeamDetail() },
      {
        fileName: StatReportFileNames[StatReportPages.PlayerDetails],
        contents: this.tournament.makeHtmlPlayerDetail(),
      },
      { fileName: StatReportFileNames[StatReportPages.RoundReport], contents: this.tournament.makeHtmlRoundReport() },
    ];
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.WriteStatReports, reports, filePathStart);
  }

  /** Prompt the user for a place to save the reports. Main will then tell renderer to generate reports with the chosen file name */
  exportStatReports() {
    const defaultFilePrefix = this.filePath ? getFileNameFromPath(this.filePath) : undefined;
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.StatReportSaveDialog, defaultFilePrefix);
  }

  onFinishInAppStatReport() {
    this.inAppStatReportGenerated = new Date();
    this.onDataChanged(true);
  }

  modalManagersSetTournament() {
    this.teamModalManager.tournament = this.tournament;
    this.matchModalManager.tournament = this.tournament;
  }

  // #region Functions for changing the data from the UI

  /** Keep track of which view the user is on, so that they can leave the Teams page, then
   *  come back and see the samve view.
   */
  setTeamsPageView(whichPage: number) {
    this.currentTeamsPageView = whichPage;
    this.onDataChanged(true);
  }

  /** Keep track of which view the user is on, so that they can leave the Games page, then
   *  come back and see the samve view.
   */
  setGamesPageView(whichPage: number) {
    this.currentGamesPageView = whichPage;
    this.onDataChanged(true);
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

  setTournamentEndDate(dateFromUser: Dayjs | null) {
    const validDateOrNull = dateFromUser?.isValid() ? dateFromUser : null;
    if (!dateFieldChanged(dayjs(this.tournament.endDate), validDateOrNull)) {
      return;
    }
    this.tournament.endDate = validDateOrNull === null ? NullObjects.nullDate : validDateOrNull.toDate();
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

  setTrackPlayerYear(checked: boolean) {
    this.tournament.trackPlayerYear = checked;
    this.onDataChanged();
  }

  setTrackSmallSchool(checked: boolean) {
    this.tournament.trackSmallSchool = checked;
    this.onDataChanged();
  }

  setTrackJV(checked: boolean) {
    this.tournament.trackJV = checked;
    this.onDataChanged();
  }

  setTrackUG(checked: boolean) {
    this.tournament.trackUG = checked;
    this.onDataChanged();
  }

  setTrackDiv2(checked: boolean) {
    this.tournament.trackDiv2 = checked;
    this.onDataChanged();
  }

  applStdRuleSet(ruleSet: CommonRuleSets) {
    this.tournament.applyRuleSet(ruleSet);
    this.onDataChanged();
  }

  setAnswerTypes(answerTypes: AnswerType[]) {
    this.tournament.scoringRules.answerTypes = answerTypes;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setTimedRoundSetting(checked: boolean) {
    this.tournament.scoringRules.timed = checked;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setNumTusPerRound(numTus: number) {
    if (numTus === this.tournament.scoringRules.maximumRegulationTossupCount) {
      return;
    }
    this.tournament.scoringRules.maximumRegulationTossupCount = numTus;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setUseBonuses(checked: boolean) {
    this.tournament.scoringRules.setUseBonuses(checked);
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setBonusesBounceBack(checked: boolean) {
    this.tournament.scoringRules.bonusesBounceBack = checked;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setMaxBonusScore(val: number) {
    if (this.tournament.scoringRules.maximumBonusScore === val) return;
    this.tournament.scoringRules.maximumBonusScore = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setMinPartsPerBonus(val: number) {
    if (this.tournament.scoringRules.minimumPartsPerBonus === val) return;
    this.tournament.scoringRules.minimumPartsPerBonus = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setMaxPartsPerBonus(val: number) {
    if (this.tournament.scoringRules.maximumPartsPerBonus === val) return;
    this.tournament.scoringRules.maximumPartsPerBonus = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setPtsPerBonusPart(val: number | undefined) {
    if (this.tournament.scoringRules.pointsPerBonusPart === val) return;
    this.tournament.scoringRules.pointsPerBonusPart = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setBonusDivisor(val: number) {
    if (this.tournament.scoringRules.bonusDivisor === val) return;
    this.tournament.scoringRules.bonusDivisor = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setMaxPlayers(val: number) {
    if (this.tournament.scoringRules.maximumPlayersPerTeam === val) return;
    this.tournament.scoringRules.maximumPlayersPerTeam = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setMinOverTimeTossupCount(val: number) {
    if (this.tournament.scoringRules.minimumOvertimeQuestionCount === val) return;
    this.tournament.scoringRules.minimumOvertimeQuestionCount = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setOvertimeUsesBonuses(checked: boolean) {
    this.tournament.scoringRules.overtimeIncludesBonuses = checked;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setUseLightning(checked: boolean) {
    this.tournament.scoringRules.lightningCountPerTeam = checked ? 1 : 0;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setStandardSchedule(sched: StandardSchedule) {
    this.tournament.setStandardSchedule(sched);
    this.onDataChanged();
  }

  setPhaseWCRankMethod(phase: Phase, method: WildCardRankingMethod) {
    phase.wildCardRankingMethod = method;
    this.onDataChanged();
  }

  addTiebreakerAfter(phase: Phase) {
    this.tournament.addTiebreakerAfter(phase);
    this.onDataChanged();
  }

  addPlayoffPhase() {
    this.tournament.addBlankPhase();
    this.onDataChanged();
  }

  deletePhase(phase: Phase) {
    this.tournament.deletePhase(phase);
    this.onDataChanged();
  }

  forcePhaseToBeNumeric(phase: Phase) {
    this.tournament.forcePhaseToBeNumeric(phase);
    this.onDataChanged();
  }

  undoForcePhaseToBeNumeric(phase: Phase) {
    this.tournament.undoForcePhaseToBeNumeric(phase);
    this.onDataChanged();
  }

  addFinalsPhase() {
    this.tournament.addFinalsPhase();
    this.onDataChanged();
  }

  addPool(phase: Phase) {
    phase.addBlankPool();
    this.onDataChanged();
  }

  deletePool(phase: Phase, pool: Pool) {
    phase.deletePool(pool);
    this.onDataChanged();
  }

  tryDeleteTeam(reg: Registration, team: Team) {
    this.genericModalManager.open('Delete Team', `Are you sure you want to delete ${team.name}?`, 'N&o', '&Yes', () =>
      this.deleteTeam(reg, team),
    );
  }

  deleteTeam(reg: Registration, team: Team) {
    this.tournament.deleteTeam(reg, team);
    this.onDataChanged();
  }

  shiftSeedUp(seedNo: number) {
    this.tournament.shiftSeedUp(seedNo);
    this.onDataChanged();
  }

  shiftSeedDown(seedNo: number) {
    this.tournament.shiftSeedDown(seedNo);
    this.onDataChanged();
  }

  seedListDragDrop(seedToMove: string, seedDroppedOn: number) {
    const seedNoToMove = parseInt(seedToMove, 10);
    if (Number.isNaN(seedNoToMove)) return;

    const newPosition = seedNoToMove < seedDroppedOn ? seedDroppedOn - 1 : seedDroppedOn;
    if (seedNoToMove === newPosition) return;

    this.tournament.insertSeedAtPosition(seedNoToMove, newPosition);
    this.onDataChanged();
  }

  swapSeeds(droppedSeed: string, targetSeed: number) {
    const droppedSeedNo = parseInt(droppedSeed, 10);
    if (Number.isNaN(droppedSeedNo)) return;

    this.tournament.swapSeeds(droppedSeedNo, targetSeed);
    this.onDataChanged();
  }

  tryDeleteMatch(match: Match, round: Round) {
    this.genericModalManager.open('Delete Game', 'Are you sure you want to delete this game?', 'N&o', '&Yes', () =>
      this.deleteMatch(match, round),
    );
  }

  deleteMatch(match: Match, round: Round) {
    round.deleteMatch(match);
    this.tournament.calcHasMatchData();
    this.onDataChanged();
  }

  addTeamtoPlayoffPool(team: Team, pool: Pool, nextPhase: Phase) {
    pool.addTeam(team);
    this.tournament.carryOverMatches(
      nextPhase,
      pool.poolTeams.map((pt) => pt.team),
    );
    this.tournament.getPrevFullPhase(nextPhase)?.markTeamDidNotAdvance(team, false);
    this.compileStats();
    this.onDataChanged();
  }

  /** Take the teams from one pool, and add them to the pools they've been calculated (or overridden) to be in */
  rebracketPool(poolStats: PoolStats, nextPhase: Phase) {
    for (const ptStats of poolStats.poolTeams) {
      if (!ptStats.currentSeed) continue;
      if (nextPhase.findPoolWithTeam(ptStats.team)) continue; // already rebracketed
      nextPhase.findPoolWithSeed(ptStats.currentSeed)?.addTeam(ptStats.team);
    }
    this.tournament.carryOverMatches(
      nextPhase,
      poolStats.poolTeams.map((ptStats) => ptStats.team),
    );
    this.compileStats();
    this.onDataChanged();
  }

  /**
   * Put a team in the the specified pool, removing them from a different pool if needed
   * @param team team to move
   * @param nextPhase phase to put the team in
   * @param newPool pool to put the team in; if undefined, just remove the team from their existing pool
   */
  overridePlayoffPoolAssignment(team: Team, nextPhase: Phase, newPool?: Pool) {
    const curPool = nextPhase.findPoolWithTeam(team);
    if (curPool && curPool === newPool) return;

    this.tournament.clearCarryoverMatches(team, nextPhase);
    if (curPool) curPool.removeTeam(team);
    if (newPool) {
      this.addTeamtoPlayoffPool(team, newPool, nextPhase);
    } else {
      this.tournament.getPrevFullPhase(nextPhase)?.markTeamDidNotAdvance(team, true);
    }

    this.compileStats();
    this.onDataChanged();
  }

  reorderPools(phase: Phase, positionDraggedStr: string, positionDroppedOn: number) {
    const posDragInt = parseInt(positionDraggedStr, 10);
    if (Number.isNaN(posDragInt)) return;

    phase.reorderPools(posDragInt, positionDroppedOn);
    this.onDataChanged();
  }

  setFinalRankingsReady(ready: boolean) {
    this.tournament.finalRankingsReady = ready;
    this.tournament.confirmFinalRankings();
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

  teamEditModalAttemptToSave(stayOpen: boolean = false, startNextLetter: boolean = false) {
    if (this.teamModalManager.preSaveValidation()) {
      this.teamModalSave(stayOpen, startNextLetter);
    }
  }

  private teamModalSave(stayOpen: boolean = false, startNextLetter: boolean = false) {
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
    this.teamEditModalReset(stayOpen, startNextLetter);
    this.onDataChanged();
  }

  teamEditModalReset(stayOpen: boolean = false, startNextLetter: boolean = false) {
    this.teamBeingModified = null;

    if (startNextLetter) {
      if (this.registrationBeingModified !== null) {
        this.teamModalManager.resetAndNextLetter(this.registrationBeingModified);
      } else {
        const regJustAdded = this.tournament.findRegistration(this.teamModalManager.tempRegistration.name);
        if (regJustAdded) this.teamModalManager.resetAndNextLetter(regJustAdded);
      }
      this.teamModalManager.checkForDuplicateTeam(this.tournament.registrations, null);
      return;
    }

    this.registrationBeingModified = null;
    if (stayOpen) {
      this.teamModalManager.resetForNewTeam();
    } else {
      this.teamModalManager.closeModal();
    }
  }

  openMatchModalNewMatchForRound(round: Round) {
    this.matchModalManager.openModal(undefined, round);
  }

  openMatchModalNewMatchForTeams(team1: Team, team2: Team) {
    this.matchModalManager.openModal(undefined, undefined, team1, team2);
  }

  openMatchEditModalExistingMatch(match: Match, round: Round) {
    this.matchModalManager.openModal(match, round);
    this.matchBeingModified = match;
  }

  matchEditModalAttemptToSave(stayOpen: boolean = false) {
    if (this.matchModalManager.preSaveValidation()) {
      this.matchEditModalSave(stayOpen);
    }
  }

  private matchEditModalSave(stayOpen: boolean = false) {
    if (this.matchBeingModified !== null) {
      this.matchModalManager.saveExistingMatch(this.matchBeingModified);
    } else {
      this.matchModalManager.saveNewMatch();
    }
    this.matchEditModalReset(stayOpen);
    this.tournament.calcHasMatchData();
    this.onDataChanged();
  }

  matchEditModalReset(stayOpen: boolean = false) {
    this.matchBeingModified = null;
    if (stayOpen) {
      this.matchModalManager.resetForNewMatch();
    } else {
      this.matchModalManager.closeModal();
    }
  }

  openPhaseModal(phase: Phase) {
    const otherNames = this.tournament.phases.filter((ph) => ph !== phase).map((ph) => ph.name);
    this.phaseModalManager.openModal(
      phase,
      otherNames,
      this.tournament.roundNumberLowerBound(phase),
      this.tournament.roundNumberUpperBound(phase),
    );
  }

  closePhaseModal(shouldSave: boolean) {
    this.phaseModalManager.closeModal(shouldSave);
    this.onDataChanged(!shouldSave);
  }

  openPoolModal(phase: Phase, pool: Pool) {
    const otherNames = phase.pools.filter((pl) => pl !== pool).map((pl) => pl.name);
    this.poolModalManager.openModal(pool, otherNames, phase);
  }

  closePoolModal(shouldSave: boolean, shouldDelete = false) {
    const poolOpened = this.poolModalManager.originalPoolOpened;
    const phase = this.poolModalManager.phaseContainingPool;
    this.poolModalManager.closeModal(shouldSave);
    if (shouldDelete && poolOpened && phase) {
      this.deletePool(phase, poolOpened);
    }
    this.onDataChanged(!shouldSave);
  }

  openRankModal(team: Team) {
    this.rankModalManager.openModal(team);
  }

  closeRankModal(shouldSave: boolean) {
    this.rankModalManager.closeModal(shouldSave);
    if (shouldSave) this.tournament.reSortStandingsByFinalRank();
    this.onDataChanged(!shouldSave);
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

    const fileName = this.filePath.substring(this.filePath.lastIndexOf('\\') + 1);
    if (!this.displayName) return fileName;
    return `${this.displayName} - ${fileName}`;
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
