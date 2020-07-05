/***********************************************************
AddTeamModal.tsx
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing teams.
***********************************************************/
import * as React from 'react';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { YfTeam, FormValidation } from './YfTypes';

const MAX_PLAYERS_PER_TEAM = 50;

interface AddTeamModalProps {
  teamToLoad: YfTeam;
  addOrEdit: 'add' | 'edit';
  addTeam: (tempItem: YfTeam, acceptAndStay: boolean) => void;
  modifyTeam: (originalTeamLoaded: YfTeam, tempItem: YfTeam, acceptAndStay: boolean) => void;
  isOpen: boolean;
  validateTeamName: (name: string, originalTeamLoaded: YfTeam) => boolean;
  playerIndex: any;
  formSettings: any;
}

interface AddTeamModalState {
  teamName: string;
  smallSchool: boolean;
  jrVarsity: boolean;
  teamUGStatus: boolean;
  teamD2Status: boolean;
  playerNames: string[];
  playerYears: string[];
  playerUGStatuses: boolean[];
  playerD2Statuses: boolean[];
  originalTeamLoaded: YfTeam;
}

export class AddTeamModal extends React.Component<AddTeamModalProps, AddTeamModalState>{

  constructor(props: AddTeamModalProps) {
    super(props);
    this.state = {
      teamName: '',
      smallSchool: false,
      jrVarsity: false,
      teamUGStatus: false,
      teamD2Status: false,
      playerNames: [],
      playerYears: [],
      playerUGStatuses: [],
      playerD2Statuses: [],
      originalTeamLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.loadTeam = this.loadTeam.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handlePlayerChange = this.handlePlayerChange.bind(this);
    this.handlePlayerPaste = this.handlePlayerPaste.bind(this);
    this.handleYearChange = this.handleYearChange.bind(this);
    this.handlePlayerUGChange = this.handlePlayerUGChange.bind(this);
    this.handlePlayerD2Change = this.handlePlayerD2Change.bind(this);
    this.validateTeam = this.validateTeam.bind(this);
  }

  /**
   * Lifecycle method
   */
  componentDidMount() {
    //Don't allow Enter key to submit form
    $(document).on("keydown", "#addTeam :input:not(textarea)", function(event) {
      return event.keyCode != 13;
    });
  }

  /**
   * Lifecyle method. Need an extra render when opening or closing in order for fields to
   * populate and clear properly.
   * @param  prevProps properties from the previous render
   */
  componentDidUpdate(prevProps: AddTeamModalProps) {
    // populate data when the form is opened
    if(this.props.isOpen && !prevProps.isOpen && this.props.addOrEdit == 'edit') {
      this.loadTeam();
    }
    // clear the form if it's being closed
    else if(!this.props.isOpen && prevProps.isOpen) {
      this.resetState();
    }
  }

  /**
   * Called when the value in one of the team-level fields changes. This is a controlled
   * component, so the state is the single source of truth.
   * @param    e event
   */
  handleChange(e: any): void {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    let partialState: any = {};
    partialState[name] = value;
    let playerD2Statuses = this.state.playerD2Statuses.slice();
    // mark every player as D2 if the whole team was just marked as D2
    if(name == 'teamD2Status' && value) {
      for(var i in this.state.playerNames) { playerD2Statuses[i] = true; }
      partialState.playerD2Statuses = playerD2Statuses;
    }
    this.setState(partialState);
  }

  /**
   * Called when a value in the list of player names changes.
   * @param   e event
   */
  handlePlayerChange(e: any) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    const whichPlayer = name.replace('player', '');
    let tempPlayers = this.state.playerNames.slice();
    tempPlayers[whichPlayer] = value;
    let last: string;
    for(last=tempPlayers.pop(); last==''; last=tempPlayers.pop()) { } // remove blank lines from end
    if(last != undefined) { tempPlayers.push(last); }
    let tempYears = this.state.playerYears.slice();
    let tempD2Statuses = this.state.playerD2Statuses.slice();
    let tempUGStatuses = this.state.playerUGStatuses.slice();
    //initialize the other fields
    if(tempYears[whichPlayer] == undefined) { tempYears[whichPlayer] = ''; }
    if(tempUGStatuses[whichPlayer] == undefined) { tempUGStatuses[whichPlayer] = false; }
    if(tempD2Statuses[whichPlayer] == undefined) { tempD2Statuses[whichPlayer] = this.state.teamD2Status; }
    // remove other data for the blank lines we removed earlier
    const newPlayerCnt = tempPlayers.length;
    const deletedLines = this.state.playerNames.length - newPlayerCnt;
    let sliceEnd = deletedLines < 2 ? 1 : 0;
    sliceEnd += newPlayerCnt;
    tempYears = tempYears.slice(0, sliceEnd);
    tempUGStatuses = tempUGStatuses.slice(0, sliceEnd);
    tempD2Statuses = tempD2Statuses.slice(0, sliceEnd);
    this.setState({
      playerNames: tempPlayers,
      playerYears: tempYears,
      playerUGStatuses: tempUGStatuses,
      playerD2Statuses: tempD2Statuses
    });
  }

