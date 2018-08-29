var React = require('react');

class HeaderNav extends React.Component{

  constructor(props) {
    super(props);
    this.handleSort = this.handleSort.bind(this);
    this.handleOrder = this.handleOrder.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.setPane = this.setPane.bind(this);
    this.setPhase = this.setPhase.bind(this);
    this.openDivModal = this.openDivModal.bind(this);
    this.openPhaseModal = this.openPhaseModal.bind(this);
  }

  handleSort(e) {
    this.props.onReOrder(e.target.id, this.props.orderDir);
  } //handleSort

  handleOrder(e) {
    this.props.onReOrder(this.props.orderBy, e.target.id);
  }

  handleSearch(e) {
    this.props.onSearch(e.target.value);
  }

  setPane(e) {
    this.props.setPane(e.target.id);
  }

  setPhase(e) {
    this.props.setPhase(e.target.id);
  }

  isActive(pane) {
    return this.props.whichPaneActive == pane ? 'active' : '';
  }

  isViewingPhase(phase) {
    return this.props.viewingPhase == phase ? 'active' : '';
  }

  openDivModal() {
    this.props.openDivModal();
  }

  openPhaseModal() {
    this.props.openPhaseModal();
  }

  getAssignmentButton() {
    if(this.props.whichPaneActive == 'teamsPane' && this.props.usingDivisions) {
      var tooltip = 'Assign divisions to selected teams';
      return (
        <button className="btn-flat waves-effect yellow-darken-3 tooltipped"
        data-tooltip={tooltip} accessKey="d" onClick={this.openDivModal}>
          Assign <span className="hotkey-underline">D</span>ivisions
        </button> );
    }
    if(this.props.whichPaneActive == 'gamesPane' && this.props.usingPhases) {
      var tooltip = 'Assign phases to selected games';
      return (
        <button className="btn-flat waves-effect yellow-darken-3 tooltipped"
        data-tooltip={tooltip} accessKey="p" onClick={this.openPhaseModal}>
          Assign <span className="hotkey-underline">P</span>hases
        </button> );
    }
    return null;
  }//getAssignmentButton

  //tabs under the navbar for picking which phase you're viewing
  phaseTabs() {
    var allPhasesTab = (
      <li key={'all'} className={'tab ' + this.isViewingPhase('all')}>
        <a id={'all'} onClick={this.setPhase}>All Phases</a>
      </li>
    );
    var tabList = [allPhasesTab];
    for(var phase in this.props.divisions) {
      if(phase != 'noPhase') {
        var oneTab = (
          <li key={phase} className={'tab ' + this.isViewingPhase(phase)}>
            <a id={phase} onClick={this.setPhase}>{phase}</a>
          </li>
        );
        tabList.push(oneTab);
      }
    }
    return (
      <div className="nav-content">
        <ul className="tabs tabs-transparent">
          {tabList}
        </ul>
      </div>
    );
  }//phaseTabs




  render() {
    var phaseTabs = null;
    var numberOfPhases = Object.keys(this.props.divisions).length;
    if(this.props.usingPhases) {
      phaseTabs = this.phaseTabs()
    }

    return(
      <div className="navbar-fixed">
        <nav className="qb-nav nav-extended">
          <div className="nav-wrapper">
            <ul className="left">
              <li>
                {this.getAssignmentButton()}
              </li>
            </ul>
            <ul id="nav-mobile" className="right">
              <li className={this.isActive("settingsPane")}><a id="settingsPane" onClick={this.setPane}>Settings</a></li>
              <li className={this.isActive("teamsPane")}><a id="teamsPane" onClick={this.setPane}>Teams</a></li>
              <li className={this.isActive("gamesPane")}><a id="gamesPane" onClick={this.setPane}>Games</a></li>
              <li>
                <form>
                  <div className="input-field qb-search">
                    <input id="search" className="qb-search-input" type="search" onChange={this.handleSearch} placeholder="Search" autoFocus type="text" className="form-control" aria-label="Search Appointments" />
                  </div>
                </form>
              </li>
            </ul>
          </div>
          {phaseTabs}
        </nav>
      </div>
    ) // return
  }//render
}; //HeaderNav

module.exports = HeaderNav;


/*  TODO: re-implement sorting

    <div className="input-group">
    <div className="input-group-btn">
      <button type="button" className="btn btn-info dropdown-toggle"
        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Sort by: <span className="caret"></span></button>
        <ul className="dropdown-menu dropdown-menu-right">
          <li><a href="#" id="teamName" onClick={this.handleSort}>Team Name {(this.props.orderBy === 'teamName') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li><a href="#" id="roster" onClick={this.handleSort}>Roster {(this.props.orderBy === 'roster') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li role="separator" className="divider"></li>
          <li><a href="#" id="asc" onClick={this.handleOrder}>Asc {(this.props.orderDir === 'asc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li><a href="#" id="desc" onClick={this.handleOrder}>Desc {(this.props.orderDir === 'desc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
        </ul>
    </div>
  </div> */
