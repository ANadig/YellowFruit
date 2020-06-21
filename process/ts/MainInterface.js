/***********************************************************
MainInterface.js
Andrew Nadig

Defines the MainInterface compenent that contains the
entire UI of the main window
***********************************************************/
const $ = require('jquery');
const _ = require('lodash');
const M = require('materialize-css');
const Mousetrap = require('mousetrap');

const ipc = electron.ipcRenderer;

import * as React from "react";
import * as SqbsUtils from './SqbsUtils';
const StatUtils = require('./StatUtils');
const StatUtils2 = require('./StatUtils2');
const QbjUtils = require('./QbjUtils');
import * as QbjUtils2 from './QbjUtils2';
// Bring in all the other React components
import { TeamListEntry } from './TeamListEntry';
import { GameListEntry } from './GameListEntry';
import { HeaderNav } from './HeaderNav';
const AddTeamModal = require('./AddTeamModal');
const AddGameModal = require('./AddGameModal');
import { DivisionEditModal } from './DivisionEditModal';
const RptConfigModal = require('./RptConfigModal');
import { DivAssignModal } from './DivAssignModal';
import { PhaseAssignModal } from './PhaseAssignModal';
const SettingsForm = require('./SettingsForm');
import { TeamList } from './TeamList';
import { GameList} from './GameList';
import { StatSidebar } from './StatSidebar';
import { SidebarToggleButton } from './SidebarToggleButton';

const MAX_PLAYERS_PER_TEAM = 50;
const METADATA = {version:app.getVersion()}; // take version straight from package.json
const DEFAULT_SETTINGS = {
  powers: '15pts',
  negs: true,
  bonuses: true,
  bonusesBounce: false,
  lightning: false,
  playersPerTeam: '4',
  defaultPhases: [], // Used to group teams when viewing all games
  rptConfig: 'YF Defaults'
};
//Materialize accent-1 colors: yellow, light-green, orange, light-blue, red, purple, teal, deep-purple, pink, green
const PHASE_COLORS = ['#ffff8d', '#ccff90', '#ffd180', '#80d8ff',
  '#ff8a80', '#ea80fc', '#a7ffeb', '#b388ff', '#ff80ab', '#b9fc6a'];
const EMPTY_CUSTOM_RPT_CONFIG = {
    defaultRpt: null,
    rptConfigList: {}
}
const SYS_DEFAULT_RPT_NAME = 'YF Defaults';
const MAX_CUSTOM_RPT_CONFIGS = 25;
const DEFAULT_FORM_SETTINGS = {
  showYearField: true,
  showSmallSchool: true,
  showJrVarsity: true,
  showUGFields: true,
  showD2Fields: true
};


export class MainInterface extends React.Component {

  constructor(props) {
    super(props);

    var defSettingsCopy = $.extend(true, {}, DEFAULT_SETTINGS);
    var defFormSettingsCopy = $.extend(true, {}, DEFAULT_FORM_SETTINGS);

    var loadRpts = fs.readFileSync(RELEASED_RPT_CONFIG_FILE, 'utf8');
    var releasedRptList = JSON.parse(loadRpts).rptConfigList;

    this.state = {
      tmWindowVisible: false, // whether the team entry modal is open
      gmWindowVisible: false, // whether the game entry modal is open
      divEditWindowVisible: false, // whether the division edit modal is open
      rptConfigWindowVisible: false, // whether the report configuration modal is open
      divWindowVisible: false, // whether the team division assignment modal is open
      phaseWindowVisible: false, // whether the game phase assignment modal is open
      teamOrder: 'alpha', // sort order. Either 'alpha' or 'division'
      queryText: '', // what's in the search bar
      settings: defSettingsCopy, // object to define the tournament rules
      packets: {}, // packet names
      divisions: {}, // object where the keys are phases, and their values are the list
                     // of divisions in that phase
      myTeams: [], // the list of teams
      myGames: [], // the list of games
      gameIndex: {}, // the list of rounds, and how many games exist for that round
      playerIndex: {}, // the list of teams with their players, and how many games each player has played
      tbCount: 0, // number of tiebreaker games in the current tournament
      allGamesShowTbs: false, // whether to include tiebreakers when showing all games
      selectedTeams: [], // teams with checkbox checked on the teams pane
      selectedGames: [], // games with checkbox checked on the games pane
      checkTeamToggle: false, // used in the key of TeamListEntry components in order to
                              // force their constructor to be called when necessary
      checkGameToggle: false, // see checkTeamToggle
      settingsLoadToggle: false, // used to force the whole settings pane to redraw when
                                 // when divisions or phases are changed
      navbarLoadToggle: false, //used to force the navbar to redraw
      activePane: 'settingsPane',  // settings, teams, or games
      viewingPhase: 'all', // 'all' or the name of a user-defined phase, or 'Tiebreakers'
      forceResetForms: false, // used to force an additional render in the team and game
                              // modals in order to clear form data
      editWhichDivision: null, // which division to load in the division edit modal
      divAddOrEdit: 'add', // either 'add' or 'edit'
      editWhichTeam: null,    // which team to load in the team modal
      tmAddOrEdit: 'add', //either 'add' or 'edit'
      editWhichGame: null, // which game to load in the game modal
      gmAddOrEdit: 'add', // either 'add' or 'edit'
      editingSettings: false, // Whether the "settings" section of the settings pane is open for editing
      gameToBeDeleted: null, // which game the user is attempting to delete
      divToBeDeleted: null, // which deivision the user is attempting to delete
      releasedRptList: releasedRptList, // list of uneditable report configurations
      customRptList: {}, // list of user-created report configurations
      customRptFile: null, // file path to score user configuration
      defaultRpt: SYS_DEFAULT_RPT_NAME, // which report configuration is default for new tournaments
      activeRpt: SYS_DEFAULT_RPT_NAME, // which report configuration is currently being used
      formSettings: defFormSettingsCopy, // which optional entry fields to turn on or off
      sidebarOpen: true, // whether the sidebar is visible
      reconstructSidebar: false // used to force the sidebar to reload when any teams are modified
    };
    this.openTeamAddWindow = this.openTeamAddWindow.bind(this);
    this.openGameAddWindow = this.openGameAddWindow.bind(this);
    this.openDivEditModal = this.openDivEditModal.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.onForceReset = this.onForceReset.bind(this);
    this.addTeam = this.addTeam.bind(this);
    this.addGame = this.addGame.bind(this);
    this.modifyTeam = this.modifyTeam.bind(this);
    this.modifyGame = this.modifyGame.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.openDivForEdit = this.openDivForEdit.bind(this);
    this.openTeamForEdit = this.openTeamForEdit.bind(this);
    this.openGameForEdit = this.openGameForEdit.bind(this);
    this.onLoadDivInModal = this.onLoadDivInModal.bind(this);
    this.onLoadTeamInModal = this.onLoadTeamInModal.bind(this);
    this.onLoadGameInModal = this.onLoadGameInModal.bind(this);
    this.validateDivisionName = this.validateDivisionName.bind(this);
    this.validateTeamName = this.validateTeamName.bind(this);
    this.haveTeamsPlayedInRound = this.haveTeamsPlayedInRound.bind(this);
    this.onSelectTeam = this.onSelectTeam.bind(this);
    this.onSelectGame = this.onSelectGame.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchLists = this.searchLists.bind(this);
    this.setPane = this.setPane.bind(this);
    this.setPhase = this.setPhase.bind(this);
    this.addDivision = this.addDivision.bind(this);
    this.modifyDivision = this.modifyDivision.bind(this);
    this.deleteDivision = this.deleteDivision.bind(this);
    this.reorderDivisions = this.reorderDivisions.bind(this);
    this.savePhases = this.savePhases.bind(this);
    this.openDivModal = this.openDivModal.bind(this);
    this.openPhaseModal = this.openPhaseModal.bind(this);
    this.submitDivAssignments = this.submitDivAssignments.bind(this);
    this.submitPhaseAssignments = this.submitPhaseAssignments.bind(this);
    this.removeDivisionFromTeam = this.removeDivisionFromTeam.bind(this);
    this.removePhaseFromGame = this.removePhaseFromGame.bind(this);
    this.setDefaultGrouping = this.setDefaultGrouping.bind(this);
    this.toggleTiebreakers = this.toggleTiebreakers.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.editingSettings = this.editingSettings.bind(this);
    this.teamHasPlayedGames = this.teamHasPlayedGames.bind(this);
    this.savePackets = this.savePackets.bind(this);
    this.sortTeamsBy = this.sortTeamsBy.bind(this);
    this.modifyRptConfig = this.modifyRptConfig.bind(this);
    this.setDefaultRpt = this.setDefaultRpt.bind(this);
    this.clearDefaultRpt = this.clearDefaultRpt.bind(this);
    this.rptDeletionPrompt = this.rptDeletionPrompt.bind(this);
    this.filterByTeam = this.filterByTeam.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.saveRankOverrides = this.saveRankOverrides.bind(this);
  }

