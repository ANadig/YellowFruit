var React = require('react');

class GameListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  getScoreString(){
    return 'Round ' + this.props.singleItem.round + ': ' +
      this.props.singleItem.team1 + " " + this.props.singleItem.score1 + ', ' +
      this.props.singleItem.team2 + " " + this.props.singleItem.score2;
  }

  render() {
    return(
      <li className="qb-item">
        <div className="row">
          <div className="col s11">
            <span className="game-name"> 
              {this.getScoreString()}
            </span>
            <div className="item-notes">{this.props.singleItem.notes}</div>
          </div>
          <div className="col s1">
            <button className="item-delete btn red" title="Remove this game" onClick={this.handleDelete}>
            <i className="material-icons">delete</i></button>
          </div>
        </div>
      </li>
    )
  }
};

module.exports = GameListEntry;
