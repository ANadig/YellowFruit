var React = require('react');

class GameListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
    this.selectGame = this.selectGame.bind(this);
  }

  //tell the mainInterface to delete me
  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  //returns e.g. ['Round 1: ', 'Central A 310', 'Memorial A 250', ' (OT)']
  getScoreStrings(){
    var strAry = ['Round ' + this.props.singleItem.round + ': '];
    strAry.push(this.props.singleItem.team1 + " " + this.props.singleItem.score1);
    strAry.push(this.props.singleItem.team2 + " " + this.props.singleItem.score2);
    if(this.props.singleItem.ottu > 0) {
      strAry.push(' (OT)');
    }
    else {
      strAry.push('');
    }
    return strAry;
  }

  //add formating to team1 if they won
  team1Format() {
    return this.props.singleItem.score1 > this.props.singleItem.score2 ? 'winner' : '';
  }

  //add formatting to team2 if they won
  team2Format() {
    return this.props.singleItem.score2 > this.props.singleItem.score1 ? 'winner' : '';
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
      if(players[p].tuh > 0) {
        lineScore += ' ' + p + ' ';
        lineScore += powers + '/' + gets + '/' + negs + ',';
      }
    }
    return lineScore.substr(0, lineScore.length - 1); //remove the comma at the end
  }

  //tell the mainInterface to open my game for editing
  selectGame() {
    this.props.onOpenGame(this.props.whichItem);
  }

  render() {
    var scoreStrings = this.getScoreStrings();

    return(
      <a className="collection-item">
        <div>
          <div className="game-name">
            {scoreStrings[0]}
            <span className={this.team1Format()}>{scoreStrings[1]}</span>
            ,&nbsp;
            <span className={this.team2Format()}>{scoreStrings[2]}</span>
            {scoreStrings[3]}
            <button className="btn-flat item-edit" title="Edit this game" onClick={this.selectGame}>
            <i className="material-icons">edit</i></button>
          </div>
          <button className="secondary-content btn-flat item-delete" title="Remove this game" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
          <br/>{this.getTeamLineScore(1)}
          <br/>{this.getTeamLineScore(2)}
          <br/><span className="game-comment"><em>{this.props.singleItem.notes}</em></span>
        </div>
      </a>
    )
  }
};

module.exports = GameListEntry;
