/***********************************************************
AddGameModal.js
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing games.
***********************************************************/
var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');
var StatUtils = require('./StatUtils');
import * as GameVal from './GameVal';
import { PlayerRow } from './PlayerRow';

const CHIP_COLORS = ['yellow', 'light-green', 'orange', 'light-blue',
  'red', 'purple', 'teal', 'deep-purple', 'pink', 'green'];

class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      phases: [],
      tuhtot: '', // total tossups heard for the game
      ottu: '',  // (total) overtime tossups
      forfeit: false,
      tiebreaker: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '', // team 1's total score
      score2: '', // team 2's total score
      players1: null, // player stats
      players2: null,
      notes: '',
      otPwr1: '', otTen1: '', otNeg1: '', // overtime buzzes for team 1
      otPwr2: '', otTen2: '', otNeg2: '', // overtime buzzes for team 2
      bbPts1: '', // bouncebacks
      bbPts2: '',
      lightningPts1: '',
      lightningPts2: '',
      originalGameLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTeamChange = this.handleTeamChange.bind(this);
    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    this.updatePlayer = this.updatePlayer.bind(this);
  } //constructor

  /*---------------------------------------------------------
  Lifecycle method
  ---------------------------------------------------------*/
  componentDidMount() {
    //don't let the Enter key submit the form
    $(document).on("keydown", "#addGame :input:not(textarea)", function(event) {
      return event.keyCode != 13;
    });
  }

  /*---------------------------------------------------------
  Lifecyle method. Need an extra render when opening or
  closing in order for fields to populate and clear properly.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
    //needed so that dropdowns show their value
    M.FormSelect.init(document.querySelectorAll('#addGame select'));
    if(this.props.forceReset) {
      this.resetState();
      //setting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
    if(this.props.gameToLoad != null) {
      this.loadGame();
      //setting mainInterface's editWhichGame to null will avoid infinite loop
      this.props.onLoadGameInModal();
    }
  }

  /*---------------------------------------------------------
  Called any time a value in the form changes, other than
  the Team or Phase selectors.
  This is a controlled component, so the state is the single
  source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    //get rid of or put back phases if tiebreaker status is changing
    if(name == 'tiebreaker') {
      if(value) { partialState.phases = []; }
      else if(this.props.addOrEdit == 'edit') {
        partialState.phases = this.state.originalGameLoaded.phases;
      }
      else { partialState.phases = [this.props.currentPhase]; }
    }
    this.setState(partialState);
  } //handleChange

  /**
   * When a team is selected in one of the dropdowns, we need to reset the player
   * stats table
   * @param  {[type]} e event
   */
  handleTeamChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    var newTeamObj = this.props.teamData.find((item) => { return item.teamName == value; });
    var roster = Object.keys(newTeamObj.roster);
    //if there can't be any substitutions, autopopulate the total tossups for the round
    var defaultTuh = roster.length <= this.props.settings.playersPerTeam ? +this.state.tuhtot : 0;
    var newPlayers = {};
    for(var i in roster) {
      newPlayers[roster[i]] = {tuh: defaultTuh, powers: 0, tens: 0, negs: 0};
    }
    if(name == 'team1') { partialState.players1 = newPlayers; }
    else if(name == 'team2') { partialState.players2 = newPlayers; }
    partialState[name] = value;
    this.setState(partialState);
  }

  /*---------------------------------------------------------
  Handle values in the phase select dropdown.
  ---------------------------------------------------------*/
  handlePhaseChange(e) {
    var options = e.target.options;
    var newPhases = [];
    for(var i=0; i<options.length; i++) {
      if(options[i].selected) { newPhases.push(options[i].value); }
    }
    this.setState({
      phases: newPhases
    });
  }

  /**
   * Called when a PlayerRow updates its state, so that this component updates its
   * state at the same time.
   * @param  whichTeam  1 or 2
   * @param  whichStat  stat to update
   * @param  value      value for that stat
   * @param  playerName player's name
   */
  updatePlayer(whichTeam, whichStat, value, playerName){
    if(whichTeam == 1) {
      //deep copy of team data to avoid spurious state updates. Maybe unnecessary?
      var tempTeam1 = $.extend(true, {}, this.state.players1);
      if(tempTeam1[playerName] == undefined) {
        //for if a player is added to a team and then that team's game is edited
        tempTeam1[playerName] = {tuh: 0, powers: 0, tens: 0, negs: 0};
      }
      tempTeam1[playerName][whichStat] = value;
      this.setState({
        players1: tempTeam1
      });
    }
    else if(whichTeam == 2) {
      //deep copy of team data to avoid spurious state updates
      var tempTeam2 = $.extend(true, {}, this.state.players2);
      if(tempTeam2[playerName] == undefined) {
        tempTeam2[playerName] = {tuh: 0, powers: 0, tens: 0, negs: 0};
      }
      tempTeam2[playerName][whichStat] = value;
      this.setState({
        players2: tempTeam2
      });
    }
  } // updatePlayer

  /*---------------------------------------------------------
  Once the modal has been closed, clear all the form data
  ---------------------------------------------------------*/
  resetState() {
    this.setState({
      round: '',
      phases: [],
      tuhtot: '',
      ottu: '',
      forfeit: false,
      tiebreaker: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: null,
      players2: null,
      notes: '',
      otPwr1: '', otTen1: '', otNeg1: '',
      otPwr2: '', otTen2: '', otNeg2: '',
      bbPts1: '',
      bbPts2: '',
      lightningPts1: '',
      lightningPts2: '',
      originalGameLoaded: null
    });
  }

  /**
   * Convert a non-zero number to a string. Convert 0 to ''
   * @param  num Number to convert
   * @return     string representation of the number
   */
  loadNumericField(num) {
    if(num === 0) { return ''; }
    return num.toString();
  }

  /**
   * Populate form with the data of the game to be edited. Also keep a pointer to this
   * game so the MainInterface knows which game to modify when the form is submitted.
   */
  loadGame() {
    this.setState({
      round: this.props.gameToLoad.round.toString(),    // 0 should be a legal round number
      phases: this.props.gameToLoad.phases,
      tuhtot: this.loadNumericField(this.props.gameToLoad.tuhtot),
      ottu: this.loadNumericField(this.props.gameToLoad.ottu),
      forfeit: this.props.gameToLoad.forfeit,
      tiebreaker: this.props.gameToLoad.tiebreaker,
      team1: this.props.gameToLoad.team1,
      team2: this.props.gameToLoad.team2,
      score1: this.props.gameToLoad.score1.toString(),  // team scores of 0 should stay
      score2: this.props.gameToLoad.score2.toString(),
      players1: this.props.gameToLoad.players1,
      players2: this.props.gameToLoad.players2,
      notes: this.props.gameToLoad.notes,
      otPwr1: this.loadNumericField(this.props.gameToLoad.otPwr1),
      otTen1: this.loadNumericField(this.props.gameToLoad.otTen1),
      otNeg1: this.loadNumericField(this.props.gameToLoad.otNeg1),
      otPwr2: this.loadNumericField(this.props.gameToLoad.otPwr2),
      otTen2: this.loadNumericField(this.props.gameToLoad.otTen2),
      otNeg2: this.loadNumericField(this.props.gameToLoad.otNeg2),
      bbPts1: this.loadNumericField(this.props.gameToLoad.bbPts1),
      bbPts2: this.loadNumericField(this.props.gameToLoad.bbPts2),
      lightningPts1: this.loadNumericField(this.props.gameToLoad.lightningPts1),
      lightningPts2: this.loadNumericField(this.props.gameToLoad.lightningPts2),
      originalGameLoaded: this.props.gameToLoad
    });
  }

  /**
   * Convert data in the form into a YfGame object
   * @return {YfGame} game object
   */
  createYfGame() {
    const forf = this.state.forfeit; //clear irrelevant data if it's a forfeit
    const ot = this.state.ottu > 0; //clear OT data if no OT
    const autoAssignPhase = this.props.addOrEdit == 'add' && this.props.currentPhase != 'all';
    const game = {
      round: +this.state.round,
      phases: autoAssignPhase && !this.state.tiebreaker ? [this.props.currentPhase] : this.state.phases,
      tuhtot: forf ? 0 : +this.state.tuhtot,
      ottu: forf ? 0 : +this.state.ottu,
      forfeit: this.state.forfeit,
      tiebreaker: this.state.tiebreaker,
      team1: this.state.team1,
      team2: this.state.team2,
      score1: forf ? 0 : +this.state.score1,
      score2: forf ? 0 : +this.state.score2,
      players1: forf ? null : this.state.players1,
      players2: forf ? null : this.state.players2,
      otPwr1: forf || !ot ? 0 : +this.state.otPwr1,
      otTen1: forf || !ot ? 0 : +this.state.otTen1,
      otNeg1: forf || !ot ? 0 : +this.state.otNeg1,
      otPwr2: forf || !ot ? 0 : +this.state.otPwr2,
      otTen2: forf || !ot ? 0 : +this.state.otTen2,
      otNeg2: forf || !ot ? 0 : +this.state.otNeg2,
      bbPts1: forf ? 0 : +this.state.bbPts1,
      bbPts2: forf ? 0 : +this.state.bbPts2,
      lightningPts1: forf ? 0 : +this.state.lightningPts1,
      lightningPts2: forf ? 0 : +this.state.lightningPts2,
      notes: this.state.notes
    }
    return game;
  }

  /**
   * Called when the form is submitted (accept button). Tell the MainInterface to create
   * a new game or modify an existing one as appropriate.
   * @param  e event
   */
  handleAdd(e) {
    e.preventDefault();
    if(!this.props.isOpen) { return; } //keyboard shortcut shouldn't work here
    let tempItem = this.createYfGame();

    var acceptAndStay = e.target.name == 'acceptAndStay';
    if(this.props.addOrEdit == 'add') {
      this.props.addGame(tempItem, acceptAndStay);
    }
    else {
      this.props.modifyGame(this.state.originalGameLoaded, tempItem, acceptAndStay);
    }

    this.resetState();
  } //handleAdd

  /*---------------------------------------------------------
  The value of a power, or zero if the tournament doesn't
  have powers.
  ---------------------------------------------------------*/
  powerValue() {
    if(this.props.settings.powers == '15pts') { return 15; }
    if(this.props.settings.powers == '20pts') { return 20; }
    return 0;
  }

  /*---------------------------------------------------------
  Calculate bonuses heard. Returns a number.
  ---------------------------------------------------------*/
  bHeard(whichTeam) {
    var tot=0;
    var players = this.state['players'+whichTeam]
    for(var p in players) {
      tot += StatUtils.toNum(players[p].powers) + StatUtils.toNum(players[p].tens);
    }
    if(StatUtils.toNum(this.state.ottu) > 0) {
      var otPwr = this.state['otPwr'+whichTeam];
      var otTen = this.state['otTen'+whichTeam];
      tot -= StatUtils.toNum(otPwr); //subtract TUs converted in overtime
      tot -= StatUtils.toNum(otTen);
    }
    return tot;
  }

  /*---------------------------------------------------------
  Calculate total bonus points. Returns a number.
  ---------------------------------------------------------*/
  bPts(whichTeam) {
    var tuPts=0;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    var totScore = whichTeam == 1 ? this.state.score1 : this.state.score2;
    var bbPts = whichTeam == 1 ? this.state.bbPts1 : this.state.bbPts2;
    var lghtPts = whichTeam == 1 ? this.state.lightningPts1 : this.state.lightningPts2;
    for(var p in players) {
      tuPts += this.powerValue()*StatUtils.toNum(players[p].powers) +
        10*StatUtils.toNum(players[p].tens) - 5*StatUtils.toNum(players[p].negs);
    }
    return totScore - tuPts - bbPts - lghtPts;
  }

  /*---------------------------------------------------------
  Returns ppb rounded to two decimal places, or an em-dash
  JSX element if no bonuses heard.
  ---------------------------------------------------------*/
  ppb(whichTeam) {
    var bHeard = this.bHeard(whichTeam);
    return bHeard == 0 ? (<span>&mdash;</span>) : (this.bPts(whichTeam)/bHeard).toFixed(2);
  }

  /*---------------------------------------------------------
  How many (30-point bonuses' worth of) bouncebacks a team
  heard.
  ---------------------------------------------------------*/
  bbHeard(whichTeam) {
    var otherTeam = whichTeam == 1 ? 2 : 1;
    return (this.bHeard(otherTeam)*30 - this.bPts(otherTeam)) / 30;
  }

  /*---------------------------------------------------------
  Points per every three bounceback parts heard, or an
  em-dash JSX element if no bouncebacks heard.
  ---------------------------------------------------------*/
  ppBb(whichTeam) {
    var bbPts = whichTeam == 1 ? this.state.bbPts1 : this.state.bbPts2;
    var bbHeard = this.bbHeard(whichTeam);
    return bbHeard <= 0 ? (<span>&mdash;</span>) : (bbPts / bbHeard).toFixed(2);
  }

  /*---------------------------------------------------------
  The integer part of the number of bouncebacks heard.
  ---------------------------------------------------------*/
  bbHeardInteger(whichTeam) {
    var raw = this.bbHeard(whichTeam);
    return raw <= 0 ? 0 : Math.trunc(raw);
  }

  /*---------------------------------------------------------
  Returns a JSX element representing the fraction 1/3/ or
  2/3, or null, becuase bouncebacks heard come in
  thirds-of-a-bonus.
  ---------------------------------------------------------*/
  bbHeardFraction(whichTeam) {
    var otherTeam = whichTeam == 1 ? 2 : 1;
    var remainder = ((this.bHeard(otherTeam)*30 - this.bPts(otherTeam))/10) % 3;
    if(remainder == 1) { return ( <span>&#8531;</span> ); } // '1/3' character
    if(remainder == 2) { return ( <span>&#8532;</span> ); } // '2/3' character
    return null;
  }

  /*---------------------------------------------------------
  Title at the top left
  ---------------------------------------------------------*/
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New game' : 'Edit game';
  }

  /*---------------------------------------------------------
  Returns the list of dropdown options
  ---------------------------------------------------------*/
  getTeamOptions() {
    var teamData = this.props.teamData;
    //alphebetize
    teamData = _.orderBy(teamData, function(item) { return item.teamName.toLowerCase(); });
    var teamOptions = teamData.map(function(item, index) {
      return ( <option key={index} value={item.teamName}>{item.teamName}</option> );
    });
    var nullOption = (<option key={-1} value="nullTeam" disabled>&nbsp;Select a team...</option>);
    teamOptions = [nullOption].concat(teamOptions);
    return teamOptions;
  }

  /**
   * Determines whether there are any issues with the game. Uses GameVal but there are
   * some things we need to handle differently here.
   * @return   FormValidation tuple
   */
  validateGame() {
    const team1 = this.state.team1, team2 = this.state.team2;
    const round = this.state.round, tuhtot = +this.state.tuhtot;
    const score1 = this.state.score1, score2 = this.state.score2;
    const players1 = this.state.players1, players2 = this.state.players2;
    //teams are required
    if(team1 == 'nullTeam' || team2 == 'nullTeam' || team1 == '' || team2 == '' ) {
      return [false, '', ''];
    }
    //round is required
    if(round == '') {
      return [false, '', ''];
    }
    //two teams can't play each other twice in the same round
    const [teamAPlayed, teamBPlayed] = this.props.haveTeamsPlayedInRound(team1, team2, round, this.state.originalGameLoaded);
    if(teamAPlayed == 3) {
      return [false, 'error', 'These teams already played each other in round ' + round];
    }
    //teams can only play multiple games in the same round if they're tiebreakers
    if(teamAPlayed == 2 || (teamAPlayed && !this.state.tiebreaker)) {
      return [false, 'error', team1 + ' has already played a game in round ' + round];
    }
    if(teamBPlayed == 2 || (teamBPlayed && !this.state.tiebreaker)) {
      return [false, 'error', team2 + ' has already played a game in round ' + round];
    }

    //team names and round are the only required info for a forfeit
    if(this.state.forfeit) {
      return [true, 'info', team1 + ' defeats ' + team2 + ' by forfeit'];
    }
    //total TUH and total scores are required.
    if(tuhtot <= 0 || score1 == '' || score2 == '') {
      return [false, '', ''];
    }
    //no error message yet if you haven't started entering data for both teams
    if(players1 == null || players2 == null) { return [false, '', '']; }

    return GameVal.validateGame(this.createYfGame(), this.props.settings);
  }//validateGame

  /*---------------------------------------------------------
  Add the disabled attribute to the submit button.
  ---------------------------------------------------------*/
  disabledButton(isGameValid) {
    return isGameValid ? '' : 'disabled';
  }

  /*---------------------------------------------------------
  Add the "invalid" class to a required field if it's empty.
    item: state property corresponding to the field
    includeForfeit: field is required even for forfeits?
  ---------------------------------------------------------*/
  validateField(item, includeForfeit) {
    if(!this.props.isOpen || this.props.gameToLoad != null) { return ''; }
    if(this.state[item] == '' && (!this.state.forfeit || includeForfeit)) {
      return 'invalid';
    }
    return '';
  }

  /*---------------------------------------------------------
  Mark the team select drop down as invalid if user hasn't
  selected a team
  ---------------------------------------------------------*/
  validateTeamSelect(whichTeam) {
    if(!this.props.isOpen || this.props.gameToLoad != null) { return ''; }
    var tm = this.state['team'+whichTeam]
    return (tm == '' || tm == 'nullTeam') ? 'invalid-select-wrapper' : '';
  }

  /**
   * Returns a JSX element containing the appropriate icon, or null if not needed
   * @param  errorLevel which icon to show
   * @return            JSX icon element
   */
  getErrorIcon(errorLevel) {
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
    if(errorLevel == 'info') {
      return ( <i className="material-icons blue-text text-darken-4 qb-modal-error">info</i> );
    }
    return null;
  }

  /*---------------------------------------------------------
  The field to select phases will appear if:
  1. Adding a game while not viewing a phase, or
  2. Editing a game that doesn't have any phases
  ---------------------------------------------------------*/
  canEditPhase() {
    var allPhases = this.props.allPhases;
    if(allPhases.length == 0) { return false; }
    if(allPhases.length == 1 && allPhases[0] == 'noPhase') { return false; }
    if(this.state.tiebreaker) { return false; }
    var addOrEdit = this.props.addOrEdit, viewingPhase = this.props.currentPhase;
    if(addOrEdit == 'add' && (viewingPhase == 'all' || viewingPhase == 'Tiebreakers')) {
      return true;
    }
    if(this.state.originalGameLoaded == null) { return false; }
    return addOrEdit == 'edit' && this.state.originalGameLoaded.phases.length == 0;
  }

  /*---------------------------------------------------------
  Chip containing the label for one of the game's phases.
  Pass colorNo -1 for a gray chip
  ---------------------------------------------------------*/
  phaseChip(colorNo, phase) {
    var colorName = colorNo >=0 ? CHIP_COLORS[colorNo % CHIP_COLORS.length] : 'grey';
    return (
      <div key={phase} className={'chip accent-1 ' + colorName}>
        {phase}
      </div>
    );
  }


  render() {
    var [gameIsValid, errorLevel, errorMessage] = this.validateGame();
    var errorIcon = this.getErrorIcon(errorLevel);
    var acceptHotKey = gameIsValid ? 'a' : '';
    var acceptStayHotKey = gameIsValid ? 's' : '';
    const scoreDivisor = GameVal.scoreDivisor(this.props.settings);

    //labels for every phase the game is part of
    var phaseChips = [];
    if(this.state.tiebreaker) {
      phaseChips = [this.phaseChip(-1, 'Tiebreaker')];
    }
    else {
      for(var i in this.props.allPhases) {
        if((this.props.addOrEdit == 'add' && this.props.currentPhase == this.props.allPhases[i]) ||
          (this.props.addOrEdit == 'edit' && this.state.phases.includes(this.props.allPhases[i]))) {
          phaseChips.push(this.phaseChip(i, this.props.allPhases[i]));
        }
      }
    }
    // multi-select dropdown to pick phases
    var phaseSelect = null;
    var canEditPhase = this.canEditPhase();

    if(canEditPhase) {
      var phaseOptions = this.props.allPhases.map((phase)=>{
        return ( <option key={phase} value={phase}>{phase}</option> );
      });
      phaseSelect = (
        <div className="input-field col s4">
          <select multiple id="phases" name="phases" value={this.state.phases}
          disabled={this.state.tiebreaker ? 'disabled' : ''} onChange={this.handlePhaseChange}>
            <option value="" disabled>Phase...</option>
            {phaseOptions}
          </select>
        </div>
      );
    }

    var teamData = this.props.teamData
    var team1PlayerRows = null;
    var team2PlayerRows = null;
    var teamOptions = this.getTeamOptions();

    // create team 1's player stats grid if it's not a forfeit
    if(!this.state.forfeit && this.state.team1 != 'nullTeam' && this.state.team1 != '') {
      var team1Obj = teamData.find(function(item){
        return item.teamName == this.state.team1
      }.bind(this));
      var roster = Object.keys(team1Obj.roster);
      team1PlayerRows = roster.map(function(item, index){
        var init = null;
        if(this.state.players1 != null) { init = this.state.players1[item]; }
        else if(roster.length <= this.props.settings.playersPerTeam) {
          init = {tuh: this.state.tuhtot, powers: '', tens: '', negs: ''};
        }
        else { init = null; }
        return(
          <PlayerRow key={team1Obj.teamName + item}
            playerName={item}
            whichTeam={1}
            initialData={init}
            updatePlayer={this.updatePlayer}
            settings={this.props.settings}
          />
        )
      }.bind(this)); //team1 roster.map
    }

    //create team 2's player stats grid if it's not a forfeit
    if(!this.state.forfeit && this.state.team2 != 'nullTeam' && this.state.team2 != '') {
      var team2Obj = teamData.find(function(item){
        return item.teamName == this.state.team2
      }.bind(this));
      var roster = Object.keys(team2Obj.roster);
      team2PlayerRows = roster.map(function(item, index){
        var init = null;
        if(this.state.players2 != null) { init = this.state.players2[item]; }
        else if(roster.length <= this.props.settings.playersPerTeam) {
          init = {tuh: this.state.tuhtot, powers: '', tens: '', negs: ''};
        }
        else { init = null; }
        return(
          <PlayerRow key={team2Obj.teamName + item}
            playerName={item}
            whichTeam={2}
            initialData={init}
            updatePlayer={this.updatePlayer}
            settings={this.props.settings}
          />
        )
      }.bind(this)); //team2 roster.map
    }

    // header for the player stats tables
    var tableHeader, powerCell, negCell;
    if(this.props.settings.powers != 'none') {
      powerCell = ( <th>{this.powerValue()}</th> );
    }
    else { powerCell = null; }
    if(this.props.settings.negs) { negCell = ( <th>-5</th> ); }
    else { negCell = null; }
    tableHeader = (
      <thead>
        <tr>
          <th/>
          <th>TUH</th>
          {powerCell}
          <th>10</th>
          {negCell}
          <th>Tot.</th>
        </tr>
      </thead>
    );

    // fields for overtime scoring, if applicable
    var overtimeRow = null;
    if(this.state.ottu > 0 && !this.state.forfeit &&
      this.state.team1 != 'nullTeam' && this.state.team2 != 'nullTeam') {
      var powerField1 = null, powerField2 = null;
      var negField1 = null, negField2 = null;
      if(this.props.settings.powers != 'none') {
        powerField1 = (
          <div className="input-field col s2 m1">
            <input id="otPwr1" type="number" name="otPwr1" min="0"
              value={this.state.otPwr1} onChange={this.handleChange}/>
            <label htmlFor="otPwr1">{this.powerValue()}</label>
          </div>
        );
        powerField2 = (
          <div className="input-field col s2 m1">
            <input id="otPwr2" type="number" name="otPwr2" min="0"
              value={this.state.otPwr2} onChange={this.handleChange}/>
            <label htmlFor="otPwr2">{this.powerValue()}</label>
          </div>
        );
      }
      if(this.props.settings.negs) {
        negField1 = (
          <div className="input-field col s2 m1">
            <input id="otNeg1" type="number" name="otNeg1" min="0"
              value={this.state.otNeg1} onChange={this.handleChange}/>
            <label htmlFor="otNeg1">{'-5'}</label>
          </div>
        );
        negField2 = (
          <div className="input-field col s2 m1">
            <input id="otNeg2" type="number" name="otNeg2" min="0"
              value={this.state.otNeg2} onChange={this.handleChange}/>
            <label htmlFor="otNeg2">{'-5'}</label>
          </div>
        );
      }
      overtimeRow = (
        <div className="row game-entry-bottom-row">
          <div className="col s3 m2">
            <h6>Overtime TU:</h6>
          </div>
          <div className="col s3 m2 ot-stat-label">
            <span className="">{this.state.team1 + ':'}</span>
          </div>
          {powerField1}
          <div className="input-field col s2 m1">
            <input id="otTen1" type="number" name="otTen1" min="0"
              value={this.state.otTen1} onChange={this.handleChange}/>
            <label htmlFor="otTen1">{'10'}</label>
          </div>
          {negField1}

          <div className="col s6 m2 ot-stat-label">
            <span className="">{this.state.team2 + ':'}</span>
          </div>
          {powerField2}
          <div className="input-field col s2 m1">
            <input id="otTen2" type="number" name="otTen2" min="0"
              value={this.state.otTen2} onChange={this.handleChange}/>
            <label htmlFor="otTen2">{'10'}</label>
          </div>
          {negField2}
        </div>
      ); //overtimeRow
    } // if overtime

    // display (automatically calulcated) bonus stats
    var bonusCalcRow = null;
    if(this.props.settings.bonuses) {
      bonusCalcRow = (
        <div className="row">
          <div className="col s6">
            Bonuses:&emsp;{this.bHeard(1)} heard&emsp;|&emsp;{this.bPts(1)} pts&emsp;|&emsp;{this.ppb(1)} ppb
          </div>
          <div className="col s6">
            Bonuses:&emsp;{this.bHeard(2)} heard&emsp;|&emsp;{this.bPts(2)} pts&emsp;|&emsp;{this.ppb(2)} ppb
          </div>
        </div>
      );
    }

    // bounceback points field, and automatically calculated bouncback conversion
    var bouncebackRow = null;
    if(this.props.settings.bonusesBounce) {
      bouncebackRow = (
        <div className="row">
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardInteger(1)}{this.bbHeardFraction(1)} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts1" type="number" name="bbPts1" step="10" min="0"
              disabled={this.state.forfeit ? 'disabled' : ''}
              value={this.state.forfeit ? '' : this.state.bbPts1} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBb(1)} ppbb
          </div>
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardInteger(2)}{this.bbHeardFraction(2)} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts2" type="number" name="bbPts2" step="10" min="0"
              disabled={this.state.forfeit ? 'disabled' : ''}
              value={this.state.forfeit ? '' : this.state.bbPts2} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBb(2)} ppbb
          </div>
        </div>
      );
    }

    // lightning round point entry
    var lightningRow = null;
    if(this.props.settings.lightning) {
      lightningRow = (
        <div className="row">
          <div className="col s6">
            Lightning Round:&emsp;
            <div className="input-field bounceback-entry">
              <input id="lightningPts1" type="number" name="lightningPts1" step="10" min="0"
              disabled={this.state.forfeit ? 'disabled' : ''}
              value={this.state.forfeit ? '' : this.state.lightningPts1} onChange={this.handleChange}/>
            </div>
            pts
          </div>
          <div className="col s6">
            Lightning Round:&emsp;
            <div className="input-field bounceback-entry">
              <input id="lightningPts2" type="number" name="lightningPts2" step="10" min="0"
              disabled={this.state.forfeit ? 'disabled' : ''}
              value={this.state.forfeit ? '' : this.state.lightningPts2} onChange={this.handleChange}/>
            </div>
            pts
          </div>
        </div>
      );
    }

    return(
      <div className="modal modal-fixed-footer" id="addGame">
        <div className="modal-content">
          <div className="row game-entry-top-row">
            <div className={'col ' + (canEditPhase ? 's4' : 's8')}>
              <h4>{this.getModalHeader()}</h4>
              {phaseChips}
            </div>

            {phaseSelect}

            <div className="input-field col s2">
              <input id="round" className={this.validateField("round",true)} type="number" name="round" min="0" value={this.state.round} onChange={this.handleChange}/>
              <label htmlFor="round">Round No.</label>
            </div>
            <div className="input-field col s2">
              <input id="tuhtot" className={this.validateField("tuhtot",false)}
                disabled={this.state.forfeit ? 'disabled' : ''}
                type="number" name="tuhtot" min="0"
                value={this.state.forfeit ? '' : this.state.tuhtot} onChange={this.handleChange}/>
              <label htmlFor="tuhtot" className="truncate">Toss-ups (incl. OT)</label>
            </div>
          </div>

          <div className="row game-entry-2nd-row">
            <div className={"input-field col s8 m3 l4 "+this.validateTeamSelect(1)}>
              <select id="tm1Name"  name="team1" value={this.state.team1} onChange={this.handleTeamChange}>
                {teamOptions}
              </select>
            </div>
            <div className="input-field col s4 m2 l1">
              <input className={this.validateField("score1",false)} disabled={this.state.forfeit ? 'disabled' : ''} type="number"
              step={scoreDivisor} id="tm1Score" name="score1"
              value={this.state.forfeit ? '' : this.state.score1} onChange={this.handleChange}/>
              <label htmlFor="tm1Score">Score</label>
            </div>
            <div className="col m2 hide-on-small-only">
              <div className="match-divider">
                &mdash;
              </div>
            </div>
            <div className="input-field col s4 m2 l1">
              <input className={this.validateField("score2",false)} disabled={this.state.forfeit ? 'disabled' : ''} type="number"
              step={scoreDivisor} id="tm2Score" name="score2"
              value={this.state.forfeit ? '' : this.state.score2} onChange={this.handleChange}/>
              <label htmlFor="tm2Score">Score</label>
            </div>
            <div className={"input-field col s8 m3 l4 "+this.validateTeamSelect(2)}>
              <select id="tm2Name" name="team2" value={this.state.team2} onChange={this.handleTeamChange}>
                {teamOptions}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col s12 m6">
              <table className="striped player-table">
                {tableHeader}
                <tbody>
                  {team1PlayerRows}
                </tbody>
              </table>
            </div>
            <div className="col s12 m6">
              <table className="striped player-table">
                {tableHeader}
                <tbody>
                  {team2PlayerRows}
                </tbody>
              </table>
            </div>

          </div>

          {bonusCalcRow}

          {bouncebackRow}

          {lightningRow}

          <div className="row game-entry-bottom-row">
            <div className="input-field col s12 m6">
              <textarea className="materialize-textarea" id="gameNotes" name="notes"
                maxLength="500" onChange={this.handleChange} value={this.state.notes} />
              <label htmlFor="gameNotes">Notes about this game</label>
            </div>
            <div className="input-field col s4 m2">
              <input id="ottu" disabled={this.state.forfeit ? 'disabled' : ''} type="number" name="ottu" min="0"
              value={this.state.forfeit ? '' : this.state.ottu} onChange={this.handleChange}/>
              <label htmlFor="ottu">Overtime TU</label>
            </div>
            <div className="col s4 m2 forfeit-ctrl">
              <label>
                <input type="checkbox" name="forfeit" checked={this.state.forfeit} onChange={this.handleChange}/>
                <span>Forfeit?</span>
              </label>
            </div>
            <div className="col s4 m2 forfeit-ctrl">
              <label>
                <input type="checkbox" name="tiebreaker" checked={this.state.tiebreaker}
                onChange={this.handleChange}/>
                <span>Tiebreaker?</span>
              </label>
            </div>
          </div>

          {overtimeRow}
        </div> {/* modal-content*/}

        <div className={'modal-footer ' + (errorMessage.length > 150 ? 'scroll-footer' : '')}>
          <div className="row">
            <div className="col s7 l8 qb-validation-msg">
              {errorIcon}&nbsp;{errorMessage}
            </div>
            <div className="col s5 l4">
              <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                <span className="hotkey-underline">C</span>ancel
              </button>&nbsp;
              <button accessKey={acceptStayHotKey} name="acceptAndStay" onClick={this.handleAdd}
              className={'btn blue accent-1 ' + this.disabledButton(gameIsValid)}>
                <span className="hotkey-underline">S</span>ave & New
              </button>&nbsp;
              <button accessKey={acceptHotKey} onClick={this.handleAdd}
              className={'modal-close btn green ' + this.disabledButton(gameIsValid)}>
                S<span className="hotkey-underline">a</span>ve
              </button>
            </div>
          </div>
        </div>
      </div>
    ) //return
  } //render
}; //AddGameModal

module.exports=AddGameModal;
