var React = require('react');

class TeamOption extends React.Component{
  render(){
    return(
      <option value={this.props.teamName}>{this.props.teamName}</option>
    )
  }
}

module.exports=TeamOption
