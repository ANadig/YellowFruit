var React = require('react');
var $ = jQuery = require('jquery');
var Path = require('path');

class TeamList extends React.Component{

  constructor(props) {
    super(props);
    this.addTeam = this.addTeam.bind(this);
  }

  //tell the mainInterface to open a new team form
  addTeam () {
    this.props.openModal();
  }

  //add the disabled class if the limit on the number of teams has been reached
  addBtnDisabled() {
    if(this.props.teamList.length > 200) {
      return 'disabled';
    }
    return '';
  }

  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return null;
    }
    if(this.props.teamList.length == 0) {
      return (
        <div className="zero-state-container">
          <div className="qb-zero-state">
            <img src="banana-bunch.png" width="80" height="55"/>
            <h5>Add a team to get started</h5>
          </div>
          <div className="fixed-action-btn btn-floating-div">
            <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a team" onClick={this.addTeam}>
              <i className="large material-icons">add</i>
            </button>
          </div>
        </div>
      );
    }
    return(
      <div className="container">
        <ul className="collection">{this.props.teamList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a team" onClick={this.addTeam}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}

module.exports=TeamList;
