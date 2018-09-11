var React = require('react');
var _ = require('lodash');

// summary data structure:
// { teamName: item.teamName,
//   wins: 0,
//   losses: 0,
//   ties: 0,
//   points: 0,
//   bHeard: 0,
//   bPts: 0,
//   forfeits: 0
// }

class StatSidebar extends React.Component{

  //sort by winning percentage, then by ppg
  standingsSort(summary) {
    return _.orderBy(summary,
      [this.getWinPct.bind(this), this.getPpg.bind(this)], ['desc', 'desc']);
  }

  getGamesPlayed(t) {
    return t.wins + t.losses + t.ties - t.forfeits;
  }

  getGamesPlayedWithForfeits(t) {
    return t.wins + t.losses + t.ties;
  }

  getWinPct(t) {
    if(this.getGamesPlayedWithForfeits(t) == 0) return 0;
    return (t.wins + t.ties/2) / this.getGamesPlayedWithForfeits(t);
  }

  //points per game. 0 if no games played
  getPpg(t) {
    return this.getGamesPlayed(t) == 0 ? 0 : (t.points / this.getGamesPlayed(t));
  }

  //points per bonus. 0 if no bonuses heard
  getPpb(t) {
    return t.bHeard == 0 ? 0 : (t.bPts / t.bHeard);
  }

  //standings to the teams in a single division
  getTable(teams, division) {
    var rows = teams.map((item, index) => {
      var ppg = this.getPpg(item);
      var ppb = this.getPpb(item);
      var ppbCell = this.props.settings.bonuses == 'none' ? null : ( <td>{ppb.toFixed(2)}</td> );
      return (
        <tr key={item.teamName}>
          <td>{item.teamName}</td>
          <td>{item.wins}</td>
          <td>{item.losses}</td>
          <td>{ppg.toFixed(1)}</td>
          {ppbCell}
        </tr>
      )
    });
    var header = division == 'noDiv' ? null : ( <h5>{division}</h5> );
    var ppbThCell = this.props.settings.bonuses == 'none' ? null : ( <th>PPB</th> );
    return (
      <div key={division}>
        {header}
        <table className="striped">
          <thead>
            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>PPG</th>
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
