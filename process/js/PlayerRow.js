var React = require('react');



class PlayerRow extends React.Component{

  //copying props into state on initialize so that fields can populate upon
  //opening a game for editing. PlayersRows are created with a key that's unique
  //to the team, so new rows are created anytime the team changes.
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

  //update state, with changes to the form, then tell the AddGameModal to do
  //likewise
  handleChange(e){
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
    this.props.updatePlayer(this.props.whichTeam, name, value, this.props.playerName);
  }

  //the total number of points score by the player in this game
  getTotalPts(){
    return 15*this.state.powers + 10*this.state.tens - 5*this.state.negs;
  }

  render(){
    return(
      <tr>
        <td>{this.props.playerName}</td>
        <td>
          <input type="number"
            id={'tuh'+this.props.playerName+'-'+this.props.whichTeam} size="3"
            name="tuh" value={this.state.tuh} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'powers'+this.props.playerName+'-'+this.props.whichTeam} size="3" name="powers" value={this.state.powers} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'tens'+this.props.playerName+'-'+this.props.whichTeam} size="3" name="tens" value={this.state.tens} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'negs'+this.props.playerName+'-'+this.props.whichTeam} size="3" name="negs" value={this.state.negs} onChange={this.handleChange}/>
        </td>
        <td>
          <input disabled id={'tot'+this.props.playerName+this.props.whichTeam} size="3" value={this.getTotalPts()}/>
        </td>
      </tr>
    )
  }
}

module.exports=PlayerRow
