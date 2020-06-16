/***********************************************************
HeaderNav.tsx
Andrew Nadig

React component representing the navigation bar at the top.
***********************************************************/
import * as React from 'react';
import * as $ from 'jquery';
import { YfPane, PhaseList } from './YfTypes';

interface HeaderNavProps {
  onSearch: (text: string) => void;
  setPane: (pane: YfPane) => void;
  setPhase: (phase: string) => void;
  whichPaneActive: YfPane;
  viewingPhase: string;
  divisions: PhaseList;
  tbsExist: boolean;
  usingPhases: boolean;
  usingDivisions: boolean;
  openDivModal: () => void;
  openPhaseModal: () => void;
  queryText: string;
}

interface HeaderNavState {
  overflowTabs: boolean;
  queryText: string;
}

export class HeaderNav extends React.Component<HeaderNavProps, HeaderNavState>{

  constructor(props: HeaderNavProps) {
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

  /**
   * Tell the MainInterface to filter teams or games by what's in the search bar
   * @param  e event
   */
  handleSearch(e: any): void {
    const text = e.target.value;
    this.props.onSearch(text);
    this.setState({
      queryText: text
    });
  }

  /**
   * Set pane (settings/teams/games) to what the user has clicked on
   * @param  e event
   */
  setPane(e: any): void {
    this.props.setPane(e.target.id);
  }

  /**
   * Tell the MainInterface to set the active phase. (Affects what divisions are visible)
   * @param  e event
   */
  setPhase(e: any): void {
    this.props.setPhase(e.target.id);
  }

  /**
   * Add a className depending on if the specified pane is currently being viewed.
   * @param   pane settings/teams/etc
   * @return  'active' or ''
   */
  isActive(pane: YfPane): string {
    return this.props.whichPaneActive == pane ? 'active' : '';
  }

  /**
   * Add a className depending on Whether the specified phase is currently active.
   * @param   phase name of the phase
   * @return  'active' or ''
   */
  isViewingPhase(phase: string): string {
    return this.props.viewingPhase == phase ? 'active' : '';
  }

  /**
   * Tell the MainInterface to open the division assignment modal
   */
  openDivModal(): void {
    this.props.openDivModal();
  }

  /**
   * Tell the MainInterface to open the phase assignment modal.
   */
  openPhaseModal(): void {
    this.props.openPhaseModal();
  }

  /**
   * Truncate phase at 15 characters
   * @param  phase  name of phase
   * @return  full name or first 15 characters + '...'
   */
  truncate(phase: string): string {
    if(phase.length <= 15) { return phase; }
    return phase.substr(0,15) + '...';
  }

  /**
   * A button to open the division or phase assignment modal, or no button, depending
   * on which pane is visible.
   * @return  Button element, or null
   */
  getAssignmentButton(): JSX.Element {
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

  /**
   * Tabs on the bottom of the navbar for pickig which phase is active
   * @return  div element containing the tabs
   */
  phaseTabs(): JSX.Element {
    const allPhasesTab = (
      <li key={'all'} className={'tab ' + this.isViewingPhase('all')}>
        <a id={'all'} onClick={this.setPhase}>All Games</a>
      </li>
    );
    let tabList = [allPhasesTab];
    for(let phase in this.props.divisions) {
      if(phase != 'noPhase') {
        let oneTab = (
          <li key={phase} className={'tab ' + this.isViewingPhase(phase)} title={phase}>
            <a id={phase} onClick={this.setPhase}>{this.truncate(phase)}</a>
          </li>
        );
        tabList.push(oneTab);
      }
    }
    if(this.props.tbsExist) {
      tabList.push((
        <li key={'Tiebreakers'} className={'tab ' + this.isViewingPhase('Tiebreakers')}>
          <a id={'Tiebreakers'} onClick={this.setPhase}>Tiebreakers</a>
        </li>
      ));
    }
    const skinny = this.state.overflowTabs ? '' : ' skinny-tabs';
    return (
      <div className="nav-content">
        <ul className={'tabs tabs-transparent' + skinny} id="phase-tabs">
          {tabList}
        </ul>
      </div>
    );
  }//phaseTabs

  /**
   * re-render if the phase tabs have just started or stopped overflowing
   */
  adjustTabs() {
    const tabs = $('#phase-tabs')[0];
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

  /**
   * Lifecycle method
   * @param  _prevProps unused
   */
  componentDidUpdate(_prevProps: any): void {
    this.adjustTabs();
  }

  /**
   * Lifecycle method
   */
  componentDidMount(): void {
    this.adjustTabs();
  }



  render() {
    let phaseTabs = null;
    if(this.props.usingPhases || this.props.tbsExist) {
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
              <li className={this.isActive(YfPane.Settings)}><a id="settingsPane" onClick={this.setPane}>Settings</a></li>
              <li className={this.isActive(YfPane.Teams)}><a id="teamsPane" onClick={this.setPane}>Teams</a></li>
              <li className={this.isActive(YfPane.Games)}><a id="gamesPane" onClick={this.setPane}>Games</a></li>
              <li>
                <div className="input-field qb-search">
                  <input id="search" className="qb-search-input form-control" type="text" value={this.state.queryText}
                  onChange={this.handleSearch} placeholder="Search" aria-label="Search" />
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
