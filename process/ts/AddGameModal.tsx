/***********************************************************
AddGameModal.ts
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing games.
***********************************************************/
import * as React from 'react';
import * as $ from 'jquery';
import * as _ from 'lodash';
import * as M from 'materialize-css';
import StatUtils = require('./StatUtils');
import * as GameVal from './GameVal';
import { PlayerRow } from './PlayerRow';
import { YfGame, YfTeam, TournamentSettings, TeamGameLine, WhichTeam, GameValidation } from './YfTypes';

const CHIP_COLORS = ['yellow', 'light-green', 'orange', 'light-blue',
  'red', 'purple', 'teal', 'deep-purple', 'pink', 'green'];

interface AddGameModalProps {
  gameToLoad: YfGame;
  addOrEdit: 'add' | 'edit';
  addGame: (g: YfGame, acceptAndStay: boolean) => void;
  modifyGame: (orig: YfGame, g: YfGame, acceptAndStay: boolean) => void;
  isOpen: boolean;
  teamData: YfTeam[];
  haveTeamsPlayedInRound: (team1: string, team2: string, round: number, orig: YfGame) => [number, number];
  allPhases: string[];
  currentPhase: string;
  settings: TournamentSettings;
}

interface AddGameModalState {
  round: string;
  phases: string[];
  tuhtot: string;
  ottu: string;
  forfeit: boolean;
  tiebreaker: boolean;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  players1: TeamGameLine;
  players2: TeamGameLine;
  otPwr1: string;
  otTen1: string;
  otNeg1: string;
  otPwr2: string;
  otTen2: string;
  otNeg2: string;
  bbPts1: string;
  bbPts2: string;
  lightningPts1: string;
  lightningPts2: string;
  notes: string;
  originalGameLoaded: YfGame;
}


export class AddGameModal extends React.Component<AddGameModalProps, AddGameModalState>{

