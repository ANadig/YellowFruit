/***********************************************************
GameListEntry.js
Andrew Nadig

React component representing one game on the games pane.
***********************************************************/
var React = require('react');
var ColorChip = require('./ColorChip');

class GameListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.editGame = this.editGame.bind(this);
    this.removePhase = this.removePhase.bind(this);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to delete this game
  ---------------------------------------------------------*/
  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  /*---------------------------------------------------------
  If the checkbox is checked, uncheck it, and vice versa
  ---------------------------------------------------------*/
  handleToggle() {
    this.props.onSelectGame(this.props.whichItem);
    this.setState({
      selected: !this.state.selected
    });
  }

  /*---------------------------------------------------------
  Tell the MainInterface to open this game for editing.
  ---------------------------------------------------------*/
  editGame() {
    this.props.onOpenGame(this.props.whichItem);
  }

  /*---------------------------------------------------------
  Remove the specified phase from this game.
  ---------------------------------------------------------*/
  removePhase(phase) {
    this.props.removePhase(this.props.whichItem, phase);
  }

  /*---------------------------------------------------------
  Return a string containing the game score
  ---------------------------------------------------------*/
  getScoreString(){
    var output = 'Round ' + this.props.singleItem.round + ': ';
    if(this.props.singleItem.forfeit) {
      return output + this.props.singleItem.team1 + ' defeats ' + this.props.singleItem.team2 + ' by forfeit';
    }
    //else not a forfeit
    var winner, loser;
    if(+this.props.singleItem.score1 >= +this.props.singleItem.score2) {
      winner = this.props.singleItem.team1 + " " + this.props.singleItem.score1
      loser = this.props.singleItem.team2 + " " + this.props.singleItem.score2
    }
    else {
      winner = this.props.singleItem.team2 + " " + this.props.singleItem.score2
      loser = this.props.singleItem.team1 + " " + this.props.singleItem.score1
    }
    output += winner + ', ' + loser;
    if(this.props.singleItem.ottu > 0) {
      output += ' (OT)';
    }
    return output;
  }

  /*---------------------------------------------------------
  Return statlines for the players who played in this game.
  e.g. "Central A: Alice 2/4/1, Bob 0/1/0, Carol 1/0/2"
  ---------------------------------------------------------*/
  getTeamLineScore(whichTeam) {
    var teamName = whichTeam == 1 ? this.props.singleItem.team1 : this.props.singleItem.team2;
    var players = whichTeam == 1 ? this.props.singleItem.players1 : this.props.singleItem.players2;
    var lineScore = teamName + ':';
    for(var p in players) {
      var powers = players[p].powers == '' ? 0 : players[p].powers;
      var tens = players[p].tens == '' ? 0 : players[p].tens;
      var negs = players[p].negs == '' ? 0 : players[p].negs;
      if(players[p].tuh > 0) {
        lineScore += ' ' + p + ' ';
        if(this.props.settings.powers != 'none') { lineScore += powers + '/'; }
        lineScore += tens;
        if(this.props.settings.negs == 'yes') { lineScore += '/' + negs; }
        lineScore += ',';
      }
    }
    return lineScore.substr(0, lineScore.length - 1); //remove the comma at the end
  }

  /*---------------------------------------------------------
  A tag that displays what phase a game belongs to.
  ---------------------------------------------------------*/
  getPhaseChip(phase, colorNo) {
    return (
      <ColorChip key={phase}
        phase = {phase}
        displayTitle = {phase}
        colorNo = {colorNo}
        removeMe = {this.removePhase}
      />
    );
  }



  render() {
    var scoreString = this.getScoreString();
    var phaseChips = [];
    var colorNo = 0;
    // phase chips
    for (var i in this.props.allPhases) {
      var phase = this.props.allPhases[i];
      if(this.props.singleItem.phases.includes(phase)) {
        phaseChips.push(this.getPhaseChip(phase, colorNo));
      }
      colorNo += 1;
    }
    //checkbox to select this game
    var checkbox = null;
    if(this.props.usingPhases) {
      checkbox = (
        <label>
          <input type="checkbox" className="filled-in team-checkbox" checked={this.state.selected}
          title="Select to assign phases" onChange={this.handleToggle}/>
          <span>&nbsp;</span>
        </label>
      );
    }

    return(
      <a className="collection-item" onDoubleClick={this.editGame}>
        <div>
          {checkbox}
          <div className="game-name">
            {scoreString}
          </div>
          &emsp;{phaseChips}
          <button className="btn-flat item-edit" title="Edit this game" onClick={this.editGame}>
          <i className="material-icons">edit</i></button>
          <button className="secondary-content btn-flat item-delete" title="Delete this game" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
          <br/><span className="game-line-score">{this.props.singleItem.forfeit ? '' : this.getTeamLineScore(1)}</span>
          <br/><span className="game-line-score">{this.props.singleItem.forfeit ? '' : this.getTeamLineScore(2)}</span>
          <br/><span className="game-comment"><em>{this.props.singleItem.notes}</em></span>
        </div>
      </a>
    );
  }
};

module.exports = GameListEntry;
