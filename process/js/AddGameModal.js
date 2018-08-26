var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');
var TeamOption = require('./TeamOption');
var PlayerRow = require('./PlayerRow');
const chipColors = ['yellow', 'light-green', 'orange', 'light-blue',
  'red', 'purple', 'teal', 'deep-purple'];


class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      phases: [],
      tuhtot: '',
      ottu: '',
      forfeit: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: null,
      players2: null,
      notes: '',
      otPwr1: '', otTen1: '', otNeg1: '',
      otPwr2: '', otTen2: '', otNeg2: '',
      originalGameLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updatePlayer = this.updatePlayer.bind(this);
    this.getTeamOptions = this.getTeamOptions.bind(this);
  } //constructor

  //called any time a value in the form changes
  //this is a controlled component, so the state is the single source of truth
  handleChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  //called when a playerRow updates its state, so that this component
  //updates its state at the same time.
  updatePlayer(whichTeam, whichStat, value, playerName){
    if(whichTeam == 1) {
      //deep copy of team data to avoid spurious state updates
      var tempTeam1 = $.extend(true, {}, this.state.players1);
      if (tempTeam1[playerName] == undefined) {
        //need to initialize each attribute so we don't set
        //null values in a controlled component
        tempTeam1[playerName] = {'tuh': '', 'powers': '', 'tens': '', 'negs': ''};
      }
      tempTeam1[playerName][whichStat] = value;
      this.setState({
        players1: tempTeam1
      });
    }
    else if(whichTeam == 2) {
      //deep copy of team data to avoid spurious state updates
      var tempTeam2 = $.extend(true, {}, this.state.players2);
      if (tempTeam2[playerName] == undefined) {
        //need to initialize each attribute so we don't set
        //null values in a controlled component
        tempTeam2[playerName] = {'tuh': '', 'powers': '', 'tens': '', 'negs': ''};
      }
      tempTeam2[playerName][whichStat] = value;
      this.setState({
        players2: tempTeam2
      });
    }
  } // updatePlayer

  //once we're done with the form, erase the data from state
  resetState() {
    this.setState({
      round: '',
      phases: [],
      tuhtot: '',
      ottu: '',
      forfeit: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: null,
      players2: null,
      notes: '',
      otPwr1: '', otTen1: '', otNeg1: '',
      otPwr2: '', otTen2: '', otNeg2: '',
      originalGameLoaded: null
    });
  }

  //populate form with the existing game's data
  //Also, keep a pointer to this game so the mainInterface can remember
  //which game to modify
  loadGame() {
    //why do I have to list these out like this? Because it crashes if I do otherwise.
    //why does it crash? I have no idea.
    this.setState({
      round: this.props.gameToLoad.round,
      phases: this.props.gameToLoad.phases,
      tuhtot: this.props.gameToLoad.tuhtot,
      ottu: this.props.gameToLoad.ottu,
      forfeit: this.props.gameToLoad.forfeit,
      team1: this.props.gameToLoad.team1,
      team2: this.props.gameToLoad.team2,
      score1: this.props.gameToLoad.score1,
      score2: this.props.gameToLoad.score2,
      players1: this.props.gameToLoad.players1,
      players2: this.props.gameToLoad.players2,
      notes: this.props.gameToLoad.notes,
      otPwr1: this.props.gameToLoad.otPwr1,
      otTen1: this.props.gameToLoad.otTen1,
      otNeg1: this.props.gameToLoad.otNeg1,
      otPwr2: this.props.gameToLoad.otPwr2,
      otTen2: this.props.gameToLoad.otTen2,
      otNeg2: this.props.gameToLoad.otNeg2,
      originalGameLoaded: this.props.gameToLoad
    });
  }

  //called when the form is submitted. Tell the mainInterface to create
  //a new game or modify an existing one as appropriate
  handleAdd(e) {
    e.preventDefault();
    if(!this.props.isOpen) { return; } //keyboard shortcut shouldn't work here
    var f = this.state.forfeit; //clear irrelevant data if it's a forfeit
    var ot = this.state.ottu > 0; //clear OT data if no OT
    var tempItem = {
      round: this.state.round,
      phases: this.props.addOrEdit == 'edit' ? this.state.phases : [this.props.currentPhase],
      tuhtot: f ? '' : this.state.tuhtot,
      ottu: f ? '' : this.state.ottu,
      forfeit: this.state.forfeit,
      team1: this.state.team1,
      team2: this.state.team2,
      score1: f ? '' : this.state.score1,
      score2: f ? '' : this.state.score2,
      players1: f ? null : this.state.players1,
      players2: f ? null : this.state.players2,
      otPwr1: f || !ot ? '' : this.state.otPwr1,
      otTen1: f || !ot ? '' : this.state.otTen1,
      otNeg1: f || !ot ? '' : this.state.otNeg1,
      otPwr2: f || !ot ? '' : this.state.otPwr2,
      otTen2: f || !ot ? '' : this.state.otTen2,
      otNeg2: f || !ot ? '' : this.state.otNeg2,
      notes: this.state.notes
    } //tempitems

    if(this.props.addOrEdit == 'add') {
      this.props.addGame(tempItem);
    }
    else {
      this.props.modifyGame(this.state.originalGameLoaded, tempItem);
    }

    this.resetState();
  } //handleAdd

  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
    if(this.props.forceReset) {
      this.resetState();
      //seting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
    if(this.props.gameToLoad != null) {
      this.loadGame();
      //setting mainInterface's editWhichGame to null will avoid infinite loop
      this.props.onLoadGameInModal();
    }
  }

  //convert string to number but without NaN
  toNum(str) {
    return isNaN(+str) ? 0 : +str;
  }

  //calculate bonuses heard. returns a number
  bHeard(whichTeam) {
    var tot=0;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    for(var p in players) {
      tot += toNum(players[p].powers) + toNum(players[p].tens);
    }
    if(toNum(this.state.ottu) > 0) {
      var otPwr = whichTeam == 1 ? this.state.otPwr1 : this.state.otPwr2;
      var otTen = whichTeam == 1 ? this.state.otTen1 : this.state.otTen2;
      tot -= this.toNum(otPwr); //subtract TUs converted in overtime
      tot -= this.toNum(otTen);
    }
    return tot;
  }

  //calculate total bonus points. returns a number
  bPts(whichTeam) {
    var tuPts=0, pwr, gt, ng;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    var totScore = whichTeam == 1 ? this.state.score1 : this.state.score2;
    for(var p in players) {
      tuPts += 15*this.toNum(players[p].powers) +
        10*this.toNum(players[p].tens) - 5*this.toNum(players[p].negs);
    }
    return totScore - tuPts;
  }

  // returns ppb rounded to two decimal places,
  // or an em-dash if no bonuses heard
  ppb(whichTeam) {
    var bHeard = this.bHeard(whichTeam);
    return bHeard == 0 ? (<span>&mdash;</span>) : (this.bPts(whichTeam)/bHeard).toFixed(2);
  }

  //title at the top left
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New game' : 'Edit game';
  }

  //for the green button at the bottom
  getSubmitWord() {
    return this.props.addOrEdit == 'add' ? 'Add ' : 'Save ';
  }

  //returns an array of length 2. 1st element is the correctly ordered list of options for
  //the team1 field. 2nd element likewise for team 2.
  //I'm programmatically putting the selected team at the top upon opening a game,
  //because I can't otherwise get it to automatically show as the selected option
  getTeamOptions() {
    var teamData = this.props.teamData;
    teamData = _.orderBy(teamData, function(item) { return item.teamName.toLowerCase(); });
    if(this.props.addOrEdit == 'add') {
      var teamOptions = teamData.map(function(item, index) {
        return(<TeamOption key={index} teamName={teamData[index].teamName}/>);
      });
      var nullOption = (<option key={-1} value="nullTeam" disabled>Select a team...</option>);
      teamOptions = [nullOption].concat(teamOptions);
      return [teamOptions, teamOptions];
    }
    if(this.props.addOrEdit == 'edit') {
      //need to look at gameToLoad because state won't be populated with game data
      //until the next render. Need to look at originalGameLoaded for subsequent
      //renders, because gameToLoad will be null.
      var gameToLoad = this.props.gameToLoad;
      var orig = this.state.originalGameLoaded;
      var team1Name, team2Name;
      if(gameToLoad != null) {
        team1Name = gameToLoad.team1;
        team2Name = gameToLoad.team2;
      }
      else if(orig != null) {
        team1Name = orig.team1;
        team2Name = orig.team2;
      }
      // if gameToLoad and originalGameLoaded are both null or undefined,
      //it means that the modal is closed, so we don't care about any of this.
      else {
        return [null,null];
      }
      //get team1 options
      var team1Others = _.without(teamData, _.find(teamData, function(o) {
        return o.teamName == team1Name;
      }.bind(this)));
      var team1Options = team1Others.map(function(item, index) {
        return(<TeamOption key={index} teamName={team1Others[index].teamName}/>);
      });
      var defaultOption1 = (<TeamOption key={-1} teamName={team1Name}/>);
      team1Options = [defaultOption1].concat(team1Options);
      // do the same for team2
      var team2Others = _.without(teamData, _.find(teamData, function(o) {
        return o.teamName == team2Name;
      }.bind(this)));
      var team2Options = team2Others.map(function(item, index) {
        return(<TeamOption key={index} teamName={team2Others[index].teamName}/>);
      });
      var defaultOption2 = (<TeamOption key={-1} teamName={team2Name}/>);
      team2Options = [defaultOption2].concat(team2Options);

      return [team1Options, team2Options];
    }
  }

  //whether there are any issues with the game, and if so, how severe and
  //what the error message should be
  validateGame() {
    var team1 = this.state.team1, team2 = this.state.team2;
    var round = this.state.round, tuhtot = this.state.tuhtot;
    var score1 = this.state.score1, score2 = this.state.score2;
    var players1 = this.state.players1, players2 = this.state.players2;

    if(team1 == 'nullTeam' || team2 == 'nullTeam' || team1 == '' || team2 == '' ) {
      return [false, '', ''];
    } //teams are required
    if(team1 == team2) {
      return [false, 'error', team1 + ' cannot play themselves'];
    } // a team can't play itself
    if(round == '') {
      return [false, '', ''];
    } //round is required
    //no team can play more than one game in a particular round
    var team1AlreadyPlayed = this.props.hasTeamPlayedInRound(team1, round, this.state.originalGameLoaded);
    var team2AlreadyPlayed = this.props.hasTeamPlayedInRound(team2, round, this.state.originalGameLoaded);
    if(team1AlreadyPlayed) {
      if(team2AlreadyPlayed) {
        return [false, 'error', 'Both teams have already played a game in round ' + round];
      }
      return [false, 'error', team1 + ' has already played a game in round ' + round];
    }
    if(team2AlreadyPlayed) {
      return [false, 'error', team2 + ' has already played a game in round ' + round];
    }

    if(this.state.forfeit) {
      return [true, 'info', team1 + ' defeats ' + team2 + ' by forfeit'];
    } //team names and round are the only required info for a forfeit
    if(tuhtot == '' || this.toNum(tuhtot) <= 0 || score1 == '' || score2 == '') {
      return [false, '', ''];
    } //total tuh and total scores are required.

    //no players can have more tossups heard than were read in the match,
    //and neither team can have no players who have heard tossups
    var anyPlayerTuHeard = false;
    for(var p in players1) {
      if(players1[p].tuh > tuhtot) {
        return [false, 'error', 'One or more players have heard more than ' + tuhtot + ' tossups'];
      }
      if(players1[p].tuh > 0) { anyPlayerTuHeard = true; }
    }
    if(!anyPlayerTuHeard) {
      return [false, 'error', 'No players for ' + team1 + ' have heard any tossups'];
    }
    //likewise for team 2
    anyPlayerTuHeard = false;
    for(var p in players2) {
      if(players2[p].tuh > tuhtot) {
        return [false, 'error', 'One or more players have heard more than ' + tuhtot + ' tossups'];
      }
      if(players2[p].tuh > 0) { anyPlayerTuHeard = true; }
    }
    if(!anyPlayerTuHeard) {
      return [false, 'error', 'No players for ' + team2 + ' have heard any tossups'];
    }

    //PPB can't be over 30 (includes having bonus points but no bonuses heawrd)
    if(this.ppb(1) > 30 || (this.bPts(1) > 0 && this.bHeard(1) == 0)) {
      return [false, 'error', team1 + ' has over 30 ppb'];
    }
    if(this.ppb(2) > 30 || (this.bPts(2) > 0 && this.bHeard(2) == 0)) {
      return [false, 'error', team2 + ' has over 30 ppb'];
    }

    //both teams combined can't convert more tossups than have been read
    if(this.bHeard(1) + this.bHeard(2) >  tuhtot) {
      return [false, 'error', 'Total tossups converted exceeds tossups heard'];
    }

    //warn if score isn't divisible by 5
    if(score1 % 5 != 0 || score2 % 5 != 0) {
      return [true, 'warning', 'Score is not divisible by 5'];
    }

    //bonus points shouldn't end in 5
    if(this.bPts(1) % 10 != 0 || this.bPts(2) % 10 != 0) {
      return [true, 'warning', 'Bonus points are not divisible by 10'];
    }

    //if the game has from [1,9] total tossups, that's probably wrong
    //(this warning is very unlikely to actually be seen)
    if(tuhtot > 0 && tuhtot < 10) {
      return [true, 'warning', 'Total tossups of ' + tuhtot + ' may be incorrect'];
    }

    //warn if the score is a tie
    if(score1 == score2) {
      return [true, 'warning', 'This game is a tie'];
    }

    return [true, '', ''];
  }//validateGame

  //add the disabled attribute to the submit button
  disabledButton(isGameValid) {
    return isGameValid ? '' : 'disabled';
  }

  //returns a jsx element containing the appropriate icon (or null if no error)
  getErrorIcon(errorLevel) {
    if(errorLevel == '') { return null; }
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
    if(errorLevel == 'info') {
      return ( <i className="material-icons blue-text text-darken-4 qb-modal-error">info</i> );
    }
  }

  phaseChip(colorNo, phase) {
    return (
      <div key={phase} className={'chip accent-1 ' + chipColors[colorNo % chipColors.length]}>
        {phase}
      </div>
    );
  }

  render() {
    var [gameIsValid, errorLevel, errorMessage] = this.validateGame();
    var errorIcon = this.getErrorIcon(errorLevel);
    var acceptHotKey = gameIsValid ? 'a' : '';

    var phaseChips = [];
    for(var i in this.props.allPhases) {
      if((this.props.addOrEdit == 'add' && this.props.currentPhase == this.props.allPhases[i]) ||
        (this.props.addOrEdit == 'edit' && this.state.phases.includes(this.props.allPhases[i]))) {
        phaseChips.push(this.phaseChip(i, this.props.allPhases[i]));
      }
    }


    $(document).on("keypress", "#addGame :input:not(textarea)", function(event) {
      // return gameIsValid || event.keyCode != 13;
      return event.keyCode != 13;
    });

    var teamData = this.props.teamData
    var team1PlayerRows = null;
    var team2PlayerRows = null;
    var [team1Options, team2Options] = this.getTeamOptions();

    if(!this.state.forfeit && this.state.team1 != 'nullTeam' && this.state.team1 != '') {
      var team1Obj = teamData.find(function(item){
        return item.teamName == this.state.team1
      }.bind(this));
      team1PlayerRows = team1Obj.roster.map(function(item, index){
        var init = this.state.players1 != null ? this.state.players1[item] : null;
        return(
          <PlayerRow key={team1Obj.teamName + item}
            playerName={item}
            whichTeam={1}
            initialData={init}
            updatePlayer={this.updatePlayer}
          />
        )
      }.bind(this));
    }

    if(!this.state.forfeit && this.state.team2 != 'nullTeam' && this.state.team2 != '') {
      var team2Obj = teamData.find(function(item){
        return item.teamName == this.state.team2
      }.bind(this));
      team2PlayerRows = team2Obj.roster.map(function(item, index){
        var init = this.state.players2 != null ? this.state.players2[item] : null;
        return(
          <PlayerRow key={team2Obj.teamName + item}
            playerName={item}
            whichTeam={2}
            initialData={init}
            updatePlayer={this.updatePlayer}
          />
        )
      }.bind(this));
    }

    var overtimeRow = null;
    if(this.state.ottu > 0 && !this.state.forfeit &&
      this.state.team1 != 'nullTeam' && this.state.team2 != 'nullTeam') {
      overtimeRow = (
        <div className="row game-entry-bottom-row">
          <div className="col s3 m2">
            <h6>Overtime TU:</h6>
          </div>
          <div className="col s3 m2 ot-stat-label">
            <span className="">{this.state.team1 + ':'}</span>
          </div>
          <div className="input-field col s2 m1">
            <input id="otPwr1" type="number" name="otPwr1"
              value={this.state.otPwr1} onChange={this.handleChange}/>
            <label htmlFor="otPwr1">{'15'}</label>
          </div>
          <div className="input-field col s2 m1">
            <input id="otTen1" type="number" name="otTen1"
              value={this.state.otTen1} onChange={this.handleChange}/>
            <label htmlFor="otTen1">{'10'}</label>
          </div>
          <div className="input-field col s2 m1">
            <input id="otNeg1" type="number" name="otNeg1"
              value={this.state.otNeg1} onChange={this.handleChange}/>
            <label htmlFor="otNeg1">{'-5'}</label>
          </div>

          <div className="col s6 m2 ot-stat-label">
            <span className="">{this.state.team2 + ':'}</span>
          </div>
          <div className="input-field col s2 m1">
            <input id="otPwr2" type="number" name="otPwr2"
              value={this.state.otPwr2} onChange={this.handleChange}/>
            <label htmlFor="otPwr2">{'15'}</label>
          </div>
          <div className="input-field col s2 m1">
            <input id="otTen2" type="number" name="otTen2"
              value={this.state.otTen2} onChange={this.handleChange}/>
            <label htmlFor="otTen2">{'10'}</label>
          </div>
          <div className="input-field col s2 m1">
            <input id="otNeg2" type="number" name="otNeg2"
              value={this.state.otNeg2} onChange={this.handleChange}/>
            <label htmlFor="otNeg2">{'-5'}</label>
          </div>
        </div>
      ); //overtimeRow
    } // if overtime

    return(
      <div className="modal modal-fixed-footer" id="addGame">
        <form onSubmit={this.handleAdd}>
          <div className="modal-content">

            <div className="row game-entry-top-row">
              <div className="col s6">
                <h4>{this.getModalHeader()}</h4>
                {phaseChips}
              </div>
            {/*  <div className="col s3">
                {phaseChips}
              </div> */}
              <div className="input-field col s3">
                <input id="round" type="number" name="round" value={this.state.round} onChange={this.handleChange}/>
                <label htmlFor="round">Round No.</label>
              </div>
              <div className="input-field col s3">
                <input id="tuhtot" disabled={this.state.forfeit ? 'disabled' : ''}
                  type="number" name="tuhtot"
                  value={this.state.forfeit ? '' : this.state.tuhtot} onChange={this.handleChange}/>
                <label htmlFor="tuhtot">Toss-ups</label>
              </div>
            </div>

            <div className="row game-entry-2nd-row">
              <div className="input-field col s8 m3 l4">
                <select id="tm1Name" name="team1" value={this.state.team1} onChange={this.handleChange}>
                  {team1Options}
                </select>
              </div>
              <div className="input-field col s4 m2 l1">
                <input disabled={this.state.forfeit ? 'disabled' : ''} type="number" step="5" id="tm1Score" name="score1"
                  value={this.state.forfeit ? '' : this.state.score1} onChange={this.handleChange}/>
                <label htmlFor="tm1Score">Score</label>
              </div>
              <div className="col m2 hide-on-small-only">
                <div className="match-divider">
                  &mdash;
                </div>
              </div>
              <div className="input-field col s4 m2 l1">
                <input disabled={this.state.forfeit ? 'disabled' : ''} type="number" step="5" id="tm2Score" name="score2"
                  value={this.state.forfeit ? '' : this.state.score2} onChange={this.handleChange}/>
                <label htmlFor="tm2Score">Score</label>
              </div>
              <div className="input-field col s8 m3 l4">
                <select id="tm2Name" name="team2" value={this.state.team2} onChange={this.handleChange}>
                  {team2Options}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col s12 m6">
                <table className="striped player-table">
                  <thead>
                    <tr>
                      <th/>
                      <th>TUH</th>
                      <th>15</th>
                      <th>10</th>
                      <th>-5</th>
                      <th>Tot.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team1PlayerRows}
                  </tbody>
                </table>
              </div>
              <div className="col s12 m6">
                <table className="striped player-table">
                  <thead>
                    <tr>
                      <th/>
                      <th>TUH</th>
                      <th>15</th>
                      <th>10</th>
                      <th>-5</th>
                      <th>Tot.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team2PlayerRows}
                  </tbody>
                </table>
              </div>

            </div>

            <div className="row">
              <div className="col s6">
                Bonuses:&emsp;{this.bHeard(1)} heard&emsp;|&emsp;{this.bPts(1)} pts&emsp;|&emsp;{this.ppb(1)} ppb
              </div>
              <div className="col s6">
                Bonuses:&emsp;{this.bHeard(2)} heard&emsp;|&emsp;{this.bPts(2)} pts&emsp;|&emsp;{this.ppb(2)} ppb
              </div>
            </div>

            <div className="row game-entry-bottom-row">
              <div className="input-field col s6 m8">
                <textarea className="materialize-textarea" id="gameNotes" name="notes" onChange={this.handleChange} value={this.state.notes} />
                <label htmlFor="gameNotes">Notes about this game</label>
              </div>
              <div className="input-field col s3 m2">
                <input id="ottu" disabled={this.state.forfeit ? 'disabled' : ''} type="number" name="ottu"
                value={this.state.forfeit ? '' : this.state.ottu} onChange={this.handleChange}/>
                <label htmlFor="ottu">Overtime TU</label>
              </div>
              <div className="col s3 m2 forfeit-ctrl">
                <label>
                  <input type="checkbox" name="forfeit" checked={this.state.forfeit} onChange={this.handleChange}/>
                  <span>Forfeit?</span>
                </label>
              </div>
            </div>

            {overtimeRow}
          </div> {/* modal-content*/}

          <div className="modal-footer">
            <div className="row">
              <div className="col s5 l8 qb-validation-msg">
                {errorIcon}&nbsp;{errorMessage}
              </div>
              <div className="col s7 l4">
                <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                  <span className="hotkey-underline">C</span>ancel
                </button>&nbsp;
                <button type="submit" accessKey={acceptHotKey}
                className={'modal-close btn green ' + this.disabledButton(gameIsValid)}>
                  {this.getSubmitWord()} G<span className="hotkey-underline">a</span>me
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    ) //return
  } //render
}; //AddGame

module.exports=AddGameModal;
