var React = require('react');

class GameList extends React.Component{

  constructor(props) {
    super(props);
    this.addGame = this.addGame.bind(this);
  }

  //tell the mainInterface to open a New Game form
  addGame () {
    this.props.openModal();
  }

  render () {
    if (this.props.whichPaneActive != 'gamesPane') {
      return null;
    }
    return(
      <div className="container">
        <ul className="collection">{this.props.gameList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className="btn-floating btn-large green" title="Add a game" onClick={this.addGame}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}

module.exports=GameList;
