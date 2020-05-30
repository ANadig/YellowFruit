/***********************************************************
PlayerRow.js
Andrew Nadig

React component representing the fields for entering a
single player's stats in the game entry form.
***********************************************************/
var React = require('react');

class PlayerRow extends React.Component{

  /*---------------------------------------------------------
  Copy props into state on initialize so that the fields can
  populate upon opening a game for editing. PlayerRows are
  created with a key that's unique to the team, so new rows
  are created anytime the team changes.
  ---------------------------------------------------------*/
  constructor(props) {
    super(props);
    var init = props.initialData;
    if(init != null){
      this.state = {
        tuh: init.tuh,
        powers: init.powers,
        tens: init.tens,
        negs: init.negs
      };
    }
    else {
      this.state = {
        tuh: '',
        powers: '',
        tens: '',
        negs: ''
      };
    }

    this.handleChange = this.handleChange.bind(this);
    this.getTotalPts = this.getTotalPts.bind(this);
  }

  /*---------------------------------------------------------
  Called when the value in the form changes.
  This is a controlled component, so the state is the
  single source of truth.
  Also tell AddGameModal to update its state, since it must
  keep track of stats for the whole game.
  ---------------------------------------------------------*/
  handleChange(e){
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
    this.props.updatePlayer(this.props.whichTeam, name, value, this.props.playerName);
  }

  /*---------------------------------------------------------
  The total number of points scored by this player in this
  game.
  ---------------------------------------------------------*/
  getTotalPts(){
    var powersTot = 0;
    if(this.props.settings.powers == '15pts') { powersTot = 15*this.state.powers; }
    else if(this.props.settings.powers == '20pts') { powersTot = 20*this.state.powers; }
    return powersTot + 10*this.state.tens - 5*this.state.negs;
  }

  render(){
    var powerCell = null, negCell = null;
    //powers
    if(this.props.settings.powers != 'none') {
      powerCell = (
        <td>
          <input type="number" id={'powers'+this.props.playerName+'-'+this.props.whichTeam}
          size="3" name="powers" min="0" value={this.state.powers} onChange={this.handleChange}/>
        </td>
      );
    }
    //negs
    if(this.props.settings.negs) {
      negCell = (
        <td>
          <input type="number" id={'negs'+this.props.playerName+'-'+this.props.whichTeam}
          size="3" name="negs" min="0" value={this.state.negs} onChange={this.handleChange}/>
        </td>
      );
    }

    // tossups heard and 10s always exist
    return(
      <tr>
        <td className="player-name">{this.props.playerName}</td>
        <td>
          <input type="number" id={'tuh'+this.props.playerName+'-'+this.props.whichTeam}
          size="3" min="0" name="tuh" value={this.state.tuh} onChange={this.handleChange}/>
        </td>
        {powerCell}
        <td>
          <input type="number" id={'tens'+this.props.playerName+'-'+this.props.whichTeam}
          size="3" name="tens" min="0" value={this.state.tens} onChange={this.handleChange}/>
        </td>
        {negCell}
        <td>
          <input disabled id={'tot'+this.props.playerName+this.props.whichTeam} size="3" value={this.getTotalPts()}/>
        </td>
      </tr>
    )
  }
}

module.exports=PlayerRow
