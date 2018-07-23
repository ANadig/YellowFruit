var React = require('react');

class GameListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
    this.selectGame = this.selectGame.bind(this);
  }

  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  getScoreString(){
    return 'Round ' + this.props.singleItem.round + ': ' +
      this.props.singleItem.team1 + " " + this.props.singleItem.score1 + ', ' +
      this.props.singleItem.team2 + " " + this.props.singleItem.score2;
  }

  //returns e.g. "Central A: Alice 2/4/1, Bob 0/1/0, Carol 1/0/2"
  getTeamLineScore(whichTeam) {
    var teamName = whichTeam == 1 ? this.props.singleItem.team1 : this.props.singleItem.team2;
    var players = whichTeam == 1 ? this.props.singleItem.players1 : this.props.singleItem.players2;
    var lineScore = teamName + ':';
    for(var p in players) {
      var powers = players[p].powers == '' ? 0 : players[p].powers;
      var gets = players[p].gets == '' ? 0 : players[p].gets;
      var negs = players[p].negs == '' ? 0 : players[p].negs;

      lineScore += ' ' + players[p].name + ' ';
      lineScore += powers + '/' + gets + '/' + negs;
      if(p < players.length - 1) { lineScore += ','; }
    }
    return lineScore;
  }

  selectGame() {
    // console.log("whichItem");
    // console.log(this.props.whichItem);
    this.props.onOpenGame(this.props.whichItem);
  }

  render() {
    return(
      <a className="collection-item">
        <div>
          <div className="game-name">
            {this.getScoreString()}
            <button className="btn-flat item-edit" title="Edit this game" onClick={this.selectGame}>
            <i className="material-icons">edit</i></button>
          </div>
          <button className="secondary-content btn-flat item-delete" title="Remove this game" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
          <br/>{this.getTeamLineScore(1)}
          <br/>{this.getTeamLineScore(2)}
        </div>
      </a>
    )
  }
};

module.exports = GameListEntry;