  /**
   * Lifecyle method. Initialize listeners to ipcs from main process and other stuff
   */
  componentDidMount() {
    //initialize modals
    M.Modal.init(document.querySelectorAll(
      '#addTeam, #addGame, #editDivision, #rptConfig, #assignDivisions, #assignPhases'),
      {onCloseEnd: this.onModalClose, dismissible: false}
    );
    //listen for escape key to close modals, since we made them non-dismissible so that
    // clicking outside them doesn't close them
    $(document).on("keydown", (event) => {
      if(event.keyCode == 27) {
        const openModal = document.querySelector('.modal.open');
        if(openModal) { M.Modal.getInstance(openModal).close(); }
      }
    });

    Mousetrap.bind(['command+f', 'ctrl+f'], () => {
      if(!this.anyModalOpen()) {
        $('#search').focus();
        $('#search').select();
      }
    });
    Mousetrap.bind(['command+t', 'ctrl+t'], () => {
      if(!this.anyModalOpen()) { this.openTeamAddWindow(); }
    });
    Mousetrap.bind(['command+g', 'ctrl+g'], () => {
      if(!this.anyModalOpen()) { this.openGameAddWindow(); }
    });
    Mousetrap.bind(['command+left', 'ctrl+left'], () => {
      if(!this.anyModalOpen()) { this.previousPage(); }
    });
    Mousetrap.bind(['command+right', 'ctrl+right'], () => {
      if(!this.anyModalOpen()) { this.nextPage(); }
    });
    Mousetrap.bind('alt+left', () => {
      if(!this.anyModalOpen()) { this.previousPhase(); }
    });
    Mousetrap.bind('alt+right', () => {
      if(!this.anyModalOpen()) { this.nextPhase(); }
    });
    Mousetrap.bind('alt+shift+left', () => {
      if(!this.anyModalOpen()) { this.setState({sidebarOpen: true}); }
    });
    Mousetrap.bind('alt+shift+right', () => {
      if(!this.anyModalOpen()) { this.setState({sidebarOpen: false}); }
    });
    //set up event listeners
    ipc.on('compileStatReport', (event, message) => {
      this.writeStatReport('');
    });
    ipc.on('saveTournamentAs', (event, fileName) => {
      this.writeJSON(fileName);
      ipc.sendSync('setWindowTitle',
        fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
      ipc.sendSync('successfulSave');
    });
    ipc.on('openTournament', (event, fileName) => {
      this.loadTournament(fileName);
    });
    ipc.on('importRosters', (event, fileName) =>  {
      this.importRosters(fileName);
    });
    ipc.on('importQbj', (event, fileName) => {
      this.importQbj(fileName);
    });
    ipc.on('mergeTournament', (event, fileName) => {
      this.mergeTournament(fileName);
    });
    ipc.on('saveExistingTournament', (event, fileName) => {
      this.writeJSON(fileName);
      ipc.sendSync('successfulSave');
    });
    ipc.on('newTournament', (event) => {
      if(!this.anyModalOpen()) { this.resetState(); }
    });
    ipc.on('exportHtmlReport', (event, fileStart) => {
      if(!this.anyModalOpen()) { this.writeStatReport(fileStart); }
    });
    ipc.on('trySqbsExport', (event) => {
      if(this.anyModalOpen()) { return; }
      var badGameAry = this.sqbsCompatErrors();
      if(badGameAry.length == 0) { ipc.sendSync('exportSqbsFile'); }
      else { ipc.sendSync('confirmLossySQBS', badGameAry); }
    });
    ipc.on('exportSqbsFile', (event, fileName) => {
      if(!this.anyModalOpen()) { this.writeSqbsFile(fileName); }
    });
    ipc.on('exportQbj', (event, fileName) => {
      if(!this.anyModalOpen()) { this.writeQbjFile(fileName); }
    });
    ipc.on('confirmGameDeletion', (event) => {
      this.deleteGame();
    });
    ipc.on('cancelGameDeletion', (event) => {
      this.setState({
        gameToBeDeleted: null
      });
    });
    ipc.on('confirmDivDeletion', (event) => {
      this.deleteDivision();
    });
    ipc.on('cancelDivDeletion', (event) => {
      this.setState({
        divToBeDeleted: null
      });
    });
    ipc.on('openRptConfig', (event) => {
      if(!this.anyModalOpen()) { this.openRptConfigModal(); }
    });
    ipc.on('rptDeleteConfirmation', (event, rptName) => {
      this.deleteRpt(rptName);
    });
    ipc.on('setActiveRptConfig', (event, rptName) => {
      this.setState({
        activeRpt: rptName
      });
    });
    ipc.on('toggleFormField', (event, whichField, status) => {
      this.toggleFormField(whichField, status);
    });
    ipc.on('loadReportConfig', (event, env) => {
      this.loadCustomRptConfigs(env);
    });
  } //componentDidMount

  /*---------------------------------------------------------
  Lifecyle method.
  I'm not certain this is necessary, but just to be safe....
  ---------------------------------------------------------*/
  componentWillUnmount() {
    ipc.removeAllListeners('addTeam');
    ipc.removeAllListeners('addGame');
    ipc.removeAllListeners('compileStatReport');
    ipc.removeAllListeners('saveTournamentAs');
    ipc.removeAllListeners('openTournament');
    ipc.removeAllListeners('importRosters');
    ipc.removeAllListeners('importQbj');
    ipc.removeAllListeners('mergeTournament');
    ipc.removeAllListeners('saveExistingTournament');
    ipc.removeAllListeners('newTournament');
    ipc.removeAllListeners('exportHtmlReport');
    ipc.removeAllListeners('exportSqbsFile');
    ipc.removeAllListeners('exportQbj');
    ipc.removeAllListeners('prevPage');
    ipc.removeAllListeners('nextPage');
    ipc.removeAllListeners('prevPhase');
    ipc.removeAllListeners('nextPhase');
    ipc.removeAllListeners('focusSearch');
    ipc.removeAllListeners('confirmGameDeletion');
    ipc.removeAllListeners('cancelGameDeletion');
    ipc.removeAllListeners('confirmDivDeletion');
    ipc.removeAllListeners('cancelDivDeletion');
    ipc.removeAllListeners('openRptConfig');
    ipc.removeAllListeners('rptDeleteConfirmation');
    ipc.removeAllListeners('setActiveRptConfig');
    ipc.removeAllListeners('toggleFormField');
    ipc.removeAllListeners('toggleSidebar');
    ipc.removeAllListeners('loadRptConfigs');
  } //componentWillUnmount

  /*---------------------------------------------------------
  Lifecycle method.
  ---------------------------------------------------------*/
  componentDidUpdate() {
  }

  /*---------------------------------------------------------
  Load report configurations, after the main process has
  told us where to look. Called once when the application
  starts.
  ---------------------------------------------------------*/
  loadCustomRptConfigs(env) {
    //load report configurations from files. Paths are defined in index.html
    var loadRpts = fs.readFileSync(RELEASED_RPT_CONFIG_FILE, 'utf8');
    var releasedRptList = JSON.parse(loadRpts).rptConfigList;
    var defaultRpt = SYS_DEFAULT_RPT_NAME;

    var customRptFile = env != 'development' ? CUSTOM_RPT_CONFIG_FILE_PROD : CUSTOM_RPT_CONFIG_FILE_DEV;

    if(fs.existsSync(customRptFile)) {
      loadRpts = fs.readFileSync(customRptFile, 'utf8');
      var customRptConfig = JSON.parse(loadRpts);
      var customRptList = customRptConfig.rptConfigList;
      if(customRptList[customRptConfig.defaultRpt] != undefined) {
        defaultRpt = customRptConfig.defaultRpt;
      }
    }
    else {
      var customRptList = {};
      fs.writeFile(customRptFile, JSON.stringify(EMPTY_CUSTOM_RPT_CONFIG), 'utf8', function(err) {
        if (err) { console.log(err); }
      });
    }
    // don't allow >25 custom configs (you'd have to manually mess with the file to have this happen)
    if(Object.keys(customRptList).length > MAX_CUSTOM_RPT_CONFIGS) {
      var customRptSlice = Object.keys(customRptList).slice(MAX_CUSTOM_RPT_CONFIGS);
      for(var i in customRptSlice) { delete customRptList[customRptSlice[i]]; }
    }

    ipc.sendSync('rebuildMenus', releasedRptList, customRptList, defaultRpt);

    this.setState({
      releasedRptList: releasedRptList, // list of uneditable report configurations
      customRptList: customRptList, // list of user-created report configurations
      customRptFile: customRptFile, // file path to store use configuration
      defaultRpt: defaultRpt, // which report configuration is default for new tournaments
      activeRpt: defaultRpt, // which report configuration is currently being used
    });
  }

  /*---------------------------------------------------------
  Called when the user saves the file.
  Filename: the file to write to
  ---------------------------------------------------------*/
  writeJSON(fileName) {
    var tempSettings = this.state.settings;
    // whichever report config is active becomes this tournament's config
    tempSettings.rptConfig = this.state.activeRpt;
    var fileString = JSON.stringify(METADATA) + '\n' +
      JSON.stringify(this.state.packets) + '\n' +
      JSON.stringify(tempSettings) + '\n' +
      JSON.stringify(this.state.divisions) + '\n' +
      JSON.stringify(this.state.myTeams) + '\n' +
      JSON.stringify(this.state.myGames);

    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(fileName, fileString, 'utf8', StatUtils2.printError));
    }).then(() => {
      ipc.sendSync('setWindowTitle', fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
      return 1;
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving file:\n\n' + err.stack, true);
    });
    this.setState({
      settings: tempSettings
    });
  }

  /*---------------------------------------------------------
  Parse the file and return an array containing each section
  ---------------------------------------------------------*/
  parseFile(fileName) {
    var fileString = fs.readFileSync(fileName, 'utf8');
    // compatibility with previous file format. Who knows why I thought this was necessary
    for(var i=1; i<=3; i++) { fileString = fileString.replace('divider_between_sections\n',''); }
    var jsonAry = fileString.split('\n', 6);
    if(jsonAry.length < 5) {
      //versions prior to 2.0.0 don't have metadata or packet names
      return [JSON.stringify({version:'1.9.9'}),'{}'].concat(jsonAry);
    }
    return jsonAry;
  }

  /*---------------------------------------------------------
  Update the game index with the games being loaded from a
  file. set startOver to true to wipe out the current index,
  false to add to it.
  ---------------------------------------------------------*/
  loadGameIndex(loadGames, startOver) {
    var round, tempIndex;
    if(startOver) { tempIndex = {}; }
    else { tempIndex = this.state.gameIndex; }
    for(var i in loadGames) {
      round = loadGames[i].round;
      if(tempIndex[round] == undefined) {
        tempIndex[round] = 1;
      }
      else { tempIndex[round] = tempIndex[round]+1; }
    }
    this.setState({
      gameIndex: tempIndex
    });
  }

  /*---------------------------------------------------------
  Update the player index with the games being loaded from a
  file. set startOver to true to wipe out the current index,
  false to add to it.
  ---------------------------------------------------------*/
  loadPlayerIndex(loadTeams, loadGames, startOver) {
    var curTeam, tempIndex, idxPiece;
    if(startOver) {
      tempIndex = {};
      for(var i in loadTeams) {
        tempIndex[loadTeams[i].teamName] = {};
      }
    }
    else {
      tempIndex = this.state.playerIndex;
    }
    for(var i in loadGames) {
      var curGame = loadGames[i];
      var team1 = curGame.team1, team2 = curGame.team2;
      if(tempIndex[team1] == undefined) { tempIndex[team1] = {}; }
      for(var p in curGame.players1) {
        if(tempIndex[team1][p] == undefined) { tempIndex[team1][p] = 0; }
        if(curGame.players1[p].tuh > 0) { tempIndex[team1][p]++; }
      }
      if(tempIndex[team2] == undefined) { tempIndex[team2] = {}; }
      for(var p in curGame.players2) {
        if(tempIndex[team2][p] == undefined) { tempIndex[team2][p] = 0; }
        if(curGame.players2[p].tuh > 0) { tempIndex[team2][p]++; }
      }
    }
    this.setState({
      playerIndex: tempIndex
    });
  }

  /*---------------------------------------------------------
  Load the tournament data from fileName into the appropriate
  state variables. The user may now begin editing this
  tournament.
  ---------------------------------------------------------*/
  loadTournament(fileName) {
    if(fileName == null || !fileName.endsWith('.yft')) { return; }
    var [loadMetadata, loadPackets, loadSettings, loadDivisions, loadTeams, loadGames] = this.parseFile(fileName);
    loadMetadata = JSON.parse(loadMetadata);
    loadPackets = JSON.parse(loadPackets);
    loadSettings = JSON.parse(loadSettings);
    loadDivisions = JSON.parse(loadDivisions);
    loadTeams = JSON.parse(loadTeams);
    loadGames = JSON.parse(loadGames);
    var assocRpt = loadSettings.rptConfig;

    if(StatUtils2.versionLt(METADATA.version, loadMetadata.version, 'minor')) {
      let verAry = loadMetadata.version.split('.');
      verAry[2] = '0';
      ipc.sendSync('genericModal', 'error', 'Cannot load tournament',
        'Upgrade to version ' + verAry.join('.') + ' or higher to load this tournament');
      return;
    }

    //if coming from 2.0.4 or earlier, there's no default phase
    if(loadSettings.defaultPhase == undefined && loadSettings. defaultPhases == undefined) {
      loadSettings.defaultPhases = [];
    }
    else {
      if(StatUtils2.versionLt(loadMetadata.version, '2.4.0')) {
        StatUtils2.settingsConversion2x4x0(loadSettings);
      }
      if(StatUtils2.versionLt(loadMetadata.version, '2.5.0')) {
        StatUtils2.settingsConversion2x5x0(loadSettings);
      }
    }

    //if coming from 2.1.0 or earlier, assign the system default report
    if(assocRpt == undefined) {
      assocRpt = SYS_DEFAULT_RPT_NAME;
    }
    //convert teams and games to new data structures
    if(StatUtils2.versionLt(loadMetadata.version, '2.1.0')) {
      StatUtils2.teamConversion2x1x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.2.0')) {
      StatUtils2.teamConversion2x2x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.3.0')) {
      StatUtils2.teamConversion2x3x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.4.0')) {
      StatUtils2.gameConversion2x4x0(loadGames);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.5.0')) {
      StatUtils2.gameConversion2x5x0(loadGames);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.5.2')) {
      StatUtils2.gameConversion2x5x2(loadGames);
    }
    //revert to system defaults if we can't find this file's report configuration
    if(this.state.releasedRptList[assocRpt] == undefined && this.state.customRptList[assocRpt] == undefined) {
      assocRpt = SYS_DEFAULT_RPT_NAME;
    }

    var tbCount = 0;
    for(var i in loadGames) { tbCount += loadGames[i].tiebreaker; }

    ipc.sendSync('setWindowTitle',
      fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
    ipc.sendSync('rebuildMenus', this.state.releasedRptList, this.state.customRptList, assocRpt);

    this.setState({
      settings: loadSettings,
      packets: loadPackets,
      divisions: loadDivisions,
      myTeams: loadTeams,
      myGames: loadGames,
      tbCount: tbCount,
      allGamesShowTbs: false,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      viewingPhase: 'all',
      activePane: 'settingsPane',
      activeRpt: assocRpt,
      teamOrder: 'alpha',
      queryText: '',
      selectedTeams: [],
      selectedGames: [],
      reconstructSidebar: !this.state.reconstructSidebar
    });
    //the value of settingsLoadToggle doesn't matter; it just needs to change
    //in order to make the settings form load
    this.loadGameIndex(loadGames, true);
    this.loadPlayerIndex(loadTeams, loadGames, true);
  }

  /*---------------------------------------------------------
  Load rosters from an SQBS file. Other data is ignored.
  ---------------------------------------------------------*/
  importRosters(fileName) {
    var fileString = fs.readFileSync(fileName, 'utf8');
    if(fileString != '') {
      var sqbsAry = fileString.split('\n');
    }
    var myTeams = this.state.myTeams.slice();
    var existingTeams = myTeams.map((o) => { return o.teamName; });
    var teamsAdded = [], renamedTeams = '';
    var dupTeams = [];
    var curLine = 0;
    var numTeams = sqbsAry[curLine++]; // first line is number of teams
    if(isNaN(numTeams)) {
      ipc.sendSync('genericModal', 'error', 'Import error',
        'Import failed. Encountered an error on line ' + curLine + ' of the SQBS file.');
      return;
    }
    for(var i=0; i<numTeams; i++) {
      let rosterSize = sqbsAry[curLine++] - 1; // first line of team is number of players + 1
      if(isNaN(rosterSize)) {
        ipc.sendSync('genericModal', 'error', 'Import error',
          'Import failed. Encountered an error on line ' + curLine + ' of the SQBS file.');
        return;
      }
      let teamName = sqbsAry[curLine++].trim(); // second line of team is team name
      if(teamName == '') { continue; }
      //throw out teams that are already in YF
      if(!this.validateTeamName(teamName, null)) {
        curLine += rosterSize;
        dupTeams.push(teamName);
        continue;
      }
      // if a team appearas twice in the SQBS file, append a number at the end of its name
      let dupNo = 2;
      let origName = teamName;
      while(teamsAdded.includes(teamName)) {
        teamName = origName + dupNo;
        dupNo++;
      }
      if(origName != teamName) {
        renamedTeams += '\n' + origName + ' to ' + teamName;
      }

      let roster = {};
      let lowercaseRoster = [];
      for(var j=0; j<rosterSize && j<MAX_PLAYERS_PER_TEAM; j++) {
        let nextPlayer = sqbsAry[curLine++].trim();
        // assume year is within parentheses and at the end of the player name
        let yearAry = nextPlayer.match(/\(.*\)$/);
        let nextPlayerYear = yearAry != null ? yearAry[0] : '';
        nextPlayerYear = nextPlayerYear.replace(/[\(\)]/g, '');
        let nextPlayerName = nextPlayer.replace(/\(.*\)$/, '');
        if(!lowercaseRoster.includes(nextPlayerName.toLowerCase())) {
          roster[nextPlayerName] = {year: nextPlayerYear, div2: false, undergrad: false};
          lowercaseRoster.push(nextPlayerName.toLowerCase());
        }
      }
      teamsAdded.push(teamName);
      myTeams.push({
        teamName: teamName,
        smallSchool: false,
        jrVarsity: false,
        teamUGStatus: false,
        teamD2Status: false,
        roster: roster,
        divisions: {},
      });
    }
    var numImported = teamsAdded.length;
    if(numImported > 0) {
      this.setState({
        myTeams: myTeams,
        reconstructSidebar: !this.state.reconstructSidebar
      });
      this.loadPlayerIndex(myTeams, this.state.myGames, true);

      let message = 'Imported ' + numImported + ' teams.\n\n';
      if(dupTeams.length > 0) {
        message += 'The following teams already exist and were not imported:\n\n' +
          dupTeams.join('\n');
      }
      ipc.sendSync('genericModal', 'info', 'Successful import', message);
      ipc.sendSync('unsavedData');
      if(renamedTeams.length > 3) {
        ipc.sendSync('genericModal', 'warning', 'Duplicate teams',
          'Some teams were renamed because they appeared multiple times in the SQBS file:\n\n' + renamedTeams);
      }
    }
    else if(dupTeams.length > 0) {
      ipc.sendSync('genericModal', 'warning', 'YellowFruit',
        'No teams were imported because all teams in the file already exist.');
    }
  } // importRosters

  /*---------------------------------------------------------
  Validate and load a QBJ file
  ---------------------------------------------------------*/
  importQbj(fileName) {
    var fileString = fs.readFileSync(fileName, 'utf8');
    if(fileString != '') {
      var qbj = JSON.parse(fileString);
    }
    if(qbj.version != 1.2) {
      ipc.sendSync('genericModal', 'error', 'Import QBJ',
        'QBJ import failed:\n\nOnly tournament schema version 1.2 is supported');
      return;
    }
    var tournament, registrations = [], matches = [];
    let badObject = '';
    for(var i in qbj.objects) {
      let obj = qbj.objects[i];
      switch (obj.type) {
        case 'Tournament':
          tournament = obj;
          break;
        case 'Registration':
          registrations.push(obj);
          break;
        case 'Match':
          matches.push(obj);
          break;
        default:
          badObject = obj.type;
      }
      if(badObject != '') {
        ipc.sendSync('genericModal', 'error', 'Import QBJ',
          'QBJ import failed:\n\nUnrecognized object of type ' + badObject);
        return;
      }
    }
    var [yfRules, ruleErrors] = QbjUtils.parseQbjRules(tournament.scoring_rules);
    if(ruleErrors.length > 0) {
      ipc.sendSync('genericModal', 'error', 'Import QBJ',
        'QBJ import failed:\n\n' + ruleErrors.join('\n'));
      return;
    }
    yfRules.defaultPhases = DEFAULT_SETTINGS.defaultPhases;
    yfRules.rptConfig = DEFAULT_SETTINGS.rptConfig;

    var [yfTeams, teamIds, teamErrors] = QbjUtils.parseQbjTeams(tournament, registrations);
    if(teamErrors.length > 0) {
      ipc.sendSync('genericModal', 'error', 'Import QBJ',
        'QBJ import failed:\n\n' + teamErrors.join('\n'));
      return;
    }

    var rounds = tournament.phases[0].rounds;
    var [yfGames, gameErrors] = QbjUtils.parseQbjMatches(rounds, matches, teamIds);
    if(gameErrors.length > 0) {
      ipc.sendSync('genericModal', 'error', 'Import QBJ',
        'QBJ import failed:\n\n' + gameErrors.join('\n'));
      return;
    }
    var [gameErrors, gameWarnings] = QbjUtils.validateMatches(yfGames, yfRules);
    if(gameErrors.length > 0) {
      ipc.sendSync('genericModal', 'error', 'Import QBJ',
        'QBJ import failed:\n\n' + gameErrors.join('\n'));
      return;
    }
    if(gameWarnings.length > 0) {
      ipc.sendSync('genericModal', 'warning', 'Import QBJ',
        'You may want to correct the following issues:\n\n' + gameWarnings.join('\n'));
    }
    var tbCount = 0;
    for(var i in yfGames) { tbCount += yfGames[i].tiebreaker; }

    this.setState({
      settings: yfRules,
      packets: [],
      divisions: {},
      tbCount: tbCount,
      myTeams: yfTeams,
      myGames: yfGames,
      allGamesShowTbs: false,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      viewingPhase: 'all',
      activePane: 'settingsPane',
      teamOrder: 'alpha',
      queryText: '',
      selectedTeams: [],
      selectedGames: [],
      activeRpt: this.state.defaultRpt,
      reconstructSidebar: !this.state.reconstructSidebar
    });

    this.loadGameIndex(yfGames, true);
    this.loadPlayerIndex(yfTeams, yfGames, true);
    ipc.sendSync('genericModal', 'info', 'Import QBJ',
      'Imported ' + yfTeams.length + ' teams and ' + yfGames.length + ' games.');
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Merge the tournament in fileName into this one.
  ---------------------------------------------------------*/
  mergeTournament(fileName) {
    if(fileName == '') { return; }
    var [loadMetadata, loadPackets, loadSettings, loadDivisions, loadTeams, loadGames] = this.parseFile(fileName);
    loadMetadata = JSON.parse(loadMetadata);
    loadSettings = JSON.parse(loadSettings);
    loadDivisions = JSON.parse(loadDivisions);
    loadTeams = JSON.parse(loadTeams);
    loadGames = JSON.parse(loadGames);
    //need to do this conversion before we can compare settings
    if(StatUtils2.versionLt(loadMetadata.version, '2.5.0')) {
      StatUtils2.settingsConversion2x5x0(loadSettings);
    }
    //reject files from a higher version than this one
    if(StatUtils2.versionLt(METADATA.version, loadMetadata.version, 'minor')) {
      let verAry = loadMetadata.version.split('.');
      verAry[2] = '0';
      ipc.sendSync('genericModal', 'error', 'Cannot load tournament',
        'Upgrade to version ' + verAry.join('.') + ' or higher to load this tournament');
      return;
    }

    // check settings
    if(!StatUtils2.settingsEqual(loadSettings, this.state.settings)) {
      ipc.sendSync('genericModal', 'error', 'Merge failed', 'Tournaments with different settings cannot be merged');
      return;
    }
    // merge divisions
    var divisionsCopy = $.extend(true, {}, this.state.divisions);
    for(var p in loadDivisions) {
      if(divisionsCopy[p] == undefined) {
        divisionsCopy[p] = loadDivisions[p];
      }
      else {
        for(var i in loadDivisions[p]) {
          if(!divisionsCopy[p].includes(loadDivisions[p][i])) {
            divisionsCopy[p].push(loadDivisions[p][i]);
          }
        }
      }
    }
    //convert team and game data structures if necessary
    if(StatUtils2.versionLt(loadMetadata.version, '2.1.0')) {
      StatUtils2.teamConversion2x1x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.2.0')) {
      StatUtils2.teamConversion2x2x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.3.0')) {
      StatUtils2.teamConversion2x3x0(loadTeams);
    }
    if(StatUtils2.versionLt(loadMetadata.version, '2.4.0')) {
      StatUtils2.gameConversion2x4x0(loadGames);
    }
    // merge teams
    var teamsCopy = this.state.myTeams.slice();
    var newTeamCount = 0;
    for(var i in loadTeams) {
      var newTeam = loadTeams[i];
      var oldTeam = teamsCopy.find((t) => { return t.teamName == newTeam.teamName; });
      if(oldTeam == undefined) {
        teamsCopy.push(newTeam);
        newTeamCount++;
      }
      else {
        // merge rosters
        for(var p in newTeam.roster) {
          if(oldTeam.roster[p] == undefined) {
            oldTeam.roster[p] = newTeam.roster[p];
          }
        }
        // merge division assignments
        for(var p in newTeam.divisions) {
          if(oldTeam.divisions[p] == undefined) {
            oldTeam.divisions[p] = newTeam.divisions[p];
          }
        }
      }
    }
    // merge games
    var gamesCopy = this.state.myGames.slice();
    var newGameCount = 0, tbCount = this.state.tbCount;
    var conflictGames = [];
    for(var i in loadGames) {
      let newGame = loadGames[i];
      if(!StatUtils2.mergeConflictGame(newGame, gamesCopy)) {
        gamesCopy.push(newGame);
        newGameCount++;
        tbCount += newGame.tiebreaker;
      }
      else { conflictGames.push(newGame); }
    }
    this.setState({
      divisions: divisionsCopy,
      myTeams: teamsCopy,
      myGames: gamesCopy,
      tbCount: tbCount,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      reconstructSidebar: !this.state.reconstructSidebar
    });
    this.loadGameIndex(gamesCopy, false);
    this.loadPlayerIndex(teamsCopy, gamesCopy, false);
    ipc.sendSync('unsavedData');

    var mergeSummary = 'Added ' + newTeamCount + ' new teams and ' + newGameCount +
      ' new games.';
    if(conflictGames.length > 0) {
      mergeSummary += '\n\nThe following games were not added because teams cannot' +
        'play multiple non-tiebreaker games in the same round:\n\n';
      for(var i in conflictGames) {
        let g = conflictGames[i];
        mergeSummary += 'Round ' + g.round + ': ' + g.team1 + ' vs. ' + g.team2 + '\n';
      }
    }

    ipc.sendSync('genericModal', 'info', 'Successful merge', mergeSummary);
  } // mergeTournament

  /*---------------------------------------------------------
  Compile data for the data report and write it to each html
  file.
  fileStart is null when generating the files for the report
  window. Otherwise it's the user-specified file to export
  to, to which we append the name of the page
  ---------------------------------------------------------*/
  writeStatReport(fileStart) {
    if(fileStart == '') {
      var standingsLocation = defaultStandingsLocation;
      var individualsLocation = defaultIndividualsLocation;
      var scoreboardLocation = defaultScoreboardLocation;
      var teamDetailLocation = defaultTeamDetailLocation;
      var playerDetailLocation = defaultPlayerDetailLocation;
      var roundReportLocation = defaultRoundReportLocation;
      var statKeyLocation = defaultStatKeyLocation;
    }
    else {
      fileStart = fileStart + '_';
      var standingsLocation = fileStart + 'standings.html';
      var individualsLocation = fileStart + 'individuals.html';
      var scoreboardLocation = fileStart + 'games.html';
      var teamDetailLocation = fileStart + 'teamdetail.html';
      var playerDetailLocation = fileStart + 'playerdetail.html';
      var roundReportLocation = fileStart + 'rounds.html';
      var statKeyLocation = fileStart + 'statKey.html';
    }
    var filterPhase = this.state.viewingPhase;
    var phasesToGroupBy = this.phasesToGroupBy();
    var [divsInPhase, phaseSizes] = this.cumulativeRankSetup(phasesToGroupBy);
    var usingDivisions = divsInPhase.length > 0;
    //we only want the last segment of the file path to use for links
    var filePathSegments = fileStart.split(/[\\\/]/);
    var endFileStart = filePathSegments.pop();

    var showTbs = this.state.allGamesShowTbs;
    var phaseColors = {}, phaseCnt = 0;
    for(var p in this.state.divisions) {
      if(p != "noPhase") { phaseColors[p] = PHASE_COLORS[phaseCnt++]; }
    }
    if(this.state.tbCount > 0 && showTbs) {
      phaseColors["Tiebreakers"] = '#9e9e9e'; // for phase legends
    }

    var activeRpt = this.state.releasedRptList[this.state.activeRpt];
    if(activeRpt == undefined) { activeRpt = this.state.customRptList[this.state.activeRpt]; }

    var teams = this.state.myTeams, games = this.state.myGames,
      settings = this.state.settings, packets = this.state.packets;

    Promise.all([
      StatUtils.getStandingsPage(teams, games, endFileStart, filterPhase,
        phasesToGroupBy, divsInPhase, phaseSizes, settings, activeRpt, showTbs),
      StatUtils.getIndividualsPage(teams, games, endFileStart, filterPhase,
        phasesToGroupBy, usingDivisions, settings, activeRpt, showTbs),
      StatUtils.getScoreboardPage(teams, games, endFileStart, filterPhase, settings,
        packets, phaseColors, showTbs),
      StatUtils.getTeamDetailPage(teams, games, endFileStart, filterPhase, packets,
        settings, phaseColors, activeRpt, showTbs),
      StatUtils.getPlayerDetailPage(teams, games, endFileStart, filterPhase, settings,
        phaseColors, activeRpt, showTbs),
      StatUtils.getRoundReportPage(teams, games, endFileStart, filterPhase, packets,
        settings, activeRpt, showTbs),
      StatUtils.getStatKeyPage(endFileStart),
    ]).then(([standings, individuals, scoreboard, teamDet, playerDet, roundRep, statKey]) => {
      fs.writeFileSync(standingsLocation, standings, 'utf8', StatUtils2.printError);
      fs.writeFileSync(individualsLocation, individuals, 'utf8', StatUtils2.printError);
      fs.writeFileSync(scoreboardLocation, scoreboard, 'utf8', StatUtils2.printError);
      fs.writeFileSync(teamDetailLocation, teamDet, 'utf8', StatUtils2.printError);
      fs.writeFileSync(playerDetailLocation, playerDet, 'utf8', StatUtils2.printError);
      fs.writeFileSync(roundReportLocation, roundRep, 'utf8', StatUtils2.printError);
      fs.writeFileSync(statKeyLocation, statKey, 'utf8', StatUtils2.printError);
      return 1;
    }).then(() => {
      if(fileStart == '') { ipc.sendSync('statReportReady'); }
      else { this.toast('Stat report generated'); }
    }).catch((err) => {
      let message = 'Error generating stat report:\n\n';
      if(err.stack.includes('EROFS: read-only file system')) {
        message += 'If you are running this application from your downloads folder, you ' +
          'may need to move it to another directory.\n\n';
      }
      ipc.sendSync('genericModal', 'error', 'Error', message + err.stack, true);
    });

  } //writeStatReport

  /*---------------------------------------------------------
  Export the data in SQBS format
  ---------------------------------------------------------*/
  writeSqbsFile(fileName) {
    var phasesToGroupBy = this.phasesToGroupBy();
    var [divsInPhase, phaseSizes] = this.cumulativeRankSetup(phasesToGroupBy);

    var sqbsData = SqbsUtils.getSqbsFile(this.state.settings, this.state.viewingPhase,
      phasesToGroupBy, divsInPhase, this.state.myTeams, this.state.myGames,
      this.state.packets, this.state.gameIndex, this.state.allGamesShowTbs);
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(fileName, sqbsData, 'utf8', StatUtils2.printError));
    }).then(() => {
      this.toast('SQBS file generated');
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving file:\n\n' + err.stack, true);
    });
  } //writeSqbsFile

  /*---------------------------------------------------------
  Export the data in tournament schema format
  ---------------------------------------------------------*/
  writeQbjFile(fileName) {
    if(!fileName) { return; }
    var tournName = fileName.split(Path.sep).pop();
    tournName = tournName.replace(/.qbj/i, '');
    var tbsExist = this.state.tbCount > 0;
    var schemaObj = QbjUtils2.getQbjFile(this.state.settings, this.state.divisions,
      this.state.myTeams, this.state.myGames, this.state.packets, tbsExist, tournName);
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(fileName, JSON.stringify(schemaObj), 'utf8', StatUtils2.printError));
    }).then(() => {
      this.toast('QBJ file generated');
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving file:\n\n' + err.stack, true);
    });
  }

  /*---------------------------------------------------------
  Returns a list of games in which at least one team had
  more than eight players that heard at least one tossup.
  SQBS only supports eight players per team per game, so
  we need to warn the user before exporting the SQBS file.
  ---------------------------------------------------------*/
  sqbsCompatErrors() {
    var badGameAry = [];
    for(var i in this.state.myGames) {
      var g = this.state.myGames[i];
      var playerCount = 0;
      for(var p in g.players1) {
        if(StatUtils.toNum(g.players1[p].tuh) > 0) { playerCount++; }
      }
      if(playerCount > 8) {
        badGameAry.push('Round ' + g.round + ': ' + g.team1 + " vs. " + g.team2);
        continue;
      }
      playerCount = 0;
      for(var p in g.players2) {
        if(StatUtils.toNum(g.players2[p].tuh) > 0) { playerCount++; }
      }
      if(playerCount > 8) {
        badGameAry.push('Round ' + g.round + ': ' + g.team1 + " vs. " + g.team2);
      }
    }
    return badGameAry;
  }

  /*---------------------------------------------------------
  Clear data and go back to defaults. Called when the user
  selects "new tournament".
  ---------------------------------------------------------*/
  resetState() {
    var defSettingsCopy = $.extend(true, {}, DEFAULT_SETTINGS);
    this.setState({
      tmWindowVisible: false,
      gmWindowVisible: false,
      divEditWindowVisible: false,
      rptConfigWindowVisible: false,
      divWindowVisible: false,
      phaseWindowVisible: false,
      teamOrder: 'alpha',
      queryText: '',
      settings: defSettingsCopy,
      packets: {},
      divisions: {},
      myTeams: [],
      myGames: [],
      gameIndex: {},
      playerIndex: {},
      tbCount: 0,
      allGamesShowTbs: false,
      selectedTeams: [],
      selectedGames: [],
      checkTeamToggle: false,
      checkGameToggle: false,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      activePane: 'settingsPane',  //settings, teams, or games
      viewingPhase: 'all',
      forceResetForms: false,
      editWhichDivision: null,
      divAddOrEdit: 'add',
      editWhichTeam: null,
      tmAddOrEdit: 'add', //either 'add' or 'edit'
      editWhichGame: null,
      gmAddOrEdit: 'add',
      editingSettings: false,
      gameToBeDeleted: null,
      divToBeDeleted: null,
      activeRpt: this.state.defaultRpt,
      reconstructSidebar: !this.state.reconstructSidebar
      // DO NOT reset these! These should persist throughout the session
      // releasedRptList: ,
      // customRptList: ,
      // defaultRpt: ,
      // formSettings
    });
    ipc.sendSync('rebuildMenus', this.state.releasedRptList, this.state.customRptList, this.state.defaultRpt);
  }

  /*---------------------------------------------------------
  Whether any of the modal windows are open
  ---------------------------------------------------------*/
  anyModalOpen() {
    return this.state.tmWindowVisible || this.state.gmWindowVisible ||
      this.state.divEditWindowVisible || this.state.rptConfigWindowVisible ||
      this.state.divWindowVisible || this.state.phaseWindowVisible;
  }

  /*---------------------------------------------------------
  Move to the previous page (settings/teams/games)
  ---------------------------------------------------------*/
  previousPage() {
    var newPane = 'settingsPane';
    if(this.state.activePane == 'settingsPane') { newPane = 'gamesPane'; }
    else if(this.state.activePane == 'teamsPane') { newPane = 'settingsPane'; }
    else if(this.state.activePane == 'gamesPane') { newPane = 'teamsPane'; }
    this.setState({
      activePane: newPane
    });
  }//previousPage

  /*---------------------------------------------------------
  Move to the next page (settings/teams/games)
  ---------------------------------------------------------*/
  nextPage() {
    var newPane = 'settingsPane';
    if(this.state.activePane == 'settingsPane') { newPane = 'teamsPane'; }
    else if(this.state.activePane == 'teamsPane') { newPane = 'gamesPane'; }
    else if(this.state.activePane == 'gamesPane') { newPane = 'settingsPane'; }
    this.setState({
      activePane: newPane
    });
  }//previousPage

  /*---------------------------------------------------------
  cycle backwards through phases (user defined phases plus
  "all games" and "tiebreakers")
  ---------------------------------------------------------*/
  previousPhase() {
    var newPhase = 'all', oldPhase = this.state.viewingPhase;
    var phaseList = Object.keys(this.state.divisions);
    phaseList = _.without(phaseList, 'noPhase');
    if(phaseList.length == 0 && this.state.tbCount > 0) {
      newPhase = oldPhase == 'all' ? 'Tiebreakers' : 'all';
    }
    else {
      if(phaseList.length == 0) { return; }
      if(oldPhase == 'all') {
        newPhase = this.state.tbCount > 0 ? 'Tiebreakers' : phaseList[phaseList.length-1];
      }
      else if(oldPhase == 'Tiebreakers') { newPhase = phaseList[phaseList.length-1]; }
      else {
        var curPhaseNo = phaseList.indexOf(this.state.viewingPhase);
        if(curPhaseNo <= 0) { newPhase = 'all'; }
        else { newPhase = phaseList[curPhaseNo-1]; }
      }
    }
    this.setState({
      viewingPhase: newPhase
    });
  }

  /*---------------------------------------------------------
  Cycle forward through phases (user defined phases plus
  "all games")
  ---------------------------------------------------------*/
  nextPhase() {
    var newPhase = 'all', oldPhase = this.state.viewingPhase;
    var phaseList = Object.keys(this.state.divisions);
    phaseList = _.without(phaseList, 'noPhase');
    if(phaseList.length == 0 && this.state.tbCount > 0) {
      newPhase = oldPhase == 'all' ? 'Tiebreakers' : 'all';
    }
    else {
      if(oldPhase == 'all') { newPhase = phaseList[0]; }
      else if(oldPhase == 'Tiebreakers') { newPhase = 'all'; }
      else {
        var curPhaseNo = phaseList.indexOf(oldPhase);
        if(curPhaseNo == phaseList.length-1) {
          newPhase = this.state.tbCount > 0 ? 'Tiebreakers' : 'all';
        }
        else { newPhase = phaseList[curPhaseNo+1]; }
      }
    }
    this.setState({
      viewingPhase: newPhase
    });
  }

  /*---------------------------------------------------------
  Kick off opening the team modal
  ---------------------------------------------------------*/
  openTeamAddWindow() {
    this.setState({
      tmWindowVisible: true
    });
    setTimeout(function() { $('#teamName').focus() }, 50);
  }

  /*---------------------------------------------------------
  Kick off opening the game modal
  ---------------------------------------------------------*/
  openGameAddWindow() {
    if(this.state.myTeams.length < 2 || this.state.editingSettings) { return; }
    this.setState({
      gmWindowVisible: true
    });
    setTimeout(function() { $('#round').focus() }, 50);
  }

  /*---------------------------------------------------------
  Open a Materialize modal
  ---------------------------------------------------------*/
  openModal(descriptor) {
    M.Modal.getInstance(document.querySelector(descriptor)).open();
  }

  /*---------------------------------------------------------
  Prevents modals from staying open on the next render. Also
  directs modals to clear their data.
  ---------------------------------------------------------*/
  onModalClose() {
    this.setState({
      divEditWindowVisible: false,
      tmWindowVisible: false,
      gmWindowVisible: false,
      rptConfigWindowVisible: false,
      divWindowVisible: false,
      phaseWindowVisible: false,
      selectedTeams: [],
      selectedGames: [],
      checkTeamToggle: !this.state.checkTeamToggle,
      checkGameToggle: !this.state.checkGameToggle,
      forceResetForms: true
    });
  }

  /*---------------------------------------------------------
  Called after modals have cleared their data so that they
  don't enter in infinite render loop due to their
  componentDidUpdate methods
  ---------------------------------------------------------*/
  onForceReset() {
    this.setState({
      forceResetForms: false,
      divAddOrEdit: 'add',
      tmAddOrEdit: 'add',
      gmAddOrEdit: 'add'
    });
  }

  /*---------------------------------------------------------
  Add the new team, then close the form
  ---------------------------------------------------------*/
  addTeam(tempItem, acceptAndStay) {
    var tempTms = this.state.myTeams.slice();
    tempTms.push(tempItem);
    var settings = this.state.settings;
    ipc.sendSync('unsavedData');
    //update player index
    var tempIndex = this.state.playerIndex, teamName = tempItem.teamName;
    tempIndex[teamName] = {};
    for(var p in tempItem.roster) { tempIndex[teamName][p] = 0; }
    this.setState({
      myTeams: tempTms,
      tmWindowVisible: acceptAndStay,
      settings: settings,
      playerIndex: tempIndex,
      reconstructSidebar: !this.state.reconstructSidebar
    }) //setState
    if(acceptAndStay) {
      $('#teamName').focus();
      this.toast('Added ' + teamName);
    }
  } //addTeam

  /*---------------------------------------------------------
  Add the new game, then close the form
  ---------------------------------------------------------*/
  addGame(tempItem, acceptAndStay) {
    var tempGms = this.state.myGames.slice();
    tempGms.push(tempItem);
    var tempGameIndex = this.state.gameIndex;
    var round = tempItem.round;
    if(tempGameIndex[round] == undefined) { tempGameIndex[round] = 1; }
    else { tempGameIndex[round]++; }
    var tempPlayerIndex = this.state.playerIndex;
    StatUtils2.addGameToPlayerIndex(tempItem, tempPlayerIndex);
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGms,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
      tbCount : this.state.tbCount + tempItem.tiebreaker,
      gmWindowVisible: acceptAndStay
    }) //setState
    if(acceptAndStay) {
      $('#round').focus();
      var gameDisp = 'Round ' + tempItem.round + ' ' + tempItem.team1 + ' vs ' + tempItem.team2;
      this.toast('Added ' + gameDisp);
      $('#toast-container').addClass('toast-bottom-left');
    }
  } //addTeam

  /*---------------------------------------------------------
  Update the appropriate team, close the form, and update
  team and player names in that team's games if necessary.
  Assumes whitespace has alredy been removed from the form
  data
  ---------------------------------------------------------*/
  modifyTeam(oldTeam, newTeam, acceptAndStay) {
    var tempTeams = this.state.myTeams.slice();
    var tempGames = this.state.myGames.slice();
    var originalNames = Object.keys(oldTeam.roster), newNames = Object.keys(newTeam.roster);

    for(var i in originalNames) {
      let oldn = originalNames[i], newn = newNames[i];
      if(oldn != newn) { // including if newn is undefined, or is a deleted player placeholder
        if(newn == undefined || newTeam.roster[newn].deleted != undefined) {
          newn = ''; // don't count deleted player placeholders as actual players
        }
        this.updatePlayerName(tempGames, oldTeam.teamName, oldn, newn);
      }
    }

    if(oldTeam.teamName != newTeam.teamName) {
      this.updateTeamName(tempGames, oldTeam.teamName, newTeam.teamName);
    }

    //update index
    var tempPlayerIndex = this.state.playerIndex;
    var newTeamCopy = $.extend(true, {}, newTeam);
    StatUtils2.modifyTeamInPlayerIndex(oldTeam, newTeamCopy, tempPlayerIndex);

    //don't save the dummy placeholders for deleted teams
    var deletedTeams = [];
    for(var p in newTeam.roster) {
      if(newTeam.roster[p].deleted != undefined) { deletedTeams.push(p); }
    }
    for(var i in deletedTeams) {
      delete newTeam.roster[deletedTeams[i]];
    }
    var oldTeamIdx = _.indexOf(tempTeams, oldTeam);
    tempTeams[oldTeamIdx] = newTeam;

    ipc.sendSync('unsavedData');
    this.setState({
      myTeams: tempTeams,
      myGames: tempGames,
      tmWindowVisible: acceptAndStay,
      playerIndex: tempPlayerIndex,
      tmAddOrEdit: 'add', // need to set here in case of acceptAndStay
      reconstructSidebar: !this.state.reconstructSidebar
    });
    if(acceptAndStay) {
      $('#teamName').focus();
      this.toast('Saved ' + newTeam.teamName);
    }
  }//modifyTeam

  /*---------------------------------------------------------
  Change the name of team oldName to newName for all
  applicable games in gameAry
  ---------------------------------------------------------*/
  updateTeamName(gameAry, oldName, newName) {
    for(var i in gameAry){
      if(gameAry[i].team1 == oldName) {
        gameAry[i].team1 = newName;
      }
      if(gameAry[i].team2 == oldName) {
        gameAry[i].team2 = newName;
      }
    }
  }

  /*---------------------------------------------------------
  Change the name of team teamName's player oldPlayerName to
  newPlayerName for all applicable games in gameAry.
  Pass the empty string as newPlayerName in order to simply delete
  this player
  ---------------------------------------------------------*/
  updatePlayerName(gameAry, teamName, oldPlayerName, newPlayerName) {
    for(var i in gameAry) {
      if(gameAry[i].forfeit) { continue; }
      if(teamName == gameAry[i].team1) {
        if(newPlayerName != '') {
          let statLine = gameAry[i].players1[oldPlayerName];
          if(statLine != undefined) {
            gameAry[i].players1[newPlayerName] = statLine;
          }
        }
        delete gameAry[i].players1[oldPlayerName];
      }
      else if(teamName == gameAry[i].team2) {
        if(newPlayerName != '') {
          let statLine = gameAry[i].players2[oldPlayerName];
          if(statLine != undefined) {
            gameAry[i].players2[newPlayerName] = statLine;
          }
        }
        delete gameAry[i].players2[oldPlayerName];
      }
    }
  }

  /*---------------------------------------------------------
  Updat the appropriate game and close the form
  ---------------------------------------------------------*/
  modifyGame(oldGame, newGame, acceptAndStay) {
    var tempGameAry = this.state.myGames.slice();
    var oldGameIdx = _.findIndex(tempGameAry, function (o) {
       return StatUtils2.gameEqual(o, oldGame)
     });
    tempGameAry[oldGameIdx] = newGame;
    // update game index
    var tempGameIndex = this.state.gameIndex;
    var oldRound = oldGame.round, newRound = newGame.round;
    if(oldRound != newRound) {
      if(tempGameIndex[newRound] == undefined) { tempGameIndex[newRound] = 1; }
      else { tempGameIndex[newRound]++; }
      if(--tempGameIndex[oldRound] == 0) { delete tempGameIndex[oldRound]; }
    }
    var tempPlayerIndex = this.state.playerIndex;
    StatUtils2.modifyGameInPlayerIndex(oldGame, newGame, tempPlayerIndex);
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGameAry,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
      tbCount: this.state.tbCount - oldGame.tiebreaker + newGame.tiebreaker,
      gmWindowVisible: acceptAndStay,
      gmAddOrEdit: 'add' // needed in case of acceptAndStay
    });
    if(acceptAndStay) {
      $('#round').focus();
      var gameDisp = 'Round ' + newGame.round + ' ' + newGame.team1 + ' vs ' + newGame.team2;
      this.toast('Saved ' + gameDisp);
      $('#toast-container').addClass('toast-bottom-left');
    }
  }

  /*---------------------------------------------------------
  Permanently delete a team. Does not check whether that team
  has any game data; make sure it doesn't before calling!
  ---------------------------------------------------------*/
  deleteTeam(item) {
    var newTeams = _.without(this.state.myTeams, item);
    var newSelected = _.without(this.state.selectedTeams, item);
    var tempPlayerIndex = this.state.playerIndex;
    delete tempPlayerIndex[item.teamName];
    this.setState({
      myTeams: newTeams,
      selectedTeams: newSelected,
      playerIndex: tempPlayerIndex,
      reconstructSidebar: !this.state.reconstructSidebar
    });
    ipc.sendSync('unsavedData');
  } //deleteTeam

  /*---------------------------------------------------------
  Called twice during the game deletion workflow. The first
  time it triggers a confirmation message. The sencond time,
  once the user has confirmed, it permanently deletes the
  game
  ---------------------------------------------------------*/
  deleteGame(item) {
    if(this.state.gameToBeDeleted == null) {
      this.setState({
        gameToBeDeleted: item
      });
      ipc.send('tryGameDelete', 'Round ' + item.round + ': ' + item.team1 + ' vs. ' + item.team2);
      return;
    }
    var allGames = this.state.myGames;
    var newGames = _.without(allGames, this.state.gameToBeDeleted);
    // update index
    var tempGameIndex = this.state.gameIndex, round = this.state.gameToBeDeleted.round;
    if(--tempGameIndex[round] == 0) { delete tempGameIndex[round]; }
    var tempPlayerIndex = this.state.playerIndex;
    StatUtils2.modifyGameInPlayerIndex(this.state.gameToBeDeleted, null, tempPlayerIndex);
    var newTbCount = this.state.tbCount - this.state.gameToBeDeleted.tiebreaker;
    var newViewingPhase = this.state.viewingPhase;
    if(newTbCount == 0 && newViewingPhase == 'Tiebreakers') {
      newViewingPhase = 'all';
    }
    this.setState({
      myGames: newGames,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
      tbCount: newTbCount,
      viewingPhase: newViewingPhase,
      gameToBeDeleted: null
    });
    ipc.sendSync('unsavedData');
  } //deleteGame

  /*---------------------------------------------------------
  Remove the given team's division assignment for the given
  phase.
  ---------------------------------------------------------*/
  removeDivisionFromTeam(whichTeam, phase) {
    var tempTeams = this.state.myTeams;
    var idx = _.indexOf(tempTeams, whichTeam);
    delete tempTeams[idx].divisions[phase];
    this.setState({
      myTeams: tempTeams
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Dissociate the specified game from the specified phase
  ---------------------------------------------------------*/
  removePhaseFromGame(whichGame, phase) {
    var tempGames = this.state.myGames;
    var idx = _.indexOf(tempGames, whichGame);
    _.pull(tempGames[idx].phases, phase);
    this.setState({
      myGames: tempGames
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Tell the division edit modal to load the given division
  ---------------------------------------------------------*/
  openDivForEdit(item) {
    this.setState({
      editWhichDivision: item,
      divAddOrEdit: 'edit'
    });
    this.openDivEditModal()
  }

  /*---------------------------------------------------------
  Tell the team modal to load the given team
  ---------------------------------------------------------*/
  openTeamForEdit(item) {
    this.setState({
      editWhichTeam: item,
      tmAddOrEdit: 'edit'
    });
    this.openTeamAddWindow();
  }

  /*---------------------------------------------------------
  Tell the game modal to load the given game
  ---------------------------------------------------------*/
  openGameForEdit(item) {
    this.setState({
      editWhichGame: item,
      gmAddOrEdit: 'edit'
    });
    this.openGameAddWindow();
  }

  /*---------------------------------------------------------
  Called by div edit modal once it's finished loading data.
  Prevents an infinite render loop from the div edit modal's
  componentDidUpdate method.
  ---------------------------------------------------------*/
  onLoadDivInModal() {
    this.setState({
      editWhichDivision: null
    });
  }

  /*---------------------------------------------------------
  Called by team modal once it's finished loading data.
  Prevents an infinite render loop from the team modal's
  componentDidUpdate method.
  ---------------------------------------------------------*/
  onLoadTeamInModal() {
    this.setState({
      editWhichTeam: null
    });
  }

  /*---------------------------------------------------------
  Called by game modal once it's finished loading data.
  Prevents an infinite render loop from the game modal's
  componentDidUpdate method.
  ---------------------------------------------------------*/
  onLoadGameInModal() {
    this.setState({
      editWhichGame: null
    });
  }

  /*---------------------------------------------------------
  Determine whether newDivName is a legal division name.
  Can't already be the name of an existing division in
  newPhase, other than savedDivision, the one that's
  currently being edited
  ---------------------------------------------------------*/
  validateDivisionName(newDivName, newPhase, savedDivision) {
    var otherDivisions = this.state.divisions[newPhase];
    if(otherDivisions == undefined) { return true; }
    if(savedDivision != null) {
      otherDivisions = _.without(otherDivisions, savedDivision.divisionName);
    }
    var idx = otherDivisions.findIndex((d) => {
      return d.toLowerCase() == newDivName.toLowerCase();
    });
    return idx==-1;
  }

  /*---------------------------------------------------------
  Determine whether newTeamName is a legal team name.
  Can't already be the name of an existing team other
  than savedTeam, the one that's currently being edited.
  ---------------------------------------------------------*/
  validateTeamName(newTeamName, savedTeam) {
    var otherTeams;
    if(savedTeam != null) {
      otherTeams = _.without(this.state.myTeams, savedTeam);
    }
    else {
      otherTeams = this.state.myTeams;
    }
    var idx = otherTeams.findIndex((t) => {
      return t.teamName.toLowerCase() == newTeamName.toLowerCase();
    });
    return idx==-1;
  }

  /*---------------------------------------------------------
  Whether the given teams have already played in this round.
  originalGameLoaded: the game currently open for editing
  Returns an array with two values, one for each team:
  0: has not played a game
  1: has played a tiebreaker
  2: has played a non-tiebreaker
  3: both teams have already played each other in this round
  ---------------------------------------------------------*/
  haveTeamsPlayedInRound(teamA, teamB, roundNo, originalGameLoaded) {
    var teamAPlayed = 0, teamBPlayed = 0;
    for(var i in this.state.myGames) {
      var g = this.state.myGames[i];
      if(g.round == roundNo && !StatUtils2.gameEqual(g, originalGameLoaded)) {
        if((g.team1 == teamA && g.team2 == teamB) || (g.team2 == teamA && g.team1 == teamB)) {
          return [3, 3];
        }
        if(g.team1 == teamA || g.team2 == teamA) {
          if(g.tiebreaker && teamAPlayed <= 1) { teamAPlayed = 1; }
          else { teamAPlayed = 2; }
        }
        if(g.team1 == teamB || g.team2 == teamB) {
          if(g.tiebreaker && teamBPlayed <= 1) { teamBPlayed = 1; }
          else { teamBPlayed = 2; }
        }
      }
    }
    return [teamAPlayed, teamBPlayed];
  }

  /*---------------------------------------------------------
  Whether this team has played at least one game.
  ---------------------------------------------------------*/
  teamHasPlayedGames(team) {
    for(var i in this.state.myGames) {
      var g = this.state.myGames[i];
      if(g.team1 == team.teamName || g.team2 == team.teamName) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Save the packet names
  ---------------------------------------------------------*/
  savePackets(packets) {
    this.setState({
      packets: packets
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Sort teams
  ---------------------------------------------------------*/
  reOrder(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    }) //setState
  } //reOrder

  /*---------------------------------------------------------
  Fiter teams or games
  ---------------------------------------------------------*/
  searchLists(query) {
    this.setState({
      queryText: query
    }); //setState
  } //searchLists

  /*---------------------------------------------------------
  Whether the user is viewing settings, teams, or games`
  ---------------------------------------------------------*/
  setPane(pane) {
    this.setState({
      activePane: pane,
    });
  } //setPane

  /*---------------------------------------------------------
  Which phase the user is viewing
  ---------------------------------------------------------*/
  setPhase(phase) {
    this.setState({
      viewingPhase: phase
    });
  }

  /*---------------------------------------------------------
  Open or close the sidebar
  ---------------------------------------------------------*/
  toggleSidebar() {
    this.setState({
      sidebarOpen: !this.state.sidebarOpen
    })
  }

  /*---------------------------------------------------------
  Add a single new division to the specified phase
  (Phase can be 'noPhase')
  acceptAndStay is true if we want the modal to stay open,
  false if not.
  ---------------------------------------------------------*/
  addDivision(divName, phase, acceptAndStay) {
    var tempDivisions = this.state.divisions;
    if(phase == 'noPhase' && tempDivisions.noPhase == undefined) {
      tempDivisions.noPhase = [];
    }
    tempDivisions[phase].push(divName);
    //select a new default grouping phase if there wasn't one before
    var newDefaultPhases = this.state.settings.defaultPhases;
    if(newDefaultPhases.length == 0) {
      var phaseList = Object.keys(this.state.divisions);
      var numPhases = phaseList.length;
      if(numPhases > 0) {
        var lastPhase = phaseList[numPhases - 1];
        if(lastPhase == 'noPhase' && numPhases > 1) {
          lastPhase = phaseList[numPhases - 2];
        }
        if(lastPhase != 'noPhase') {
          newDefaultPhases = [lastPhase];
        }
      }
    }
    var newSettings = this.state.settings;
    newSettings.defaultPhases = newDefaultPhases;
    this.setState({
     divisions: tempDivisions,
     divEditWindowVisible: acceptAndStay,
     settings: newSettings,
     settingsLoadToggle: !this.state.settingsLoadToggle
    });
    ipc.sendSync('unsavedData');
    if(acceptAndStay) {
      $('#divisionName').focus();
      var phaseDisplay = phase != 'noPhase' ? ' (' + phase + ')' : '';
      this.toast('Added ' + divName + phaseDisplay);
    }
  }

  /*---------------------------------------------------------
  Modify a single division
  acceptAndStay is true if we want the modal to stay open,
  false if not.
  ---------------------------------------------------------*/
  modifyDivision(oldDivision, newDivName, newPhase, acceptAndStay) {
    var tempDivisions = this.state.divisions;
    var tempTeams = this.state.myTeams;
    var oldDivName = oldDivision.divisionName, oldPhase = oldDivision.phase;
    //if phase was changed remove it from teams and from division structure
    if(oldPhase != newPhase) {
      for(var i in tempTeams) {
        if(tempTeams[i].divisions[oldPhase] == oldDivName) {
          delete tempTeams[i].divisions[oldPhase];
        }
      }
      _.pull(tempDivisions[oldPhase], oldDivName);
      if(newPhase != 'noPhase') {
        tempDivisions[newPhase].push(newDivName);
      }
      else {
        if(tempDivisions.noPhase != undefined) { tempDivisions.noPhase.push(newDivName); }
        else { tempDivisions.noPhase = [newDivName]; }
      }
    }
    //otherwise just change division name
    else if(oldDivName != newDivName) {
      for(var i in tempTeams) {
        if(tempTeams[i].divisions[newPhase] == oldDivName) {
          tempTeams[i].divisions[newPhase] = newDivName;
        }
      }
      var idx = tempDivisions[newPhase].findIndex((d) => { return d == oldDivName });
      tempDivisions[newPhase][idx] = newDivName;
    }
    this.setState({
      divisions: tempDivisions,
      myTeams: tempTeams,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      divEditWindowVisible: acceptAndStay,
      divAddOrEdit: 'add' // need to reset this here in case of acceptAndStay
    });
    ipc.sendSync('unsavedData');
    if(acceptAndStay) {
      $('#divisionName').focus();
      var phaseDisplay = newPhase != 'noPhase' ? ' (' + newPhase + ')' : '';
      this.toast('Saved ' + newDivName + phaseDisplay);
    }
  } //modifyDivision

  /*---------------------------------------------------------
  Delete a single division
  Called twice during the division deletion workflow. The
  first time it triggers a confirmation message. The second
  time, once the user has confirmed, it permanently deletes
  the game
  ---------------------------------------------------------*/
  deleteDivision(item) {
    if(this.state.divToBeDeleted == null) {
      this.setState({
        divToBeDeleted: item
      });
      var phaseString = item.phase != 'noPhase' ? ' (' + item.phase + ')' : ''
      ipc.send('tryDivDelete', item.divisionName + phaseString);
      return;
    }
    // delete the division from any teams that have it
    var tempTeams = this.state.myTeams;
    var divName = this.state.divToBeDeleted.divisionName;
    var phase = this.state.divToBeDeleted.phase;
    for(var i in tempTeams) {
      if(tempTeams[i].divisions[phase] == divName) {
        delete tempTeams[i].divisions[phase];
      }
    }
    // delete the division from the division object
    var tempDivisions = this.state.divisions;
    _.pull(tempDivisions[phase], divName);
    if(phase == 'noPhase' && tempDivisions.noPhase.length == 0) {
      delete tempDivisions.noPhase;
    }
    // delete default grouping phase if there are no more divisions
    var divsExist = false, newSettings = this.state.settings;
    for(var p in tempDivisions) {
      if(tempDivisions[p].length > 0) { divsExist = true; }
    }
    if(!divsExist) { newSettings.defaultPhases = []; }
    this.setState({
      divisions: tempDivisions,
      teams: tempTeams,
      settings: newSettings,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      divToBeDeleted: null
    });
    ipc.sendSync('unsavedData');
  }//deleteDivision

  /*---------------------------------------------------------
  reorder the list of divisions so that droppedItem is
  immediately above receivingItem
  ---------------------------------------------------------*/
  reorderDivisions(droppedItem, receivingItem) {
    // don't bother if the divisions are from different phases, or if they're the same division
    if(droppedItem.phase != receivingItem.phase ||
      droppedItem.divisionName == receivingItem.divisionName) {
        return;
      }
    var phase = droppedItem.phase;
    var tempDivisions = this.state.divisions;
    var onePhase = _.without(tempDivisions[phase], droppedItem.divisionName);
    var recItemIdx = onePhase.indexOf(receivingItem.divisionName);
    tempDivisions[phase] = onePhase.slice(0,recItemIdx).concat([droppedItem.divisionName], onePhase.slice(recItemIdx));
    this.setState({
      divisions: tempDivisions,
      settingsLoadToggle: !this.state.settingsLoadToggle,
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Modify phases and divisions, as well as the assignments
  of teams to divisions and games to phases if necessary.
  Called from the settings form.
  ---------------------------------------------------------*/
  savePhases(newPhases, newDivAry, nameChanges) {
    var tempDivisions = $.extend(true, {}, this.state.divisions);
    var divsWithDeletedPhases = [];
    // adjust division structure
    for(var phase in this.state.divisions) {
      // rename phases
      if(nameChanges[phase] != undefined) {
        delete tempDivisions[phase];
        tempDivisions[nameChanges[phase]] = this.state.divisions[phase];
      }
      // remove phases that were deleted
      else if(!newPhases.includes(phase) && phase != 'noPhase') {
        divsWithDeletedPhases = divsWithDeletedPhases.concat(this.state.divisions[phase]);
        delete tempDivisions[phase];
      }
    }
    for(var i in newPhases) {
      // initialize new phases
      let phase = newPhases[i];
      if(tempDivisions[phase] == undefined){
        tempDivisions[phase] = [];
      }
    }
    if(tempDivisions.noPhase != undefined) {
      tempDivisions.noPhase = tempDivisions.noPhase.concat(divsWithDeletedPhases);
    }
    else if(divsWithDeletedPhases.length > 0) {
      tempDivisions.noPhase = divsWithDeletedPhases;
    }
    // put the phases back in the order they were listed when the user submitted the form,
    //  so that the order doesn't change arbitrarily
    var reorderedPhases = {};
    for(var i in newPhases) {
      reorderedPhases[newPhases[i]] = tempDivisions[newPhases[i]];
    }
    if(tempDivisions.noPhase != undefined) {
      reorderedPhases.noPhase = tempDivisions.noPhase;
    }
    tempDivisions = reorderedPhases;

    // adjust team structure
    var tempTeams = this.state.myTeams.slice();
    for(var i in this.state.myTeams) {
      let tm = this.state.myTeams[i]
      for(var phase in tm.divisions) {
        // rename phases
        if(nameChanges[phase] != undefined) {
          tempTeams[i].divisions[nameChanges[phase]] = tm.divisions[phase];
          delete tempTeams[i].divisions[phase];
        }
        // remove phases that were deleted
        else if(!newPhases.includes(phase)) {
          delete tempTeams[i].divisions[phase];
        }
      }
    }

    // adjust game structure
    var tempGames = this.state.myGames.slice();
    for(var i in this.state.myGames) {
      let gm = this.state.myGames[i];
      for(var j in gm.phases) {
        let phase = gm.phases[j];
        // rename phases
        if(nameChanges[phase] != undefined) {
          _.pull(tempGames[i].phases, phase);
          tempGames[i].phases.push(nameChanges[phase]);
        }
        // remove phases that were deleted
        if(!newPhases.includes(phase)) {
          _.pull(tempGames[i].phases, phase);
        }
      }
    }

    //can't be viewing a phase that doesn't exist
    var newViewingPhase = this.state.viewingPhase;
    if(newViewingPhase != 'Tiebreakers' && !newPhases.includes(newViewingPhase)) {
      newViewingPhase = 'all';
    }
    //modify default grouping phases if necessary
    var oldDefaultPhases = this.state.settings.defaultPhases;
    var newDefaultPhases = this.state.settings.defaultPhases.slice();
    for(var i in oldDefaultPhases) {
      //can't have default grouping phases that don't exist
      if(!newPhases.includes(oldDefaultPhases[i])) {
        _.pull(newDefaultPhases, oldDefaultPhases[i]);
      }
    }
    // add a default phase if there isn't one yet
    if(newDefaultPhases.length == 0 && newPhases.length > 0 && this.usingDivisions()) {
      newDefaultPhases.push(newPhases[newPhases.length - 1]);
    }

    var newSettings = this.state.settings;
    newSettings.defaultPhases = newDefaultPhases;

    this.setState({
      divisions: tempDivisions,
      myTeams: tempTeams,
      myGames: tempGames,
      viewingPhase: newViewingPhase,
      settings: newSettings,
      settingsLoadToggle: !this.state.settingsLoadToggle
    });
    ipc.sendSync('unsavedData');
  } //savePhases

  /*---------------------------------------------------------
  When a team is selected or deselected using the checkbox
  ---------------------------------------------------------*/
  onSelectTeam(whichTeam) {
    var tempSelTeams = this.state.selectedTeams.slice();
    var idx = tempSelTeams.indexOf(whichTeam);
    if(idx == -1) { tempSelTeams.push(whichTeam); }
    else { _.pull(tempSelTeams, whichTeam); }
    this.setState({
      selectedTeams: tempSelTeams
    });
  }

  /*---------------------------------------------------------
  When a game is selected/deselected using the checkbox
  ---------------------------------------------------------*/
  onSelectGame(whichGame) {
    var tempSelGames = this.state.selectedGames.slice();
    var idx = tempSelGames.indexOf(whichGame);
    if(idx == -1) { tempSelGames.push(whichGame); }
    else { _.pull(tempSelGames, whichGame); }
    this.setState({
      selectedGames: tempSelGames
    });
  }

  /*---------------------------------------------------------
  Open the modal for editing divisions
  ---------------------------------------------------------*/
  openDivEditModal() {
    this.setState({
      divEditWindowVisible: true
    });
    // for some reason I can't call focus() normally for this field.
    // fortunately this delay is not perceptible
    setTimeout(function() { $('#divisionName').focus() }, 50);
    // $('#divisionName').focus();
  }

  /*---------------------------------------------------------
  Open the modal for configuring report settings
  ---------------------------------------------------------*/
  openRptConfigModal() {
    this.setState({
      rptConfigWindowVisible: true
    });
  }

  /*---------------------------------------------------------
  Open the modal for assigning teams to divisions
  ---------------------------------------------------------*/
  openDivModal() {
    if(this.state.selectedTeams.length == 0) { return; }
    this.setState({
      divWindowVisible: true
    });
  }

  /*---------------------------------------------------------
  Open the modal for assigning games to phases
  ---------------------------------------------------------*/
  openPhaseModal() {
    if(this.state.selectedGames.length == 0) { return; }
    this.setState({
      phaseWindowVisible: true
    });
  }

  /*---------------------------------------------------------
  Assign divisions to the selected teams.
  ---------------------------------------------------------*/
  submitDivAssignments(divSelections) {
    var selTeams = this.state.selectedTeams;
    var allTeams = this.state.myTeams;
    for(var i in selTeams) {
      var tmIdx = allTeams.indexOf(selTeams[i]);
      for(var phase in divSelections) {
        var div = divSelections[phase];
        if(div == 'remove') {
          delete allTeams[tmIdx].divisions[phase];
        }
        else if(div != 'ignore') {
          allTeams[tmIdx].divisions[phase] = div;
        }
      }
    }
    this.setState({
      divWindowVisible: false,
      myTeams: allTeams,
      selectedTeams: [],
      checkTeamToggle: !this.state.checkTeamToggle
    });
    ipc.sendSync('unsavedData');
  }//submitDivAssignments

  /*---------------------------------------------------------
  Assign phases to the selected games.
  ---------------------------------------------------------*/
  submitPhaseAssignments(phaseSelections) {
    var selGames = this.state.selectedGames;
    var allGames = this.state.myGames;
    for(var i in selGames) {
      var idx = allGames.indexOf(selGames[i]);
      for(var i in phaseSelections) {
        if(phaseSelections[i] == 'delete') {
          allGames[idx].phases = [];
        }
        else if (!allGames[idx].phases.includes(phaseSelections[i])) {
          allGames[idx].phases.push(phaseSelections[i]);
        }
      }
    }
    this.setState({
      myGames: allGames,
      phaseWindowVisible: false,
      selectedGames: [],
      checkGameToggle: !this.state.checkGameToggle
    });
    ipc.sendSync('unsavedData');
  }//submitPhaseAssignments

  /*---------------------------------------------------------
  Does the team belong to the phase the user is currently
  viewing?
  ---------------------------------------------------------*/
  teamBelongsToCurrentPhase(team) {
    var viewingPhase = this.state.viewingPhase;
    if(viewingPhase == 'all') { return true; }
    if(viewingPhase == 'Tiebreakers') { return true; } // Tiebreakers isn't a real phase
    return team.divisions[this.state.viewingPhase] != undefined;
  }

  /*---------------------------------------------------------
  Does the game belong to the phase the user is currently
  viewing?
  ---------------------------------------------------------*/
  gameBelongsToCurrentPhase(game) {
    var viewingPhase = this.state.viewingPhase;
    if(viewingPhase == 'all') { return true; }
    if(viewingPhase == 'Tiebreakers') { return game.tiebreaker; }
    return game.phases.includes(this.state.viewingPhase);
  }

  /*---------------------------------------------------------
  Set which phase's divisions will be used when viewing all
  games
  ---------------------------------------------------------*/
  setDefaultGrouping(phases) {
    var newSettings = this.state.settings;
    newSettings.defaultPhases = phases;
    this.setState({
      settings: newSettings
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Show/hide tiebreakers when viewing all games
  ---------------------------------------------------------*/
  toggleTiebreakers(show) {
    this.setState({
      allGamesShowTbs: show
    });
  }

  /*---------------------------------------------------------
  Does this tournament have at least one user-defined phase?
  ---------------------------------------------------------*/
  usingPhases() {
    var numberOfPhases = Object.keys(this.state.divisions).length;
    return numberOfPhases > 1 ||  (numberOfPhases == 1 && this.state.divisions['noPhase'] == undefined);
  }

  /*---------------------------------------------------------
  Does this tournament have one or more divisions?
  ---------------------------------------------------------*/
  usingDivisions() {
    for (var phase in this.state.divisions) {
      if(this.state.divisions[phase].length > 0) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Get the list of phases (if any) by which to group teams
  ---------------------------------------------------------*/
  phasesToGroupBy() {
    var usingPhases = this.usingPhases(), viewingPhase = this.state.viewingPhase;
    if(!usingPhases && this.usingDivisions()) { return ['noPhase']; }
    else if(viewingPhase == 'Tiebreakers') { return []; }
    else if(viewingPhase != 'all') { return [viewingPhase]; }
    else if(usingPhases) { return this.state.settings.defaultPhases; }
    return [];
  }

  /*---------------------------------------------------------
  Compute the list of divisions to group teams by (could be
  from multiple phases), and the number of divisions in
  each grouping phase
  ---------------------------------------------------------*/
  cumulativeRankSetup(phasesToGroupBy) {
    var divsInPhase = [], phaseSizes = [0];
    for(var i in phasesToGroupBy) {
      let oneDivList = this.state.divisions[phasesToGroupBy[i]];
      divsInPhase = divsInPhase.concat(oneDivList);
      //keep track of which divisions came from which phases (for the phase record column tooltip)
      phaseSizes[+i+1] = phaseSizes[i] + oneDivList.length;
    }
    return [divsInPhase, phaseSizes];
  }

  /*---------------------------------------------------------
  Save the tournament format settings (powers, negs, bonuses,
  players per team. Merges these settings into the others
  contained in the settings object.
  ---------------------------------------------------------*/
  saveSettings(newSettings) {
    this.setState ({
      settings: $.extend(true, this.state.settings, newSettings)
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Whether the "settings" section of the settings pane is
  open for editing.
  ---------------------------------------------------------*/
  editingSettings(bool) {
    this.setState({
      editingSettings: bool
    });
  }

  /*---------------------------------------------------------
  Does the search text match this team?
  ---------------------------------------------------------*/
  teamQueryMatch(queryText, team) {
    var teamName = team.teamName.toLowerCase();
    if(queryText.startsWith('=')) { return queryText.substr(1) == teamName; }
    return teamName.indexOf(queryText)!=-1 || Object.keys(team.roster).join(', ').toLowerCase().indexOf(queryText)!=-1
  }

  /*---------------------------------------------------------
  Does the search text match this game?
  ---------------------------------------------------------*/
  gameQueryMatch(queryText, game) {
    if(queryText.length <= 1) { return this.gameBelongsToCurrentPhase(game); } // ignore 1-character searches for performance reasons
    if(this.noPhaseQuery(queryText, game)) { return true; }
    if(!this.gameBelongsToCurrentPhase(game)) { return false; }
    var team1 = game.team1.toLowerCase(), team2 = game.team2.toLowerCase();
    if(queryText.startsWith('=') && !queryText.includes('/')) { // '=' to require exact match
      return team1 == queryText.substr(1) || team2 == queryText.substr(1);
    }
    return game.team1.toLowerCase().indexOf(queryText)!=-1 ||
    game.team2.toLowerCase().indexOf(queryText)!=-1 ||
    game.notes.toLowerCase().indexOf(queryText)!=-1 ||
    this.matchRoundSearch(queryText,game) ||
    this.matchBothTeams(queryText, game);
  }

  /*---------------------------------------------------------
  Returns true if the query text starts with "Round###" or
  "R###" and if the game's round matches ###
  ---------------------------------------------------------*/
  matchRoundSearch(queryText, game) {
    queryText = queryText.trim();
    if(queryText.search(/^(r(ound)?\s*\d+)/i) != 0) { return false; }
    var queryRound = queryText.replace(/\D/g, '');
    return game.round == queryRound;
  }

  /*---------------------------------------------------------
  Returns true if parts of the query text (separate by a '/')
  match both teams
  ---------------------------------------------------------*/
  matchBothTeams(queryText, game) {
    var matchFirst = false, matchSecond = false;
    var team1 = game.team1.toLowerCase(), team2 = game.team2.toLowerCase();
    var words = queryText.split('/');
    words = words.map(function(str,idx) { return str.trim(); });
    words = _.without(words, '');
    if(words.length < 2) { return false; }
    for(var i in words) {
      if(words[i].startsWith('=')) {
        if(team1 == words[i].substr(1)) { matchFirst = true; }
        else if(team2 == words[i].substr(1)) { matchSecond = true; }
      }
      else {
        if(team1.indexOf(words[i])!=-1) { matchFirst = true; }
        else if(team2.indexOf(words[i])!=-1) { matchSecond = true; }
      }
    }
    return matchFirst && matchSecond;
  }

  /*---------------------------------------------------------
  Typing "no phase", "nophase", etc. in the search bar will
  find games with no assigned phase.
  ---------------------------------------------------------*/
  noPhaseQuery(queryText, game) {
    if(game.phases.length > 0 || game.tiebreaker) { return false; }
    queryText = queryText.trim();
    return queryText.search(/^(no\W*phase)/i) == 0;
  }

  /*---------------------------------------------------------
  Change how the list of teams is sorted.
  ---------------------------------------------------------*/
  sortTeamsBy(orderBy) {
    this.setState({
      teamOrder: orderBy
    });
  }

  /*---------------------------------------------------------
  When the user clicks a team's name in the sidebar,
  find that team's games. Or, if they just did that,
  clear the search bar.
  ---------------------------------------------------------*/
  filterByTeam(teamName) {
    var newQueryText = '';
    if(this.state.queryText != '=' + teamName) {
      newQueryText = '=' + teamName;
    }
    this.setState({
      queryText: newQueryText,
      navbarLoadToggle: !this.state.navbarLoadToggle
    });
  }

  /*---------------------------------------------------------
  Save the custom report configuration called rptName
  to file.
  If rptName is null, add the new configuration without
  replacing an existing one
  acceptAndStay is true if we want the modal to stay open,
  false if not.
  ---------------------------------------------------------*/
  modifyRptConfig(rptName, rptObj, newName, acceptAndStay) {
    var tempRpts = this.state.customRptList;
    var activeRpt = this.state.activeRpt;
    if(rptName != null) {
      if(this.state.customRptList[rptName] == undefined) { return; }
      delete tempRpts[rptName];
      if(activeRpt == rptName) { activeRpt = newName; }
    }
    tempRpts[newName] = rptObj; //newName may or may not be the same as rptName
    this.setState({
      customRptList: tempRpts,
      rptConfigWindowVisible: acceptAndStay,
      activeRpt: activeRpt
    });
    var newCustomRpts = {
        defaultRpt: this.state.defaultRpt,
        rptConfigList: tempRpts
    }
    var state = this.state;
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', StatUtils2.printError));
    }).then(() => {
      if(acceptAndStay) { this.toast('Saved ' + newName); }
      ipc.sendSync('rebuildMenus', this.state.releasedRptList, tempRpts, activeRpt);
      return 1;
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving settings:\n\n' + err.stack, true);
    });
  }

  /*---------------------------------------------------------
  Set the default report configuration and write to file
  ---------------------------------------------------------*/
  setDefaultRpt(rptName) {
    var newCustomRpts = {
      defaultRpt: rptName,
      rptConfigList: this.state.customRptList
    }
    this.setState({
      defaultRpt: rptName,
    });
    var state = this.state;
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', StatUtils2.printError));
    }).then(() => {
      this.toast('Set ' + rptName + ' as the default for new tournaments');
      return 1;
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving settings:\n\n' + err.stack, true);
    });
  }

  /*---------------------------------------------------------
  Set the default report configuration back to the original
  default and write to file.
  ---------------------------------------------------------*/
  clearDefaultRpt() {
    var newCustomRpts = {
      defaultRpt: null,
      rptConfigList: this.state.customRptList
    }
    this.setState({
      defaultRpt: SYS_DEFAULT_RPT_NAME,
    });

    var state = this.state;
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', StatUtils2.printError));
    }).then(() => {
      this.toast('Removed default status');
      return 1;
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving settings:\n\n' + err.stack, true);
    });
  }

  /*---------------------------------------------------------
  Tell the main process to prompt the user to confirm that
  they want to delete this rpt
  ---------------------------------------------------------*/
  rptDeletionPrompt(rptName) {
    ipc.sendSync('rptDeletionPrompt', rptName);
  }

  /*---------------------------------------------------------
  Delete a report configuration. Called after the user
  confirms that they want to delete it.
  ---------------------------------------------------------*/
  deleteRpt(rptName) {
    var tempRpts = this.state.customRptList;
    var newDefault = this.state.defaultRpt;
    var activeRpt = this.state.activeRpt;
    delete tempRpts[rptName];
    if(this.state.defaultRpt == rptName) { newDefault = SYS_DEFAULT_RPT_NAME; }
    if(this.state.activeRpt == rptName) { activeRpt = SYS_DEFAULT_RPT_NAME; }
    this.setState({
      customRptList: tempRpts,
      defaultRpt: newDefault,
      activeRpt: activeRpt
    });
    var newCustomRpts = {
      defaultRpt: newDefault == SYS_DEFAULT_RPT_NAME ? null : newDefault,
      rptConfigList: tempRpts
    }

    var state = this.state;
    new Promise(function(resolve, reject) {
      resolve(fs.writeFileSync(state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', StatUtils2.printError));
    }).then(() => {
      ipc.sendSync('rebuildMenus', this.state.releasedRptList, tempRpts, activeRpt);
      return 1;
    }).catch((err) => {
      ipc.sendSync('genericModal', 'error', 'Error', 'Error saving settings:\n\n' + err.stack, true);
    });
  }

  /*---------------------------------------------------------
  Turn on and off settings for which optional entry fields
  should appear
  ---------------------------------------------------------*/
  toggleFormField(whichField, status) {
    if(this.state.formSettings[whichField] == undefined) { return; }
    var tempFormSettings = this.state.formSettings;
    tempFormSettings[whichField] = status;
    this.setState({
      formSettings: tempFormSettings
    });
  }

  /*---------------------------------------------------------
  Save rank overrides entered in the sidebar. Throw out
  values that don't make sense.
  ---------------------------------------------------------*/
  saveRankOverrides(rankOverrides) {
    var tempTeams = this.state.myTeams;
    for(var i in tempTeams) {
      let rank = Math.round(rankOverrides[tempTeams[i].teamName]);
      if(!isNaN(rank) && rank >= 1) {
        tempTeams[i].rank = rank;
      }
      else { tempTeams[i].rank = ''; }
    }
    this.setState({
      myTeams: tempTeams,
      reconstructSidebar: !this.state.reconstructSidebar
    });
    ipc.sendSync('unsavedData');
  }

  /*---------------------------------------------------------
  Wrapper for materialize toast messages
  ---------------------------------------------------------*/
  toast(text) {
    M.toast({
      html: '<i class=\"material-icons\">check_circle</i>&emsp;' + text,
      classes: 'green-toast',
      displayLength: 2000
    });
  }



  render() {
    var filteredTeams = [];
    var filteredGames = [];
    var queryText = this.state.queryText.trim().toLowerCase();
    var myTeams = this.state.myTeams;
    var myGames = this.state.myGames;
    var activePane = this.state.activePane;
    var numberOfPhases = Object.keys(this.state.divisions).length;
    var usingPhases = this.usingPhases();
    var usingDivisions = this.usingDivisions();
    var phasesToGroupBy = this.phasesToGroupBy();
    var [divsInPhase, phaseSizes] = this.cumulativeRankSetup(phasesToGroupBy);

    var rptObj = this.state.releasedRptList[this.state.activeRpt];
    if(rptObj == undefined) { rptObj = this.state.customRptList[this.state.activeRpt]; }

    // Get Materialize features to show up correctly
    $(document).ready(function() {
      M.Tooltip.init(document.querySelectorAll('.tooltipped'));//initialize tooltips
    });
    M.FormSelect.init(document.querySelectorAll('select'));//initialize all dropdowns
    M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn')); //initialize floating buttons
    //for some reason, Materialize code will crash if I only initialize these once
    //perhaps one day I will figure out why
    M.Modal.init(document.querySelectorAll('#assignDivisions, #assignPhases'),
      {onCloseEnd: this.onModalClose, dismissible: false}
    );
    //open modals if appropriate
    if(this.state.tmWindowVisible === true) { this.openModal('#addTeam'); }
    if(this.state.gmWindowVisible === true) { this.openModal('#addGame'); }
    if(this.state.divEditWindowVisible === true) { this.openModal('#editDivision'); }
    if(this.state.divWindowVisible === true) { this.openModal('#assignDivisions'); }
    if(this.state.phaseWindowVisible === true) { this.openModal('#assignPhases'); }
    if(this.state.rptConfigWindowVisible === true) { this.openModal('#rptConfig'); }

    //sort and filter teams
    if (activePane == 'teamsPane') {
      //Filter list of teams
      for (var i = 0; i < myTeams.length; i++) {
        if (this.teamQueryMatch(queryText, myTeams[i])) {
          filteredTeams.push(myTeams[i]);
        }
      }
      //always sort alphabetically. Then sort by division if appropriate
      filteredTeams = _.orderBy(filteredTeams, function(item) {
        return item.teamName.toLowerCase();
      }, 'asc');
      if(this.state.teamOrder == 'division') {
        filteredTeams = _.orderBy(filteredTeams, function(item) {
          var div;
          if(usingPhases) { div = item.divisions[phasesToGroupBy[0]]; }
          else { div = item.divisions.noPhase; }
          if(div == undefined) { div = 'zzzzzzzzzzzzzzzzzzz'; } //teams with no division go (hopefully) at the end
          return div.toLowerCase();
        }, 'asc'); // array orderby
      }
    }

    //sort and filter games
    else if (activePane == 'gamesPane') {
      //Filter list of games
      for (var i = 0; i < myGames.length; i++) {
        if (this.gameQueryMatch(queryText, myGames[i])) {
          filteredGames.push(myGames[i]);
        }
      }
      // don't sort games right now
      filteredGames = _.orderBy(filteredGames, function(item) {
        return +item.round;
      }, 'asc'); // order array
    }

    //make a react element for each item in the lists
    filteredTeams=filteredTeams.map(function(item, index) {
      return(
        <TeamListEntry key = {item.teamName + this.state.checkTeamToggle}
          team = {item}
          onDelete = {this.deleteTeam}
          onOpenTeam = {this.openTeamForEdit}
          onSelectTeam = {this.onSelectTeam}
          selected = {this.state.selectedTeams.includes(item)}
          numGamesPlayed = {StatUtils.gamesPlayed(item, myGames)}
          allPhases = {Object.keys(this.state.divisions)}
          usingDivisions = {usingDivisions}
          removeDivision = {this.removeDivisionFromTeam}
          activeInPhase = {this.teamBelongsToCurrentPhase(item)}
        />
      )
    }.bind(this)); //filteredTeams.map
    filteredGames=filteredGames.map(function(item, index) {
      return(
        <GameListEntry key = {item.team1 + item.team2 + item.round + this.state.checkGameToggle}
          game = {item}
          onDelete = {this.deleteGame}
          onOpenGame = {this.openGameForEdit}
          onSelectGame = {this.onSelectGame}
          selected = {this.state.selectedGames.includes(item)}
          allPhases = {Object.keys(this.state.divisions)}
          usingPhases = {usingPhases}
          removePhase = {this.removePhaseFromGame}
          settings = {this.state.settings}
        />
      )
    }.bind(this)); //filteredGames.map

    // need to make a deep copy of this object
    // to prevent player stats from updating before I tell them to
    var gameToLoadCopy = this.state.editWhichGame == null ? null : $.extend(true, {}, this.state.editWhichGame);

    var mainWindowClass = this.state.sidebarOpen ? 'col s12 l8' : 'col s12';

    var sidebar = null;
    if(this.state.sidebarOpen) {
      let standings = StatUtils.compileStandings(myTeams, myGames, this.state.viewingPhase,
        phasesToGroupBy, this.state.settings, rptObj, this.state.allGamesShowTbs)
      sidebar = (
        <div id="stat-sidebar" className="col l4 s0">
          <StatSidebar key={this.state.reconstructSidebar}
            visible = {this.state.sidebarOpen}
            standings = {standings}
            phase = {this.state.viewingPhase}
            divisions = {divsInPhase}
            phasesToGroupBy = {phasesToGroupBy}
            phaseSizes = {phaseSizes}
            settings = {this.state.settings}
            rptConfig = {rptObj}
            filterByTeam = {this.filterByTeam}
            saveRankOverrides = {this.saveRankOverrides}
          />
        </div>
      );
    }

    return(
      <div className="application">
        <div className="interface">
          <AddTeamModal
            teamToLoad = {this.state.editWhichTeam}
            onLoadTeamInModal = {this.onLoadTeamInModal}
            addOrEdit = {this.state.tmAddOrEdit}
            addTeam = {this.addTeam}
            modifyTeam = {this.modifyTeam}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
            isOpen = {this.state.tmWindowVisible}
            validateTeamName = {this.validateTeamName}
            teamHasGames = {this.teamHasPlayedGames}
            playerIndex = {this.state.playerIndex}
            formSettings = {this.state.formSettings}
          />
          <AddGameModal
            gameToLoad = {gameToLoadCopy}
            onLoadGameInModal = {this.onLoadGameInModal}
            addOrEdit = {this.state.gmAddOrEdit}
            addGame = {this.addGame}
            modifyGame = {this.modifyGame}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
            isOpen = {this.state.gmWindowVisible}
            teamData = {myTeams.slice()}
            haveTeamsPlayedInRound = {this.haveTeamsPlayedInRound}
            allPhases = {Object.keys(this.state.divisions)}
            currentPhase = {this.state.viewingPhase != 'Tiebreakers' ? this.state.viewingPhase : 'all'}
            settings = {this.state.settings}
          />
         <RptConfigModal
            isOpen = {this.state.rptConfigWindowVisible}
            tournamentSettings = {this.state.settings}
            releasedRptList = {this.state.releasedRptList}
            customRptList = {this.state.customRptList}
            defaultRpt = {this.state.defaultRpt}
            modifyRptConfig = {this.modifyRptConfig}
            setDefaultRpt = {this.setDefaultRpt}
            clearDefaultRpt = {this.clearDefaultRpt}
            attemptDeletion = {this.rptDeletionPrompt}
            systemDefault = {SYS_DEFAULT_RPT_NAME}
            usingDivisions = {usingDivisions}
         />
         <DivAssignModal key={JSON.stringify(this.state.divisions) + this.state.checkTeamToggle}
            isOpen = {this.state.divWindowVisible}
            divisions = {this.state.divisions}
            handleSubmit = {this.submitDivAssignments}
            usingPhases = {usingPhases}
          />
          <PhaseAssignModal key={JSON.stringify(this.state.divisions) + this.state.checkGameToggle + 'games'}
            isOpen = {this.state.phaseWindowVisible}
            divisions = {this.state.divisions}
            handleSubmit = {this.submitPhaseAssignments}
          />
          <DivisionEditModal
            isOpen = {this.state.divEditWindowVisible}
            addOrEdit = {this.state.divAddOrEdit}
            divisionToLoad = {this.state.editWhichDivision}
            onLoadDivInModal = {this.onLoadDivInModal}
            divisions = {this.state.divisions}
            addDivision = {this.addDivision}
            modifyDivision = {this.modifyDivision}
            validateName = {this.validateDivisionName}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
          />

          <div className="row">
            <div id="main-window" className={mainWindowClass}>
              <HeaderNav key={'nav' + this.state.navbarLoadToggle}
                onSearch= {this.searchLists}
                setPane = {this.setPane}
                setPhase = {this.setPhase}
                whichPaneActive = {activePane}
                viewingPhase = {this.state.viewingPhase}
                divisions = {this.state.divisions}
                tbsExist = {this.state.tbCount > 0}
                usingPhases = {usingPhases}
                usingDivisions = {usingDivisions}
                openDivModal = {this.openDivModal}
                openPhaseModal = {this.openPhaseModal}
                queryText = {this.state.queryText}
              />
              <SettingsForm key = {this.state.settingsLoadToggle}
                whichPaneActive = {activePane}
                settings = {this.state.settings}
                packets = {this.state.packets}
                divisions = {this.state.divisions}
                savePhases = {this.savePhases}
                newDivision = {this.openDivEditModal}
                editDivision = {this.openDivForEdit}
                deleteDivision = {this.deleteDivision}
                reorderDivisions = {this.reorderDivisions}
                defaultPhases = {this.state.settings.defaultPhases}
                setDefaultGrouping = {this.setDefaultGrouping}
                saveSettings = {this.saveSettings}
                savePackets = {this.savePackets}
                gameIndex = {this.state.gameIndex}
                tbsExist = {this.state.tbCount > 0}
                toggleTbs = {this.toggleTiebreakers}
                editingSettings = {this.editingSettings}
                haveGamesBeenEntered = {this.state.myGames.length > 0}
              />
              <TeamList
                whichPaneActive = {activePane}
                teamList = {filteredTeams}
                openModal = {this.openTeamAddWindow}
                totalTeams = {myTeams.length}
                sortTeamsBy = {this.sortTeamsBy}
                usingDivisions = {usingDivisions}
                numberSelected = {this.state.selectedTeams.length}
              />
              <GameList
                whichPaneActive = {activePane}
                gameList = {filteredGames}
                openModal = {this.openGameAddWindow}
                numberOfTeams = {myTeams.length}
                totalGames = {myGames.length}
                numberSelected = {this.state.selectedGames.length}
              />
              <SidebarToggleButton
                toggle = {this.toggleSidebar}
                sidebarOpen = {this.state.sidebarOpen}
              />
            </div>
            {sidebar}

          </div>
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface
