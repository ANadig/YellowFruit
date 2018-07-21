var React = require('react');
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
      notes: ''
    };
    this.resetState = this.resetState.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updatePlayer = this.updatePlayer.bind(this);
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
      tempAry = this.state.players1;
      if (tempAry[index] == undefined) {
        tempAry[index] = {'name': playerName};
      }
      tempAry[index][whichStat] = value;
      this.setState({
        players1: tempAry
      });
    }
    else if(whichTeam == 2) {
      tempAry = this.state.players2;
      if (tempAry[index] == undefined) {
        tempAry[index] = {'name': playerName};
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
      notes: ''
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

    this.props.addGame(tempItem);

    this.resetState();
  } //handleAdd

  componentDidUpdate(prevProps) {
    if(this.props.forceReset) {
      this.resetState();
      //seting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
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

  ppb(whichTeam) {
    var bHeard = this.bHeard(whichTeam);
    return bHeard == 0 ? (<span>&mdash;</span>) : (this.bPts(whichTeam)/bHeard);
  }

  render() {
    var teamData = this.props.teamData
    var team1PlayerRows = null;
    var team2PlayerRows = null;

    var teamOptions = teamData.map(function(item, index) {
      return(
        <TeamOption key={index}
          teamName={teamData[index].teamName}
        />
      ) //return
    });

    if(this.state.team1 != 'nullTeam' && this.state.team1 != '') {
      var team1Obj = teamData.find(function(item){
        return item.teamName == this.state.team1
      }.bind(this));
      team1PlayerRows = team1Obj.roster.map(function(item, index){
        return(
          <PlayerRow key={index}
            rowNo={index}
            playerName={item}
            whichTeam={1}
            updatePlayer={this.updatePlayer}
          />
        )
      }.bind(this));
    }

    if(this.state.team2 != 'nullTeam' && this.state.team2 != '') {
      var team2Obj = teamData.find(function(item){
        return item.teamName == this.state.team2
      }.bind(this));
      team2PlayerRows = team2Obj.roster.map(function(item, index){
        return(
          <PlayerRow key={index}
            rowNo={index}
            playerName={item}
            whichTeam={2}
            updatePlayer={this.updatePlayer}
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
                <h4>Add a Game</h4>
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
                  <option value="nullTeam">Select a team...</option>
                  {teamOptions}
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
                  <option value="nullTeam">Select a team...</option>
                  {teamOptions}
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
                Bonuses: {this.bHeard(1)} heard | {this.bPts(1)} pts | {this.ppb(1)} ppb
              </div>
              <div className="col s6">
                Bonuses: {this.bHeard(2)} heard | {this.bPts(2)} pts | {this.ppb(2)} ppb
              </div>
            </div>

            <div className="row">
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
              <button type="submit" className="modal-close btn green">Add Game</button>
            </div>
          </form>
        </div>
      </div>
    ) //return
  } //render
}; //AddGame

module.exports=AddGameModal;
