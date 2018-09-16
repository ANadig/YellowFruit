var React = require('react');
var $ = jQuery = require('jquery');
var Path = require('path');

class TeamList extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      orderBy: 'alpha'
    };
    this.addTeam = this.addTeam.bind(this);
    this.groupByDivision = this.groupByDivision.bind(this);
    this.alphaSort = this.alphaSort.bind(this);
  }

  //tell the mainInterface to open a new team form
  addTeam () {
    this.props.openModal();
  }

  groupByDivision() {
    this.props.sortTeamsBy('division');
    this.setState({
      orderBy: 'division'
    });
  }

  alphaSort() {
    this.props.sortTeamsBy('alpha');
    this.setState({
      orderBy: 'alpha'
    });
  }

  selectedString() {
    if(this.props.numberSelected == 0) { return ''; }
    return this.props.numberSelected + ' selected';
  }

  btnToggled(orderBy) {
    if(this.state.orderBy == orderBy) {
      return 'blue accent-1';
    }
    return 'grey lighten-4';
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
      var message;
      if(this.props.totalTeams == 0) {
        message = 'Add a team to get started';
      }
      else { //there are teams, but they've all been excluded based on the search
        message = 'Your search did not match any teams';
      }
      return (
        <div className="zero-state-container">
          <div className="qb-zero-state">
            <img src="banana-bunch.png" width="80" height="55"/><br/><br/>
            <h6>{message}</h6>
          </div>
          <div className="fixed-action-btn btn-floating-div">
            <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()} data-position="left" data-tooltip="Add a team" onClick={this.addTeam}>
              <i className="large material-icons">add</i>
            </button>
          </div>
        </div>
      );
    }
    var sortButtons;
    if(this.props.usingDivisions) {
      sortButtons = (
        <div className="sort-buttons">
          <a className={'waves-effect waves-light btn-flat toggle-left ' + this.btnToggled('division')}
          title="Group teams by this phase's division" onClick={this.groupByDivision}>
            <i className="material-icons left">view_day</i>Group
          </a>
          <a className={'waves-effect waves-light btn-flat toggle-right ' + this.btnToggled('alpha')}
          onClick={this.alphaSort}>
            <i className="material-icons left">sort_by_alpha</i>Sort
          </a>&emsp;
          {this.selectedString()}
        </div>
      );
    }
    else {
      sortButtons = ( <div className="sort-buttons"></div> );
    }
    return(
      <div className="container">
        {sortButtons}
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


// <a className="waves-effect waves-light btn-small blue accent-1"
// title="Find teams that don't have a division for this phase">
//   <i className="material-icons left">search</i>No division
// </a>
