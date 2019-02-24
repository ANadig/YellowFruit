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
      roster: [],
      divisions: {},
      originalTeamLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.loadTeam = this.loadTeam.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handlePlayerChange = this.handlePlayerChange.bind(this);
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
  Called when the value in the team name field changes.
  This is a controlled component, so the state is the
  single source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  /*---------------------------------------------------------
  Called when a value in the list of players changes.
  ---------------------------------------------------------*/
  handlePlayerChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPlayer = name.replace('player', '');
    var tempPlayers = this.state.roster.slice();
    tempPlayers[whichPlayer] = value;
    for(var last=tempPlayers.pop(); last==''; last=tempPlayers.pop()) { } // remove blank lines
    if(last != undefined) { tempPlayers.push(last); }
    this.setState({
      roster: tempPlayers
    });
  }

  /*---------------------------------------------------------
  Once we're done with the form, clear the data.
  ---------------------------------------------------------*/
  resetState() {
    this.setState({
      teamName: '',
      roster: [],
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
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      roster: this.props.teamToLoad.roster,
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
    var rosterAry = this.state.roster.map(function(s,idx) { return s.trim(); });
    rosterAry = _.without(rosterAry, '');

    var tempItem = {
      teamName: this.state.teamName.trim(),
      roster: rosterAry,
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
    var rosterAry = this.state.roster.map(function(item, idx) {
      return item.toLowerCase().trim();
    });
    rosterAry = _.without(rosterAry, '');
    rosterAry = _.orderBy(rosterAry);
    for(var i=0; i < (rosterAry.length - 1); i++) {
      if (rosterAry[i] == rosterAry[i+1]) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Returns true if there's nothing but whitespace in the
  player fields.
  ---------------------------------------------------------*/
  hasNoPlayers() {
    var noPlayers = true;
    for(var i in this.state.roster) {
      if(this.state.roster[i].trim() != '') { noPlayers = false; }
    }
    return noPlayers;
  }

  /*---------------------------------------------------------
  Returns true if user has tried to delete a player from a
  team that already has games entered.
  ---------------------------------------------------------*/
  illegalEdit() {
    if(this.props.teamToLoad != null || this.props.addOrEdit == 'add') { return false; }
    var playerDeleted = false;
    for(var i in this.state.originalTeamLoaded.roster) {
      var p = this.state.roster[i];
      if(p == undefined || p.trim() == '') { playerDeleted = true; }
    }
    return this.props.teamHasGames(this.state.originalTeamLoaded) && playerDeleted;
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
    if(this.hasNoPlayers()) { return [false, '', '']; } //likewise for roster
    if(this.illegalEdit()) {
      return [false, 'error', 'You may not remove players from a team that has played games'];
    }
    // fairly aribitrary limit to make sure no one does anything ridiculous
    if(this.state.roster.length > MAX_PLAYERS_PER_TEAM) {
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
    var tempPlayers = this.state.roster.slice();
    tempPlayers.push('');
    var playerFields = tempPlayers.map(function(player, idx) {
      return (
        <li key={idx}>
          <div className="input-field tight-input">
          <input className="player-field" id={'player'+idx}
            type="text" name={'player'+idx} placeholder="Add a player"
            value={tempPlayers[idx]} onChange={this.handlePlayerChange}/>
          </div>
        </li>
      );
    }.bind(this));
    return ( <ul>{playerFields}</ul> );
  }



  render() {
    var playerFields = this.getPlayerFields();
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
              <div className="input-field">
                <input type="text" id="teamName" name="teamName" onChange={this.handleChange} value={this.state.teamName}/>
                <label htmlFor="teamName">Team Name</label>
              </div>
            <span>Roster</span>
            {playerFields}
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
