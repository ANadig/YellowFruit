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

  //add the disabled class if the limit on the number of games has been reached
  addBtnDisabled() {
    if(this.props.gameList.length > 2000) {
      return 'disabled';
    }
    return '';
  }

  render () {
    if (this.props.whichPaneActive != 'gamesPane') {
      return null;
    }
    if(this.props.gameList.length == 0) {
      var message;
      if(this.props.numberOfTeams < 2) {
        message = 'Add more teams to get started';
      }
      else {
        message = 'Add a game to get started';
      }
      return (
        <div className="zero-state-container">
          <div className="qb-zero-state">
            <img src="banana-bunch.png" width="80" height="55"/>
            <h5>{message}</h5>
          </div>
          <div className="fixed-action-btn btn-floating-div">
            <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a game" onClick={this.addGame}>
              <i className="large material-icons">add</i>
            </button>
          </div>
        </div>
      );
    }
    return(
      <div className="container">
        <ul className="collection">{this.props.gameList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className="btn-floating btn-large green tooltipped" data-position="left" data-tooltip="Add a game" onClick={this.addGame}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}

module.exports=GameList;
