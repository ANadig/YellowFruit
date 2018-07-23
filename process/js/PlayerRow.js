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
        gets: init.gets,
        negs: init.negs
      };
    }
    else {
      this.state = {
        tuh: '',
        powers: '',
        gets: '',
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
    this.props.updatePlayer(this.props.whichTeam, this.props.rowNo, name, value, this.props.playerName);
  }

  //the total number of points score by the player in this game
  getTotalPts(){
    return 15*this.state.powers + 10*this.state.gets - 5*this.state.negs;
  }

  render(){
    return(
      <tr>
        <td>{this.props.playerName}</td>
        <td>
          <input type="number"
            id={'tuh'+this.props.rowNo+'-'+this.props.whichTeam} size="3"
            name="tuh" value={this.state.tuh} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'powers'+this.props.rowNo+'-'+this.props.whichTeam} size="3" name="powers" value={this.state.powers} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'gets'+this.props.rowNo+'-'+this.props.whichTeam} size="3" name="gets" value={this.state.gets} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" id={'negs'+this.props.rowNo+'-'+this.props.whichTeam} size="3" name="negs" value={this.state.negs} onChange={this.handleChange}/>
        </td>
        <td>
          <input disabled id={'tot'+this.props.rowNo+this.props.whichTeam} size="3" value={this.getTotalPts()}/>
        </td>
      </tr>
    )
  }
}

module.exports=PlayerRow
