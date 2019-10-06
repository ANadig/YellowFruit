/***********************************************************
render.js
Andrew Nadig

Entry point for the Electron renderer process. Defines the
MainInterface compenent that contains the entire UI of the
main window
***********************************************************/
var $ = jQuery = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');
// eRequire is defined in index.html
// I took these two lines from a tutorial and don't remember why it's necessary
var fs = eRequire('fs');
var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
// Bring in all the other React components
var TeamListEntry = require('./TeamListEntry');
var GameListEntry = require('./GameListEntry');
var HeaderNav = require('./HeaderNav');
var AddTeamModal = require('./AddTeamModal');
var AddGameModal = require('./AddGameModal');
var DivisionEditModal = require('./DivisionEditModal');
var RptConfigModal = require('./RptConfigModal');
var DivAssignModal = require('./DivAssignModal');
var PhaseAssignModal = require('./PhaseAssignModal');
var SettingsForm = require('./SettingsForm');
var TeamList = require('./TeamList');
var GameList = require('./GameList');
var StatSidebar = require('./StatSidebar');
var SidebarToggleButton = require('./SidebarToggleButton');

const MAX_PLAYERS_PER_TEAM = 30;
const METADATA = {version:'2.3.0'};
const DEFAULT_SETTINGS = {
  powers: '15pts',
  negs: 'yes',
  bonuses: 'noBb',
  playersPerTeam: '4',
  defaultPhase: 'noPhase', // Used to group teams when viewing all games
  rptConfig: 'SQBS Defaults'
};
//Materialize accent-1 colors: yellow, light-green, orange, light-blue, red, purple, teal, deep-purple, pink, green
const PHASE_COLORS = ['#ffff8d', '#ccff90', '#ffd180', '#80d8ff',
  '#ff8a80', '#ea80fc', '#a7ffeb', '#b388ff', '#ff80ab', '#b9fc6a'];
const EMPTY_CUSTOM_RPT_CONFIG = {
    defaultRpt: null,
    rptConfigList: {}
}
const ORIG_DEFAULT_RPT_NAME = 'SQBS Defaults';
const MAX_CUSTOM_RPT_CONFIGS = 25;
const DEFAULT_FORM_SETTINGS = {
  showYearField: true,
  showSmallSchool: true,
  showJrVarsity: true,
  showUGFields: true,
  showD2Fields: true
};


