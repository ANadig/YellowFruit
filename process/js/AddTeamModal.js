/***********************************************************
AddTeamModal.js
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing teams.
***********************************************************/
var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');

const MAX_PLAYERS_PER_TEAM = 30;

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      teamName: '',
      teamUGStatus: false,
      teamD2Status: false,
      playerNames: [],
      playerYears: [],
      playerUGStatuses: [],
      playerD2Statuses: [],
      divisions: {},
      originalTeamLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.loadTeam = this.loadTeam.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handlePlayerChange = this.handlePlayerChange.bind(this);
    this.handleYearChange = this.handleYearChange.bind(this);
    this.handlePlayerUGChange = this.handlePlayerUGChange.bind(this);
    this.handlePlayerD2Change = this.handlePlayerD2Change.bind(this);
    this.validateTeam = this.validateTeam.bind(this);
  }

  /*---------------------------------------------------------
  Lifecyle method. Need an extra render when opening or
  closing in order for fields to populate and clear properly.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
    if(this.props.forceReset) {
      this.resetState();
      //setting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
    if(this.props.teamToLoad != null) {
      this.loadTeam();
      //setting mainInterface's editWhichTeam to null will avoid infinite loop
      this.props.onLoadTeamInModal();
    }
  }

  /*---------------------------------------------------------
  Called when the value in on of the team-level fields
  changes. This is a controlled component, so the state is
  the single source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    var playerUGStatuses = this.state.playerUGStatuses.slice();
    var playerD2Statuses = this.state.playerD2Statuses.slice();
    // mark every player as D2 if the whole team was just marked as D2
    if(name == 'teamD2Status' && value) {
      for(var i in this.state.playerNames) { playerD2Statuses[i] = true; }
      partialState.playerD2Statuses = playerD2Statuses;
    }
    this.setState(partialState);
  } //handleChange

  /*---------------------------------------------------------
  Called when a value in the list of player names changes.
  ---------------------------------------------------------*/
  handlePlayerChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPlayer = name.replace('player', '');
    var previousValue = this.state.playerNames[whichPlayer];
    var tempPlayers = this.state.playerNames.slice();
    tempPlayers[whichPlayer] = value;
    for(var last=tempPlayers.pop(); last==''; last=tempPlayers.pop()) { } // remove blank lines
    if(last != undefined) { tempPlayers.push(last); }
    var tempYears = this.state.playerYears.slice();
    var tempD2Statuses = this.state.playerD2Statuses.slice();
    var tempUGStatuses = this.state.playerUGStatuses.slice();
    //initialize the other fields
    if(tempYears[whichPlayer] == undefined) { tempYears[whichPlayer] = ''; }
    if(tempUGStatuses[whichPlayer] == undefined) { tempUGStatuses[whichPlayer] = false; }
    if(tempD2Statuses[whichPlayer] == undefined) { tempD2Statuses[whichPlayer] = this.state.teamD2Status; }
    // remove other data for the blank lines we removed earlier
    var newPlayerCnt = tempPlayers.length;
    var deletedLines = this.state.playerNames.length - newPlayerCnt;
    tempYears = tempYears.slice(0, newPlayerCnt + (deletedLines < 2));
    tempUGStatuses = tempUGStatuses.slice(0, newPlayerCnt + (deletedLines < 2));
    tempD2Statuses = tempD2Statuses.slice(0, newPlayerCnt + (deletedLines < 2));
    this.setState({
      playerNames: tempPlayers,
      playerYears: tempYears,
      playerUGStatuses: tempUGStatuses,
      playerD2Statuses: tempD2Statuses
    });
  }

  /*---------------------------------------------------------
  Called when a value in the list of player years changes.
  ---------------------------------------------------------*/
  handleYearChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPlayer = name.replace('year', '');
    var tempYears = this.state.playerYears.slice();
    tempYears[whichPlayer] = value;
    this.setState({
      playerYears: tempYears
    });
  }

  /*---------------------------------------------------------
  Called when a value in the list of player UG statuses
  changes.
  ---------------------------------------------------------*/
  handlePlayerUGChange(e) {
    const target = e.target;
    const value = target.checked;
    const name = target.name;
    var whichPlayer = name.replace('ug', '');
    var tempStatuses = this.state.playerUGStatuses.slice();
    tempStatuses[whichPlayer] = value;
    var partialState = {};
    partialState.playerUGStatuses = tempStatuses;
    this.setState(partialState);
  }

  /*---------------------------------------------------------
  Called when a value in the list of player d2 statuses
  changes.
  ---------------------------------------------------------*/
  handlePlayerD2Change(e) {
    const target = e.target;
    const value = target.checked;
    const name = target.name;
    var whichPlayer = name.replace('d2', '');
    var tempStatuses = this.state.playerD2Statuses.slice();
    tempStatuses[whichPlayer] = value;
    var partialState = {};
    partialState.playerD2Statuses = tempStatuses;
    if(whichPlayer < this.state.playerNames.length && !value) {
      partialState.teamD2Status = false; // team can't be D2 if one of its players isn't
    }
    this.setState(partialState);
  }

  /*---------------------------------------------------------
  Once we're done with the form, clear the data.
  ---------------------------------------------------------*/
  resetState() {
    this.setState({
      teamName: '',
      playerNames: [],
      playerYears: [],
      teamUGStatus: false,
      teamD2Status: false,
      playerUGStatuses: [],
      playerD2Statuses: [],
      divisions: {},
      originalTeamLoaded: null
    });
  }

  /*---------------------------------------------------------
  Populate form with the existing team's data. Also keep a
  pointer to this team so the MainInterface can remember
  which team to modify.
  ---------------------------------------------------------*/
  loadTeam() {
    var years = [], ugStatuses = [], div2Statuses = [];
    for(var p in this.props.teamToLoad.roster) {
      years.push(this.props.teamToLoad.roster[p].year);
      div2Statuses.push(this.props.teamToLoad.roster[p].div2);
      ugStatuses.push(this.props.teamToLoad.roster[p].undergrad);
    }
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      teamUGStatus: this.props.teamToLoad.teamUGStatus,
      teamD2Status: this.props.teamToLoad.teamD2Status,
      playerNames: Object.keys(this.props.teamToLoad.roster),
      playerYears: years,
      playerUGStatuses: ugStatuses,
      playerD2Statuses: div2Statuses,
      divisions: this.props.teamToLoad.divisions,
      originalTeamLoaded: this.props.teamToLoad
    });
  }

  /*---------------------------------------------------------
  Called when the form is submitted. Tell the MainInterface
  to create a new team or modify an existing one as
  appropriate.
  ---------------------------------------------------------*/
  handleAdd(e) {
    e.preventDefault();
    if(!this.props.isOpen) { return; } //keyboard shortcut shouldn't work here
    //trim each player name, then remove blank lines
    var roster = {};
    var count = 0, playerDeleted = false;
    for(var i in this.state.playerNames) {
      var name = this.state.playerNames[i].trim();
      if(name != '' || (this.props.addOrEdit == 'edit' && i < Object.keys(this.state.originalTeamLoaded.roster).length)) {
        //if editing existing team, need to keep empty lines so we know which players were deleted
        if(name == '') {
          roster['deletedPlayerPlaceholder'+(count++)] = {deleted: true};
        } // dummy name, so we don't have duplicates if the user just deleted two players
        else {
          roster[name] = {
            year: this.state.playerYears[i].trim(),
            undergrad: this.state.playerUGStatuses[i],
            div2: this.state.playerD2Statuses[i]
          };
        }
      }
    }

    var tempItem = {
      teamName: this.state.teamName.trim(),
      teamUGStatus: this.state.teamUGStatus,
      teamD2Status: this.state.teamD2Status,
      roster: roster,
      divisions: this.state.divisions
    } //tempitems

    if(this.props.addOrEdit == 'add') {
      this.props.addTeam(tempItem);
    }
    else {
      this.props.modifyTeam(this.state.originalTeamLoaded, tempItem);
    }

    this.resetState();
  } //handleAdd

  /*---------------------------------------------------------
  Title at the top of the window
  ---------------------------------------------------------*/
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New team' : 'Edit team';
  }

  /*---------------------------------------------------------
  For the Accept button at the bottom.
  ---------------------------------------------------------*/
  getSubmitWord() {
    return this.props.addOrEdit == 'add' ? 'Add ' : 'Save ';
  }

  /*---------------------------------------------------------
  Are there two players with the same name?
  ---------------------------------------------------------*/
  rosterHasDups() {
    var nameAry = this.state.playerNames.map(function(item, idx) {
      return item.toLowerCase().trim();
    });
    nameAry = _.without(nameAry, '');
    nameAry = _.orderBy(nameAry);
    for(var i=0; i < (nameAry.length - 1); i++) {
      if (nameAry[i] == nameAry[i+1]) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Returns true if there's nothing but whitespace in the
  player fields.
  ---------------------------------------------------------*/
  hasNoPlayers() {
    var noPlayers = true;
    for(var i in this.state.playerNames) {
      if(this.state.playerNames[i].trim() != '') { noPlayers = false; }
    }
    return noPlayers;
  }

  /*---------------------------------------------------------
  Returns true if user has tried to delete a player that has
  already played in at least one game
  ---------------------------------------------------------*/
  illegalEdit() {
    if(this.props.teamToLoad != null || this.props.addOrEdit == 'add') { return false; }
    var playerDeleted = null;
    var originalNames = Object.keys(this.state.originalTeamLoaded.roster);
    for(var i in originalNames) {
      var currentName = this.state.playerNames[i];
      if(currentName == undefined || currentName.trim() == '') { playerDeleted = originalNames[i]; }
    }
    if(playerDeleted == null) { return false; }
    return this.props.playerIndex[this.state.originalTeamLoaded.teamName][playerDeleted] > 0;
    // return this.props.teamHasGames(this.state.originalTeamLoaded) && playerDeleted;
  }

  /*---------------------------------------------------------
  Whether there are any issues with the team. 3-element array:
  - Are there errors, true/false
  - Severity level (error: can't save team; warning: can
    override)
  - Error message
  ---------------------------------------------------------*/
  validateTeam() {
    if(!this.props.validateTeamName(this.state.teamName.trim(), this.state.originalTeamLoaded)) {
      return [false, 'error', 'There is already a team named ' + this.state.teamName];
    }
    if(this.state.teamName.trim() == '') { return [false, '', '']; } //team name can't be just whitespace
    if(this.hasNoPlayers()) { return [false, '', '']; } //likewise for playerNames
    if(this.illegalEdit()) {
      return [false, 'error', 'You may not remove players that have already played in a game'];
    }
    // fairly aribitrary limit to make sure no one does anything ridiculous
    if(this.state.playerNames.length > MAX_PLAYERS_PER_TEAM) {
      return [false, 'error', 'Cannot have more than 30 players on a team'];
    }
    if(this.rosterHasDups()) { return [false, 'error', 'Roster contains two or more players with the same name']; }
    return [true, '', ''];
  }

  /*---------------------------------------------------------
  Add the disabled attribute to the submit button.
  ---------------------------------------------------------*/
  disabledButton(isTeamValid) {
    return isTeamValid ? '' : 'disabled';
  }

  /*---------------------------------------------------------
  Returns a JSX element containing the appropriate icon
  (or null if no error)
  ---------------------------------------------------------*/
  getErrorIcon(errorLevel) {
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
    return null;
  }

  /*---------------------------------------------------------
  The list of text fields conaining the roster.
  ---------------------------------------------------------*/
  getPlayerFields() {
    var tempPlayers = this.state.playerNames.slice();
    tempPlayers.push('');
    var playerFields = tempPlayers.map((player, idx) => {
      return (
          <div key={idx} className="input-field tight-input">
            <input id={'player'+idx} type="text" name={'player'+idx} placeholder="Add a player"
              value={player} onChange={this.handlePlayerChange}/>
          </div>
      );
    });
    return playerFields;
  }

  /*---------------------------------------------------------
  The list of text fields containing the grades/years of
  each player.
  ---------------------------------------------------------*/
  getYearFields() {
    var tempYears = this.state.playerNames.map((name, idx) => { return this.state.playerYears[idx]; });
    if(this.state.playerYears.length > tempYears.length) {
      tempYears.push(this.state.playerYears[tempYears.length]);
    }
    else { tempYears.push(''); }
    var yearFields = tempYears.map((year, idx) => {
      return (
          <div key={idx} className="input-field tight-input">
            <input id={'year'+idx} type="text" name={'year'+idx} placeholder="Grade/Year"
              value={year} onChange={this.handleYearChange}/>
          </div>
      );
    });
    return yearFields;
  }

  /*---------------------------------------------------------
  The list of checkboxes denoting the undergrad status of
  each player
  ---------------------------------------------------------*/
  getUGFields() {
    var tempStatuses = this.state.playerNames.map((name, idx) => { return this.state.playerUGStatuses[idx]; });
    if(this.state.playerUGStatuses.length > tempStatuses.length) {
      tempStatuses.push(this.state.playerUGStatuses[tempStatuses.length]);
    }
    else { tempStatuses.push(false); }
    var ugFields = tempStatuses.map((status, idx) => {
      return (
        <div key={idx} className="player-d2-checkbox">
          <label>
            <input id={'ug'+idx} type="checkbox" name={'ug'+idx} checked={status} onChange={this.handlePlayerUGChange}/>
            <span>UG</span>
          </label>
        </div>
      );
    });
    return ugFields;
  }

  /*---------------------------------------------------------
  The list of checkboxes denoting the Div. 2 status of
  each player
  ---------------------------------------------------------*/
  getD2Fields() {
    var tempStatuses = this.state.playerNames.map((name, idx) => { return this.state.playerD2Statuses[idx]; });
    if(this.state.playerD2Statuses.length > tempStatuses.length) {
      tempStatuses.push(this.state.playerD2Statuses[tempStatuses.length]);
    }
    else { tempStatuses.push(false); }
    var d2Fields = tempStatuses.map((status, idx) => {
      return (
        <div key={idx} className="player-d2-checkbox">
          <label>
            <input id={'d2'+idx} type="checkbox" name={'d2'+idx} checked={status} onChange={this.handlePlayerD2Change}/>
            <span>D2</span>
          </label>
        </div>
      );
    });
    return d2Fields;
  }

  /*---------------------------------------------------------
  Put the sets of fields together into a series of row
  elements
  ---------------------------------------------------------*/
  constructRosterTable(playerFields, yearFields, ugFields, d2Fields) {
    var numCheckBoxes = (+this.props.formSettings.playerUG) + (+this.props.formSettings.playerD2);
    var yearWidth = this.props.formSettings.year ? 3 : 0;
    var nameWidthL = 12 - yearWidth - numCheckBoxes;
    var nameWidthS = 12 - yearWidth - 2*numCheckBoxes;
    var rows = [];
    for(var i in playerFields) {
      var yearField = null, ugField = null, d2Field = null;
      if(this.props.formSettings.year) {
        yearField = (
          <div className="col s3">
            {yearFields[i]}
          </div>
        );
      }
      if(this.props.formSettings.playerUG) {
        ugField = (
          <div className="col l1 s2">
            {ugFields[i]}
          </div>
        );
      }
      if(this.props.formSettings.playerD2) {
        d2Field = (
          <div className="col l1 s2">
            {d2Fields[i]}
          </div>
        );
      }
      var oneRow = (
        <div key={i} className="row">
          <div className={'col l' + nameWidthL + ' s' + nameWidthS}>
            {playerFields[i]}
          </div>
          {yearField}
          {ugField}
          {d2Field}
        </div>
      );
      rows.push(oneRow);
    }
    return rows;
  }



  render() {
    var playerFields = this.getPlayerFields();
    var yearFields = this.getYearFields();
    var ugFields = this.getUGFields();
    var d2Fields = this.getD2Fields();
    var rosterTable = this.constructRosterTable(playerFields, yearFields, ugFields, d2Fields);

    var [teamIsValid, errorLevel, errorMessage] = this.validateTeam();
    var errorIcon = this.getErrorIcon(errorLevel);
    var acceptHotKey = teamIsValid ? 'a' : '';

    //Don't allow Enter key to submit form
    $(document).on("keypress", "#addTeam :input:not(textarea)", function(event) {
      // return teamIsValid || event.keyCode != 13;
      return event.keyCode != 13;
    });

    return(
      <div className="modal modal-fixed-footer" id="addTeam">
        <form onSubmit={this.handleAdd}>
          <div className="modal-content">
            <h4>{this.getModalHeader()}</h4>
            <div className="row">
              <div className="col l10 s8">
                <div className="input-field">
                  <input type="text" id="teamName" name="teamName" onChange={this.handleChange} value={this.state.teamName}/>
                  <label htmlFor="teamName">Team Name</label>
                </div>
              </div>
              <div className="col l1 s2">
                <div className="team-level-checkbox">
                  <label>
                    <input id="teamUGStatus" type="checkbox" name="teamUGStatus" checked={this.state.teamUGStatus} onChange={this.handleChange}/>
                    <span>UG</span>
                  </label>
                </div>
              </div>
              <div className="col l1 s2">
                <div className="team-level-checkbox">
                  <label>
                    <input id="teamD2Status" type="checkbox" name="teamD2Status" checked={this.state.teamD2Status} onChange={this.handleChange}/>
                    <span>D2</span>
                  </label>
                </div>
              </div>
            </div>
            <h5>Roster</h5>
            {rosterTable}
          </div> {/* modal content */}
          <div className="modal-footer">
            <div className="row">
              <div className="col s5 l8 qb-validation-msg">
                {errorIcon}&nbsp;{errorMessage}
              </div>
              <div className="col s7 l4">
                <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                  <span className="hotkey-underline">C</span>ancel
                </button>&nbsp;
                <button type="submit" accessKey={acceptHotKey} className={'modal-close btn green ' + this.disabledButton(teamIsValid)}>
                  {this.getSubmitWord()} Te<span className="hotkey-underline">a</span>m
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
