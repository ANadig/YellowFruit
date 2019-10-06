/***********************************************************
TeamListEntry.js
Andrew Nadig

React component representing one team on the teams pane.
***********************************************************/
var React = require('react');
var ColorChip = require('./ColorChip');

class TeamListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.editTeam = this.editTeam.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.removeDivision = this.removeDivision.bind(this);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to delete this team.
  ---------------------------------------------------------*/
  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to open this team for editing.
  ---------------------------------------------------------*/
  editTeam() {
    this.props.onOpenTeam(this.props.whichItem);
  }

  /*---------------------------------------------------------
  If the checkbox is checked, uncheck it, and vice versa
  ---------------------------------------------------------*/
  handleToggle() {
    this.props.onSelectTeam(this.props.whichItem);
    this.setState({
      selected: !this.state.selected
    });
  }

  /*---------------------------------------------------------
  Remove the specified division from this team.
  ---------------------------------------------------------*/
  removeDivision(phase) {
    this.props.removeDivision(this.props.whichItem, phase);
  }

  /*---------------------------------------------------------
  Add the disabled attribute to the edit button.
  ---------------------------------------------------------*/
  canEdit() {
    return this.state.selected ? 'disabled' : '';
  }

  /*---------------------------------------------------------
  IF a team has played games, disable the delete button, with
  a tooltip explaining why.
  ---------------------------------------------------------*/
  getDeleteButton() {
    if(this.props.numGamesPlayed == 0) {
      return (
        <button className="secondary-content btn-flat item-delete" title="Delete this team" onClick={this.handleDelete}>
        <i className="material-icons">delete</i></button>
      );
    }
    var gameWord = this.props.numGamesPlayed == 1 ? 'game' : 'games';
    var tooltip = this.props.singleItem.teamName + ' has played ' + this.props.numGamesPlayed + ' ' + gameWord;
    return (
      <span className="secondary-content btn-flat disabled-item-delete tooltipped"
        data-tooltip={tooltip} data-position="left">
      <i className="material-icons">delete</i></span>
    );
  }//getDeleteButton

  /*---------------------------------------------------------
  A tag that displays which division a team is in.
  ---------------------------------------------------------*/
  getDivisionChip(phase, colorNo) {
    return (
      <ColorChip key={phase}
        phase = {phase}
        displayTitle = {this.props.singleItem.divisions[phase]}
        colorNo = {colorNo}
        removeMe = {this.removeDivision}
      />
    );
  }//getDivisionChip

  /*---------------------------------------------------------
  String with the team's name and SS,etc. status if applicable
  ---------------------------------------------------------*/
  teamNameDisplay() {
    var attributes = [];
    if(this.props.singleItem.smallSchool) {
      attributes.push('SS');
    }
    if(this.props.singleItem.jrVarsity) {
      attributes.push('JV');
    }
    if(this.props.singleItem.teamUGStatus) {
      attributes.push('UG');
    }
    if(this.props.singleItem.teamD2Status) {
      attributes.push('D2');
    }
    var str = this.props.singleItem.teamName;
    if(attributes.length > 0) {
      str += ' (' + attributes.join(', ') + ')';
    }
    return str;
  }

  /*---------------------------------------------------------
  A list of the players on the team
  ---------------------------------------------------------*/
  rosterToString() {
    var str = '';
    for(var name in this.props.singleItem.roster) {
      str += name;
      let year = this.props.singleItem.roster[name].year;
      if(year != undefined && year != '') {
        str += ' (' + year + '), ';
      }
      else {
        str += ', ';
      }
    }
    return str.substr(0, str.length - 2); //remove the comma+space at the end
  }


  render() {
    var deleteButton = this.getDeleteButton();
    //division chips
    var divisionChips = [];
    var colorNo = 0;
    for (var i in this.props.allPhases) {
      var phase = this.props.allPhases[i];
      if(this.props.singleItem.divisions[phase] != undefined) {
        divisionChips.push(this.getDivisionChip(phase, colorNo));
      }
      colorNo += 1;
    }
    //checkbox to select this team
    var checkbox = null;
    if(this.props.usingDivisions) {
      checkbox = (
        <label>
          <input type="checkbox" className="filled-in team-checkbox" checked={this.state.selected}
          title="Select to assign divisions" onChange={this.handleToggle}/>
          <span>&nbsp;</span>
        </label>
      );
    }

    return(
      <a className="collection-item" onDoubleClick={this.editTeam}>
        <div>
          {checkbox}
          <div className={this.props.activeInPhase ? 'team-name' : 'team-name-inactive'}>
            {this.teamNameDisplay()}&emsp;
          </div>
          {divisionChips}
          <button className={'btn-flat item-edit ' + this.canEdit()} title="Edit this team" onClick={this.editTeam}>
          <i className="material-icons">edit</i></button>
          {deleteButton}
          <br/><span className="roster-display">{this.rosterToString()}</span>
        </div>
      </a>
    )
  }
};

module.exports = TeamListEntry;
