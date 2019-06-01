/***********************************************************
StatSidebar.js
Andrew Nadig

React component representing the abbreviated version of the
stats report that appears on the side.
***********************************************************/
var React = require('react');
var _ = require('lodash');

/* summary data structure:
 { teamName: item.teamName,
   wins: 0,
   losses: 0,
   ties: 0,
   points: 0,
   bHeard: 0,
   bPts: 0,
   forfeits: 0
 } */

class StatSidebar extends React.Component{

  constructor(props) {
    super(props);
    this.filterByTeam = this.filterByTeam.bind(this);
  }

  /*---------------------------------------------------------
  When a team's name is clicked on, filter the list of games
  ---------------------------------------------------------*/
  filterByTeam(e) {
    var teamName = e.target.name;
    this.props.filterByTeam(teamName);
  }

  /*---------------------------------------------------------
  Sort by winning percentage, then by ppg
  ---------------------------------------------------------*/
  standingsSort(summary) {
    return _.orderBy(summary,
      [this.getWinPct.bind(this), this.getPpg.bind(this)], ['desc', 'desc']);
  }

  /*---------------------------------------------------------
  Games played, not counting forfeits.
  ---------------------------------------------------------*/
  getGamesPlayed(t) {
    return t.wins + t.losses + t.ties - t.forfeits;
  }

  /*---------------------------------------------------------
  Games, played, including forfeits.
  ---------------------------------------------------------*/
  getGamesPlayedWithForfeits(t) {
    return t.wins + t.losses + t.ties;
  }

  /*---------------------------------------------------------
  Win percentage, including forfeits.
  ---------------------------------------------------------*/
  getWinPct(t) {
    if(this.getGamesPlayedWithForfeits(t) == 0) return 0;
    return (t.wins + t.ties/2) / this.getGamesPlayedWithForfeits(t);
  }

  /*---------------------------------------------------------
  Points, per game or 20 TUH. Zero if no games played.
  ---------------------------------------------------------*/
  getPpg(t) {
    if(this.getGamesPlayed(t) == 0) { return 0; }
    if(this.props.activeRpt.ppgOrPp20 == 'pp20') { return 20 * t.points / t.tuh; }
    return t.points / this.getGamesPlayed(t);
  }

  /*---------------------------------------------------------
  Points per bonus. Zero if no bonuses heard.
  ---------------------------------------------------------*/
  getPpb(t) {
    return t.bHeard == 0 ? 0 : (t.bPts / t.bHeard);
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
  teams: the sorted summarized stats object.
  division: can be 'noDiv' if this tournament does not have
    divisions
  ---------------------------------------------------------*/
  getTable(teams, division) {
    var tiesExist = this.tiesExist();
    var usePp20 = this.props.activeRpt.ppgOrPp20 == 'pp20';
    var rows = teams.map((item, index) => {
      var ppg = this.getPpg(item);
      var ppb = this.getPpb(item);
      var ppbCell = this.props.settings.bonuses == 'none' ? null : ( <td>{ppb.toFixed(2)}</td> );
      var tiesCell = tiesExist ? ( <td>{item.ties}</td> ) : null;
      return (
        <tr key={item.teamName}>
          <td className="text-cell">
            <a onClick={this.filterByTeam} name={item.teamName}
            title="Find this team's games">{item.teamName}</a>
          </td>
          <td>{item.wins}</td>
          <td>{item.losses}</td>
          {tiesCell}
          <td>{ppg.toFixed(1)}</td>
          {ppbCell}
        </tr>
      )
    });
    var header = division == 'noDiv' ? null : ( <h5>{division}</h5> );
    var ppbThCell = this.props.settings.bonuses == 'none' ? null : ( <th>PPB</th> );
    var tiesThCell = tiesExist ? ( <th>T</th> ) : null;
    return (
      <div key={division}>
        {header}
        <table className="striped">
          <thead>
            <tr>
              <th className="text-cell">Team</th>
              <th>W</th>
              <th>L</th>
              {tiesThCell}
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


  render(){
    if(!this.props.visible) { return null; }
    if(this.props.activeRpt == undefined) { return ( <span>Report configuration error</span> ); }

    var sortedSummary = this.standingsSort(this.props.standings.slice());
    var tables = [];
    if(this.props.divisions != undefined && this.props.divisions.length > 0) {
      for(var i in this.props.divisions) {
        var teamsInDiv = _.filter(sortedSummary,
          (t) => { return t.division == this.props.divisions[i] });
        tables.push(this.getTable(teamsInDiv, this.props.divisions[i]));
      }
    }
    else {
      tables.push(this.getTable(sortedSummary, 'noDiv'));
    }

    return(
      <div>
        {tables}
      </div>
    )
  }
}

module.exports=StatSidebar
