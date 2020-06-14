/***********************************************************
TeamListEntry.tsx
Andrew Nadig

React component representing one team on the teams pane.
***********************************************************/
import * as React from "react";
import { ColorChip } from './ColorChip';
import { QbTeam } from "./YfTypes";

interface TeamListEntryProps {
  team: QbTeam;
  onDelete: (whichTeam: QbTeam) => void;        // called when the user attempts to delete
  onOpenTeam: (whichTeam: QbTeam) => void;      // called when the user opens the team for editing
  onSelectTeam: (whichTeam: QbTeam) => void;    // called when the checkbox is toggled
  selected: boolean;                            // whether the checkbox is selected
  numGamesPlayed: number;                       // how many games this team has played
  allPhases: string[];                          // list of the tournament's phases
  usingDivisions: boolean;                      // whether this tournament has divisions
  removeDivision: (team: QbTeam, phase: string) => void;  // remove this team's divisions for this phase
  activeInPhase: boolean;                       // whether this team is participating in the phase the user is currently viewing
}

interface TeamListEntryState {
  selected: boolean;    // whether the checkbox is selected. Needs to be in both props and
                        //  state because the MainInterface needs to be able to clear the checkbox
}

export class TeamListEntry extends React.Component<TeamListEntryProps, TeamListEntryState>{

  constructor(props: TeamListEntryProps) {
    super(props);
    this.state = {
      selected: props.selected
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.editTeam = this.editTeam.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.removeDivision = this.removeDivision.bind(this);
  }

  /**
   * Tell the MainInterface to delete this team.
   */
  handleDelete(): void {
    this.props.onDelete(this.props.team);
  }

  /**
   * Tell the MainInterface to open this team for editing.
   */
  editTeam(): void {
    this.props.onOpenTeam(this.props.team);
  }

  /**
   * If the checkbox is checked, uncheck it, and vice versa
   */
  handleToggle(): void {
    this.props.onSelectTeam(this.props.team);
    this.setState({
      selected: !this.state.selected
    });
  }

  /**
   * Remove the specified division from this team.
   */
  removeDivision(phase: string) {
    this.props.removeDivision(this.props.team, phase);
  }

  /**
   * A disabled attribute to the edit button.
   * @return 'disabled' or the empty string
   */
  canEdit(): string {
    return this.state.selected ? 'disabled' : '';
  }

  /*---------------------------------------------------------
  IF a team has played games, disable the delete button, with
  a tooltip explaining why.
  ---------------------------------------------------------*/
  /**
   * The delete button for this team. May be disabled
   * @return JSX element for the delete button
   */
  getDeleteButton(): JSX.Element {
    if(this.props.numGamesPlayed === 0) {
      return (
        <button className="secondary-content btn-flat item-delete" title="Delete this team" onClick={this.handleDelete}>
        <i className="material-icons">delete</i></button>
      );
    }
    const gameWord = this.props.numGamesPlayed == 1 ? 'game' : 'games';
    const tooltip = this.props.team.teamName + ' has played ' + this.props.numGamesPlayed + ' ' + gameWord;
    return (
      <span className="secondary-content btn-flat disabled-item-delete tooltipped"
        data-tooltip={tooltip} data-position="left">
      <i className="material-icons">delete</i></span>
    );
  }//getDeleteButton

  /**
   * A tag that shows which division a team is in.
   * @param   phase   Name of the phase
   * @param   colorNo Index in list of chip colors
   * @return A ColorChip
   */
  getDivisionChip(phase: string, colorNo: number): JSX.Element {
    return (
      <ColorChip key={phase}
        phase = {phase}
        displayTitle = {this.props.team.divisions[phase]}
        colorNo = {colorNo}
        removeMe = {this.removeDivision}
      />
    );
  }//getDivisionChip

  /**
   * @return String with the team's name and JV ,etc. status if applicable
   */
  teamNameDisplay(): string {
    let attributes = [];
    if(this.props.team.smallSchool) {
      attributes.push('SS');
    }
    if(this.props.team.jrVarsity) {
      attributes.push('JV');
    }
    if(this.props.team.teamUGStatus) {
      attributes.push('UG');
    }
    if(this.props.team.teamD2Status) {
      attributes.push('D2');
    }
    let str = this.props.team.teamName;
    if(attributes.length > 0) {
      str += ' (' + attributes.join(', ') + ')';
    }
    return str;
  }

  /**
   * A list of the players on the team
   * @return Comma-delimited list
   */
  rosterToString(): string {
    let str = '';
    for(let name in this.props.team.roster) {
      str += name;
      let year = this.props.team.roster[name].year;
      if(year) {
        str += ' (' + year + '), ';
      }
      else {
        str += ', ';
      }
    }
    return str.substr(0, str.length - 2); //remove the comma+space at the end
  }


  render() {
    const deleteButton = this.getDeleteButton();
    //division chips
    let divisionChips = [];
    let colorNo = 0;
    for(let p of this.props.allPhases) {
      if(this.props.team.divisions[p] != undefined) {
        divisionChips.push(this.getDivisionChip(p, colorNo));
      }
      colorNo += 1;
    }
    //checkbox to select this team
    let checkbox = null;
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
