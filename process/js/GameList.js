var React = require('react');

class GameList extends React.Component{

  constructor(props) {
    super(props);
    this.addGame = this.addGame.bind(this);
  }

  addGame () {
    this.props.openModal();
  }

  render () {
    if (this.props.whichPaneActive != 'gamesPane') {
      return null;
    }
    return(
      <div className="container">
       <div className="row">
         <div className="appointments col-sm-12">
           <h2 className="appointments-headline">List of Games</h2>
           <ul className="item-list media-list">{this.props.gameList}</ul>
           <button type="button" className="btn btn-success" onClick={this.addGame}>Add Game</button>
         </div>
       </div>
      </div>
    )
  }

}

module.exports=GameList;