  constructor(props: AddGameModalProps) {
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

  /**
   * Lifecycle method
   */
  componentDidMount(): void {
    //don't let the Enter key submit the form
    $(document).on("keydown", "#addGame :input:not(textarea)", function(event) {
      return event.keyCode != 13;
    });
  }

  /**
   * Lifecyle method. Need an extra render when opening or closing for fields to
   * populate and clear properly
   * @param  prevProps props from previous render
   */
  componentDidUpdate(prevProps: AddGameModalProps): void {
    //populate data if the modal is being opened
    if(this.props.isOpen && !prevProps.isOpen) {
      const curPhase = this.props.currentPhase;
      // pre-populate current phase if creating a new game
      if(this.props.addOrEdit == 'add' && curPhase != 'all' && curPhase != 'Tiebreakers') {
        this.setState({
          phases: [curPhase]
        });
      }
      else if(this.props.addOrEdit == 'edit') {
        this.loadGame();
      }
      // delay this to wait for the form to load... I don't feel like tracking the additional render
      setTimeout(() => {
        //needed so that labels aren't on top of data when the edit form opens
        M.updateTextFields();
        //needed so that dropdowns show their value
        M.FormSelect.init(document.querySelectorAll('#addGame select'));
      }, 25);
    }
    // clear the form if it's being closed
    else if(!this.props.isOpen && prevProps.isOpen) {
      this.resetState();
    }
  }

  /**
   * Called anytime a value in the form changes, other than the Team or Phase
   * selectors.
   * @param  e event
   */
  handleChange(e: any): void {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    let partialState: any = {};
    partialState[name] = value;
    //get rid of or put back phases if tiebreaker status is changing
    if(name == 'tiebreaker') {
      if(value) { partialState.phases = []; }
      else if(this.props.addOrEdit == 'edit') {
        partialState.phases = this.state.originalGameLoaded.phases;
      }
      else { partialState.phases = [this.props.currentPhase]; }
    }
    // when adding overtime, automatically scroll the window so that the rest of the
    // overtime fields are in view
    if(name == 'ottu' && +this.state.ottu === 0 && +value > 0) {
      // need a timer because the fields won't exist until the next render
      setTimeout(() => {
        const modalContent = document.querySelector('.modal.open .modal-content');
        modalContent.scrollTop = modalContent.scrollHeight - modalContent.clientHeight;
      }, 100);
    }

    this.setState(partialState);
  } //handleChange

  /**
   * When a team is selected in one of the dropdowns, we need to reset the player
   * stats table
   * @param   e event
   */
  handleTeamChange(e: any): void {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    let partialState: any = {};
    const newTeamObj = this.props.teamData.find((item) => { return item.teamName == value; });
    const roster = Object.keys(newTeamObj.roster);
    //if there can't be any substitutions, autopopulate the total tossups for the round
    const defaultTuh = roster.length <= this.props.settings.playersPerTeam ? +this.state.tuhtot : 0;
    let newPlayers = {};
    for(var i in roster) {
      newPlayers[roster[i]] = {tuh: defaultTuh, powers: 0, tens: 0, negs: 0};
    }
    if(name == 'team1') { partialState.players1 = newPlayers; }
    else if(name == 'team2') { partialState.players2 = newPlayers; }
    partialState[name] = value;
    this.setState(partialState);
  }

  /**
   * Handle values in the phase select dropdown.
   * @param  e event
   */
  handlePhaseChange(e: any): void {
    const options = e.target.options;
    let newPhases = [];
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
  updatePlayer(whichTeam: WhichTeam, whichStat: string, value: number, playerName: string): void {
    if(whichTeam == 1) {
      //deep copy of team data to avoid spurious state updates. Maybe unnecessary?
      let tempTeam1 = $.extend(true, {}, this.state.players1);
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
      let tempTeam2 = $.extend(true, {}, this.state.players2);
      if(tempTeam2[playerName] == undefined) {
        tempTeam2[playerName] = {tuh: 0, powers: 0, tens: 0, negs: 0};
      }
      tempTeam2[playerName][whichStat] = value;
      this.setState({
        players2: tempTeam2
      });
    }
  } // updatePlayer

  /**
   * Once the modal has been closed, clear all the form data
   */
  resetState(): void {
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
  loadNumericField(num: number): string {
    if(num === 0) { return ''; }
    return num.toString();
  }

  /**
   * Convert the round number into a string to show in the field.
   * @param  {number} round               round number from the stored game
   * @return {string}                     string
   */
  loadRoundNumber(round: number): string {
    if(round === undefined || round === null) { return ''; }
    return round.toString();
  }

  /**
   * Populate form with the data of the game to be edited. Also keep a pointer to this
   * game so the MainInterface knows which game to modify when the form is submitted.
   */
  loadGame(): void {
    this.setState({
      round: this.loadRoundNumber(this.props.gameToLoad.round),
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
   * @return  game object
   */
  createYfGame(): YfGame {
    const forf = this.state.forfeit; //clear irrelevant data if it's a forfeit
    const ot = +this.state.ottu > 0; //clear OT data if no OT
    const score1 = this.state.score1 === '' ? null : +this.state.score1;
    const score2 = this.state.score2 === '' ? null : +this.state.score2;
    const tuhtot = this.state.tuhtot === '' ? null : +this.state.tuhtot;
    const game: YfGame = {
      validationMsg: '',
      round: this.state.round === '' ? null : +this.state.round,
      phases: this.state.phases,
      tuhtot: forf ? 0 : tuhtot,
      ottu: forf ? 0 : +this.state.ottu,
      forfeit: this.state.forfeit,
      tiebreaker: this.state.tiebreaker,
      team1: this.state.team1,
      team2: this.state.team2,
      score1: forf ? null : score1,
      score2: forf ? null : score2,
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
  handleAdd(e: any): void {
    e.preventDefault();
    if(!this.props.isOpen) { return; } //keyboard shortcut shouldn't work here
    const validationResult = this.validateGame();
    const errorLevel = validationResult.type;
    const errorMessage = validationResult.message;

    let tempItem = this.createYfGame();
    tempItem.invalid = !validationResult.isValid;
    tempItem.validationMsg = errorLevel == 'error' || errorLevel == 'warning' ? errorMessage : '';

    var acceptAndStay = e.target.name == 'acceptAndStay';
    if(this.props.addOrEdit == 'add') {
      this.props.addGame(tempItem, acceptAndStay);
    }
    else {
      this.props.modifyGame(this.state.originalGameLoaded, tempItem, acceptAndStay);
    }

    this.resetState();
  } //handleAdd

  /**
   * The value of a power, or zero if the tournament doesn't have powers
   * @return {[type]} [description]
   */
  powerValue(): number {
    if(this.props.settings.powers == '15pts') { return 15; }
    if(this.props.settings.powers == '20pts') { return 20; }
    return 0;
  }

  /**
   * JSX element containing the points per bonus
   * @param   bPts   bonuse points scored
   * @param   bHeard bonuses heard
   * @return         span containing a number or em dash
   */
  ppbDisplay(bPts: number, bHeard: number) : JSX.Element {
    return bHeard == 0 ? ( <span>&mdash;</span> ) :
      ( <span>{(bPts / bHeard).toFixed(2)} </span> );
  }

  /**
   * JSX element containing the points per bouncback
   * @param   bbPts   team's bounceback points
   * @param   bbHeard team's bouncebacks heard, in decimal form
   * @return          span with a number or an em dash
   */
  ppBbDisplay(bbPts: number, bbHeard: number): JSX.Element {
    return bbHeard <= 0 ? ( <span>&mdash;</span> ) :
      ( <span>{(bbPts / bbHeard).toFixed(2)}</span> );
  }

  /**
   * A JSX element containing the bouncebacks heard in fractional form, e.g. 4 1/3
   * @param   bbHeard tuple: [integer part, remainder]
   * @return         span element
   */
  bbHeardDisplay(bbHeard: number[]): JSX.Element {
     // negative bouncebacks can happen if user hasn't filled in all the TU data yet
    if(bbHeard[0] < 0) { return ( <span>0</span> ); }
    if(bbHeard[1] == 1) { return ( <span>{bbHeard[0]}&#8531;</span> ); } // '1/3' character
    if(bbHeard[1] == 2) { return ( <span>{bbHeard[0]}&#8532;</span> ); } // '2/3' character
    return ( <span>{bbHeard[0]}</span> );
  }

  /**
   * Title at the top left
   * @return 'New game' or 'Edit game'
   */
  getModalHeader(): string {
    return this.props.addOrEdit == 'add' ? 'New game' : 'Edit game';
  }

  /**
   * Returns the list of dropdown options
   * @return  array of option elements
   */
  getTeamOptions(): JSX.Element[] {
    let teamData = this.props.teamData;
    //alphebetize
    teamData = _.orderBy(teamData, function(item) { return item.teamName.toLowerCase(); });
    let teamOptions = teamData.map(function(item, index) {
      return ( <option key={index} value={item.teamName}>{item.teamName}</option> );
    });
    const nullOption = (<option key={-1} value="nullTeam" disabled>&nbsp;Select a team...</option>);
    teamOptions = [nullOption].concat(teamOptions);
    return teamOptions;
  }

  /**
   * Determines whether there are any issues with the game. Uses GameVal but there are
   * some things we need to handle differently here.
   * @return   GameValidation object
   */
  validateGame(): GameValidation {
    let result: GameValidation = { isValid: false };
    const team1 = this.state.team1, team2 = this.state.team2, round = this.state.round;
    //teams are required
    if(team1 == 'nullTeam' || team2 == 'nullTeam' || team1 == '' || team2 == '' ) {
      return result;
    }
    //round is required
    if(round === '' || round === null || round === undefined) {
      return result;
    }
    //two teams can't play each other twice in the same round
    const [teamAPlayed, teamBPlayed] = this.props.haveTeamsPlayedInRound(team1, team2, +round, this.state.originalGameLoaded);
    if(teamAPlayed == 3) {
      result.type = 'error';
      result.message = 'These teams already played each other in round ' + round;
      return result;
    }
    //teams can only play multiple games in the same round if they're tiebreakers
    if(teamAPlayed == 2 || (teamAPlayed && !this.state.tiebreaker)) {
      result.type = 'error';
      result.message = team1 + ' has already played a game in round ' + round;
      return result;
    }
    if(teamBPlayed == 2 || (teamBPlayed && !this.state.tiebreaker)) {
      result.type = 'error';
      result.message = team2 + ' has already played a game in round ' + round;
      return result;
    }

    return GameVal.validateGame(this.createYfGame(), this.props.settings);
  }

  /**
   * Add the disabled attribute to the submit button.
   * @param  isGameValid  whether the form can be submitted
   * @return 'disabled' or ''
   */
  disabledButton(isGameValid: boolean): string {
    return isGameValid ? '' : 'disabled';
  }

  /**
   * Add the "invalid" class to a required field if it's empty.
   * @param   item           state property corresponding to the field
   * @param  includeForfeit whether the field is required even if the game is a forfeit
   * @return                'invalid' or ''
   */
  validateField(item: keyof AddGameModalState, includeForfeit: boolean) {
    if(!this.props.isOpen || this.props.gameToLoad != null) { return ''; }
    if(this.state[item] == '' && (!this.state.forfeit || includeForfeit)) {
      return 'invalid';
    }
    return '';
  }

  /**
   * Mark the team select drop down as invalid if user hasn't
   * @param   whichTeam team 1 or 2
   * @return           class name or ''
   */
  validateTeamSelect(whichTeam: WhichTeam): string {
    if(!this.props.isOpen || this.props.gameToLoad != null) { return ''; }
    const tm = this.state['team'+whichTeam]
    return (tm == '' || tm == 'nullTeam') ? 'invalid' : '';
  }

  /**
   * Returns a JSX element containing the appropriate icon, or null if not needed
   * @param  errorLevel which icon to show
   * @return            JSX icon element
   */
  getErrorIcon(errorLevel: 'error' | 'warning' | 'info'): JSX.Element {
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

  /**
   * Whether the field to select phases should appear
   * @return         true/false
   */
  canEditPhase(): boolean {
    const allPhases = this.props.allPhases;
    if(allPhases.length == 0) { return false; }
    if(allPhases.length == 1 && allPhases[0] == 'noPhase') { return false; }
    if(this.state.tiebreaker) { return false; }
    return true;
  }

  /**
   * Chip containing the label for one of the game's phases.
   * @param   colorNo index in the list of colors. Pass -1 for gray
   * @param   phase   Name of the phase to show on the chip
   * @return          chip div element
   */
  phaseChip(colorNo: number, phase: string): JSX.Element {
    const colorName = colorNo >=0 ? CHIP_COLORS[colorNo % CHIP_COLORS.length] : 'grey';
    return (
      <div key={phase} className={'chip accent-1 ' + colorName}>
        {phase}
      </div>
    );
  }


  render() {
    const gameObj = this.createYfGame();
    const settings = this.props.settings;
    const bHeard = [StatUtils.bonusesHeard(gameObj, 1), StatUtils.bonusesHeard(gameObj, 2)];
    const bPts = [StatUtils.bonusPoints(gameObj, 1, settings), StatUtils.bonusPoints(gameObj, 2, settings)];
    const bbHrd = [StatUtils.bbHeard(gameObj, 1, settings), StatUtils.bbHeard(gameObj, 2, settings)];
    const bbHrdFloats = [StatUtils.bbHrdToFloat(bbHrd[0]), StatUtils.bbHrdToFloat(bbHrd[1])];

    const validationResult = this.validateGame();
    const gameIsValid = validationResult.isValid;
    const suppressMessage = validationResult.suppressFromForm;
    const errorMessage = suppressMessage ? '' : validationResult.message;

    const errorIcon = suppressMessage ? null : this.getErrorIcon(validationResult.type);
    const acceptHotKey = gameIsValid ? 'a' : '';
    const acceptStayHotKey = gameIsValid ? 's' : '';
    const scoreDivisor = GameVal.scoreDivisor(this.props.settings);

    //labels for every phase the game is part of
    let phaseChips = [];
    if(this.state.tiebreaker) {
      phaseChips = [this.phaseChip(-1, 'Tiebreaker')];
    }

    // multi-select dropdown to pick phases
    let phaseSelect = null;
    const canEditPhase = this.canEditPhase();

    if(canEditPhase) {
      const availablePhases = _.without(this.props.allPhases, 'noPhase');
      const phaseOptions = availablePhases.map((phase)=>{
        return ( <option key={phase} value={phase}>{phase}</option> );
      });
      phaseSelect = (
        <div className="input-field col s4">
          <select multiple id="phases" name="phases" value={this.state.phases}
          disabled={this.state.tiebreaker} onChange={this.handlePhaseChange}>
            <option value="" disabled>Phase...</option>
            {phaseOptions}
          </select>
        </div>
      );
    }

    const teamData = this.props.teamData
    let team1PlayerRows = null;
    let team2PlayerRows = null;
    const teamOptions = this.getTeamOptions();

    // create team 1's player stats grid if it's not a forfeit
    if(!this.state.forfeit && this.state.team1 != 'nullTeam' && this.state.team1 != '') {
      const team1Obj = teamData.find((item) => {
        return item.teamName == this.state.team1;
      });
      const roster = Object.keys(team1Obj.roster);

      team1PlayerRows = roster.map((item, _index) => {
        let init = null;
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
      }); //team1 roster.map
    }

    //create team 2's player stats grid if it's not a forfeit
    if(!this.state.forfeit && this.state.team2 != 'nullTeam' && this.state.team2 != '') {
      const team2Obj = teamData.find((item) => {
        return item.teamName == this.state.team2;
      });
      const roster = Object.keys(team2Obj.roster);
      team2PlayerRows = roster.map((item, _index) => {
        let init = null;
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
      }); //team2 roster.map
    }

    // header for the player stats tables
    let tableHeader: JSX.Element, powerCell: JSX.Element, negCell: JSX.Element;
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
    let overtimeRow = null;
    if(+this.state.ottu > 0 && !this.state.forfeit &&
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
    let bonusCalcRow = null;
    if(this.props.settings.bonuses) {
      bonusCalcRow = (
        <div className="row">
          <div className="col s6">
            Bonuses:&emsp;
            {bHeard[0]} heard&emsp;|&emsp;
            {bPts[0]} pts&emsp;|&emsp;
            {this.ppbDisplay(bPts[0], bHeard[0])} ppb
          </div>
          <div className="col s6">
            Bonuses:&emsp;
            {bHeard[1]} heard&emsp;|&emsp;
            {bPts[1]} pts&emsp;|&emsp;
            {this.ppbDisplay(bPts[1], bHeard[1])} ppb
          </div>
        </div>
      );
    }

    // bounceback points field, and automatically calculated bouncback conversion
    let bouncebackRow = null;
    if(this.props.settings.bonusesBounce) {
      bouncebackRow = (
        <div className="row">
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardDisplay(bbHrd[0])} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts1" type="number" name="bbPts1" step="10" min="0"
              disabled={this.state.forfeit}
              value={this.state.forfeit ? '' : this.state.bbPts1} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBbDisplay(+this.state.bbPts1, bbHrdFloats[0])} ppbb
          </div>
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardDisplay(bbHrd[1])} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts2" type="number" name="bbPts2" step="10" min="0"
              disabled={this.state.forfeit}
              value={this.state.forfeit ? '' : this.state.bbPts2} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBbDisplay(+this.state.bbPts2, bbHrdFloats[1])} ppbb
          </div>
        </div>
      );
    }

    // lightning round point entry
    let lightningRow = null;
    if(this.props.settings.lightning) {
      lightningRow = (
        <div className="row">
          <div className="col s6">
            Lightning Round:&emsp;
            <div className="input-field bounceback-entry">
              <input id="lightningPts1" type="number" name="lightningPts1" step="10" min="0"
              disabled={this.state.forfeit}
              value={this.state.forfeit ? '' : this.state.lightningPts1} onChange={this.handleChange}/>
            </div>
            pts
          </div>
          <div className="col s6">
            Lightning Round:&emsp;
            <div className="input-field bounceback-entry">
              <input id="lightningPts2" type="number" name="lightningPts2" step="10" min="0"
              disabled={this.state.forfeit}
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
                disabled={this.state.forfeit}
                type="number" name="tuhtot" min="0"
                value={this.state.forfeit ? '' : this.state.tuhtot} onChange={this.handleChange}/>
              <label htmlFor="tuhtot" className="truncate">Toss-ups (incl. OT)</label>
            </div>
          </div>

          <div className="row game-entry-2nd-row">
            <div className={"input-field col s8 m3 l4 teamsel-wrapper"}>
              <select className={'browser-default ' + this.validateTeamSelect(1)} id="tm1Name"
                name="team1" value={this.state.team1} onChange={this.handleTeamChange}>
                {teamOptions}
              </select>
            </div>
            <div className="input-field col s4 m2 l1">
              <input className={this.validateField("score1",false)} disabled={this.state.forfeit} type="number"
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
              <input className={this.validateField("score2",false)} disabled={this.state.forfeit} type="number"
              step={scoreDivisor} id="tm2Score" name="score2"
              value={this.state.forfeit ? '' : this.state.score2} onChange={this.handleChange}/>
              <label htmlFor="tm2Score">Score</label>
            </div>
            <div className={"input-field col s8 m3 l4 teamsel-wrapper"}>
              <select className={'browser-default ' + this.validateTeamSelect(2)} id="tm2Name"
                name="team2" value={this.state.team2} onChange={this.handleTeamChange}>
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
                maxLength={500} onChange={this.handleChange} value={this.state.notes} />
              <label htmlFor="gameNotes">Notes about this game</label>
            </div>
            <div className="input-field col s4 m2">
              <input id="ottu" disabled={this.state.forfeit} type="number" name="ottu" min="0"
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

        <div className={'modal-footer ' + (errorMessage && errorMessage.length > 150 ? 'scroll-footer' : '')}>
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
