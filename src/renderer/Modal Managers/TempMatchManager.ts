import { createContext } from 'react';
import { LeftOrRight, NullObjects } from '../Utils/UtilTypes';
import { Match } from '../DataModel/Match';
import { Team } from '../DataModel/Team';
import Tournament, { NullTournament } from '../DataModel/Tournament';
import { Phase, PhaseTypes } from '../DataModel/Phase';
import { MatchValidationType } from '../DataModel/MatchValidationMessage';
import { MatchPlayer } from '../DataModel/MatchPlayer';
import { PlayerAnswerCount } from '../DataModel/PlayerAnswerCount';
import { textFieldChanged } from '../Utils/GeneralUtils';
import { Round } from '../DataModel/Round';

export class TempMatchManager {
  /** The Match being edited */
  tempMatch: Match = NullObjects.nullMatch;

  tournament: Tournament = NullTournament;

  /** Round number of the match being edited */
  roundNumber?: number;

  /** round containing the match being edited */
  round?: Round;

  /** The round the match belonged to at the time the user opened it */
  originalRoundOpened?: Round;

  /** Error to print next to the round field */
  roundFieldError?: string;

  /** Which phase the match currently belongs to based on its round (ignoring carryover) */
  phase?: Phase;

  modalIsOpen: boolean = false;

  errorDialogIsOpen: boolean = false;

  errorDialogContents: string[] = [];

  dataChangedReactCallback: () => void;

  constructor(tourn?: Tournament) {
    if (tourn) this.tournament = tourn;
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    delete this.round;
    delete this.phase;
    delete this.roundFieldError;
  }

  /**
   * Get the form ready, and open it
   * @param match Existing match to edit, if any
   * @param round Round number to pre-populate
   * @param leftTeam Team to pre-populate in the left slot
   * @param rightTeam Team to pre-populate in the right slot
   */
  openModal(match?: Match, round?: Round, leftTeam?: Team, rightTeam?: Team) {
    this.modalIsOpen = true;
    this.round = round;
    if (round) this.phase = this.tournament.whichPhaseIsRoundIn(round);
    this.roundNumber = this.phase?.usesNumericRounds() ? round?.number : undefined;
    if (match) {
      this.loadMatch(match);
      this.originalRoundOpened = round;
    } else {
      this.createBlankMatch();
      if (leftTeam) this.setTeam('left', leftTeam);
      if (rightTeam) this.setTeam('right', rightTeam);
    }

    if (this.phase?.phaseType === PhaseTypes.Tiebreaker) this.tempMatch.tiebreaker = true;
    if (this.roundNumber !== undefined) this.validateRoundNo();
    this.dataChangedReactCallback();
  }

  createBlankMatch() {
    this.tempMatch = new Match();
    if (!this.tournament.scoringRules.timed) {
      this.tempMatch.tossupsRead = this.tournament.scoringRules.regulationTossupCount;
    }
    this.dataChangedReactCallback();
  }

  private loadMatch(match: Match) {
    this.tempMatch = match.makeCopy();
    this.tempMatch.leftTeam.addNewPlayers(this.tournament.scoringRules.answerTypes);
    this.tempMatch.rightTeam.addNewPlayers(this.tournament.scoringRules.answerTypes);
  }

  /** Transfer data from temp objects to real objects */
  saveExistingMatch(targetMatch: Match) {
    this.tempMatch.clearInactivePlayers();
    if (!!this.round && !!this.originalRoundOpened && this.round !== this.originalRoundOpened) {
      this.originalRoundOpened.deleteMatch(targetMatch);
      this.tournament.addMatch(targetMatch, this.round);
    }
    targetMatch.copyFromMatch(this.tempMatch);
  }

  saveNewMatch() {
    if (this.round === undefined) return;
    this.tempMatch.clearInactivePlayers();
    this.tournament.addMatch(this.tempMatch, this.round);
  }

