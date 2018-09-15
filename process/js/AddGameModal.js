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
      bbPts1: '',
      bbPts2: '',
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
      bbPts1: '',
      bbPts2: '',
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
      bbPts1: this.props.gameToLoad.bbPts1,
      bbPts2: this.props.gameToLoad.bbPts2,
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
      bbPts1: f ? '' : this.state.bbPts1,
      bbPts2: f ? '' : this.state.bbPts2,
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

  //the greatest integer guaranteed to divide a game score evenly
  scoreDivisor() {
    if(this.props.settings.powers == '15pts' || this.props.settings.negs == 'yes') {
      return 5;
    }
    return 10;
  }

  powerValue() {
    if(this.props.settings.powers == '15pts') { return 15; }
    if(this.props.settings.powers == '20pts') { return 20; }
    return 0;
  }

  //calculate bonuses heard. returns a number
  bHeard(whichTeam) {
    var tot=0;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    for(var p in players) {
      tot += this.toNum(players[p].powers) + this.toNum(players[p].tens);
    }
    if(this.toNum(this.state.ottu) > 0) {
      var otPwr = whichTeam == 1 ? this.state.otPwr1 : this.state.otPwr2;
      var otTen = whichTeam == 1 ? this.state.otTen1 : this.state.otTen2;
      tot -= this.toNum(otPwr); //subtract TUs converted in overtime
      tot -= this.toNum(otTen);
    }
    return tot;
  }

  //calculate total bonus points. returns a number
  bPts(whichTeam) {
    var tuPts=0;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    var totScore = whichTeam == 1 ? this.state.score1 : this.state.score2;
    var bbPts = whichTeam == 1 ? this.state.bbPts1 : this.state.bbPts2;
    for(var p in players) {
      tuPts += this.powerValue()*this.toNum(players[p].powers) +
        10*this.toNum(players[p].tens) - 5*this.toNum(players[p].negs);
    }
    return totScore - tuPts - bbPts;
  }

  // returns ppb rounded to two decimal places,
  // or an em-dash if no bonuses heard
  ppb(whichTeam) {
    var bHeard = this.bHeard(whichTeam);
    return bHeard == 0 ? (<span>&mdash;</span>) : (this.bPts(whichTeam)/bHeard).toFixed(2);
  }

  //how many (30-point bonuses' worth of) bouncebacks a team heard
  bbHeard(whichTeam) {
    var otherTeam = whichTeam == 1 ? 2 : 1;
    return (this.bHeard(otherTeam)*30 - this.bPts(otherTeam)) / 30;
  }

  //points per every three bounceback questions heard
  ppBb(whichTeam) {
    var bbPts = whichTeam == 1 ? this.state.bbPts1 : this.state.bbPts2;
    var bbHeard = this.bbHeard(whichTeam);
    return bbHeard <= 0 ? (<span>&mdash;</span>) : (bbPts / bbHeard).toFixed(2);
  }

  //rounds down to the nearest integer, or returns 0 if negative
  bbHeardInteger(whichTeam) {
    var raw = this.bbHeard(whichTeam);
    return raw <= 0 ? 0 : Math.trunc(raw);
  }

  //returns a JSX element representing the fraction 1/3 or 2/3, or null.
  //bouncebacks heard come in thirds-of-a-bonus;
  //this is more elegant than displaying .33 and .67 is
  bbHeardFraction(whichTeam) {
    var otherTeam = whichTeam == 1 ? 2 : 1;
    var remainder = ((this.bHeard(otherTeam)*30 - this.bPts(otherTeam))/10) % 3;
    if(remainder == 1) { return ( <span>&#8531;</span> ); }
    if(remainder == 2) { return ( <span>&#8532;</span> ); }
    return null;
  }

  //points per bounceback is invalid if
  //-- it's a number greater than 30
  //-- there are bounceback points scored but 0 bouncebacks heard
  invalidPpbb(whichTeam) {
    var ppbb = whichTeam == 1 ? this.ppBb(1) : this.ppBb(2);
    if(ppbb > 30) { return true; }
    var bbPts = whichTeam == 1 ? +this.state.bbPts1 : +this.state.bbPts2;
    return isNaN(ppbb) && bbPts > 0;
  }

  //how many points the team scored on overtime tossups
  otPoints(whichTeam) {
    if(toNum(this.state.ottu) <= 0) { return 0; }
    var otPwr = whichTeam == 1 ? this.state.otPwr1 : this.state.otPwr2;
    var otTen = whichTeam == 1 ? this.state.otTen1 : this.state.otTen2;
    var otNeg = whichTeam == 1 ? this.state.otNeg1 : this.state.otNeg2;
    var totScore = whichTeam == 1 ? this.state.score1 : this.state.score2;
    return this.powerValue()*otPwr + 10*otTen - 5*otNeg;
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
    var round = this.state.round, tuhtot = this.toNum(this.state.tuhtot);
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
    if(tuhtot <= 0 || score1 == '' || score2 == '') {
      return [false, '', ''];
    } //total tuh and total scores are required.

    //no player can have more tossups heard than were read in the match,
    //and no player can answer more tossups than he's heard
    //A team's players cannot have heard more tossups collectively than the
    //total tossups for the game, times the number of players per team
    var playerTuhSums = [0,0];
    for(var p in players1) {
      if(this.toNum(players1[p].tuh) > tuhtot) {
        return [false, 'error', 'One or more players have heard more than ' + tuhtot + ' tossups'];
      }
      var tuAnswered = this.toNum(players1[p].powers) + this.toNum(players1[p].tens) + this.toNum(players1[p].negs);
      if(this.toNum(players1[p].tuh) < tuAnswered) {
        return [false, 'error', p + ' has more tossups answered than tossups heard']
      }
      playerTuhSums[0] += this.toNum(players1[p].tuh);
    }

    //likewise for team 2
    for(var p in players2) {
      if(this.toNum(players2[p].tuh) > tuhtot) {
        return [false, 'error', 'One or more players have heard more than ' + tuhtot + ' tossups'];
      }
      var tuAnswered = this.toNum(players2[p].powers) + this.toNum(players2[p].tens) + this.toNum(players2[p].negs);
      if(this.toNum(players2[p].tuh) < tuAnswered) {
        return [false, 'error', p + ' has more tossups answered than tossups heard']
      }
      playerTuhSums[1] += this.toNum(players2[p].tuh);
    }

    var idealCollectiveTuh = tuhtot * this.props.settings.playersPerTeam;
    if(idealCollectiveTuh > 0 && playerTuhSums[0] > idealCollectiveTuh) {
      return [false, 'error', team1 + '\'s players have heard more than ' + idealCollectiveTuh + ' tossups'];
    }
    if(idealCollectiveTuh > 0 && playerTuhSums[1] > idealCollectiveTuh) {
      return [false, 'error', team2 + '\'s players have heard more than ' + idealCollectiveTuh + ' tossups'];
    }

    //if it's a tossup only format, sum of tossup points must equal total score
    if(this.props.settings.bonuses == 'none') {
      if(this.bPts(1) != 0) {
        return [false, 'error', team1 + '\'s tossup points and total score do not match'];
      }
      if(this.bPts(2) != 0) {
        return [false, 'error', team2 + '\'s tossup points and total score do not match'];
      }
    }

    //PPB can't be over 30 (includes having bonus points but no bonuses heawrd)
    //exception is if there are no bonus points to account for
    if((isNaN(this.ppb(1)) && this.bPts(1) > 0) || this.ppb(1) > 30) {
      return [false, 'error', team1 + ' has over 30 ppb'];
    }
    if((isNaN(this.ppb(2)) && this.bPts(2) > 0) || this.ppb(2) > 30) {
      return [false, 'error', team2 + ' has over 30 ppb'];
    }

    //both teams combined can't convert more tossups than have been read
    if(this.bHeard(1) + this.bHeard(2) >  tuhtot) {
      return [false, 'error', 'Total tossups converted exceeds tossups heard'];
    }

    if(this.bPts(1) < 0 || this.bPts(2) < 0) {
      return [false, 'error', 'Bonus points cannot be negative'];
    }

    //can't have over 30 ppbb
    if(this.props.settings.bonuses == 'yesBb' && this.invalidPpbb(1)) {
      return [false, 'error', team1 + ' has over 30 ppbb'];
    }
    if(this.props.settings.bonuses == 'yesBb' && this.invalidPpbb(2)) {
      return [false, 'error', team2 + ' has over 30 ppbb'];
    }

    //warn if score isn't divisible by 5
    var divisor = this.scoreDivisor();
    if(score1 % divisor != 0 || score2 % divisor != 0) {
      return [true, 'warning', 'Score is not divisible by ' + divisor];
    }

    //bonus points shouldn't end in 5
    if(this.bPts(1) % 10 != 0 || this.bPts(2) % 10 != 0) {
      return [true, 'warning', 'Bonus points are not divisible by 10'];
    }

    //there shouldn't be empty chairs if your team had enough players to fill them
    if(playerTuhSums[0] < idealCollectiveTuh &&
      Object.keys(players1).length >= this.props.settings.playersPerTeam) {
      return [true, 'warning', team1 + '\'s players have heard fewer than ' + idealCollectiveTuh + ' tossups'];
    }
    if(playerTuhSums[1] < idealCollectiveTuh &&
      Object.keys(players2).length >= this.props.settings.playersPerTeam) {
      return [true, 'warning', team2 + '\'s players have heard fewer than ' + idealCollectiveTuh + ' tossups'];
    }

    if(this.toNum(this.state.ottu) > 0 && score1 - this.otPoints(1) != score2 - this.otPoints(2)) {
      return [true, 'warning', 'Game went to overtime but score was not tied at the ' +
        'end of regulation based on each team\'s points scored in overtime'];
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

    //don't let the Enter key submit the form
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
            settings={this.props.settings}
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
            settings={this.props.settings}
          />
        )
      }.bind(this));
    }

    var tableHeader, powerCell, negCell;
    if(this.props.settings.powers != 'none') {
      powerCell = ( <th>{this.powerValue()}</th> );
    }
    else { powerCell = null; }
    if(this.props.settings.negs == 'yes') { negCell = ( <th>-5</th> ); }
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
      if(this.props.settings.negs == 'yes') {
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

    var bonusCalcRow = null;
    if(this.props.settings.bonuses != 'none') {
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

    var bouncebackRow = null;
    if(this.props.settings.bonuses == 'yesBb') {
      bouncebackRow = (
        <div className="row">
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardInteger(1)}{this.bbHeardFraction(1)} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts1" type="number" name="bbPts1" step="10" min="0"
              value={this.state.bbPts1} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBb(1)} ppbb
          </div>
          <div className="col s6">
            Bouncebacks:&emsp;{this.bbHeardInteger(2)}{this.bbHeardFraction(2)} heard&emsp;|
            &emsp;
            <div className="input-field bounceback-entry">
              <input id="bbPts2" type="number" name="bbPts2" step="10" min="0"
              value={this.state.bbPts2} onChange={this.handleChange}/>
            </div>
            pts&emsp;|
            &emsp;{this.ppBb(2)} ppbb
          </div>
        </div>
      );
    }

    return(
      <div className="modal modal-fixed-footer" id="addGame">
        <form onSubmit={this.handleAdd}>
          <div className="modal-content">

            <div className="row game-entry-top-row">
              <div className="col s6">
                <h4>{this.getModalHeader()}</h4>
                {phaseChips}
              </div>

              <div className="input-field col s3">
                <input id="round" type="number" name="round" value={this.state.round} onChange={this.handleChange}/>
                <label htmlFor="round">Round No.</label>
              </div>
              <div className="input-field col s3">
                <input id="tuhtot" disabled={this.state.forfeit ? 'disabled' : ''}
                  type="number" name="tuhtot" min="0"
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
                <input disabled={this.state.forfeit ? 'disabled' : ''} type="number"
                step={this.scoreDivisor()} id="tm1Score" name="score1"
                value={this.state.forfeit ? '' : this.state.score1} onChange={this.handleChange}/>
                <label htmlFor="tm1Score">Score</label>
              </div>
              <div className="col m2 hide-on-small-only">
                <div className="match-divider">
                  &mdash;
                </div>
              </div>
              <div className="input-field col s4 m2 l1">
                <input disabled={this.state.forfeit ? 'disabled' : ''} type="number"
                step={this.scoreDivisor()} id="tm2Score" name="score2"
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

            <div className="row game-entry-bottom-row">
              <div className="input-field col s6 m8">
                <textarea className="materialize-textarea" id="gameNotes" name="notes" onChange={this.handleChange} value={this.state.notes} />
                <label htmlFor="gameNotes">Notes about this game</label>
              </div>
              <div className="input-field col s3 m2">
                <input id="ottu" disabled={this.state.forfeit ? 'disabled' : ''} type="number" name="ottu" min="0"
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
              <div className="col s7 l8 qb-validation-msg">
                {errorIcon}&nbsp;{errorMessage}
              </div>
              <div className="col s5 l4">
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
