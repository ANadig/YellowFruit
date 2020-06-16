/***********************************************************
TeamList.tsx
Andrew Nadig

React component representing the list of teams on the teams
pane.
***********************************************************/
import * as React from "react";
import { YfPane } from "./YfTypes";

type TeamSortMode = 'division' | 'alpha';

interface TeamListProps {
  whichPaneActive: YfPane;
  teamList: JSX.Element[];
  openModal: () => void;
  totalTeams: number;
  sortTeamsBy: (mode: TeamSortMode) => void;
  usingDivisions: boolean;
  numberSelected: number;
}

interface TeamListState {
  orderBy: TeamSortMode;
}

export class TeamList extends React.Component<TeamListProps, TeamListState>{

  readonly MAX_ALLOWED_TEAMS = 200;

  constructor(props: TeamListProps) {
    super(props);
    this.state = {
      orderBy: 'alpha'
    };
    this.addTeam = this.addTeam.bind(this);
  }

  /**
   *   Tell the MainInterface to open the team modal to add a new team
   */
  addTeam(): void {
    this.props.openModal();
  }

  /**
   * Sorting function
   * @param  mode Which mode should the function use to sort teams?
   * @return   A function that sorts teams by the specified mode
   */
  teamSortFunction(mode: TeamSortMode): () => void {
    return () => {
      this.props.sortTeamsBy(mode);
      this.setState({
        orderBy: mode
      })
    }
  }

  /**
   * A chip that displays the count of how many games are selected
   * @return A Materialize chip
   */
  selectedCounter(): JSX.Element {
    const sel = this.props.numberSelected;
    if(sel == 0) { return null; }
    return (
      <div className="chip z-depth-2 selected-counter">
        {`${sel} team${(sel>1 ? 's' : '')} selected`}
      </div>
    );
  }

  /**
   * Which color to use for a sort button, based on whether it's toggled on or off
   * @param   orderBy sorting mode
   * @return  Materialize color classes
   */
  btnToggled(orderBy: TeamSortMode): string {
    if(this.state.orderBy == orderBy) {
      return 'blue accent-1';
    }
    return 'grey lighten-4';
  }

  /**
   * Disabled attribute for the add game button if the limit on the number of teams
   * has been reached
   * @return  'disabled' or ''
   */
  addBtnDisabled(): string {
    if(this.props.teamList.length > this.MAX_ALLOWED_TEAMS) {
      return 'disabled';
    }
    return '';
  }

  /**
   *   Display how many teams are being shown to the user.
   * @return  span with the text
   */
  teamCountDisplay(): JSX.Element {
    const total = this.props.totalTeams;
    const showing = this.props.teamList.length;
    if(showing == total) {
      return ( <span>Showing all {total} teams</span> );
    }
    return ( <span>Showing {showing} of {total} teams</span> );
  }


  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return null;
    }

    let listHeader: JSX.Element;
    let selectedCounter: JSX.Element = null;
    // Show sort buttons if there are divisions (if no divisions, sorting is
    // always alphabetical)
    if(this.props.usingDivisions) {
      listHeader = (
        <div className="list-header">
          <a className={'waves-effect waves-light btn-flat toggle-left ' + this.btnToggled('division')}
          title="Group teams by this phase's division" onClick={this.teamSortFunction('division')}>
            <i className="material-icons left">view_day</i>Group
          </a>
          <a className={'waves-effect waves-light btn-flat toggle-right ' + this.btnToggled('alpha')}
          onClick={this.teamSortFunction('alpha')}>
            <i className="material-icons left">sort_by_alpha</i>Sort
          </a>&emsp;
          {this.teamCountDisplay()}
        </div>
      );
      selectedCounter = this.selectedCounter();
    }
    else {
      listHeader = ( <div className="list-header">{this.teamCountDisplay()}</div> );
    }

    // Zero-state display for when there are no teams
    if(this.props.teamList.length == 0) {
      let message: string;
      if(this.props.totalTeams == 0) {
        message = 'Add a team to get started';
      }
      else { //there are teams, but they've all been excluded based on the search
        message = 'Your search did not match any teams';
      }
      return (
        <div className="zero-state-container">
          {selectedCounter}
          <div className="qb-zero-state">
            <img src="banana-bunch.png" width="80" height="55"/><br/><br/>
            <h6>{message}</h6>
          </div>
          <div className="fixed-action-btn btn-floating-div">
            <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a team" onClick={this.addTeam}>
              <i className="large material-icons">add</i>
            </button>
          </div>
        </div>
      );
    }//if there are no teams to display

    return(
      <div className="container">
        {selectedCounter}
        {listHeader}
        <ul className="collection">{this.props.teamList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a team" onClick={this.addTeam}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}
