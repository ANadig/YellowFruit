var React = require('react');
var $ = jQuery = require('jquery');

class TeamList extends React.Component{

  constructor(props) {
    super(props);
    this.addTeam = this.addTeam.bind(this);
  }

  addTeam () {
    this.props.openModal();
  }


  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return null;
    }
    return(
      <div className="container">
        <h2>List of Teams</h2>
        <ul className="item-list">{this.props.teamList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className="btn-floating btn-large green" title="Add a team" onClick={this.addTeam}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}

module.exports=TeamList;
