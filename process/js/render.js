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
var DivAssignModal = require('./DivAssignModal');
var PhaseAssignModal = require('./PhaseAssignModal');
var SettingsForm = require('./SettingsForm');
var TeamList = require('./TeamList');
var GameList = require('./GameList');
var StatSidebar = require('./StatSidebar');

const MAX_PLAYERS_PER_TEAM = 30;
const METADATA = {version:'2.0.5'};
const DEFAULT_SETTINGS = {
  powers: '15pts',
  negs: 'yes',
  bonuses: 'noBb',
  playersPerTeam: '4',
  defaultPhase: 'noPhase' // Used to group teams when viewing all games
};
//Materialize accent-1 colors: yellow, light-green, orange, light-blue, red, purple, teal, deep-purple
const PHASE_COLORS = ['#ffeb3b', '#ccff90', '#ffd180', '#80d8ff',
  '#ff8a80', '#ea80fc', '#a7ffeb', '#b388ff'];


class MainInterface extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      tmWindowVisible: false, // whether the team entry modal is open
      gmWindowVisible: false, // whether the game entry modal is open
      divWindowVisible: false, // whether the team division assignment modal is open
      phaseWindowVisible: false, // whether the game phase assignment modal is open
      teamOrder: 'alpha', // sort order. Either 'alpha' or 'division'
      queryText: '', // what's in the search bar
      settings: DEFAULT_SETTINGS, // object to define the tournament rules
      packets: {}, // packet names
      divisions: {}, // object where the keys are phases, and their values are the list
                     // of divisions in that phase
      myTeams: [], // the list of teams
      myGames: [], // the list of games
      gameIndex: {}, // the list of rounds, and how many games exist for that round
      selectedTeams: [], // teams with checkbox checked on the teams pane
      selectedGames: [], // games with checkbox checked on the games pane
      checkTeamToggle: false, // used in the key of TeamListEntry components in order to
                              // force their constructor to be called when necessary
      checkGameToggle: false, // see checkTeamToggle
      settingsLoadToggle: false, // used to force the whole settings pane to redraw when
                                 // when divisions or phases are changed
      activePane: 'settingsPane',  // settings, teams, or games
      viewingPhase: 'all', // 'all' or the name of a user-defined phase
      forceResetForms: false, // used to force an additional render in the team and game
                              // modals in order to clear form data
      editWhichTeam: null,    // which team to load in the team modal
      tmAddOrEdit: 'add', //either 'add' or 'edit'
      editWhichGame: null, // which game to load in the game modal
      gmAddOrEdit: 'add', // either 'add' or 'edit'
      editingSettings: false, // Whether the "settings" section of the settings pane is open for editing
      gameToBeDeleted: null // which game the user is attempting to delete
    };
    this.openTeamAddWindow = this.openTeamAddWindow.bind(this);
    this.openGameAddWindow = this.openGameAddWindow.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.onForceReset = this.onForceReset.bind(this);
    this.addTeam = this.addTeam.bind(this);
    this.addGame = this.addGame.bind(this);
    this.modifyTeam = this.modifyTeam.bind(this);
    this.modifyGame = this.modifyGame.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.openTeamForEdit = this.openTeamForEdit.bind(this);
    this.openGameForEdit = this.openGameForEdit.bind(this);
    this.onLoadTeamInModal = this.onLoadTeamInModal.bind(this);
    this.onLoadGameInModal = this.onLoadGameInModal.bind(this);
    this.validateTeamName = this.validateTeamName.bind(this);
    this.hasTeamPlayedInRound = this.hasTeamPlayedInRound.bind(this);
    this.onSelectTeam = this.onSelectTeam.bind(this);
    this.onSelectGame = this.onSelectGame.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchLists = this.searchLists.bind(this);
    this.setPane = this.setPane.bind(this);
    this.setPhase = this.setPhase.bind(this);
    this.saveDivisions = this.saveDivisions.bind(this);
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
  }

  /*---------------------------------------------------------
  Lifecyle method. Initialize listeners to ipcs from main
  process.
  ---------------------------------------------------------*/
  componentDidMount() {
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
    ipc.on('confirmDelete', (event) => {
      this.deleteGame();
    });
    ipc.on('cancelDelete', (event) => {
      this.setState({
        gameToBeDeleted: null
      });
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
    ipc.removeAllListeners('confirmDelete');
    ipc.removeAllListeners('cancelDelete');
  } //componentWillUnmount

  /*---------------------------------------------------------
  Unused at the moment
  ---------------------------------------------------------*/
  componentDidUpdate() {
  }

  /*---------------------------------------------------------
  Called when the user saves the file.
  Filename: the file to write to
  ---------------------------------------------------------*/
  writeJSON(fileName) {
    var fileString = JSON.stringify(METADATA) + '\n' +
      JSON.stringify(this.state.packets) + '\n' +
      JSON.stringify(this.state.settings) + '\n' +
      JSON.stringify(this.state.divisions) + '\n' +
      JSON.stringify(this.state.myTeams) + '\n' +
      JSON.stringify(this.state.myGames);
    fs.writeFile(fileName, fileString, 'utf8', function(err) {
      if (err) { console.log(err); }
    });
    ipc.sendSync('setWindowTitle',
      fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
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
      return [JSON.stringify(METADATA),'{}'].concat(jsonAry);
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
  Load the tournament data from fileName into the appropriate
  state variables. The user may now begin editing this
  tournament.
  ---------------------------------------------------------*/
  loadTournament(fileName) {
    if(fileName == '') { return; }
    var [loadMetadata, loadPackets, loadSettings, loadDivisions, loadTeams, loadGames] = this.parseFile(fileName);
    //loadMetadata = JSON.parse(loadMetadata);  // not used currently
    loadPackets = JSON.parse(loadPackets);
    loadSettings = JSON.parse(loadSettings);
    loadDivisions = JSON.parse(loadDivisions);
    loadTeams = JSON.parse(loadTeams);
    loadGames = JSON.parse(loadGames);

    //if coming from 2.0.4 or earlier, arbitrarily pick the first phase as default
    if(loadSettings.defaultPhase == undefined) {
      var numberOfPhases = Object.keys(loadDivisions).length;
      if (numberOfPhases > 1 ||  (numberOfPhases == 1 && loadDivisions['noPhase'] == undefined)) {
        loadSettings.defaultPhase = Object.keys(loadDivisions)[0];
      }
    }

    ipc.sendSync('setWindowTitle',
      fileName.substring(fileName.lastIndexOf('\\')+1, fileName.lastIndexOf('.')));
    this.setState({
      settings: loadSettings,
      packets: loadPackets,
      divisions: loadDivisions,
      myTeams: loadTeams,
      myGames: loadGames,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      viewingPhase: 'all',
      activePane: 'settingsPane'
    });
    //the value of settingsLoadToggle doesn't matter; it just needs to change
    //in order to make the settings form load
    this.loadGameIndex(loadGames, true);
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
      var rosterAry = [];
      var lowercaseRoster = [];
      for(var j=0; j<rosterSize && j<MAX_PLAYERS_PER_TEAM; j++) {
        var nextPlayer = sqbsAry[curLine++].trim();
        if(!lowercaseRoster.includes(nextPlayer.toLowerCase())) {
          rosterAry.push(nextPlayer);
          lowercaseRoster.push(nextPlayer.toLowerCase());
        }
      }
      myTeams.push({
        teamName: teamName,
        roster: rosterAry,
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
        for(var j in newTeam.roster) {
          if(!oldTeam.roster.includes(newTeam.roster[j])) {
            oldTeam.roster.push(newTeam.roster[j]);
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
      phaseColors[p] = PHASE_COLORS[phaseCnt++];
    }

    var standingsHtml = getStandingsHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, phaseToGroupBy, divsInPhase, this.state.settings);
    fs.writeFile(standingsLocation, standingsHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - standings
    var individualsHtml = getIndividualsHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, phaseToGroupBy, usingDivisions, this.state.settings);
    fs.writeFile(individualsLocation, individualsHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - individuals
    var scoreboardHtml = getScoreboardHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.settings, this.state.packets, phaseColors);
    fs.writeFile(scoreboardLocation, scoreboardHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - scoreboard
    var teamDetailHtml = getTeamDetailHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.packets, this.state.settings, phaseColors);
    fs.writeFile(teamDetailLocation, teamDetailHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - team detail
    var playerDetailHtml = getPlayerDetailHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.settings, phaseColors);
    fs.writeFile(playerDetailLocation, playerDetailHtml, 'utf8', function(err) {
      if (err) { console.log(err); }
    });//writeFile - individual Detail
    var roundReportHtml = getRoundReportHtml(this.state.myTeams, this.state.myGames,
      endFileStart, phase, this.state.packets, this.state.settings);
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
    var sqbsData = getSqbsFile(this.state.settings, phaseToGroupBy, this.state.divisions[phaseToGroupBy],
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
    this.setState({
      tmWindowVisible: false,
      gmWindowVisible: false,
      divWindowVisible: false,
      phaseWindowVisible: false,
      teamOrder: 'alpha',
      queryText: '',
      settings: DEFAULT_SETTINGS,
      packets: {},
      divisions: {},
      myTeams: [],
      myGames: [],
      gameIndex: {},
      selectedTeams: [],
      selectedGames: [],
      checkTeamToggle: false,
      checkGameToggle: false,
      settingsLoadToggle: !this.state.settingsLoadToggle,
      activePane: 'settingsPane',  //settings, teams, or games
      viewingPhase: 'all',
      forceResetForms: false,
      editWhichTeam: null,
      tmAddOrEdit: 'add', //either 'add' or 'edit'
      editWhichGame: null,
      gmAddOrEdit: 'add',
      editingSettings: false,
      gameToBeDeleted: null
    });
  }

  //clear text from the search bar in order to show all teams/games
  // clearSearch() {
  //   if(this.state.activePane == 'settingsPane') { return; }
  //   $('#search').val('');
  //   this.setState({
  //     queryText: '',
  //   });
  // }

  /*---------------------------------------------------------
  Whether any of the modal windows are open
  ---------------------------------------------------------*/
  anyModalOpen() {
    return this.state.tmWindowVisible || this.state.gmWindowVisible ||
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
  }

  /*---------------------------------------------------------
  Prevents modals from staying open on the next render. Also
  directs modals to clear their data.
  ---------------------------------------------------------*/
  onModalClose() {
    this.setState({
      tmWindowVisible: false,
      gmWindowVisible: false,
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
      tmAddOrEdit: 'add',
      gmAddOrEdit: 'add'
    });
  }

  /*---------------------------------------------------------
  Add the new team, then close the form
  ---------------------------------------------------------*/
  addTeam(tempItem) {
    var tempTms = this.state.myTeams.slice();
    tempTms.push(tempItem);
    ipc.sendSync('unsavedData');
    this.setState({
      myTeams: tempTms,
      tmWindowVisible: false,
    }) //setState
  } //addTeam

  /*---------------------------------------------------------
  Add the new game, then close the form
  ---------------------------------------------------------*/
  addGame(tempItem) {
    var tempGms = this.state.myGames.slice();
    tempGms.push(tempItem);
    var tempIndex = this.state.gameIndex;
    var round = tempItem.round;
    if(tempIndex[round] == undefined) { tempIndex[round] = 1; }
    else { tempIndex[round]++; }
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGms,
      gameIndex: tempIndex,
      gmWindowVisible: false
    }) //setState
  } //addTeam

  /*---------------------------------------------------------
  Update the appropriate team, close the form, and update
  team and player names in that team's games if necessary.
  Assumes whitespace has alredy been removed from the form
  data
  ---------------------------------------------------------*/
  modifyTeam(oldTeam, newTeam) {
    var tempTeams = this.state.myTeams.slice();
    var oldTeamIdx = _.indexOf(tempTeams, oldTeam);
    tempTeams[oldTeamIdx] = newTeam;
    var tempGames = this.state.myGames.slice();

    for(var i in oldTeam.roster) {
      if(!newTeam.roster.includes(oldTeam.roster[i])) {
        this.updatePlayerName(tempGames, oldTeam.teamName, oldTeam.roster[i], newTeam.roster[i]);
      }
    }

    if(oldTeam.teamName != newTeam.teamName) {
      this.updateTeamName(tempGames, oldTeam.teamName, newTeam.teamName);
    }

    ipc.sendSync('unsavedData');
    this.setState({
      myTeams: tempTeams,
      myGames: tempGames,
      tmWindowVisible: false
    });
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
  newPlayerName for all applicable games in gameAry
  ---------------------------------------------------------*/
  updatePlayerName(gameAry, teamName, oldPlayerName, newPlayerName) {
    for(var i in gameAry) {
      if(gameAry[i].forfeit) { continue; }
      if(teamName == gameAry[i].team1) {
        gameAry[i].players1[newPlayerName] = gameAry[i].players1[oldPlayerName];
        delete gameAry[i].players1[oldPlayerName];
      }
      else if(teamName == gameAry[i].team2) {
        gameAry[i].players2[newPlayerName] = gameAry[i].players2[oldPlayerName];
        delete gameAry[i].players2[oldPlayerName];
      }
    }
  }

  /*---------------------------------------------------------
  Updat the appropriate game and close the form
  ---------------------------------------------------------*/
  modifyGame(oldGame, newGame) {
    var tempGameAry = this.state.myGames.slice();
    var oldGameIdx = _.findIndex(tempGameAry, function (o) {
       return gameEqual(o, oldGame)
     });
    tempGameAry[oldGameIdx] = newGame;
    // update game index
    var tempIndex = this.state.gameIndex;
    var oldRound = oldGame.round, newRound = newGame.round;
    if(oldRound != newRound) {
      if(tempIndex[newRound] == undefined) { tempIndex[newRound] = 1; }
      else { tempIndex[newRound]++; }
      if(--tempIndex[oldRound] == 0) { delete tempIndex[oldRound]; }
    }
    ipc.sendSync('unsavedData');
    this.setState({
      myGames: tempGameAry,
      gameIndex: tempIndex,
      gmWindowVisible: false
    });
  }

  /*---------------------------------------------------------
  Permanently delete a team. Does not check whether that team
  has any game data; rather, it assumes the UI has been
  constucted so as to prevent the user from deleting a team
  that has played games.
  ---------------------------------------------------------*/
  deleteTeam(item) {
    var newTeams = _.without(this.state.myTeams, item);
    var newSelected = _.without(this.state.selectedTeams, item);
    this.setState({
      myTeams: newTeams,
      selectedTeams: newSelected
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
      ipc.send('tryDelete', 'Round ' + item.round + ': ' + item.team1 + ' vs. ' + item.team2);
      return;
    }
    var allGames = this.state.myGames;
    var newGames = _.without(allGames, this.state.gameToBeDeleted);
    // update index
    var tempIndex = this.state.gameIndex, round = this.state.gameToBeDeleted.round;
    if(--tempIndex[round] == 0) { delete tempIndex[round]; }
    this.setState({
      myGames: newGames,
      gameIndex: tempIndex,
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
    var idx = _.findIndex(otherTeams, function(t) {
      return t.teamName.toLowerCase() == newTeamName.toLowerCase();
    });
    return idx==-1;
  }

  /*---------------------------------------------------------
  Whether the given team has already played a game in the
  given round.
  originalGameLoaded: the game currently open for editing
  ---------------------------------------------------------*/
  hasTeamPlayedInRound(teamName, roundNo, originalGameLoaded) {
    for(var i in this.state.myGames) {
      var g = this.state.myGames[i];
      if(!gameEqual(g, originalGameLoaded) && g.round == roundNo &&
        (g.team1 == teamName || g.team2 == teamName)) {
        return true;
      }
    }
    return false;
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
  Modify phases and divisions, as well as the assignments
  of teams to divisions and games to phases if necessary.
  Called from the settings form.
  ---------------------------------------------------------*/
  saveDivisions(newPhases, newDivAry, newPhaseAssignments) {
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
    //delete team's division if the phase doesn't exist or doesn't have that division
    var tempTeams = this.state.myTeams;
    for(var i in tempTeams) {
      for(var phase in tempTeams[i].divisions) {
        if(tempDivisions[phase] == undefined ||
            !tempDivisions[phase].includes(tempTeams[i].divisions[phase])) {
          delete tempTeams[i].divisions[phase];
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
    if(!newPhases.includes(newDefaultPhase)) {
      reloadSettingsPane = !this.state.settingsLoadToggle; //so UI will update
      if(newPhases.length > 0) { newDefaultPhase = newPhases[0]; }
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
  } //saveDivisions

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
  Assign divisions to the selected games.
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
  Save the tournament format settings (powers, negs, etc.)
  ---------------------------------------------------------*/
  saveSettings(newSettings) {
    this.setState ({
      settings: newSettings
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
    var words = queryText.split('/');
    words = words.map(function(str,idx) { return str.trim(); });
    words = _.without(words, '');
    if(words.length < 2) { return false; }
    for(var i in words) {
      if(game.team1.toLowerCase().indexOf(words[i])!=-1) { matchFirst = true; }
      else if(game.team2.toLowerCase().indexOf(words[i])!=-1) { matchSecond = true; }
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



  render() {
    var filteredTeams = [];
    var filteredGames = [];
    var queryText = this.state.queryText.trim();
    var myTeams = this.state.myTeams;
    var myGames = this.state.myGames;
    var activePane = this.state.activePane;
    var numberOfPhases = Object.keys(this.state.divisions).length;
    var usingPhases = this.usingPhases();
    var usingDivisions = this.usingDivisions();
    var phaseToGroupBy = this.state.viewingPhase == 'all' ? this.state.settings.defaultPhase : this.state.viewingPhase;
    var divsInPhase = this.state.divisions[phaseToGroupBy];

    // Get Materialize features to show up correctly
    $(document).ready(function() { $('.tooltipped').tooltip(); });//initialize tooltips
    $('select').formSelect(); //initialize all dropdowns
    $('.fixed-action-btn').floatingActionButton(); //initialize floating buttons
    //initialize all modals
    $('.modal').modal({
      onCloseEnd: this.onModalClose
    });
    if(this.state.tmWindowVisible === true) { $('#addTeam').modal('open'); }
    if(this.state.gmWindowVisible === true) { $('#addGame').modal('open'); }
    if(this.state.divWindowVisible === true) { $('#assignDivisions').modal('open'); }
    if(this.state.phaseWindowVisible === true) { $('#assignPhases').modal('open'); }

    //sort and filter teams
    if (activePane == 'teamsPane') {
      //Filter list of teams
      for (var i = 0; i < myTeams.length; i++) {
        if (
          ((myTeams[i].teamName.toLowerCase().indexOf(queryText)!=-1) ||
          (myTeams[i].roster.join(', ').toLowerCase().indexOf(queryText)!=-1))
        ) {
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
        if (this.noPhaseQuery(queryText, myGames[i]) ||
          ((myGames[i].team1.toLowerCase().indexOf(queryText)!=-1 ||
          myGames[i].team2.toLowerCase().indexOf(queryText)!=-1 ||
          myGames[i].notes.toLowerCase().indexOf(queryText)!=-1 ||
          this.matchRoundSearch(queryText, myGames[i]) ||
          this.matchBothTeams(queryText, myGames[i])) &&
          this.gameBelongsToCurrentPhase(myGames[i]))
        ) {
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
            hasTeamPlayedInRound = {this.hasTeamPlayedInRound}
            allPhases = {Object.keys(this.state.divisions)}
            currentPhase = {this.state.viewingPhase}
            settings = {this.state.settings}
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

          <div className="row">
            <div id="main-window" className="col s12 m12 l8">
              <HeaderNav
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
              />
              <SettingsForm key = {this.state.settingsLoadToggle}
                whichPaneActive = {activePane}
                settings = {this.state.settings}
                packets = {this.state.packets}
                divisions = {this.state.divisions}
                saveDivisions = {this.saveDivisions}
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
            </div>
            <div id="stat-sidebar" className="col l4 hide-on-med-and-down">
              <StatSidebar
                standings = {getSmallStandings(myTeams, myGames, this.state.viewingPhase, phaseToGroupBy, this.state.settings)}
                divisions = {divsInPhase}
                settings = {this.state.settings}
              />
            </div>

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
