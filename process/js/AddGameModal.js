var React = require('react');
var _ = require('lodash');
var M = require('materialize-css');
var TeamOption = require('./TeamOption');
var PlayerRow = require('./PlayerRow');


class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      tuhtot: '',
      ottu: '',
      forfeit: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: '',
      originalGameLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updatePlayer = this.updatePlayer.bind(this);
    this.getTeamOptions = this.getTeamOptions.bind(this);
  } //constructor

  handleChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  updatePlayer(whichTeam, index, whichStat, value, playerName){
    var tempAry = [];
    if(whichTeam == 1) {
      tempAry = this.state.players1.slice();
      if (tempAry[index] == undefined) {
        //need to initialize each attribute so we don't set
        //null values in a controlled component
        tempAry[index] = {'name': playerName, 'tuh': '', 'powers': '', 'gets': '', 'negs': ''};
      }
      tempAry[index][whichStat] = value;
      this.setState({
        players1: tempAry
      });
    }
    else if(whichTeam == 2) {
      tempAry = this.state.players2.slice();
      if (tempAry[index] == undefined) {
        //need to initialize each attribute so we don't set
        //null values in a controlled component
        tempAry[index] = {'name': playerName, 'tuh': '', 'powers': '', 'gets': '', 'negs': ''};
      }
      tempAry[index][whichStat] = value;
      this.setState({
        players2: tempAry
      });
    }
  } // updatePlayer

  resetState() {
    this.setState({
      round: '',
      tuhtot: '',
      ottu: '',
      forfeit: false,
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: '',
      originalGameLoaded: null
    });
  }

  loadGame() {
    //why do I have to list these out like this? Because it crashes if I do otherwise.
    //why does it crash? I have no idea.
    this.setState({
      round: this.props.gameToLoad.round,
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
      originalGameLoaded: this.props.gameToLoad
    });
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      round: this.state.round,
      tuhtot: this.state.tuhtot,
      ottu: this.state.ottu,
      forfeit: this.state.forfeit,
      team1: this.state.team1,
      team2: this.state.team2,
      score1: this.state.score1,
      score2: this.state.score2,
      players1: this.state.players1,
      players2: this.state.players2,
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

  bHeard(whichTeam) {
    var tot=0, pwr, gt;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    for(var p in players) {
      pwr = parseFloat(players[p]["powers"]);
      gt = parseFloat(players[p]["gets"]);
      tot = isNaN(pwr) ? tot : tot+pwr;
      tot = isNaN(gt) ? tot : tot+gt;
    }
    return tot;
  }

  bPts(whichTeam) {
    var tuPts=0, pwr, gt, ng;
    var players = whichTeam == 1 ? this.state.players1 : this.state.players2;
    var totScore = whichTeam == 1 ? this.state.score1 : this.state.score2;
    for(var p in players) {
      pwr = parseFloat(players[p]["powers"]);
      gt = parseFloat(players[p]["gets"]);
      ng = parseFloat(players[p]["negs"]);
      tuPts = isNaN(pwr) ? tuPts : tuPts+(15*pwr);
      tuPts = isNaN(gt) ? tuPts : tuPts+(10*gt);
      tuPts = isNaN(ng) ? tuPts : tuPts-(5*ng)
    }
    return totScore-tuPts;
  }

  // returns ppb rounded to two decimal places,
  // or an em-dash if no bonuses heard
  ppb(whichTeam) {
    var bHeard = this.bHeard(whichTeam);
    return bHeard == 0 ? (<span>&mdash;</span>) : (this.bPts(whichTeam)/bHeard).toFixed(2);
  }

  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New game' : 'Edit game';
  }

  getSubmitCaption() {
    return this.props.addOrEdit == 'add' ? 'Add game' : 'Save game';
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

  render() {
    var teamData = this.props.teamData
    var team1PlayerRows = null;
    var team2PlayerRows = null;
    var [team1Options, team2Options] = this.getTeamOptions();

    if(this.state.team1 != 'nullTeam' && this.state.team1 != '') {
      var team1Obj = teamData.find(function(item){
        return item.teamName == this.state.team1
      }.bind(this));
      var players1Copy = this.state.players1.slice();
      team1PlayerRows = team1Obj.roster.map(function(item, index){
        return(
          <PlayerRow key={team1Obj.teamName + index}
            rowNo={index}
            playerName={item}
            whichTeam={1}
            initialData={players1Copy[index]}
            updatePlayer={this.updatePlayer}
          />
        )
      }.bind(this));
    }

    if(this.state.team2 != 'nullTeam' && this.state.team2 != '') {
      var team2Obj = teamData.find(function(item){
        return item.teamName == this.state.team2
      }.bind(this));
      var players2Copy = this.state.players2.slice();
      team2PlayerRows = team2Obj.roster.map(function(item, index){
        return(
          <PlayerRow key={team2Obj.teamName + index}
            rowNo={index}
            playerName={item}
            whichTeam={2}
            initialData={players2Copy[index]}
            updatePlayer={this.updatePlayer}
            printGames={this.props.printGames}
          />
        )
      }.bind(this));
    }

    return(
      <div className="modal" id="addGame">
        <div className="modal-content">
          <form onSubmit={this.handleAdd}>
            <div className="row game-entry-top-row">
              <div className="col s6">
                <h4>{this.getModalHeader()}</h4>
              </div>
              <div className="input-field col s3">
                <input id="round" type="number" name="round" value={this.state.round} onChange={this.handleChange}/>
                <label htmlFor="round">Round No.</label>
              </div>
              <div className="input-field col s3">
                <input id="tuhtot" type="number" name="tuhtot" value={this.state.tuhtot} onChange={this.handleChange}/>
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
                <input type="number" id="tm1Score" name="score1" value={this.state.score1} onChange={this.handleChange}/>
                <label htmlFor="tm1Score">Score</label>
              </div>
              <div className="col m2 hide-on-small-only">
                <div className="match-divider">
                  &mdash;
                </div>
              </div>
              <div className="input-field col s4 m2 l1">
                <input type="number" id="tm2Score" name="score2" value={this.state.score2} onChange={this.handleChange}/>
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
                <input id="ottu" type="number" name="ottu" value={this.state.ottu} onChange={this.handleChange}/>
                <label htmlFor="ottu">Overtime TU</label>
              </div>
              <div className="col s3 m2 forfeit-ctrl">
                <label>
                  <input type="checkbox" name="forfeit" checked={this.state.forfeit} onChange={this.handleChange}/>
                  <span>Forfeit?</span>
                </label>
              </div>
            </div>



            <div className="modal-footer">
              <button type="button" className="modal-close btn grey" onClick={this.resetState}>Cancel</button>&nbsp;
              <button type="submit" className="modal-close btn green">{this.getSubmitCaption()}</button>
            </div>
          </form>
        </div>
      </div>
    ) //return
  } //render
}; //AddGame

module.exports=AddGameModal;
