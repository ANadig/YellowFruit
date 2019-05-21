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
      teamUgStatus: false,
      teamD2Status: false,
      playerNames: [],
      playerYears: [],
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
    var tempPlayers = this.state.playerNames.slice();
    tempPlayers[whichPlayer] = value;
    for(var last=tempPlayers.pop(); last==''; last=tempPlayers.pop()) { } // remove blank lines
    if(last != undefined) { tempPlayers.push(last); }
    var tempYears = this.state.playerYears.slice();
    var tempD2Statuses = this.state.playerD2Statuses.slice();
    if(tempYears[whichPlayer] == undefined) {
      tempYears[whichPlayer] = ''; // initialize year field
      tempD2Statuses[whichPlayer] = false; // initialize d2 field
    }
    this.setState({
      playerNames: tempPlayers,
      playerYears: tempYears,
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
    this.setState({
      playerD2Statuses: tempStatuses
    });
  }

  /*---------------------------------------------------------
  Once we're done with the form, clear the data.
  ---------------------------------------------------------*/
  resetState() {
    this.setState({
      teamName: '',
      playerNames: [],
      playerYears: [],
      teamUgStatus: false,
      teamD2Status: false,
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
    var years = [], div2Statuses = [];
    for(var p in this.props.teamToLoad.roster) {
      years.push(this.props.teamToLoad.roster[p].year);
      div2Statuses.push(this.props.teamToLoad.roster[p].div2);
    }
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      teamUgStatus: this.props.teamToLoad.teamUgStatus,
      teamD2Status: this.props.teamToLoad.teamD2Status,
      playerNames: Object.keys(this.props.teamToLoad.roster),
      playerYears: years,
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
            div2: this.state.playerD2Statuses[i]
          };
        }
      }
    }

    var tempItem = {
      teamName: this.state.teamName.trim(),
      teamUgStatus: this.state.teamUgStatus,
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
  constructRosterTable(playerFields, yearFields, d2Fields) {
    var rows = [];
    for(var i in playerFields) {
      var oneRow = (
        <div key={i} className="row">
          <div className="col l9 s7">
            {playerFields[i]}
          </div>
          <div className="col l2 s3">
            {yearFields[i]}
          </div>
          <div className="col l1 s2">
            {d2Fields[i]}
          </div>
        </div>
      );
      rows.push(oneRow);
    }
    return rows;
  }



  render() {
    var playerFields = this.getPlayerFields();
    var yearFields = this.getYearFields();
    var d2Fields = this.getD2Fields();
    var rosterTable = this.constructRosterTable(playerFields, yearFields, d2Fields);

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
              <div className="col s8">
                <div className="input-field">
                  <input type="text" id="teamName" name="teamName" onChange={this.handleChange} value={this.state.teamName}/>
                  <label htmlFor="teamName">Team Name</label>
                </div>
              </div>
              <div className="col s4">
                <div className="team-level-checkbox">
                  <label>
                    <input id="teamUgStatus" type="checkbox" name="teamUgStatus" checked={this.state.teamUgStatus} onChange={this.handleChange}/>
                    <span>UG&emsp;&emsp;</span>
                  </label>
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
