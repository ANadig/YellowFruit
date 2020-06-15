/***********************************************************
GameList.tsx
Andrew Nadig

React component representing the list of games on the games
pane.
***********************************************************/
import * as React from "react";
import { YfPanes } from "./YfTypes";

interface GameListProps {
  whichPaneActive: YfPanes;
  gameList: JSX.Element[];
  openModal: () => void;
  numberOfTeams: number;
  totalGames: number;
  numberSelected: number;
}

export class GameList extends React.Component<GameListProps, {}>{

  readonly MAX_ALLOWED_GAMES = 900; // PACE NSC is something like 770-780 games.

  constructor(props: GameListProps) {
    super(props);
    this.addGame = this.addGame.bind(this);
  }

  /**
   * Tell the MainInterface to open the game entry modal.
   */
  addGame (): void {
    this.props.openModal();
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
    if (this.props.whichPaneActive != YfPanes.Games) {
      return null;
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
        {this.selectedCounter()}
        <div className="list-header">
        </div>
        {this.gameCountDisplay()}
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
