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

  render(){
    var sortedSummary = this.standingsSort(this.props.standings.slice());

    var summaryRows = sortedSummary.map(function(item, index) {
      var ppg = this.getPpg(item);
      var ppb = this.getPpb(item);
      return (
        <tr key={item.teamName}>
          <td>{item.teamName}</td>
          <td>{item.wins}</td>
          <td>{item.losses}</td>
          <td>{ppg.toFixed(1)}</td>
          <td>{ppb.toFixed(2)}</td>
        </tr>
      )
    }.bind(this));

    return(
      <div>
        <table className="striped">
          <thead>
            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>PPG</th>
              <th>PPB</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows}
          </tbody>
        </table>
      </div>
    )
  }
}

module.exports=StatSidebar
