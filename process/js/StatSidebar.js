/***********************************************************
StatSidebar.js
Andrew Nadig

React component representing the abbreviated version of the
stats report that appears on the side.
***********************************************************/
const React = require('react');
const _ = require('lodash');
const StatUtils = require('./StatUtils');

class StatSidebar extends React.Component{

  constructor(props) {
    super(props);
    var rankings = {};
    for(var i in props.standings) {
      rankings[props.standings[i].teamName] = '';
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

  /*---------------------------------------------------------
  Update state when on of the rank fields changes value
  ---------------------------------------------------------*/
  handleRankChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    const whichTeam = name.replace('_rank_', '');
    var tempRanks = this.state.rankOverrides;
    tempRanks[whichTeam] = value;
    this.setState({
      rankOverrides: tempRanks
    });
  }

  /*---------------------------------------------------------
  When a team's name is clicked on, filter the list of games
  ---------------------------------------------------------*/
  filterByTeam(e) {
    var teamName = e.target.name;
    this.props.filterByTeam(teamName);
  }

  /*---------------------------------------------------------
  Does this tournament have at least one tie?
  ---------------------------------------------------------*/
  tiesExist() {
    for(var i in this.props.standings) {
      if(this.props.standings[i].ties > 0) { return true; }
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
            <td><input type="number" id={'_rank_'+teamName} size="2"
            placeholder={item.rank} name={'_rank_'+teamName} min="1"
            value={this.state.rankOverrides[teamName]} onChange={this.handleRankChange}
            /></td>
          );
        }
        else {
          rankCell = ( <td className="text-cell">{item.rank}</td> );
        }

      }
      let ppbCell = this.props.settings.bonuses ? ( <td>{ppb}</td> ) : null;
      let tiesCell = tiesExist ? ( <td>{item.team.ties}</td> ) : null;
      let phaseRecCell = showPhaseRecord ? ( <td>{item.team.phaseRecord}</td> ) : null;

      return (
        <tr key={teamName}>
          {rankCell}
          <td className="text-cell">
            <a onClick={this.filterByTeam} name={teamName}
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

  /*---------------------------------------------------------
  Make ranks editable to be overridden
  ---------------------------------------------------------*/
  enableRankEdit() {
    this.setState({
      ranksEditable: true
    });
  }

  /*---------------------------------------------------------
  Save rankings and exit edit mode
  ---------------------------------------------------------*/
  saveRankOverrides() {
    this.setState({
      ranksEditable: false
    });
  }


  render(){
    console.log(this.state.rankOverrides);

    if(!this.props.visible) { return null; }
    if(this.props.rptConfig == undefined) { return ( <span>Report configuration error</span> ); }

    var linesToPrint = StatUtils.arrangeStandingsLines(this.props.standings, this.props.phase,
      this.props.divisions, this.props.phasesToGroupBy, this.props.phaseSizes, this.props.rptConfig);

    var tiesExist = this.tiesExist();
    var tables = [];

    let curDivName = null, curDivTeams = [];
    for(var i in linesToPrint) {
      let curLine = linesToPrint[i];
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

    var rankButton = null;
    if(this.state.ranksEditable) {
      rankButton = (
        <button className="btn-flat waves-effect tooltipped"
        data-tooltip="Save Ranking Overrides" onClick={this.saveRankOverrides}>
          <i className="material-icons left">save</i>Rankings
        </button>
      );
    }
    else if(this.props.phase == 'all') {
      rankButton = (
        <button className="btn-flat waves-effect tooltipped"
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

module.exports=StatSidebar
