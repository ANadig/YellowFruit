var React = require('react');



class PlayerRow extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      tuh: '',
      powers: '',
      gets: '',
      negs: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.getTotalPts = this.getTotalPts.bind(this);
  }

  handleChange(e){
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);

    this.props.updatePlayer(this.props.whichTeam, this.props.rowNo, name, value, this.props.playerName);
  }

  getTotalPts(){
    return 15*this.state.powers + 10*this.state.gets - 5*this.state.negs;
  }

  render(){
    return(
      <tr>
        <td>{this.props.playerName}</td>
        <td>
          <input type="number" className="form-control"
            id={'tuh'+this.props.rowNo+'-'+this.props.whichTeam} size="3"
            name="tuh" value={this.state.tuh} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" className="form-control"
            id={'powers'+this.props.rowNo+'-'+this.props.whichTeam} size="3"
            name="powers" value={this.state.powers} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" className="form-control"
          id={'gets'+this.props.rowNo+'-'+this.props.whichTeam} size="3"
          name="gets" value={this.state.gets} onChange={this.handleChange}/>
        </td>
        <td>
          <input type="number" className="form-control"
          id={'negs'+this.props.rowNo+this.props.whichTeam} size="3"
          name="negs" value={this.state.negs} onChange={this.handleChange}/>
        </td>
        <td>
          <input disabled id={'tot'+this.props.rowNo+this.props.whichTeam} size="3" value={this.getTotalPts()}/>
        </td>
      </tr>
    )
  }
}

module.exports=PlayerRow
