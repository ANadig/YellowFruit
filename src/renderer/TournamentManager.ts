import { createContext } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Tournament, { IYftFileTournament, NullTournament } from './DataModel/Tournament';
import { dateFieldChanged, getFileNameFromPath, textFieldChanged, versionLt } from './Utils/GeneralUtils';
import { NullObjects } from './Utils/UtilTypes';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain } from '../IPCChannels';
import { IIndeterminateQbj, IQbjWholeFile, IRefTargetDict } from './DataModel/Interfaces';
import AnswerType from './DataModel/AnswerType';
import StandardSchedule from './DataModel/StandardSchedule';
import { Team } from './DataModel/Team';
import Registration, { IQbjRegistration } from './DataModel/Registration';
import { TempTeamManager } from './Modal Managers/TempTeamManager';
import { GenericModalManager } from './Modal Managers/GenericModalManager';
import { collectRefTargets, findTournamentObject } from './DataModel/QbjUtils2';
import FileParser from './DataModel/FileParsing';
import { TempMatchManager } from './Modal Managers/TempMatchManager';
import { IModaqMatch, IQbjMatch, Match } from './DataModel/Match';
import {
  FileSwitchActions,
  IMatchImportFileRequest,
  IYftBackupFile,
  SqbsExportFile,
  StatReportHtmlPage,
} from '../SharedUtils';
import { StatReportFileNames, StatReportPages } from './Enums';
import { Pool } from './DataModel/Pool';
import { PoolStats } from './DataModel/StatSummaries';
import { Phase, PhaseTypes, WildCardRankingMethod } from './DataModel/Phase';
import { Round } from './DataModel/Round';
import TempPhaseManager from './Modal Managers/TempPhaseManager';
import TempPoolManager from './Modal Managers/TempPoolManager';
import TempRankManager from './Modal Managers/TempRankManager';
import { snakeCaseToCamelCase, camelCaseToSnakeCase } from './DataModel/CaseConversion';
import { CommonRuleSets } from './DataModel/ScoringRules';
import { qbjFileValidVersion } from './DataModel/QbjUtils';
import PoolAssignmentModalManager from './Modal Managers/PoolAssignmentModalManager';
import MatchImportResult from './DataModel/MatchImportResult';
import MatchImportResultsManager from './Modal Managers/MatchImportResultsManager';
import { parseOldYfFile, isOldYftFile } from './DataModel/OldYfParsing';
import parseTeamsFromSqbsFile from './DataModel/SqbsParsing';
import SqbsExportModalManager from './Modal Managers/SqbsExportModalManager';
import SqbsGenerator from './DataModel/SqbsFileGeneration';
import { AlertColor } from '@mui/material';

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

  /** Show a toast message */
  makeToast: (message: string, severity?: AlertColor, urlToLaunch?: string) => void;

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

  poolAssignmentModalManager: PoolAssignmentModalManager;

  matchImportResultsManager: MatchImportResultsManager;

  sqbsExportModalManager: SqbsExportModalManager;

  aboutYfDialogOpen: boolean = false;

  /** When did we last update the stat report? */
  inAppStatReportGenerated: Date;

  recoveredBackup?: IYftBackupFile;

  readonly isNull: boolean = false;

  /** The version of the app that is currently running */
  appVersion: string = '';

  /** The latest published version of the app that's available to download*/
  latestAvailVersion: string = '';

  constructor() {
    this.dataChangedReactCallback = () => {};
    this.makeToast = () => {};
    this.addIpcListeners();

    this.genericModalManager = new GenericModalManager();
    this.teamModalManager = new TempTeamManager();
    this.matchModalManager = new TempMatchManager();
    this.phaseModalManager = new TempPhaseManager();
    this.poolModalManager = new TempPoolManager();
    this.rankModalManager = new TempRankManager();
    this.poolAssignmentModalManager = new PoolAssignmentModalManager();
    this.matchImportResultsManager = new MatchImportResultsManager();
    this.sqbsExportModalManager = new SqbsExportModalManager();
    this.inAppStatReportGenerated = new Date();

    this.requestAppVersion();
    this.checkForNewVersion();

    this.newTournament();

    this.requestBackupFile();
  }

  protected addIpcListeners() {
    window.electron.ipcRenderer.on(IpcMainToRend.CheckForUnsavedData, (action) => {
      this.checkForUnsavedData(action as FileSwitchActions);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.openYftFile, (filePath, fileContents, curYfVersion) => {
      this.openYftFile(filePath as string, fileContents as string, curYfVersion as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.ImportQbjTournament, (filePath, fileContents) => {
      this.importQbjTournament(filePath as string, fileContents as string);
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
    window.electron.ipcRenderer.on(IpcMainToRend.ImportQbjTeams, (contents) => {
      this.importQbjTeams(contents as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.ImportSqbsTeams, (contents) => {
      this.importSqbsTeams(contents as string);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.MakeToast, (message) => {
      this.makeToast(message as string);
    });
    window.electron.ipcRenderer.on(IpcBidirectional.LoadBackup, (contents) => {
      this.parseBackup(contents as string);
    });
    window.electron.ipcRenderer.on(IpcBidirectional.ExportQbjFile, (filePath) => {
      this.exportQbjFile(filePath as string);
    });
    window.electron.ipcRenderer.on(IpcBidirectional.SqbsExport, () => {
      this.startSqbsExport();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.LaunchAboutYf, () => {
      this.openAboutYfDialog();
    });
    window.electron.ipcRenderer.on(IpcBidirectional.GetAppVersion, (version) => {
      this.appVersion = version as string;
      if (this.tournament) this.tournament.appVersion = this.appVersion;
    });
    window.electron.ipcRenderer.on(IpcBidirectional.CheckForNewVersion, (latestVersion) => {
      this.latestAvailVersion = latestVersion as string;
      this.newReleaseAlert();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  protected requestAppVersion() {
    window.electron.ipcRenderer.sendMessage(IpcBidirectional.GetAppVersion);
  }

  // eslint-disable-next-line class-methods-use-this
  protected requestBackupFile() {
    window.electron.ipcRenderer.sendMessage(IpcBidirectional.LoadBackup);
  }

  //eslint-disable-next-line class-methods-use-this
  protected checkForNewVersion() {
    window.electron.ipcRenderer.sendMessage(IpcBidirectional.CheckForNewVersion);
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
    this.tournament.appVersion = this.appVersion;
    this.modalManagersSetTournament();
    this.setFilePath(null);
    this.displayName = '';
    this.unsavedData = false;

    this.setWindowTitle();
    this.dataChangedReactCallback();
  }

  /** Parse file contents and load tournament for editing */
  private openYftFile(filePath: string, fileContents: string, curYfVersion: string) {
    if (isOldYftFile(fileContents)) {
      this.openOldYftFile(fileContents);
      return;
    }

    const objFromFile = this.parseJSON(fileContents);
    if (!objFromFile) return;
    this.parseYftFile(filePath, objFromFile, curYfVersion);
  }

  private openOldYftFile(fileContents: string) {
    try {
      this.tournament = parseOldYfFile(fileContents);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
      this.newTournament();
      return;
    }

    this.tournament.appVersion = this.appVersion;
    this.modalManagersSetTournament();
    this.setFilePath(null); // don't actually edit old files directly, in case we can't parse them right and end up losing info
    this.displayName = '';
    this.unsavedData = true;

    this.setWindowTitle();
    this.dataChangedReactCallback();

    this.genericModalManager.open(
      'YellowFruit',
      'This file is from an older version of YellowFruit. It has been opened successfully, but you will need to save a new file if you make changes.',
    );
  }

  /** Import an entire (non-YFT) qbj file */
  private importQbjTournament(filePath: string, fileContents: string) {
    this.newTournament();
    const objFromFile = this.parseJSON(fileContents);
    if (!objFromFile) return;

    snakeCaseToCamelCase(objFromFile);
    const loadedTournament = this.loadTournamentFromQbjObjects(objFromFile as IQbjWholeFile);
    if (loadedTournament === null) {
      return;
    }
    this.tournament = loadedTournament;
    this.modalManagersSetTournament();
    this.displayName = this.tournament.name || '';
    this.onDataChanged();
  }

  private parseYftFile(filePath: string, objFromFile: object, curYfVersion?: string) {
    snakeCaseToCamelCase(objFromFile);
    const loadedTournament = this.loadTournamentFromQbjObjects(objFromFile as IQbjWholeFile, curYfVersion);
    if (loadedTournament === null) {
      return;
    }

    loadedTournament.conversions();
    loadedTournament.appVersion = this.appVersion;

    this.setFilePath(filePath as string);
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

  /**
   * Given an array of Qbj/Yft objects, parse them and create a tournament from the info
   * @param objFromFile The parsed JSON object from the file
   * @param curYfVersion YellowFruit version the yft file must be compatible with. If not passed, we treat as a non-YFT base qbj file
   */
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
      if (curYfVersion) {
        loadedTournament = parser.parseYftTournament(tournamentObj as IYftFileTournament, curYfVersion);
      } else {
        loadedTournament = parser.parseTournament(tournamentObj);
      }
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

  // eslint-disable-next-line class-methods-use-this
  launchImportQbjTeamsWorkflow() {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.LaunchImportQbjTeamWorkflow);
  }

  // eslint-disable-next-line class-methods-use-this
  launchImportSqbsTeamsWorkflow() {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.LaunchImportSqbsTeamWorkflow);
  }

  private importQbjTeams(fileContents: string) {
    const objFromFile = this.parseJSON(fileContents) as IQbjWholeFile;
    if (!objFromFile) return;

    const objectList = objFromFile.objects;
    if (!qbjFileValidVersion(objFromFile)) {
      this.openGenericModal('Invalid File', "This file doesn't use a supported version of the tournament schema.");
      return;
    }

    let refTargets: IRefTargetDict = {};
    try {
      refTargets = collectRefTargets(objectList);
    } catch (err: any) {
      this.openGenericModal('Invalid File', err.message);
      return;
    }

    const registrationList = FileParser.findRegistrations(objectList);
    if (registrationList.length === 0) {
      this.openGenericModal('Invalid File', 'This file contains no Registration objects.');
      return;
    }

    const parser = new FileParser(refTargets, this.tournament);
    parser.buildTypesByIdArrays(objectList);
    let numTeamsImported = 0;
    const maxTeamsAllowed = this.tournament.getExpectedNumberOfTeams();
    let maxTeamsReached = false;
    for (const reg of registrationList) {
      if (this.tournament.getNumberOfTeams() === maxTeamsAllowed) {
        maxTeamsReached = true;
        break;
      }
      numTeamsImported += this.importSingleRegistrationObj(reg, parser);
    }

    if (numTeamsImported === 0) {
      this.openGenericModal(
        'Team Import',
        `No teams were imported because no new teams were found or the maximum number of teams was reached.`,
      );
    } else {
      this.openGenericModal(
        'Team Import',
        `Imported ${numTeamsImported} teams.${
          maxTeamsReached ? ' Not all teams were imported because the maximum number teams was reached.' : ''
        }`,
      );
    }
    this.markFileDirty();
  }

  private importSingleRegistrationObj(registration: IQbjRegistration, parser: FileParser) {
    let registrationFromFile;
    try {
      registrationFromFile = parser.parseRegistration(registration as IIndeterminateQbj);
    } catch (err: any) {
      // TODO: track errors?
      return 0;
    }
    if (!registrationFromFile) return 0;

    registrationFromFile.computeLettersAndRegName();
    let numTeamsImported = 0;
    const maxTeamsAllowed = this.tournament.getExpectedNumberOfTeams();
    const existingRegistration = this.tournament.findRegistration(registrationFromFile.name);
    if (existingRegistration) {
      for (const teamFromFile of registrationFromFile.teams) {
        if (!this.tournament.findTeamByName(teamFromFile.name)) {
          existingRegistration.addTeam(teamFromFile);
          numTeamsImported++;
        }
        if (this.tournament.getNumberOfTeams() === maxTeamsAllowed) break;
      }
      this.tournament.seedTeamsInRegistration(existingRegistration);
    } else {
      if (
        maxTeamsAllowed !== null &&
        this.tournament.getNumberOfTeams() + registrationFromFile.teams.length > maxTeamsAllowed
      ) {
        return 0;
      }
      this.tournament.addRegistration(registrationFromFile);
      numTeamsImported = registrationFromFile.teams.length;
    }
    return numTeamsImported;
  }

  private importSqbsTeams(fileContents: string) {
    let registrationList;
    try {
      registrationList = parseTeamsFromSqbsFile(fileContents);
    } catch (err: any) {
      this.openGenericModal('SQBS Roster Import', `Import failed: ${err.message}`);
      return;
    }
    if (!registrationList) return;

    if (registrationList.length === 0) {
      this.openGenericModal('SQBS Roster Import', 'No teams imported: this file contains no teams');
      return;
    }

    const maxTeamsAllowed = this.tournament.getExpectedNumberOfTeams();
    let numTeamsImported = 0;
    for (const oneReg of registrationList) {
      if (maxTeamsAllowed !== null && this.tournament.getNumberOfTeams() >= maxTeamsAllowed) {
        this.openGenericModal(
          'SQBS Roster Import',
          `Imported ${numTeamsImported} teams. Not all teams in the file were imported because the maximum number of teams was reached.`,
        );
        this.markFileDirty();
        return;
      }

      const existingReg = this.tournament.findRegistration(oneReg.name);
      if (!existingReg) {
        this.tournament.addRegistration(oneReg);
        numTeamsImported++;
      } else {
        const newTeam = oneReg.teams[0];
        if (!existingReg.teams.find((t) => t.name === newTeam.name)) {
          existingReg.addTeam(newTeam);
          this.tournament.seedAndAssignNewTeam(newTeam);
          numTeamsImported++;
        }
      }
    }
    this.openGenericModal('SQBS Roster Import', `Imported ${numTeamsImported} teams.`);
    this.markFileDirty();
  }

  /**
   * Tell main to launch the file selection window for importing matches
   * @param round Which round the matches should go into. If not passed, use the files to determine the correct rounds
   * @returns
   */
  async launchImportMatchWorkflow(round?: Round) {
    const files = (await window.electron.ipcRenderer.invoke(
      IpcBidirectional.ImportQbjGames,
    )) as IMatchImportFileRequest[];
    if (files.length === 0) return;

    this.importMatchesFromQbj(files, round);
  }

  /**
   * Parse a qbj or qbj-like file and add its matches to the given round
   * @param fileAry The files we're trying to parse
   * @param round Which round the matches should go into. If not passed, use the files to determine the correct rounds
   */
  private importMatchesFromQbj(fileAry: IMatchImportFileRequest[], round?: Round) {
    const phase = round ? this.tournament.findPhaseByRound(round) : undefined;

    let results: MatchImportResult[] = [];
    for (const oneFile of fileAry) {
      const { filePath, fileContents } = oneFile;
      const objFromFile = this.parseJSON(fileContents);
      if (!objFromFile) return;

      snakeCaseToCamelCase(objFromFile);

      if ((objFromFile as IQbjWholeFile).objects) {
        results = results.concat(this.importMatchesFromWholeQbj(objFromFile as IQbjWholeFile, filePath, phase, round));
      } else {
        const oneResult: MatchImportResult = new MatchImportResult(filePath);
        results.push(oneResult);
        const roundToUse = round ?? this.tournament.getRoundObjByNumber((objFromFile as IModaqMatch)._round);
        if (!roundToUse) {
          oneResult.markFatal("Couldn't determine a round for the game in this file");
          continue;
        }
        const phaseToUse = phase ?? this.tournament.findPhaseByRound(roundToUse);
        if (!phaseToUse) {
          continue; // just ignore this match; this isn't plausible and I don't know how I would explain it to a user
        }
        this.importSingleMatchObj(objFromFile as IQbjMatch, phaseToUse, roundToUse, oneResult);
      }
    }

    MatchImportResult.validateImportSetForTeamDups(results);
    this.tournament.setMatchIdCounter();
    this.openMatchImportModal(results, round);
  }

  /**
   * Import multiple matches from an arbitrary QBJ file
   * @param fileObj top-level file JSON object
   * @param phase phase we're importing matches into
   * @param round round we're importing matches into
   * @param filePath file that we're importing
   */
  private importMatchesFromWholeQbj(fileObj: IQbjWholeFile, filePath: string, phase?: Phase, round?: Round) {
    const objectList = fileObj.objects;
    const importResults: MatchImportResult[] = [];
    const wholeFileFailureResult = new MatchImportResult(filePath);
    if (!qbjFileValidVersion(fileObj as IQbjWholeFile)) {
      wholeFileFailureResult.markFatal("This file doesn't use a supported version of the tournament schema.");
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    let refTargets: IRefTargetDict = {};
    try {
      refTargets = collectRefTargets(objectList);
    } catch (err: any) {
      wholeFileFailureResult.markFatal(err.message);
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    const matchesWithRoundNums = FileParser.findMatches(objectList);
    if (matchesWithRoundNums.length === 0) {
      wholeFileFailureResult.markFatal(`The file ${filePath} contains no Match objects.`);
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    const parser = new FileParser(refTargets, this.tournament, phase);
    parser.buildTypesByIdArrays(objectList);
    for (const matchAndRound of matchesWithRoundNums) {
      const singleResult = new MatchImportResult(filePath);
      const roundToUse = round ?? this.tournament.getRoundObjByNumber(Number.parseInt(matchAndRound.roundName, 10));
      if (roundToUse === undefined) {
        singleResult.markFatal(`Couldn't find a round in this tournament matching "${matchAndRound.roundName}"`);
        continue;
      }
      const phaseToUse = phase ?? this.tournament.findPhaseByRound(roundToUse);
      if (phaseToUse === undefined) {
        continue; // just ignore this match; this isn't plausible and I don't know how I would explain it to a user
      }
      this.importSingleMatchObj(matchAndRound.match, phaseToUse, roundToUse, singleResult, parser);
      importResults.push(singleResult);
    }
    return importResults;
  }

  /** Import a match based only on a single QBJ Match object and nothing else */
  private importSingleMatchObj(
    match: IQbjMatch,
    phase: Phase,
    round: Round,
    importResult: MatchImportResult,
    existingParser?: FileParser,
  ) {
    importResult.phase = phase;
    importResult.round = round;
    const parser = existingParser ?? new FileParser({}, this.tournament);
    parser.importPhase = phase;
    let yfMatch;
    try {
      yfMatch = parser.parseMatch(match as IIndeterminateQbj);
    } catch (err: any) {
      importResult.markFatal(err.message);
      return;
    }
    if (yfMatch) {
      Tournament.validateHaveTeamsPlayedInRound(yfMatch, round, phase, false);
      importResult.evaluateMatch(yfMatch);
    }
  }

  /** Save the tournament to the given file and switch context to that file */
  yftSaveAs(filePath: string) {
    this.setFilePath(filePath);
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

  private startSqbsExport() {
    if (this.tournament.phases.length > 1) {
      this.openSqbsExportModal();
    } else {
      this.generateSqbsFiles(this.tournament.phases);
    }
  }

  private generateSqbsFiles(phases: Phase[], combinedFile?: boolean) {
    if (phases.length === 0) {
      this.openGenericModal('Error', 'Failed to find any stages to export');
      return;
    }
    const sqbsGenerator = new SqbsGenerator(this.tournament);
    const sqbsFiles: SqbsExportFile[] = [];
    if (phases.length === 1 || combinedFile) {
      sqbsGenerator.generateFile(phases);
      if (sqbsGenerator.errorMessage !== '') {
        this.openGenericModal('SQBS Export', `Error: ${sqbsGenerator.errorMessage}`);
        return;
      }
      sqbsFiles.push({ contents: sqbsGenerator.fileOutput });
    } else {
      for (const ph of phases) {
        sqbsGenerator.generateFile([ph]);
        if (sqbsGenerator.errorMessage !== '') {
          this.openGenericModal('SQBS Export', `Error: ${sqbsGenerator.errorMessage}`);
          return;
        }
        sqbsFiles.push({ contents: sqbsGenerator.fileOutput, fileSuffix: ph.name });
      }
    }
    window.electron.ipcRenderer.sendMessage(IpcBidirectional.SqbsExport, sqbsFiles);
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
    this.parseYftFile(this.recoveredBackup.filePath, this.recoveredBackup.fileContents);
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
    this.makeToast('File saved');
  }

  private setFilePath(path: string | null) {
    this.filePath = path || null;
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.setYftFilePath, path || '');
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

  setPacketName(round: Round, packetName: string) {
    const trimmedName = packetName.trim();
    if (!textFieldChanged(round.packet.name, trimmedName)) {
      return;
    }
    round.packet.name = trimmedName;
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

  setLightningDivisor(val: number) {
    this.tournament.scoringRules.lightningDivisor = val;
    this.tournament.clearStdRuleSet();
    this.onDataChanged();
  }

  setStandardSchedule(sched: StandardSchedule) {
    this.tournament.setStandardSchedule(sched);
    this.onDataChanged();
  }

  tryUnlockCustomSchedule() {
    if (!this.tournament.hasMatchData) {
      this.unlockCustomSchedule();
      return;
    }

    this.genericModalManager.open(
      'Customize Schedule',
      'Are you sure you want to unlock custom scheduling features and give up rebracketing assistance? Because one or more games have already been entered, you will not be able to reapply this template.',
      'N&o',
      '&Yes',
      () => {
        this.unlockCustomSchedule();
      },
    );
  }

  unlockCustomSchedule() {
    this.tournament.unlockCustomSchedule();
    this.onDataChanged();
  }

  startNewCustomSchedule() {
    this.tournament.startNewCustomSchedule();
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

  movePhaseUp(phase: Phase) {
    this.tournament.movePhaseUp(phase);
    this.onDataChanged();
  }

  movePhaseDown(phase: Phase) {
    this.tournament.movePhaseDown(phase);
    this.onDataChanged();
  }

  tryDeletePhase(phase: Phase) {
    this.genericModalManager.open('Delete Stage', 'Are you sure you want to delete this stage?', 'N&o', '&Yes', () => {
      this.deletePhase(phase);
    });
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

  /** After getting confirmation from the user, close the pool modal and delete the pool that was just open */
  tryDeletePool() {
    const poolOpened = this.poolModalManager.originalPoolOpened;
    const phase = this.poolModalManager.phaseContainingPool;
    if (poolOpened && phase) {
      this.genericModalManager.open('Delete Pool', 'Are you sure you want to delete this pool?', 'N&o', '&Yes', () => {
        this.poolModalManager.closeModal(false);
        this.deletePool(phase, poolOpened);
      });
    }
  }

  deletePool(phase: Phase, pool: Pool) {
    this.poolModalManager.closeModal(false);
    phase.deletePool(pool, true);
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

  unseededTeamDragDrop(originPool: Pool, targetPool: Pool, teamBeingDropped: Team) {
    if (originPool === targetPool) return;

    originPool.removeTeam(teamBeingDropped);
    targetPool.addTeam(teamBeingDropped);

    const phase = this.tournament.getPrelimPhase();
    if (phase) {
      phase.revalidateMatchesForPoolCompatibility(originPool);
      phase.revalidateMatchesForPoolCompatibility(targetPool);
    }

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

    if (actualRegToModify === null) {
      // brand new registration
      this.tournament.addRegAndTeam(this.teamModalManager.tempRegistration, this.teamModalManager.tempTeam);
    } else if (this.teamBeingModified === null) {
      // brand new team on existing registration
      this.teamModalManager.saveRegistration(actualRegToModify, true);
      this.tournament.seedTeamsInRegistration(actualRegToModify);
    } else if (registrationSwitched) {
      // existing team being moved from one registration to another
      this.teamModalManager.saveRegistration(actualRegToModify, true, this.teamBeingModified);
      if (this.registrationBeingModified !== null) {
        // remove the team from the old registration
        this.tournament.deleteTeam(this.registrationBeingModified, this.teamBeingModified);
      }
    } else {
      // existing team being modified without changing the registration
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

  openMatchImportModal(importResults: MatchImportResult[], round?: Round) {
    this.matchImportResultsManager.openModal(importResults, round);
  }

  closeMatchImportModal(shouldSave: boolean) {
    this.matchImportResultsManager.closeModal(shouldSave);
    this.onDataChanged(!shouldSave);
  }

  openPhaseModal(phase: Phase) {
    const otherNames = this.tournament.phases.filter((ph) => ph !== phase).map((ph) => ph.name);
    const relatedFullPhase = phase.isFullPhase() ? phase : this.tournament.getPrevFullPhase(phase);
    const canConvToFinals = !relatedFullPhase
      ? false
      : (phase.phaseType === PhaseTypes.Playoff || phase.phaseType === PhaseTypes.Tiebreaker) &&
        this.tournament.isLastFullPhase(relatedFullPhase) &&
        !this.tournament.hasTiebreakerAfter(phase);
    // Has to either be a playoff phase, or a finals phase immediately after a playoff phase
    const canConvToTB = !relatedFullPhase
      ? false
      : (phase.phaseType === PhaseTypes.Playoff ||
          (phase.phaseType === PhaseTypes.Finals && relatedFullPhase === this.tournament.getPrevPhase(phase))) &&
        !this.tournament.hasTiebreakerAfter(relatedFullPhase);

    this.phaseModalManager.openModal(
      phase,
      otherNames,
      canConvToFinals,
      canConvToTB,
      this.tournament.roundNumberLowerBound(phase),
      this.tournament.roundNumberUpperBound(phase),
    );
  }

  closePhaseModal(shouldSave: boolean) {
    const needToRecomputePhaseCodes = shouldSave && this.phaseModalManager.needToRecomputePhaseCodes();
    this.phaseModalManager.closeModal(shouldSave);
    if (needToRecomputePhaseCodes) {
      this.tournament.recomputePhaseCodes();
    }
    this.onDataChanged(!shouldSave);
  }

  openPoolModal(phase: Phase, pool: Pool) {
    const otherNames = phase.pools.filter((pl) => pl !== pool).map((pl) => pl.name);
    this.poolModalManager.openModal(pool, otherNames, phase, !this.tournament.usingScheduleTemplate);
  }

  closePoolModal(shouldSave: boolean) {
    this.poolModalManager.closeModal(shouldSave);
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

  openPoolAssignmentModal(team: Team, phase: Phase, acceptCallback: () => void, originalPool?: Pool) {
    this.poolAssignmentModalManager.openModal(team, phase, acceptCallback, originalPool);
    this.onDataChanged(true);
  }

  closePoolAssignmentModal(shouldSave: boolean) {
    this.poolAssignmentModalManager.closeModal(shouldSave);
    this.onDataChanged(!shouldSave);
  }

  poolAssignSimpleSwitch() {
    this.poolAssignmentModalManager.simplePoolSwitch();
  }

  poolAssignPlayoffSwitch() {
    if (!this.poolAssignmentModalManager.modalIsOpen) return;

    const team = this.poolAssignmentModalManager.teamBeingAssigned;
    const nextPhase = this.poolAssignmentModalManager.phase;
    if (!team || !nextPhase) return;

    const newPool = this.poolAssignmentModalManager.selectedPool;
    this.overridePlayoffPoolAssignment(team, nextPhase, newPool);
  }

  openSqbsExportModal() {
    this.sqbsExportModalManager.openModal(this.tournament.phases);
    this.onDataChanged(true);
  }

  closeSqbsExportModal(shouldSave: boolean) {
    const phases = this.sqbsExportModalManager.selectedPhases;
    const combinedFile = this.sqbsExportModalManager.combineFiles;
    this.sqbsExportModalManager.closeModal();
    this.onDataChanged(true);

    if (shouldSave) this.generateSqbsFiles(phases, combinedFile);
  }

  /** Should be called anytime the user modifies something */
  private onDataChanged(doesntAffectFile = false) {
    this.dataChangedReactCallback();
    if (doesntAffectFile) return;

    this.markFileDirty();
  }

  private markFileDirty() {
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

  openAboutYfDialog() {
    this.aboutYfDialogOpen = true;
    this.onDataChanged(true);
  }

  closeAboutYfDialog() {
    this.aboutYfDialogOpen = false;
    this.onDataChanged(true);
  }

  openGenericModal(title: string, contents: string) {
    this.genericModalManager.open(title, contents);
    this.dataChangedReactCallback();
  }

  closeGenericModal() {
    this.genericModalManager.close();
  }

  anyModalOpen() {
    return (
      this.genericModalManager.isOpen ||
      this.teamModalManager.modalIsOpen ||
      this.matchModalManager.modalIsOpen ||
      this.phaseModalManager.modalIsOpen ||
      this.poolModalManager.modalIsOpen ||
      this.rankModalManager.modalIsOpen ||
      this.matchImportResultsManager.modalIsOpen ||
      this.poolAssignmentModalManager.modalIsOpen ||
      this.sqbsExportModalManager.modalIsOpen ||
      this.aboutYfDialogOpen
    );
  }

  /** Alert the user if there is a newer version of the application is available */
  newReleaseAlert(isRetry?: boolean) {
    if (this.latestAvailVersion === '') return;

    if (this.appVersion === '') {
      if (isRetry) this.requestAppVersion();

      setTimeout(() => {
        this.newReleaseAlert(true);
      }, 3000);
    }

    if (versionLt(this.appVersion, this.latestAvailVersion)) {
      this.makeToast(
        `A newer version of YellowFruit is available`,
        'info',
        'https://github.com/ANadig/YellowFruit/releases/latest',
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  launchStatReportInBrowserWindow() {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.LaunchStatReportInBrowser);
  }

  // eslint-disable-next-line class-methods-use-this
  launchWebPageInBrowserWindow(url: string) {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.LaunchExternalWebPage, url);
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

  // eslint-disable-next-line class-methods-use-this
  requestAppVersion(): void {}

  // eslint-disable-next-line class-methods-use-this
  requestBackupFile(): void {}

  // eslint-disable-next-line class-methods-use-this
  checkForNewVersion(): void {}
}

/** React context that elements can use to access the TournamentManager and its data without
 * having to thread data and data-changing functions up and down the react tree
 */
export const TournamentContext = createContext<TournamentManager>(new NullTournamentManager());
