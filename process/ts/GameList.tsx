/***********************************************************
GameList.tsx
Andrew Nadig

React component representing the list of games on the games
pane.
***********************************************************/
import * as React from "react";
import { YfPane, YfGame } from "./YfTypes";

interface GameListProps {
  whichPaneActive: YfPane;      // which pane user is viewing. Render method short-circuits if not Games
  gameList: JSX.Element[];      // List of GameListEntry s to show
  openModal: (addOrEdit: 'add' | 'edit', gameToLoad: YfGame) => void;        // tell MainInterface to open the game add modal
  numberOfTeams: number;        // total number of teams in the file
  totalGames: number;           // total number of games in the file
  numberSelected: number;       // number of games currently selected
  defaultRound: number;         // default round number for new games
  setDefaultRound: (roundNo: number) => void;
  errors: number;               // number of invalid games
  warnings: number;             // number of valid games with validation messages
  changeBadgeFilter: (badge: string) => void; // filter to all errors or warnings
  activeBadgeFilter: 'errors' | 'warnings'   // which badge filter is currently active
}

export class GameList extends React.Component<GameListProps, {}>{

  readonly MAX_ALLOWED_GAMES = 900; // PACE NSC is something like 770-780 games.

  constructor(props: GameListProps) {
    super(props);
    this.addGame = this.addGame.bind(this);
    this.handleRoundChange = this.handleRoundChange.bind(this);
    this.badgeFilter = this.badgeFilter.bind(this);
  }

  /**
   * Tell the MainInterface to open the game entry modal.
   */
  addGame (): void {
    this.props.openModal('add', null);
  }

  /**
   * Update state when the value in the Current Round field changes
   * @param  {any} e               event
   */
  handleRoundChange(e: any): void {
    const rawValue = e.target.value;
    const roundNo = rawValue === '' ? null : +rawValue;
    this.props.setDefaultRound(roundNo);
  }

  /**
   * A chip that displays the count of how many games are selected
   * @return A Materialize chip
   */
  selectedCounter(): JSX.Element {
    const sel = this.props.numberSelected;
    if(sel == 0) { return null; }
    return (
      <div className="chip z-depth-2 selected-counter">
        {`${sel} game${(sel>1 ? 's' : '')} selected`}
      </div>
    );
  }

  /**
   * Badge that shows the number of invalid games
   */
  errorBadge(): JSX.Element {
    const errors = this.props.errors;
    if(errors < 1) { return null; }
    const caption = errors == 1 ? 'Error' : 'Errors';
    const shade = this.props.activeBadgeFilter == 'warnings' ? 'lighten-4' : 'darken-4';
    const active = this.props.activeBadgeFilter == 'errors' ? 'active' : '';
    return ( <span className={`new badge red ${shade} ${active}`} id="errors" onClick={this.badgeFilter}
      title="Show only games with errors" data-badge-caption={caption}>{errors}</span> );
  }

  /**
   * Badge that shows the number of valid games with validation warnings
   */
  warningBadge(): JSX.Element {
    const warnings = this.props.warnings;
    if(warnings < 1) { return null; }
    const caption = warnings == 1 ? 'Warning' : 'Warnings';
    const shade = this.props.activeBadgeFilter == 'errors' ? 'lighten-4' : 'accent-4';
    const textColor = this.props.activeBadgeFilter == 'errors' ? 'grey-text text-lighten-1' : 'black-text';
    const active = this.props.activeBadgeFilter == 'warnings' ? 'active' : '';
    return ( <span className={`new badge yellow ${shade} ${textColor} ${active}`} id="warnings" onClick={this.badgeFilter}
      title="Show only games with warnings" data-badge-caption={caption}>{warnings}</span> );
  }

  /**
   * Determine whether we're filtering by a badge that doesn't exist anymore
   */
  badBadgeFilterState(): boolean {
    return (this.props.activeBadgeFilter == 'errors' && this.props.errors === 0) ||
      (this.props.activeBadgeFilter == 'warnings' && this.props.warnings === 0);
  }

  /**
   * Filter the list of games to the ones with warnings or errors
   * @param  {[type]} e               event
   */
  badgeFilter(e: any): void {
    this.props.changeBadgeFilter(e.target.id);
  }

  /**
   * Display how many games are being shown to the user.
   * @return span with the text
   */
  gameCountDisplay(): JSX.Element {
    const total = this.props.totalGames;
    const showing = this.props.gameList.length;
    if(showing == total) {
      return ( <span>Showing all {total} games</span> );
    }
    return ( <span>Showing {showing} of {total} games</span> );
  }

  /**
   * Disabled attribute for the add game button if the limit on the number of games
   * has been reached, or if there aren't yet two teams to make a game with
   * @return  'disabled' or ''
   */
  addBtnDisabled(): string {
    if(this.props.gameList.length > this.MAX_ALLOWED_GAMES || this.props.numberOfTeams < 2) {
      return 'disabled';
    }
    return '';
  }

  render () {
    if (this.props.whichPaneActive != YfPane.Games) {
      return null;
    }

    const defaultRound = this.props.defaultRound;
    const defRndFieldVal = defaultRound === null ? '' : defaultRound.toString();

    if(this.badBadgeFilterState()) {
      this.props.changeBadgeFilter(null);
    }

    // zero-state display for when there are no games.
    if(this.props.gameList.length == 0) {
      let message: string;
      if(this.props.numberOfTeams < 2) {
        message = 'Add more teams to get started';
      }
      else if(this.props.totalGames == 0) {
        message = 'Add a game to get started';
      }
      else { //there are games, but they've all been excluded based on the search
        message = 'Your search did not match any games'
      }
      return (
        <div className="zero-state-container">
          {this.selectedCounter()}
          <div className="qb-zero-state">
            <img src="banana-bunch.png" width="80" height="55"/><br/><br/>
            <h6>{message}</h6>
          </div>
          <div className="fixed-action-btn btn-floating-div">
            <button className={'btn-floating btn-large green tooltipped ' + this.addBtnDisabled()}
              data-position="left" data-tooltip="Add a game" onClick={this.addGame}>
              <i className="large material-icons">add</i>
            </button>
          </div>
        </div>
      );
    }
    return(
      <div className="container">
        <div className="list-header">
        </div>
        <div className="game-list-header">
          {this.selectedCounter()}
          {this.gameCountDisplay()}
          {this.errorBadge()}
          {this.warningBadge()}
          <span className="default-round">
            Current round:&nbsp;
            <div className="input-field">
              <input id="defaultRound" type="number" name="defaultRound"
                min="1" max="1000" step="1"
                value={defRndFieldVal} onChange={this.handleRoundChange}/>
            </div>
            <i className="material-icons tiny"
              title="Set the default round for new games. You can increment this field throughout the tournament as you enter each round.">
              help_outline</i>
          </span>
        </div>

        <br/>

        <ul className="collection game-list">{this.props.gameList}</ul>
        <div className="fixed-action-btn btn-floating-div">
          <button className="btn-floating btn-large green tooltipped" data-position="left" data-tooltip="Add a game" onClick={this.addGame}>
            <i className="large material-icons">add</i>
          </button>
        </div>
      </div>
    )
  }

}
