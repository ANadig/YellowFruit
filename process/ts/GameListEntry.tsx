/***********************************************************
GameListEntry.tsx
Andrew Nadig

React component representing one game on the games pane.
***********************************************************/
import * as React from "react";
import { ColorChip } from './ColorChip';
import StatUtils = require('./StatUtils');
import { QbGame, TournamentSettings, WhichTeam, PowerRule } from "./YfTypes";

interface GameListEntryProps {
  game: QbGame;
  onDelete: (whichGame: QbGame) => void;      // called when the user attempts to delete
  onOpenGame: (whichGame: QbGame) => void;    // called when the user opens the game for editing
  onSelectGame: (whichGame: QbGame) => void;  // called when the checkbox is toggled
  selected: boolean;                          // whether the checkbox is selected
  allPhases: string[];                        // list of the tournament's phases
  usingPhases: boolean;                       // whether this tournament has phases
  removePhase: (whichGame: QbGame, phase: string) => void;  // remove a phase from a game
  settings: TournamentSettings;
}

interface GameListEntryState {
  selected: boolean;    // whether the checkbox is selected. Needs to be in both props and
                        //  state because the MainInterface needs to be able to clear the checkbox
}

export class GameListEntry extends React.Component<GameListEntryProps, GameListEntryState>{

  constructor(props: GameListEntryProps) {
    super(props);
    this.state = {
      selected: props.selected
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.editGame = this.editGame.bind(this);
    this.removePhase = this.removePhase.bind(this);
  }

  /**
   * Tell the MainInterface to delete this game
   */
  handleDelete(): void {
    this.props.onDelete(this.props.game);
  }

  /**
   *   If the checkbox is checked, uncheck it, and vice versa
   */
  handleToggle(): void {
    this.props.onSelectGame(this.props.game);
    this.setState({
      selected: !this.state.selected
    });
  }

  /**
   *   Tell the MainInterface to open this game for editing.
   */
  editGame(): void {
    this.props.onOpenGame(this.props.game);
  }

  /**
   *   Remove the specified phase from this game.
   * @param  phase name of the phase
   */
  removePhase(phase: string): void {
    this.props.removePhase(this.props.game, phase);
  }

  /**
   *   Return a string containing the game score
   * @return something like "Round 2: West 305, Central 300 (OT)"
   */
  getScoreString(): string {
    let output = `Round ${this.props.game.round}: `;
    if(this.props.game.forfeit) {
      return `${output}${this.props.game.team1} defeats ${this.props.game.team2} by forfeit`;
    }
    //else not a forfeit
    let winner: string, loser: string;
    if(+this.props.game.score1 >= +this.props.game.score2) {
      winner = this.props.game.team1 + " " + this.props.game.score1
      loser = this.props.game.team2 + " " + this.props.game.score2
    }
    else {
      winner = this.props.game.team2 + ' ' + this.props.game.score2
      loser = this.props.game.team1 + ' ' + this.props.game.score1
    }
    output += winner + ', ' + loser;
    if(+this.props.game.ottu > 0) {
      output += ' (OT)';
    }
    return output;
  }

  /**
   * Statlines for the players who played in this game.
   * @param  whichTeam team 1 or team 2
   * @return something like "Central A: 2/6/1 16.53 PPB"
   */
  getTeamLineScore(whichTeam: WhichTeam): string {
    const teamName = whichTeam == 1 ? this.props.game.team1 : this.props.game.team2;
    const game = this.props.game;
    let lineScore = teamName + ': ';
    if(this.props.settings.powers != PowerRule.None) {
      lineScore += StatUtils.teamPowers(game, whichTeam) + '/';
    }
    lineScore += StatUtils.teamTens(game, whichTeam);
    if(this.props.settings.negs) {
      lineScore += '/' + StatUtils.teamNegs(game, whichTeam);
    }
    if(this.props.settings.bonuses) {
      let bHrd = StatUtils.bonusesHeard(game, whichTeam);
      if(bHrd > 0) {
        let bPts = StatUtils.bonusPoints(game, whichTeam, this.props.settings);
        lineScore += `, ${(bPts/bHrd).toFixed(2)} PPB`;
      }
    }
    return lineScore;
  }

  /**
   * A tag that displays what phase a game belongs to.
   * @param  phase   name of the phase
   * @param  colorNo index in list of phase colors
   * @return         a ColorChip
   */
  getPhaseChip(phase: string, colorNo: number): JSX.Element {
    return (
      <ColorChip key={phase}
        phase = {phase}
        displayTitle = {phase}
        colorNo = {colorNo}
        removeMe = {phase != 'Tiebreaker' ? this.removePhase : null}
      />
    );
  }


  render() {
    const scoreString = this.getScoreString();
    let phaseChips = [];
    let colorNo = 0;
    // phase chips
    for(let p of this.props.allPhases) {
      if(this.props.game.phases.includes(p)) {
        phaseChips.push(this.getPhaseChip(p, colorNo));
      }
      colorNo += 1;
    }
    if(this.props.game.tiebreaker) {
      phaseChips.push(this.getPhaseChip('Tiebreaker', -1));
    }
    //checkbox to select this game
    let checkbox = null;
    if(this.props.usingPhases) {
      checkbox = (
        <label>
          <input type="checkbox" className="filled-in team-checkbox" checked={this.state.selected}
          title="Select to assign phases" onChange={this.handleToggle}/>
          <span>&nbsp;</span>
        </label>
      );
    }

    let lineScore = '';
    if(!this.props.game.forfeit) {
      lineScore = this.getTeamLineScore(1) + '; ' + this.getTeamLineScore(2);
    }

    return(
      <a className="collection-item" onDoubleClick={this.editGame}>
        <div>
          {checkbox}
          <div className="game-name">
            {scoreString}
          </div>
          &emsp;{phaseChips}
          <button className="btn-flat item-edit" title="Edit this game" onClick={this.editGame}>
          <i className="material-icons">edit</i></button>
          <button className="secondary-content btn-flat item-delete" title="Delete this game" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
          <br/><span className="game-line-score">{lineScore}</span>
          <br/><span className="game-comment"><em>{this.props.game.notes}</em></span>
        </div>
      </a>
    );
  }
};
