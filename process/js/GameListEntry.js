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
          <br/>{this.props.singleItem.notes}
          <br/>{JSON.stringify(this.props.singleItem.players1)}
          <br/>{JSON.stringify(this.props.singleItem.players2)}
        </div>
      </a>
    )
  }
};

module.exports = GameListEntry;
