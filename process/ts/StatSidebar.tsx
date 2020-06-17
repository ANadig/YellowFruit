/***********************************************************
StatSidebar.tsx
Andrew Nadig

React component representing the abbreviated version of the
stats report that appears on the side.
***********************************************************/
import * as React from 'react';
import * as _ from 'lodash';
import StatUtils = require('./StatUtils');
import { TournamentSettings } from './YfTypes';

/**
 * Teams' manually specified ranks. Strings because that's how the html fields send them
 */
interface RankingList {
  [teamName: string]: string;   // index teams' ranks by their team name
}

interface StatSidebarProps {
  visible: boolean;               // whether the sidebar is open
  standings: any;                 // standings information from StatUtils
  phase: string;                  // which phase to show standings for
  divisions: string[];            // divisions to group teams by
  phasesToGroupBy: string[];      // phases whose divisions we're grouping teams by
  phaseSizes: number[];           // number of divisions in each phase of phasesToGroupBy
  settings: TournamentSettings;   // tournament rules
  rptConfig: any;                 // report configuration (so that sidebar mirrors the html report)
  filterByTeam: (team: string) => void;               // find a team's games when its name is clicked
  saveRankOverrides: (ranks:RankingList) => void;     // file the data in the rank fields
}

interface StatSidebarState {
  rankOverrides: RankingList;   // list of teams' rank overrides
  ranksEditable: boolean;       // whether ranking fields are available for editing
}

export class StatSidebar extends React.Component<StatSidebarProps, StatSidebarState>{

  constructor(props: StatSidebarProps) {
    super(props);
    let rankings = {};
    for(var i in props.standings) {
      const tm = props.standings[i]
      const rank = tm.rank;
      if(rank == undefined) { rankings[tm.teamName] = ''; }
      else { rankings[tm.teamName] = rank; }
    }
    this.state = {
      ranksEditable: false,
      rankOverrides: rankings
    };
    this.handleRankChange = this.handleRankChange.bind(this);
    this.filterByTeam = this.filterByTeam.bind(this);
    this.enableRankEdit = this.enableRankEdit.bind(this);
    this.saveRankOverrides = this.saveRankOverrides.bind(this);
  }

  /**
   *  Update state when on of the rank fields changes value
   * @param  e  event
   */
  handleRankChange(e: any): void {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    const whichTeam = name.replace('_rank_', '');
    let tempRanks = this.state.rankOverrides;
    tempRanks[whichTeam] = value;
    this.setState({
      rankOverrides: tempRanks
    });
  }

  /**
   * When a team's name is clicked on, filter the list of games
   * @param  e events
   */
  filterByTeam(e: any): void {
    const teamName = e.target.innerText;
    this.props.filterByTeam(teamName);
  }

