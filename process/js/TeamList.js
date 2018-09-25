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

  selectedCounter() {
    var sel = this.props.numberSelected;
    if(sel == 0) { return null; }
    return (
      <div className="chip z-depth-2 selected-counter">
        {sel + ' team' + (sel>1 ? 's' : '') + ' selected'}
      </div>
    );
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

  teamCountDisplay() {
    var total = this.props.totalTeams;
    var showing = this.props.teamList.length;
    if(showing == total) {
      return ( <span>Showing all {total} teams</span> );
    }
    return ( <span>Showing {showing} of {total} teams</span> );
  }




  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return null;
    }

    var listHeader;
    var selectedCounter = null;
    if(this.props.usingDivisions) {
      listHeader = (
        <div className="list-header">
          <a className={'waves-effect waves-light btn-flat toggle-left ' + this.btnToggled('division')}
          title="Group teams by this phase's division" onClick={this.groupByDivision}>
            <i className="material-icons left">view_day</i>Group
          </a>
          <a className={'waves-effect waves-light btn-flat toggle-right ' + this.btnToggled('alpha')}
          onClick={this.alphaSort}>
            <i className="material-icons left">sort_by_alpha</i>Sort
          </a>&emsp;
          {this.teamCountDisplay()}
        </div>
      );
      selectedCounter = this.selectedCounter();
    }

    else {
      listHeader = ( <div className="list-header">{this.teamCountDisplay()}</div> );
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
          {selectedCounter}
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
    }//if there are no teams to display

    return(
      <div className="container">
        {selectedCounter}
        {listHeader}
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
