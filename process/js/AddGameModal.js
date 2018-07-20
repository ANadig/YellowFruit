var React = require('react');
var TeamOption = require('./TeamOption');
var PlayerRow = require('./PlayerRow');


class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      tuhtot: '',
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
    const value = target.value;
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
              <div className="col s4">
                <h4>Add a Game</h4>
              </div>
              <div className="input-field col s4">
                <input id="round" type="number" className="validate" name="round" value={this.state.round} onChange={this.handleChange}/>
                <label htmlFor="round">Round No.</label>
              </div>
              <div className="input-field col s4">
                <input id="tuhtot" type="number" className="validate" name="tuhtot" value={this.state.tuhtot} onChange={this.handleChange}/>
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
                <input type="number" className="validate" id="tm1Score" name="score1" value={this.state.score1} onChange={this.handleChange}/>
                <label htmlFor="tm1Score">Score</label>
              </div>
              <div className="col m2 hide-on-small-only">
                <div className="match-divider">
                  &mdash;
                </div>
              </div>
              <div className="input-field col s4 m2 l1">
                <input type="number" className="validate" id="tm2Score" name="score2" value={this.state.score2} onChange={this.handleChange}/>
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


            <label className="col-sm-3 control-label" htmlFor="aptNotes">Game Notes</label>
            <textarea className="form-control" rows="4" cols="50"
              id="aptNotes"  name="notes" onChange={this.handleChange}
              value={this.state.notes} placeholder="Notes about this game"></textarea>
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