  closeModal() {
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  /** Clear the form and leave it open so another match can be entered */
  resetForNewMatch() {
    this.openModal(undefined, this.round);
  }

  /** Returns true if we can save the data */
  preSaveValidation() {
    if (this.tempMatch.isForfeit()) {
      this.tempMatch.leftTeam.matchPlayers = [];
      this.tempMatch.rightTeam.matchPlayers = [];
    }
    this.tempMatch.validateAll(this.tournament.scoringRules);
    this.validateTeamPools(false);
    let errors: string[] = [];
    if (this.roundFieldError) errors.push(`Round number: ${this.roundFieldError}`);
    errors = errors.concat(this.tempMatch.getErrorMessages());
    if (errors.length > 0) {
      this.openErrorDialog(errors);
      return false;
    }
    return true;
  }

  setRoundNo(val: string) {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      if (val === '') {
        this.roundNumber = undefined;
      } // else don't change it (revert to last valid value)
    } else {
      this.roundNumber = parsed;
      this.removeBadCarryoverPhase();
    }
    this.setPhaseAndRound();
    this.validateRoundNo();
    this.dataChangedReactCallback();
    return this.roundNumber;
  }

  /** If the match's round is listed in its carryover phases, remove that phase from the list */
  removeBadCarryoverPhase() {
    if (this.round === undefined) return;
    const newPhase = this.tournament.whichPhaseIsRoundIn(this.round);
    if (newPhase === undefined) return;
    this.tempMatch.carryoverPhases = this.tempMatch.carryoverPhases.filter((ph) => ph !== newPhase);
  }

  validateRoundNo() {
    if (this.phase && !this.phase.usesNumericRounds()) {
      delete this.roundFieldError;
      return;
    }
    if (this.roundNumber === undefined && !this.round) {
      this.roundFieldError = 'Round number is required';
      return;
    }
    if (!this.round) {
      this.roundFieldError = 'This round number is not a part of any Phase';
      return;
    }
    delete this.roundFieldError;
    this.validateTeamPools(false);
  }

  /** Find Phase and Round objects, given the current round number */
  setPhaseAndRound() {
    if (this.roundNumber === undefined) return;
    this.phase = this.tournament.whichPhaseIsRoundNumberIn(this.roundNumber);
    this.round = this.phase?.getRound(this.roundNumber);
  }

  getAvailableCarryOverPhases() {
    if (this.phase && !this.phase.isFullPhase()) return [];

    const playoffPhases = this.tournament.getPlayoffPhases();
    if (this.round === undefined) return playoffPhases;

    const curPhase = this.tournament.whichPhaseIsRoundIn(this.round);
    return playoffPhases.filter((ph) => ph !== curPhase);
  }

  setCarryoverPhases(phaseNames: string[]) {
    const phases: Phase[] = [];
    for (const str of phaseNames) {
      const matchingPhase = this.tournament.findPhaseByName(str);
      if (matchingPhase) phases.push(matchingPhase);
    }
    this.tempMatch.carryoverPhases = phases;
    this.dataChangedReactCallback();
  }

