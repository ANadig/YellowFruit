var React = require('react');
var TeamOption = require('./TeamOption');
var PlayerRow = require('./PlayerRow');


class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: ''
    };
    this.toggleGmAddWindow = this.toggleGmAddWindow.bind(this);
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

  toggleGmAddWindow() {
    this.setState({
      round: '',
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: ''
    });
    this.props.handleToggle();
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      round: this.state.round,
      team1: this.state.team1,
      team2: this.state.team2,
      score1: this.state.score1,
      score2: this.state.score2,
      players1: this.state.players1,
      players2: this.state.players2,
      notes: this.state.notes
    } //tempitems

    this.props.addGame(tempItem);

    this.setState({
      round: '',
      team1: 'nullTeam',
      team2: 'nullTeam',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: ''
    });

  } //handleAdd

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
      <div className="modal fade" id="addGame" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.toggleGmAddWindow} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Add a Game</h4>
            </div>

            <form className="modal-body add-appointment form-horizontal" onSubmit={this.handleAdd}>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="roundInput">Round</label>
                <input type="number" className="form-control" id="roundInput"
                  name="round" value={this.state.round} onChange={this.handleChange}/>
              </div>
              <div className="form-group">
                <select id="tm1Name" name="team1" value={this.state.team1} onChange={this.handleChange}>
                  <option value="nullTeam">Select...</option>
                  {teamOptions}
                </select>
                <input type="number" className="form-control"
                  id="tm1Score" name="score1" value={this.state.score1} onChange={this.handleChange}/>
                <select id="tm2Name" name="team2" value={this.state.team2} onChange={this.handleChange}>
                  <option value="nullTeam">Select...</option>
                  {teamOptions}
                </select>
                <input type="number" className="form-control"
                  id="tm2Score" name="score2" value={this.state.score2} onChange={this.handleChange}/>
              </div>


              <table>
                <tbody>
                  <tr>
                    <th/>
                    <th>TUH</th>
                    <th>15</th>
                    <th>10</th>
                    <th>-5</th>
                  </tr>
                  {team1PlayerRows}
                </tbody>
              </table>

              <table>
                <tbody>
                  <tr>
                    <th/>
                    <th>TUH</th>
                    <th>15</th>
                    <th>10</th>
                    <th>-5</th>
                  </tr>
                  {team2PlayerRows}
                </tbody>
              </table>


              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Game Notes</label>
                <div className="col-sm-9">
                  <textarea className="form-control" rows="4" cols="50"
                    id="aptNotes"  name="notes" onChange={this.handleChange}
                    value={this.state.notes} placeholder="Notes about this game"></textarea>
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleGmAddWindow}>Cancel</button>&nbsp;
                    <button type="submit" className="btn btn-primary">Add Game</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    ) //return
  } //render
}; //AddGame

module.exports=AddGameModal;
