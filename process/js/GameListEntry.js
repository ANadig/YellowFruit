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
      <li className="pet-item media">
        <div className="media-left">
          <a className="pet-delete btn" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></a>
        </div>
        <div className="pet-info media-body">
          <div className="pet-head">
            <span className="pet-name">
              {this.getScoreString()}
            </span>
          </div>
          <div className="apt-notes">{this.props.singleItem.notes}</div>
        </div>
      </li>
    )
  }
};

module.exports = GameListEntry;