  /**
   *  Does this tournament have at least one tie?
   * @return  true iff >=1 game is a tie
   */
  tiesExist(): boolean {
    for(let g of this.props.standings) {
      if(g.ties > 0) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Standings table (JSX) for the teams in a single division.
  teams: 'row'-type lines from arrangeStandingsLines
  division: can be 'noDiv' if this tournament does not have
    divisions
  tiesExist: whether at least one game in the tournament
    is a tie
  ---------------------------------------------------------*/
  getTable(teams, division, tiesExist) {
    var usePp20 = this.props.rptConfig.ppgOrPp20 == 'pp20';
    var showPhaseRecord = this.props.rptConfig.phaseRecord && this.props.phase == 'all' &&
      this.props.phasesToGroupBy.length > 0 && this.props.phasesToGroupBy[0] != 'noPhase';
    var rows = teams.map((item, index) => {
      let teamName = item.team.teamName;
      let ppg = item.team.ppg, ppb = item.team.ppb;
      if(isNaN(ppg)) { ppg = ''; }
      if(isNaN(ppb)) { ppb = ''; }
      let rankCell = null;
      if(this.props.phase == 'all') {
        if(this.state.ranksEditable) {
          rankCell = (
            <td><input type="number" id={'_rank_'+teamName} size={2}
            placeholder={item.rank} name={'_rank_'+teamName} min="1"
            value={this.state.rankOverrides[teamName]} onChange={this.handleRankChange}
            /></td>
          );
        }
        else {
          let tooltip = item.isOverride ? 'Rank manually overridden' : '';
          let dispVal = item.isOverride ? item.rank + '*' : item.rank;
          rankCell = ( <td className="text-cell rank" title={tooltip}>{dispVal}</td> );
        }
      }
      let ppbCell = this.props.settings.bonuses ? ( <td>{ppb}</td> ) : null;
      let tiesCell = tiesExist ? ( <td>{item.team.ties}</td> ) : null;
      let phaseRecCell = showPhaseRecord ? ( <td>{item.team.phaseRecord}</td> ) : null;

      return (
        <tr key={teamName}>
          {rankCell}
          <td className="text-cell">
            <a onClick={this.filterByTeam}
            title="Find this team's games">{teamName}</a>
          </td>
          <td>{item.team.wins}</td>
          <td>{item.team.losses}</td>
          {tiesCell}
          {phaseRecCell}
          <td>{ppg}</td>
          {ppbCell}
        </tr>
      );
    });

    var header = division == null ? null : ( <h5>{division}</h5> );
    var rankThCell = this.props.phase == 'all' ? ( <th className="text-cell">Rk</th> ) : null;
    var ppbThCell = this.props.settings.bonuses ? ( <th>PPB</th> ) : null;
    var tiesThCell = tiesExist ? ( <th>T</th> ) : null;
    let phaseRecThCell = null;
    if(showPhaseRecord) {
      let tooltip = '';
      if(teams.length > 0) {
        //arbitrarily use the first team since they should all be the same
        tooltip = 'Record in the ' + teams[0].team.groupingPhase + ' phase';
      }
      phaseRecThCell = ( <th title={tooltip}>Ph.</th> );
    }

    return (
      <div key={division}>
        {header}
        <table className="striped">
          <thead>
            <tr>
              {rankThCell}
              <th className="text-cell">Team</th>
              <th>W</th>
              <th>L</th>
              {tiesThCell}
              {phaseRecThCell}
              <th>{usePp20 ? 'PP20' : 'PPG'}</th>
              {ppbThCell}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  } //getTable

  /**
   *  Make ranks editable to be overridden
   */
  enableRankEdit(): void {
    this.setState({
      ranksEditable: true
    });
  }

  /**
   *  Save rankings and exit edit mode
   */
  saveRankOverrides(): void {
    this.props.saveRankOverrides(this.state.rankOverrides);
    this.setState({
      ranksEditable: false
    });
  }


  render(){
    if(!this.props.visible) { return null; }
    if(this.props.rptConfig == undefined) { return ( <span>Report configuration error</span> ); }

    const linesToPrint = StatUtils.arrangeStandingsLines(this.props.standings, this.props.phase,
      this.props.divisions, this.props.phasesToGroupBy, this.props.phaseSizes, this.props.rptConfig);

    const tiesExist = this.tiesExist();
    let tables = [];

    let curDivName = null, curDivTeams = [];
    for(let curLine of linesToPrint) {
      switch (curLine.type) {
        case 'divLabel':
          curDivName = curLine.divName;
          break;
        case 'tableHeader':
          curDivTeams = [];
          break;
        case 'row':
          curDivTeams.push(curLine);
          break;
        case 'tableEnd':
          tables.push(this.getTable(curDivTeams, curDivName, tiesExist));
          break;
      }
    }

    let rankButton = null;
    if(this.state.ranksEditable) {
      rankButton = (
        <button className="btn-flat grey lighten-3 waves-effect tooltipped"
        data-tooltip="Save Ranking Overrides" onClick={this.saveRankOverrides}>
          <i className="material-icons left">save</i>Rankings
        </button>
      );
    }
    else if(this.props.phase == 'all') {
      rankButton = (
        <button className="btn-flat grey lighten-3 waves-effect tooltipped"
        data-tooltip="Override Final Rankings" onClick={this.enableRankEdit}>
          <i className="material-icons left">edit</i>Rankings
        </button>
      );
    }

    return(
      <div>
        {rankButton}
        {tables}
      </div>
    )
  }
}