  /**
   * Allow pasting in multiple players at a time, separated by newlines
   * @param  {[type]} e event
   */
  handlePlayerPaste(e: any) {
    const target = e.target;
    const name = target.name;
    const whichPlayer = name.replace('player', '');
    let tempPlayers = this.state.playerNames.slice();
    let tempYears = this.state.playerYears.slice();
    let tempD2Statuses = this.state.playerD2Statuses.slice();
    let tempUGStatuses = this.state.playerUGStatuses.slice();
    let nameList = e.clipboardData.getData('Text').split('\n');
    if(nameList.length <= 1 || whichPlayer < tempPlayers.length) {
      return; // only allowed if you're pasting at the end of the list
    }
    e.preventDefault();
    nameList = _.without(nameList, '', '\r');
    // console.log(nameList[2].charCodeAt(0));
    for(let i=0; i<nameList.length; i++) {
      const playerIdx = +whichPlayer + i;
      tempPlayers[playerIdx] = nameList[i].trim();
      //initialize the other fields
      if(tempYears[playerIdx] == undefined) { tempYears[playerIdx] = ''; }
      if(tempUGStatuses[playerIdx] == undefined) { tempUGStatuses[playerIdx] = false; }
      if(tempD2Statuses[playerIdx] == undefined) { tempD2Statuses[playerIdx] = this.state.teamD2Status; }
    }
    this.setState({
      playerNames: tempPlayers,
      playerYears: tempYears,
      playerUGStatuses: tempUGStatuses,
      playerD2Statuses: tempD2Statuses
    });
  }

  /**
   * Called when a value in the list of player years changes.
   * @param  e event
   */
  handleYearChange(e: any): void {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    const whichPlayer = name.replace('year', '');
    let tempYears = this.state.playerYears.slice();
    tempYears[whichPlayer] = value;
    this.setState({
      playerYears: tempYears
    });
  }

  /**
   * alled when a value in the list of player UG statuses changes
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  handlePlayerUGChange(e: any): void {
    const target = e.target;
    const value = target.checked;
    const name = target.name;
    const whichPlayer = name.replace('ug', '');
    let tempStatuses = this.state.playerUGStatuses.slice();
    tempStatuses[whichPlayer] = value;
    let partialState: any = {};
    partialState.playerUGStatuses = tempStatuses;
    this.setState(partialState);
  }

  /**
   * Called when a value in the list of player d2 statuses changes.
   * @param  e event
   */
  handlePlayerD2Change(e: any): void {
    const target = e.target;
    const value = target.checked;
    const name = target.name;
    const whichPlayer = name.replace('d2', '');
    let tempStatuses = this.state.playerD2Statuses.slice();
    tempStatuses[whichPlayer] = value;
    let partialState: any = {};
    partialState.playerD2Statuses = tempStatuses;
    if(whichPlayer < this.state.playerNames.length && !value) {
      partialState.teamD2Status = false; // team can't be D2 if one of its players isn't
    }
    this.setState(partialState);
  }

  /**
   * Once we're done with the form, clear the data.
   */
  resetState(): void {
    this.setState({
      teamName: '',
      smallSchool: false,
      jrVarsity: false,
      teamUGStatus: false,
      teamD2Status: false,
      playerNames: [],
      playerYears: [],
      playerUGStatuses: [],
      playerD2Statuses: [],
      originalTeamLoaded: null
    });
  }

