var React = require('react');
var _ = require('lodash');

// summary data structure:
// { teamName: item.teamName,
//   wins: 0,
//   losses: 0,
//   ties: 0,
//   points: 0,
//   bHeard: 0,
//   bPts: 0
// }

class StatSidebar extends React.Component{

  //sort by winning percentage, then by ppg
  standingsSort(summary) {
    return _.orderBy(summary, [function(g) {
      if(this.getGamesPlayed(g) == 0) { return 0.5; }
      return (g.wins + g.ties/2) / this.getGamesPlayed(g);
    }.bind(this), this.getPpg.bind(this)], ['desc', 'desc']);
  }

  getGamesPlayed(g) {
    return g.wins + g.losses + g.ties;
  }

  getPpg(g) {
    return this.getGamesPlayed(g) == 0 ? 0 : (g.points / this.getGamesPlayed(g));
  }

  getPpb(g) {
    return g.bHeard == 0 ? 0 : (g.bPts / g.bHeard);
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