  setTotalTuh(val: string): number | undefined {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      this.tempMatch.tossupsRead = undefined;
    } else {
      this.tempMatch.tossupsRead = parsed;
    }
    if (this.tempMatch.tossupsRead !== undefined) {
      this.tempMatch.fillInTossupsHeard(this.tournament.scoringRules.maximumPlayersPerTeam, this.tempMatch.tossupsRead);
    }
    this.tempMatch.validateTotalTuh(this.tournament.scoringRules);
    this.tempMatch.validateTotalBuzzes();
    this.tempMatch.validateAllMatchPlayersTuh(this.tournament.scoringRules);
    this.dataChangedReactCallback();
    return this.tempMatch.tossupsRead;
  }

  getSelectedTeam(whichTeam: LeftOrRight): Team | undefined {
    if (whichTeam === 'left') return this.tempMatch.leftTeam.team;
    return this.tempMatch.rightTeam.team;
  }

  teamSelectChangeTeam(whichTeam: LeftOrRight, teamName: string) {
    const oldTeam = this.tempMatch.getMatchTeam(whichTeam).team;
    const oldScore = this.tempMatch.getMatchTeam(whichTeam).points;
    const matchingTeam = this.tournament.findTeamByName(teamName);
    if (!matchingTeam) {
      this.tempMatch.clearTeam(whichTeam);
      this.dataChangedReactCallback();
      return;
    }
    if (oldTeam === matchingTeam) return;

    this.setTeam(whichTeam, matchingTeam, oldScore);
    this.tempMatch.validateTeams();
    this.validateTeamPools(true);
    this.dataChangedReactCallback();
  }

  setTeam(whichTeam: LeftOrRight, team: Team, score?: number) {
    const { answerTypes, maximumPlayersPerTeam } = this.tournament.scoringRules;
    this.tempMatch.setTeam(whichTeam, team, answerTypes, maximumPlayersPerTeam, this.tempMatch.tossupsRead, score);
  }

  validateTeamPools(unSuppress: boolean) {
    const leftTeam = this.tempMatch.leftTeam.team;
    const rightTeam = this.tempMatch.rightTeam.team;
    let valid = true;
    if (leftTeam && rightTeam && this.round !== undefined && leftTeam !== rightTeam) {
      const leftPool = this.tournament.findPoolWithTeam(leftTeam, this.round);
      const rightPool = this.tournament.findPoolWithTeam(rightTeam, this.round);
      if (leftPool && rightPool && leftPool !== rightPool) {
        valid = false;
      }
    }
    this.tempMatch.setSamePoolValidation(valid, unSuppress);
  }

  setTeamScore(whichTeam: LeftOrRight, val: string): number | undefined {
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    this.tempMatch.setTeamScore(whichTeam, valToSave);
    this.tempMatch.validateMatchTeams(this.tournament.scoringRules);
    this.dataChangedReactCallback();
    return valToSave;
  }

  setPlayerTuh(mPlayer: MatchPlayer, val: string): number | undefined {
    if (!textFieldChanged(mPlayer.tossupsHeard?.toString() || '', val)) return mPlayer.tossupsHeard;
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    mPlayer.tossupsHeard = valToSave;
    this.tempMatch.validatePlayerTuh(mPlayer);
    this.tempMatch.validateAllMatchPlayersTuh(this.tournament.scoringRules);
    this.tempMatch.validateMatchTeams(this.tournament.scoringRules);
    this.dataChangedReactCallback();
    return valToSave;
  }

  setPlayerAnswerCount(aCount: PlayerAnswerCount, val: string): number | undefined {
    if (!textFieldChanged(aCount.number?.toString() || '', val)) return aCount.number;
    const parsed = parseInt(val, 10);
    const valToSave = Number.isNaN(parsed) ? undefined : parsed;
    aCount.number = valToSave;
    this.tempMatch.validateMatchTeams(this.tournament.scoringRules);
    this.tempMatch.validateTotalBuzzes();
    this.dataChangedReactCallback();
    return valToSave;
  }

  setForfeit(whichTeam: LeftOrRight, isForfeit: boolean) {
    this.tempMatch.setForfeit(whichTeam, isForfeit);
    if (isForfeit) {
      this.tempMatch.leftTeam.points = undefined;
      this.tempMatch.rightTeam.points = undefined;
      this.tempMatch.tossupsRead = undefined;
    } else {
      if (this.tempMatch.leftTeam.matchPlayers.length === 0 && this.tempMatch.leftTeam.team) {
        this.setTeam('left', this.tempMatch.leftTeam.team);
      }
      if (this.tempMatch.rightTeam.matchPlayers.length === 0 && this.tempMatch.rightTeam.team) {
        this.setTeam('right', this.tempMatch.rightTeam.team);
      }
    }
    this.tempMatch.validateForfeit();
    this.tempMatch.validateTotalTuh(this.tournament.scoringRules);
    this.dataChangedReactCallback();
  }

  suppressValidationMessage(type: MatchValidationType, whichTeam?: LeftOrRight) {
    this.tempMatch.suppressMessageType(type, whichTeam);
    this.dataChangedReactCallback();
  }

  reorderMatchPlayers(whichTeam: LeftOrRight, nameOfPlayerDropped: string, playerDroppedOn: MatchPlayer) {
    if (nameOfPlayerDropped === '') return;
    const matchTeam = this.tempMatch.getMatchTeam(whichTeam);
    const posToMove = matchTeam.matchPlayers.findIndex((mp) => mp.player.name === nameOfPlayerDropped);
    const newPosition = matchTeam.matchPlayers.findIndex((mp) => mp === playerDroppedOn);
    if (posToMove === newPosition || posToMove === -1 || newPosition === -1) return;

    const [playerToMove] = matchTeam.matchPlayers.splice(posToMove, 1);
    matchTeam.matchPlayers.splice(newPosition, 0, playerToMove);
    this.dataChangedReactCallback();
  }

  openErrorDialog(errs: string[]) {
    this.errorDialogIsOpen = true;
    this.errorDialogContents = errs;
    this.dataChangedReactCallback();
  }

  closeErrorDialog() {
    this.errorDialogIsOpen = false;
    this.errorDialogContents = [];
    this.dataChangedReactCallback();
  }
}

export const MatchEditModalContext = createContext<TempMatchManager>(new TempMatchManager());