class MainInterface extends React.Component {

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
      selectedTeams: [], // teams with checkbox checked on the teams pane
      selectedGames: [], // games with checkbox checked on the games pane
      checkTeamToggle: false, // used in the key of TeamListEntry components in order to
                              // force their constructor to be called when necessary
      checkGameToggle: false, // see checkTeamToggle
      settingsLoadToggle: false, // used to force the whole settings pane to redraw when
                                 // when divisions or phases are changed
      navbarLoadToggle: false, //used to force the navbar to redraw
      activePane: 'settingsPane',  // settings, teams, or games
      viewingPhase: 'all', // 'all' or the name of a user-defined phase
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
      defaultRpt: ORIG_DEFAULT_RPT_NAME, // which report configuration is default for new tournaments
      activeRpt: ORIG_DEFAULT_RPT_NAME, // which report configuration is currently being used
      modalsInitialized: false, // we only need to initialize Materialize modals on the first render
      formSettings: defFormSettingsCopy, // which optional entry fields to turn on or off
      sidebarOpen: true // whether the sidebar is visible
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
  }

  /*---------------------------------------------------------
  Lifecyle method. Initialize listeners to ipcs from main
  process.
  ---------------------------------------------------------*/
  componentDidMount() {
    //initialize modals
    $('#addTeam, #addGame, #editDivision, #rptConfig, #assignDivisions, #assignPhases').modal({
      onCloseEnd: this.onModalClose
    });
    //set up event listeners
    ipc.on('addTeam', (event, message) => {
      if(!this.anyModalOpen()) { this.openTeamAddWindow(); }
    });
    ipc.on('addGame', (event, message) => {
      if(!this.anyModalOpen()) { this.openGameAddWindow(); }
    });
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
    ipc.on('prevPage', (event) => {
      if(!this.anyModalOpen()) { this.previousPage(); }
    });
    ipc.on('nextPage', (event) => {
      if(!this.anyModalOpen()) { this.nextPage(); }
    });
    ipc.on('prevPhase', (event) => {
      if(!this.anyModalOpen()) { this.previousPhase(); }
    });
    ipc.on('nextPhase', (event) => {
      if(!this.anyModalOpen()) { this.nextPhase(); }
    });
    ipc.on('focusSearch', (event) => {
      if(!this.anyModalOpen()) {
        $('#search').focus();
        $('#search').select();
      }
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
    ipc.on('toggleSidebar', (event, open) => {
      this.setState({
        sidebarOpen: open
      });
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
    ipc.removeAllListeners('mergeTournament');
    ipc.removeAllListeners('saveExistingTournament');
    ipc.removeAllListeners('newTournament');
    ipc.removeAllListeners('exportHtmlReport');
    ipc.removeAllListeners('exportSqbsFile');
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
    if(!this.state.modalsInitialized) {
      this.setState({
        modalsInitialized: true
      });
    }
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
    var defaultRpt = ORIG_DEFAULT_RPT_NAME;

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
    fs.writeFile(fileName, fileString, 'utf8', function(err) {
      if (err) { console.log(err); }
    });
    ipc.sendSync('setWindowTitle',
      fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
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

    //if coming from 2.0.4 or earlier, arbitrarily pick the first phase as default
    if(loadSettings.defaultPhase == undefined) {
      var numberOfPhases = Object.keys(loadDivisions).length;
      if (numberOfPhases > 1 ||  (numberOfPhases == 1 && loadDivisions['noPhase'] == undefined)) {
        loadSettings.defaultPhase = Object.keys(loadDivisions)[0];
      }
    }
    //if coming from 2.1.0 or earlier, assign the SQBS default report
    if(assocRpt == undefined) {
      assocRpt = ORIG_DEFAULT_RPT_NAME;
    }
    //convert teams to new data structure
    if(versionLt(loadMetadata.version, '2.1.0')) {
      teamConversion2x1x0(loadTeams);
    }
    if(versionLt(loadMetadata.version, '2.2.0')) {
      teamConversion2x2x0(loadTeams);
    }
    if(versionLt(loadMetadata.version, '2.3.0')) {
      teamConversion2x3x0(loadTeams);
    }
    //revert to SQBS defaults if we can't find this file's report configuration
    if(this.state.releasedRptList[assocRpt] == undefined && this.state.customRptList[assocRpt] == undefined) {
      assocRpt = ORIG_DEFAULT_RPT_NAME;
    }

    ipc.sendSync('setWindowTitle',
      fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
    ipc.sendSync('rebuildMenus', this.state.releasedRptList, this.state.customRptList, assocRpt);

    this.setState({
      settings: loadSettings,
      packets: loadPackets,
      divisions: loadDivisions,
      myTeams: loadTeams,
      myGames: loadGames,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      viewingPhase: 'all',
      activePane: 'settingsPane',
      activeRpt: assocRpt
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
    var dupTeams = [];
    var curLine = 0;
    var numTeams = sqbsAry[curLine++]; // first line is number of teams
    if(isNaN(numTeams)) {
      ipc.sendSync('sqbsImportError', curLine);
      return;
    }
    for(var i=0; i<numTeams; i++) {
      var rosterSize = sqbsAry[curLine++] - 1; // first line of team is number of players + 1
      if(isNaN(rosterSize)) {
        ipc.sendSync('sqbsImportError', curLine);
        return;
      }
      var teamName = sqbsAry[curLine++].trim(); // second line of team is team name
      if(teamName == '') { continue; }
      if(!this.validateTeamName(teamName, null)) {
        curLine += rosterSize;
        dupTeams.push(teamName);
        continue;
      }
      var roster = {};
      var lowercaseRoster = [];
      for(var j=0; j<rosterSize && j<MAX_PLAYERS_PER_TEAM; j++) {
        var nextPlayer = sqbsAry[curLine++].trim();
        if(!lowercaseRoster.includes(nextPlayer.toLowerCase())) {
          roster[nextPlayer] = {year: '', div2: false, undergrad: false};
          lowercaseRoster.push(nextPlayer.toLowerCase());
        }
      }
      myTeams.push({
        teamName: teamName,
        smallSchool: false,
        jrVarsity: false,
        teamUGStatus: false,
        teamD2Status: false,
        roster: roster,
        divisions: {}
      });
    }
    var numImported = myTeams.length - this.state.myTeams.length;
    if(numImported > 0) {
      this.setState({
        myTeams: myTeams
      });
      ipc.sendSync('rosterImportSuccess', numImported, dupTeams);
      ipc.sendSync('unsavedData');
    }
    else if(dupTeams.length > 0) {
      ipc.sendSync('allDupsFromSQBS');
    }
  } // importRosters

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
    // check settings
    if(!settingsEqual(loadSettings, this.state.settings)) {
      ipc.sendSync('mergeError', 'Tournaments with different settings cannot be merged');
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
    //convert team data structures if necessary
    if(versionLt(loadMetadata.version, '2.1.0')) {
      teamConversion2x1x0(loadTeams);
    }
    if(versionLt(loadMetadata.version, '2.2.0')) {
      teamConversion2x2x0(loadTeams);
    }
    if(versionLt(loadMetadata.version, '2.3.0')) {
      teamConversion2x3x0(loadTeams);
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
    var newGameCount = 0;
    var conflictGames = [];
    for(var i in loadGames) {
      var newGame = loadGames[i];
      var oldGame = gamesCopy.find((g) => { return g.team1==newGame.team1 && g.team2==newGame.team2 && g.round==newGame.round; });
      if(oldGame == undefined) {
        gamesCopy.push(newGame);
        newGameCount++;
      }
      else { conflictGames.push(newGame); }
    }
    this.setState({
      divisions: divisionsCopy,
      myTeams: teamsCopy,
      myGames: gamesCopy,
      settingsLoadToggle: !this.state.settingsLoadToggle
    });
    this.loadGameIndex(gamesCopy, false);
    this.loadPlayerIndex(teamsCopy, gamesCopy, false);
    ipc.sendSync('unsavedData');
    ipc.sendSync('successfulMerge', newTeamCount, newGameCount, conflictGames);
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
    var phase = this.state.viewingPhase;
    var phaseToGroupBy = this.state.viewingPhase == 'all' ? this.state.settings.defaultPhase : this.state.viewingPhase;
    var divsInPhase = this.state.divisions[phaseToGroupBy];
    var usingDivisions = divsInPhase != undefined && divsInPhase.length > 0;
    //we only want the last segment of the file path to use for links
    var filePathSegments = fileStart.split(/[\\\/]/);
    var endFileStart = filePathSegments.pop();
    var phaseColors = {}, phaseCnt = 0;
    for(var p in this.state.divisions) {
      if(p != "noPhase") { phaseColors[p] = PHASE_COLORS[phaseCnt++]; }
    }
    var activeRpt = this.state.releasedRptList[this.state.activeRpt];
    if(activeRpt == undefined) { activeRpt = this.state.customRptList[this.state.activeRpt]; }

    var standingsHtml = getStandingsHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, phaseToGroupBy, divsInPhase, this.state.settings, activeRpt);
    fs.writeFile(standingsLocation, standingsHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - standings
    var individualsHtml = getIndividualsHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, phaseToGroupBy, usingDivisions, this.state.settings, activeRpt);
    fs.writeFile(individualsLocation, individualsHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - individuals
    var scoreboardHtml = getScoreboardHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.settings, this.state.packets, phaseColors);
    fs.writeFile(scoreboardLocation, scoreboardHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - scoreboard
    var teamDetailHtml = getTeamDetailHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.packets, this.state.settings, phaseColors, activeRpt);
    fs.writeFile(teamDetailLocation, teamDetailHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - team detail
    var playerDetailHtml = getPlayerDetailHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.settings, phaseColors, activeRpt);
    fs.writeFile(playerDetailLocation, playerDetailHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - individual Detail
    var roundReportHtml = getRoundReportHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.packets, this.state.settings, activeRpt);
    fs.writeFile(roundReportLocation, roundReportHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - round report
    var statKeyHtml = getStatKeyHtml(endFileStart);
    fs.writeFile(statKeyLocation, statKeyHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - stat key
    // don't tell stat window to reload if we're exporting the html report
    if(fileStart == '') { ipc.sendSync('statReportReady'); }
  } //writeStatReport

  /*---------------------------------------------------------
  Export the data in SQBS format
  ---------------------------------------------------------*/
  writeSqbsFile(fileName) {
    var phaseToGroupBy = this.state.viewingPhase == 'all' ? this.state.settings.defaultPhase : this.state.viewingPhase;
    var sqbsData = getSqbsFile(this.state.settings, this.state.viewingPhase, phaseToGroupBy, this.state.divisions[phaseToGroupBy],
      this.state.myTeams, this.state.myGames, this.state.packets, this.state.gameIndex);
    fs.writeFile(fileName, sqbsData, 'utf8', function(err) {
      if (err) { console.log(err); }
    });
  } //writeSqbsFile

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
        if(toNum(g.players1[p].tuh) > 0) { playerCount++; }
      }
      if(playerCount > 8) {
        badGameAry.push('Round ' + g.round + ': ' + g.team1 + " vs. " + g.team2);
        continue;
      }
      playerCount = 0;
      for(var p in g.players2) {
        if(toNum(g.players2[p].tuh) > 0) { playerCount++; }
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
      activeRpt: this.state.defaultRpt
      // DO NOT reset these! These should persist throughout the session
      // releasedRptList: ,
      // customRptList: ,
      // defaultRpt: ,
      // modalsInitialized:
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
  "all games")
  ---------------------------------------------------------*/
  previousPhase() {
    var newPhase = 'all';
    var phaseList = Object.keys(this.state.divisions);
    phaseList = _.without(phaseList, 'noPhase');
    if(phaseList.length == 0) { return; }
    if(this.state.viewingPhase == 'all') {
      newPhase = phaseList[phaseList.length-1];
    }
    else {
      var curPhaseNo = phaseList.indexOf(this.state.viewingPhase);
      if(curPhaseNo <= 0) { newPhase = 'all'; }
      else { newPhase = phaseList[curPhaseNo-1]; }
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
    var newPhase = 'all';
    var phaseList = Object.keys(this.state.divisions);
    phaseList = _.without(phaseList, 'noPhase');
    if(phaseList.length == 0) { return; }
    if(this.state.viewingPhase == 'all') {
      newPhase = phaseList[0];
    }
    else {
      var curPhaseNo = phaseList.indexOf(this.state.viewingPhase);
      if(curPhaseNo == phaseList.length-1) { newPhase = 'all'; }
      else { newPhase = phaseList[curPhaseNo+1]; }
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
    $('#teamName').focus();
  }

  /*---------------------------------------------------------
  Kick off opening the game modal
  ---------------------------------------------------------*/
  openGameAddWindow() {
    if(this.state.myTeams.length < 2 || this.state.editingSettings) { return; }
    this.setState({
      gmWindowVisible: true
    });
    $('#round').focus();
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
      playerIndex: tempIndex
    }) //setState
    if(acceptAndStay) {
      $('#teamName').focus();
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Added \"' + teamName + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
    addGameToPlayerIndex(tempItem, tempPlayerIndex); //statUtils2
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGms,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
      gmWindowVisible: acceptAndStay
    }) //setState
    if(acceptAndStay) {
      $('#round').focus();
      var gameDisp = 'Round ' + tempItem.round + ' ' + tempItem.team1 + ' vs ' + tempItem.team2;
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Added \"' + gameDisp + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
      if(oldn != newn && newn != undefined) {
        this.updatePlayerName(tempGames, oldTeam.teamName, oldn, newn);
      }
    }

    if(oldTeam.teamName != newTeam.teamName) {
      this.updateTeamName(tempGames, oldTeam.teamName, newTeam.teamName);
    }

    //update index
    var tempPlayerIndex = this.state.playerIndex;
    var newTeamCopy = $.extend(true, {}, newTeam);
    modifyTeamInPlayerIndex(oldTeam, newTeamCopy, tempPlayerIndex); //statUtils2

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
      tmWindowVisible: false,
      playerIndex: tempPlayerIndex,
      tmAddOrEdit: 'add' // need to set here in case of acceptAndStay
    });
    if(acceptAndStay) {
      $('#teamName').focus();
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Saved \"' + newTeam.teamName + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
          gameAry[i].players1[newPlayerName] = gameAry[i].players1[oldPlayerName];
        }
        delete gameAry[i].players1[oldPlayerName];
      }
      else if(teamName == gameAry[i].team2) {
        if(newPlayerName != '') {
          gameAry[i].players2[newPlayerName] = gameAry[i].players2[oldPlayerName];
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
       return gameEqual(o, oldGame)
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
    modifyGameInPlayerIndex(oldGame, newGame, tempPlayerIndex); //statUtils2
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGameAry,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
      gmWindowVisible: false,
      gmAddOrEdit: 'add' // needed in case of acceptAndStay
    });
    if(acceptAndStay) {
      $('#round').focus();
      var gameDisp = 'Round ' + newGame.round + ' ' + newGame.team1 + ' vs ' + newGame.team2;
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Saved \"' + gameDisp + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
      playerIndex: tempPlayerIndex
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
    modifyGameInPlayerIndex(this.state.gameToBeDeleted, null, tempPlayerIndex); //statUtils2
    this.setState({
      myGames: newGames,
      gameIndex: tempGameIndex,
      playerIndex: tempPlayerIndex,
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
  Returns: 0 if neither team has
  1 if teamA has
  2 if teamB has
  3 if both teams have
  4 if both teams have already played each other in this round
  ---------------------------------------------------------*/
  haveTeamsPlayedInRound(teamA, teamB, roundNo, originalGameLoaded) {
    var teamAPlayed = false, teamBPlayed = false;
    for(var i in this.state.myGames) {
      var g = this.state.myGames[i];
      if(!gameEqual(g, originalGameLoaded) && g.round == roundNo) {
        if((g.team1 == teamA && g.team2 == teamB) || (g.team2 == teamA && g.team1 == teamB)) {
          return 4;
        }
        var teamAPlayed = teamAPlayed || (g.team1 == teamA || g.team2 == teamA);
        var teamBPlayed = teamBPlayed || (g.team1 == teamB || g.team2 == teamB);
      }
    }
    if(teamAPlayed) {
      if(teamBPlayed) { return 3; }
      return 1;
    }
    if(teamBPlayed) { return 2; }
    return 0;
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
    this.setState({
     divisions: tempDivisions,
     divEditWindowVisible: acceptAndStay,
     settingsLoadToggle: !this.state.settingsLoadToggle
    });
    ipc.sendSync('unsavedData');
    if(acceptAndStay) {
      $('#divisionName').focus();
      var phaseDisplay = phase != 'noPhase' ? ' (' + phase + ')' : '';
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Added \"' + divName + phaseDisplay + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
      M.toast({
        html: '<i class=\"material-icons\">check_circle</i>&emsp;Saved \"' + newDivName + phaseDisplay + '\"',
        classes: 'green-toast',
        displayLength: 2000
      });
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
    this.setState({
      divisions: tempDivisions,
      teams: tempTeams,
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
  savePhases(newPhases, newDivAry, newPhaseAssignments) {
    var tempDivisions = {};
    if(newPhases.length == 0 && newDivAry.length > 0) {
      tempDivisions.noPhase = newDivAry;
    }
    else { //populate divisions per phase
      for(var i in newPhases) {
        tempDivisions[newPhases[i]] = [];
        for(var j in newDivAry) {
          if(newPhaseAssignments[j] == newPhases[i]) {
            tempDivisions[newPhases[i]].push(newDivAry[j]);
          }
        }
      }
      //divisions not assigned to a phase
      var noPhase = [];
      for(var i in newDivAry) {
        if(newPhaseAssignments[i] == undefined || newPhaseAssignments[i] == '') {
          noPhase.push(newDivAry[i]);
        }
      }
      if(noPhase.length > 0) { tempDivisions.noPhase = noPhase; }
    }
    //update team's divisions
    var tempTeams = this.state.myTeams;
    for(var i in tempTeams) {
      for(var phase in tempTeams[i].divisions) {
        //delete divisions for phases that no longer exist
        if(tempDivisions[phase] == undefined) {
          delete tempTeams[i].divisions[phase];
        }
        else {
          if(!tempDivisions[phase].includes(tempTeams[i].divisions[phase])) {
            delete tempTeams[i].divisions[phase];
          }
        }
      }
    }
    //delete phases in the game data that no longer exist
    var tempGames = this.state.myGames;
    for(var i in tempGames) {
      var phases = tempGames[i].phases;
      for(var j in phases) {
        if(!Object.keys(tempDivisions).includes(phases[j])) {
          _.pull(phases, phases[j]);
        }
      }
    }
    //can't be viewing a phase that doesn't exist
    var newViewingPhase = this.state.viewingPhase;
    if(!newPhases.includes(newViewingPhase)) { newViewingPhase = 'all'; }
    //also can't have a default grouping phase that doesn't exist
    var newDefaultPhase = this.state.settings.defaultPhase;
    var reloadSettingsPane = this.state.settingsLoadToggle;
    if(!newPhases.includes(newDefaultPhase)) { // incl if 'noPhase'
      reloadSettingsPane = !this.state.settingsLoadToggle; //so UI will update
      if(newPhases.length > 0 && newDivAry.length > 0) { newDefaultPhase = newPhases[0]; }
      else { newDefaultPhase = 'noPhase'; }
    }

    var newSettings = this.state.settings;
    newSettings.defaultPhase = newDefaultPhase;

    this.setState({
      divisions: tempDivisions,
      myTeams: tempTeams,
      myGames: tempGames,
      viewingPhase: newViewingPhase,
      settings: newSettings,
      settingsLoadToggle: reloadSettingsPane
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
    if(this.state.viewingPhase == 'all') { return true; }
    return team.divisions[this.state.viewingPhase] != undefined;
  }

  /*---------------------------------------------------------
  Does the game belong to the phase the user is currently
  viewing?
  ---------------------------------------------------------*/
  gameBelongsToCurrentPhase(game) {
    if(this.state.viewingPhase == 'all') { return true; }
    return game.phases.includes(this.state.viewingPhase);
  }

  /*---------------------------------------------------------
  Set which phase's divisions will be used when viewing all
  games
  ---------------------------------------------------------*/
  setDefaultGrouping(phase) {
    var newSettings = this.state.settings;
    newSettings.defaultPhase = phase;
    this.setState({
      settings: newSettings
    });
    ipc.sendSync('unsavedData');
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
    queryText = queryText.trim();
    return queryText.search(/^(no\W*phase)/i) == 0 && game.phases.length == 0;
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
    var saveSuccess = true;
    fs.writeFile(this.state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', (err) => {
      if (err) {
        saveSuccess = false;
        console.log(err);
      }
    });
    if(saveSuccess && acceptAndStay) {
      M.toast({html: '<i class=\"material-icons\">check_circle</i>&emsp;Saved \"' + newName + '\"', classes: 'green-toast'});
    }
    ipc.sendSync('rebuildMenus', this.state.releasedRptList, tempRpts, activeRpt);
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
    var saveSuccess = true;
    fs.writeFile(this.state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', (err) => {
      if (err) {
        saveSuccess = false;
        console.log(err);
      }
    });
    if(saveSuccess) {
      M.toast({html: '<i class=\"material-icons\">check_circle</i>&emsp;Set \"' + rptName + '\" as the default for new tournaments', classes: 'green-toast'});
    }
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
      defaultRpt: ORIG_DEFAULT_RPT_NAME,
    });
    var saveSuccess = true;
    fs.writeFile(this.state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', (err) => {
      if (err) {
        saveSuccess = false;
        console.log(err);
      }
    });
    if(saveSuccess) {
      M.toast({html: '<i class=\"material-icons\">check_circle</i>&emsp;Removed default status', classes: 'green-toast'});
    }
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
    if(this.state.defaultRpt == rptName) { newDefault = ORIG_DEFAULT_RPT_NAME; }
    if(this.state.activeRpt == rptName) { activeRpt = ORIG_DEFAULT_RPT_NAME; }
    this.setState({
      customRptList: tempRpts,
      defaultRpt: newDefault,
      activeRpt: activeRpt
    });

    var newCustomRpts = {
      defaultRpt: newDefault == ORIG_DEFAULT_RPT_NAME ? null : newDefault,
      rptConfigList: tempRpts
    }
    fs.writeFile(this.state.customRptFile, JSON.stringify(newCustomRpts), 'utf8', (err) => {
      if (err) { console.log(err); }
    });
    ipc.sendSync('rebuildMenus', this.state.releasedRptList, tempRpts, activeRpt);
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
    var phaseToGroupBy = this.state.viewingPhase == 'all' ? this.state.settings.defaultPhase : this.state.viewingPhase;
    var divsInPhase = this.state.divisions[phaseToGroupBy];
    var rptObj = this.state.releasedRptList[this.state.activeRpt];
    if(rptObj == undefined) { rptObj = this.state.customRptList[this.state.activeRpt]; }

    // Get Materialize features to show up correctly
    $(document).ready(function() { $('.tooltipped').tooltip(); });//initialize tooltips
    $('select').formSelect(); //initialize all dropdowns
    $('.fixed-action-btn').floatingActionButton(); //initialize floating buttons
    //for some reason, Materialize code will crash if I only initialize these once
    //perhaps one day I will figure out why
    $('#assignDivisions, #assignPhases').modal({
      onCloseEnd: this.onModalClose
    });
    //open modals if appropriate
    if(this.state.tmWindowVisible === true) { $('#addTeam').modal('open'); }
    if(this.state.gmWindowVisible === true) { $('#addGame').modal('open'); }
    if(this.state.divEditWindowVisible === true) { $('#editDivision').modal('open'); }
    if(this.state.divWindowVisible === true) { $('#assignDivisions').modal('open'); }
    if(this.state.phaseWindowVisible === true) { $('#assignPhases').modal('open'); }
    if(this.state.rptConfigWindowVisible === true) { $('#rptConfig').modal('open'); }

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
          if(usingPhases) { div = item.divisions[phaseToGroupBy]; }
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
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteTeam}
          onOpenTeam = {this.openTeamForEdit}
          onSelectTeam = {this.onSelectTeam}
          selected = {this.state.selectedTeams.includes(item)}
          numGamesPlayed = {gamesPlayed(item, myGames)}
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
          singleItem = {item}
          whichItem =  {item}
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

    var mainWindowClass = this.state.sidebarOpen ? 'col s12 xl8' : 'col s12';

    var sidebar = null;
    if(this.state.sidebarOpen) {
      sidebar = (
        <div id="stat-sidebar" className="col xl4 s0">
          <StatSidebar
            visible = {this.state.sidebarOpen}
            standings = {getSmallStandings(myTeams, myGames, this.state.viewingPhase, phaseToGroupBy, this.state.settings)}
            divisions = {divsInPhase}
            settings = {this.state.settings}
            activeRpt = {rptObj}
            filterByTeam = {this.filterByTeam}
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
            currentPhase = {this.state.viewingPhase}
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
            originalDefault = {ORIG_DEFAULT_RPT_NAME}
            usingDivisions = {usingDivisions}
         />
         <DivAssignModal key={JSON.stringify(this.state.divisions) + this.state.checkTeamToggle}
            isOpen = {this.state.divWindowVisible}
            teamsToAssign = {this.state.selectedTeams}
            divisions = {this.state.divisions}
            handleSubmit = {this.submitDivAssignments}
            usingPhases = {usingPhases}
          />
          <PhaseAssignModal key={JSON.stringify(this.state.divisions) + this.state.checkGameToggle + 'games'}
            isOpen = {this.state.phaseWindowVisible}
            gamesToAssign = {this.state.selectedGames}
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
                defaultPhase = {this.state.settings.defaultPhase}
                setDefaultGrouping = {this.setDefaultGrouping}
                saveSettings = {this.saveSettings}
                savePackets = {this.savePackets}
                gameIndex = {this.state.gameIndex}
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

// Since all the UI is child components of MainInterface, this takes care of everything
// at once.
ReactDOM.render(
  <MainInterface />,
  document.getElementById('statsInterface')
);
