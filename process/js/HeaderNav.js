/***********************************************************
HeaderNav.js
Andrew Nadig

React component representing the navigation bar at the top.
***********************************************************/
var React = require('react');
var $ = jQuery = require('jquery');

class HeaderNav extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      overflowTabs: false,
      queryText: props.queryText
    }
    this.handleSearch = this.handleSearch.bind(this);
    this.setPane = this.setPane.bind(this);
    this.setPhase = this.setPhase.bind(this);
    this.openDivModal = this.openDivModal.bind(this);
    this.openPhaseModal = this.openPhaseModal.bind(this);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to filter teams or games by what's
  in the search bar.
  ---------------------------------------------------------*/
  handleSearch(e) {
    var text = e.target.value;
    this.props.onSearch(text);
    this.setState({
      queryText: text
    });
  }

  /*---------------------------------------------------------
  Set pane (settings/teams/games) to what the user has
  clicked on.
  ---------------------------------------------------------*/
  setPane(e) {
    this.props.setPane(e.target.id);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to set the active phase. (Affects
  what divisions are visible)
  ---------------------------------------------------------*/
  setPhase(e) {
    this.props.setPhase(e.target.id);
  }

  /*---------------------------------------------------------
  Whether the specified pane is currently visible.
  ---------------------------------------------------------*/
  isActive(pane) {
    return this.props.whichPaneActive == pane ? 'active' : '';
  }

  /*---------------------------------------------------------
  Whether the specified phase is currently active.
  ---------------------------------------------------------*/
  isViewingPhase(phase) {
    return this.props.viewingPhase == phase ? 'active' : '';
  }

  /*---------------------------------------------------------
  Tell the MainInterface to open the division assignment
  modal.
  ---------------------------------------------------------*/
  openDivModal() {
    this.props.openDivModal();
  }

  /*---------------------------------------------------------
  Tell the MainInterface to open the phase assignment modal.
  ---------------------------------------------------------*/
  openPhaseModal() {
    this.props.openPhaseModal();
  }

  /*---------------------------------------------------------
  A button to open the division or phase assignment modal,
  or no button, depending on which pane is visible.
  ---------------------------------------------------------*/
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

  /*---------------------------------------------------------
  Tabs on the bottom of the navbar for pickig which phase
  is active.
  ---------------------------------------------------------*/
  phaseTabs() {
    var allPhasesTab = (
      <li key={'all'} className={'tab ' + this.isViewingPhase('all')}>
        <a id={'all'} onClick={this.setPhase}>All Games</a>
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
    var skinny = this.state.overflowTabs ? '' : ' skinny-tabs';
    return (
      <div className="nav-content">
        <ul className={'tabs tabs-transparent' + skinny} id="phase-tabs">
          {tabList}
        </ul>
      </div>
    );
  }//phaseTabs

  /*---------------------------------------------------------
  re-render if the phase tabs have just started or stopped
  overflowing
  ---------------------------------------------------------*/
  adjustTabs() {
    var tabs = $('#phase-tabs')[0];
    if(tabs != undefined && tabs.scrollWidth > tabs.clientWidth && !this.state.overflowTabs) {
      this.setState({
        overflowTabs: true
      });
    }
    else if(tabs != undefined && tabs.scrollWidth <= tabs.clientWidth && this.state.overflowTabs) {
      this.setState({
        overflowTabs: false
      });
    }
  }

  /*---------------------------------------------------------
  Lifecyle method
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    this.adjustTabs();
  }

  /*---------------------------------------------------------
  Lifecyle method
  ---------------------------------------------------------*/
  componentDidMount() {
    this.adjustTabs();
  }



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
                <div className="input-field qb-search">
                  <input id="search" className="qb-search-input" type="search" value={this.state.queryText}
                  onChange={this.handleSearch} placeholder="Search" autoFocus type="text"
                  className="form-control" aria-label="Search Appointments" />
                </div>
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
