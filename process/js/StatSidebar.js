var React = require('react');

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
  render(){
    var summaryRows = this.props.standings.map(function(item, index) {
      return (
        <tr key={item.teamName}>
          <td>{item.teamName}</td>
          <td>{item.wins}</td>
          <td>{item.losses}</td>
          <td>{(item.points / (item.wins + item.losses)).toFixed(1)}</td>
          <td>{(item.bPts / item.bHeard).toFixed(2)}</td>
        </tr>
      )
    });

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


        <p>Stuff in the sidebar!</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
        <p>another line</p>
      </div>
    )
  }
}

module.exports=StatSidebar