  /**
   * Populate form with the existing team's data. Also keep a pointer to this team so the
   * mainInterface can remember which team to modify
   */
  loadTeam(): void {
    let years = [], ugStatuses = [], div2Statuses = [];
    for(let p in this.props.teamToLoad.roster) {
      years.push(this.props.teamToLoad.roster[p].year);
      div2Statuses.push(this.props.teamToLoad.roster[p].div2);
      ugStatuses.push(this.props.teamToLoad.roster[p].undergrad);
    }
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      smallSchool: this.props.teamToLoad.smallSchool,
      jrVarsity: this.props.teamToLoad.jrVarsity,
      teamUGStatus: this.props.teamToLoad.teamUGStatus,
      teamD2Status: this.props.teamToLoad.teamD2Status,
      playerNames: Object.keys(this.props.teamToLoad.roster),
      playerYears: years,
      playerUGStatuses: ugStatuses,
      playerD2Statuses: div2Statuses,
      originalTeamLoaded: this.props.teamToLoad
    });
  }

  /**
   * Called when the form is submitted. Tell the MainInterface to create a new team or
   * modify an existing one
   * @param  {[type]} e event
   */
  handleAdd(e: any): void {
    e.preventDefault();
    if(!this.props.isOpen) { return; } //keyboard shortcut shouldn't work here
    //trim each player name, then remove blank lines
    let roster = {};
    let count = 0;
    for(let i in this.state.playerNames) {
      const name = this.state.playerNames[i].trim();
      if(name != '' || (this.props.addOrEdit == 'edit' && +i < Object.keys(this.state.originalTeamLoaded.roster).length)) {
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

    let tempItem = {
      teamName: this.state.teamName.trim(),
      smallSchool: this.state.smallSchool,
      jrVarsity: this.state.jrVarsity,
      teamUGStatus: this.state.teamUGStatus,
      teamD2Status: this.state.teamD2Status,
      roster: roster,
      divisions: null,  // division and rank to be filled int by MainInterface
      rank: null
    } //tempitems

    const acceptAndStay = e.target.name == 'acceptAndStay';
    if(this.props.addOrEdit == 'add') {
      this.props.addTeam(tempItem, acceptAndStay);
    }
    else {
      this.props.modifyTeam(this.state.originalTeamLoaded, tempItem, acceptAndStay);
    }

    this.resetState();
  } //handleAdd

  /**
   * Title at the top of the window
   * @return {[type]} 'New team' or 'Edit team'
   */
  getModalHeader(): string {
    return this.props.addOrEdit == 'add' ? 'New team' : 'Edit team';
  }

  /**
   * Are there two players with the same name?
   * @return  true if there are two players with the same name
   */
  rosterHasDups(): boolean {
    let nameAry = this.state.playerNames.map(function(item, _idx) {
      return item.toLowerCase().trim();
    });
    nameAry = _.without(nameAry, '');
    nameAry = _.orderBy(nameAry);
    for(let i=0; i < (nameAry.length - 1); i++) {
      if (nameAry[i] == nameAry[i+1]) { return true; }
    }
    return false;
  }

  /**
   * Returns true if there's nothing but whitespace in the player fields
   * @return boolean
   */
  hasNoPlayers(): boolean {
    let noPlayers = true;
    for(var i in this.state.playerNames) {
      if(this.state.playerNames[i].trim() != '') { noPlayers = false; }
    }
    return noPlayers;
  }

  /**
   * Returns true if user has tried to delete a player that has already played in at
   * least one game
   * @return boolean
   */
  illegalEdit(): boolean {
    if(this.props.teamToLoad != null || this.props.addOrEdit == 'add') { return false; }
    let playerDeleted = null;
    const originalNames = Object.keys(this.state.originalTeamLoaded.roster);
    for(let i in originalNames) {
      var currentName = this.state.playerNames[i];
      if(currentName == undefined || currentName.trim() == '') { playerDeleted = originalNames[i]; }
    }
    if(playerDeleted == null) { return false; }
    return this.props.playerIndex[this.state.originalTeamLoaded.teamName][playerDeleted] > 0;
  }

  /**
   * Whether there are any issues with the team.
   * @return  FormValidation tuple
   */
  validateTeam(): FormValidation {
    if(!this.props.validateTeamName(this.state.teamName.trim(), this.state.originalTeamLoaded)) {
      return [false, 'error', 'There is already a team named ' + this.state.teamName];
    }
    if(this.state.teamName.trim() == '') { return [false, null, '']; } //team name can't be just whitespace
    if(this.hasNoPlayers()) { return [false, null, '']; } //likewise for playerNames
    if(this.illegalEdit()) {
      return [false, 'error', 'You may not remove players that have already played in a game'];
    }
    // fairly aribitrary limit to make sure no one does anything ridiculous
    if(this.state.playerNames.length > MAX_PLAYERS_PER_TEAM) {
      return [false, 'error', 'Cannot have more than ' + MAX_PLAYERS_PER_TEAM + ' players on a team'];
    }
    if(this.rosterHasDups()) { return [false, 'error', 'Roster contains two or more players with the same name']; }
    return [true, null, ''];
  }

  /**
   * Add the disabled attribute to the submit button.
   * @param  {Boolean} isTeamValid whether the data can be saved
   * @return  'disabled' or ''
   */
  disabledButton(isTeamValid: boolean): string {
    return isTeamValid ? '' : 'disabled';
  }

  /**
   * Returns a JSX element containing the appropriate icon, or null if no error
   * @param  {[type]} errorLevel what kind of icon to use
   * @return icon JSX element
   */
  getErrorIcon(errorLevel: 'error' | 'warning' | 'info'): JSX.Element {
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
    return null;
  }

  /**
   * The list of text fields conaining the roster.
   * @return array of div elements conaining text fields
   */
  getPlayerFields(): JSX.Element[] {
    let tempPlayers = this.state.playerNames.slice();
    tempPlayers.push('');
    const playerFields = tempPlayers.map((player, idx) => {
      return (
          <div key={idx} className="input-field tight-input">
            <input id={'player'+idx} type="text" name={'player'+idx}
              maxLength={100} placeholder="Add a player" value={player}
              onChange={this.handlePlayerChange} onPaste={this.handlePlayerPaste}/>
          </div>
      );
    });
    return playerFields;
  }

  /**
   * The list of text fields containing the grades/years of each player
   * @return array of div elements
   */
  getYearFields(): JSX.Element[] {
    let tempYears = this.state.playerNames.map((_name, idx) => { return this.state.playerYears[idx]; });
    if(this.state.playerYears.length > tempYears.length) {
      tempYears.push(this.state.playerYears[tempYears.length]);
    }
    else { tempYears.push(''); }
    const yearFields = tempYears.map((year, idx) => {
      return (
          <div key={idx} className="input-field tight-input">
            <input id={'year'+idx} type="text" name={'year'+idx} maxLength={20}
              placeholder="Grade/Year" value={year} onChange={this.handleYearChange}/>
          </div>
      );
    });
    return yearFields;
  }

  /**
   * The list of checkboxes denoting the undergrad status of each player
   * @return array of span elements
   */
  getUGFields(): JSX.Element[] {
    let tempStatuses = this.state.playerNames.map((_name, idx) => { return this.state.playerUGStatuses[idx]; });
    if(this.state.playerUGStatuses.length > tempStatuses.length) {
      tempStatuses.push(this.state.playerUGStatuses[tempStatuses.length]);
    }
    else { tempStatuses.push(false); }
    const ugFields = tempStatuses.map((status, idx) => {
      return (
        <span key={'ug'+idx} className="player-checkbox">
          <label>
            <input id={'ug'+idx} type="checkbox" name={'ug'+idx} checked={status} onChange={this.handlePlayerUGChange}/>
            <span>UG</span>
          </label>
        </span>
      );
    });
    return ugFields;
  }

  /**
   * The list of checkboxes denoting the Div. 2 status of each player
   * @return {[type]} array of span elements
   */
  getD2Fields(): JSX.Element[] {
    let tempStatuses = this.state.playerNames.map((_name, idx) => { return this.state.playerD2Statuses[idx]; });
    if(this.state.playerD2Statuses.length > tempStatuses.length) {
      tempStatuses.push(this.state.playerD2Statuses[tempStatuses.length]);
    }
    else { tempStatuses.push(false); }
    const d2Fields = tempStatuses.map((status, idx) => {
      return (
        <span key={'d2'+idx} className="player-checkbox">
          <label>
            <input id={'d2'+idx} type="checkbox" name={'d2'+idx} checked={status} onChange={this.handlePlayerD2Change}/>
            <span>D2</span>
          </label>
        </span>
      );
    });
    return d2Fields;
  }

  /**
   * Put the sets of fields together into a series of row elements
   * @param   playerFields list of player text fields
   * @param   yearFields   player year fields
   * @param   ugFields     player UG checkboxes
   * @param   d2Fields     player d2 checkboxes
   * @return               array of div row elements
   */
  constructRosterTable(playerFields: JSX.Element[], yearFields: JSX.Element[],
    ugFields: JSX.Element[], d2Fields: JSX.Element[]): JSX.Element[] {

    const anyCheckBoxes = this.props.formSettings.showUGFields || this.props.formSettings.showD2Fields;
    const yearWidth = this.props.formSettings.showYearField ? 3 : 0;
    const nameWidthL = 12 - yearWidth - 3*anyCheckBoxes;
    const nameWidthM = 12 - yearWidth - 4*anyCheckBoxes;
    const nameWidthS = 12 - yearWidth - 5*anyCheckBoxes;
    let rows = [];
    for(let i in playerFields) {
      let yearField = null, checkBoxCol = null, ugField = null, d2Field = null;
      if(this.props.formSettings.showYearField) {
        yearField = (
          <div className="col s3">
            {yearFields[i]}
          </div>
        );
      }
      if(this.props.formSettings.showUGFields) {
        ugField = ugFields[i];
      }
      if(this.props.formSettings.showD2Fields) {
        d2Field = d2Fields[i];
      }
      if(anyCheckBoxes) {
        checkBoxCol = (
          <div className="col l3 m4 s5">
            {ugField}{d2Field}
          </div>
        );
      }
      let oneRow = (
        <div key={i} className="row">
          <div className={'col l' + nameWidthL + ' m' + nameWidthM + ' s' + nameWidthS}>
            {playerFields[i]}
          </div>
          {yearField}
          {checkBoxCol}
        </div>
      );
      rows.push(oneRow);
    }
    return rows;
  }



  render() {
    const playerFields = this.getPlayerFields();
    const yearFields = this.getYearFields();
    const ugFields = this.getUGFields();
    const d2Fields = this.getD2Fields();
    const rosterTable = this.constructRosterTable(playerFields, yearFields, ugFields, d2Fields);

    const [teamIsValid, errorLevel, errorMessage] = this.validateTeam();
    const errorIcon = this.getErrorIcon(errorLevel);
    const acceptHotKey = teamIsValid ? 'a' : '';
    const acceptStayHotKey = teamIsValid ? 's' : '';

    let teamSSField = null,
      teamJVField = null,
      teamUGField = null,
      teamD2Field = null,
      teamFieldGroup = null;
    if(this.props.formSettings.showSmallSchool) {
      teamSSField = (
        <span>
          <label>
            <input id="smallSchool" type="checkbox" name="smallSchool" checked={this.state.smallSchool} onChange={this.handleChange}/>
            <span>SS</span>
          </label>
        </span>
      );
    }
    if(this.props.formSettings.showJrVarsity) {
      teamJVField = (
        <span>
          <label>
            <input id="jrVarsity" type="checkbox" name="jrVarsity" checked={this.state.jrVarsity} onChange={this.handleChange}/>
            <span>JV</span>
          </label>
        </span>
      );
    }
    if(this.props.formSettings.showUGFields) {
      teamUGField = (
        <span>
          <label>
            <input id="teamUGStatus" type="checkbox" name="teamUGStatus" checked={this.state.teamUGStatus} onChange={this.handleChange}/>
            <span>UG</span>
          </label>
        </span>
      );
    }
    if(this.props.formSettings.showD2Fields) {
      teamD2Field = (
        <span>
          <label>
            <input id="teamD2Status" type="checkbox" name="teamD2Status" checked={this.state.teamD2Status} onChange={this.handleChange}/>
            <span>D2</span>
          </label>
        </span>
      );
    }

    if(teamSSField != null || teamJVField != null || teamUGField != null || teamD2Field != null) {
      teamFieldGroup = (
        <div className="col l3 m4 s5 team-level-checkbox">
          {teamSSField}
          {teamJVField}
          {teamUGField}
          {teamD2Field}
        </div>
      );
    }
    const teamNameCol = teamFieldGroup != null ? 'col l9 m8 s7' : 'col s12';

    return(
      <div className="modal modal-fixed-footer" id="addTeam">
        <div className="modal-content">
          <h4>{this.getModalHeader()}</h4>
          <div className="row">
            <div className={teamNameCol}>
              <div className="input-field">
                <input type="text" id="teamName" name="teamName" maxLength={100}
                onChange={this.handleChange} value={this.state.teamName}/>
                <label htmlFor="teamName">Team Name</label>
              </div>
            </div>
            {teamFieldGroup}
          </div>
          <h5>Roster</h5>
          {rosterTable}
        </div> {/* modal content */}
        <div className="modal-footer">
          <div className="row">
            <div className="col s5 l7 qb-validation-msg">
              {errorIcon}&nbsp;{errorMessage}
            </div>
            <div className="col s7 l5">
              <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                <span className="hotkey-underline">C</span>ancel
              </button>&nbsp;
              <button accessKey={acceptStayHotKey} name="acceptAndStay" onClick={this.handleAdd}
              className={'btn blue accent-1 ' + this.disabledButton(teamIsValid)}>
                <span className="hotkey-underline">S</span>ave & New
              </button>&nbsp;
              <button accessKey={acceptHotKey} onClick={this.handleAdd}
              className={'modal-close btn green ' + this.disabledButton(teamIsValid)}>
                S<span className="hotkey-underline">a</span>ve
              </button>
            </div>
          </div>
        </div>
      </div>
    ) //return
  } //render
}; //AddTeam
