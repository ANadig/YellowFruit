/***********************************************************
TeamOption.js
Andrew Nadig

React component representing an item in the team select
dropdown in the AddGameModal.
***********************************************************/
var React = require('react');

class TeamOption extends React.Component{
  render(){
    return (
      <option value={this.props.teamName}>{this.props.teamName}</option>
    )
  }
}

module.exports=TeamOption
