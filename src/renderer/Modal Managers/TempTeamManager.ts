import { createContext } from 'react';
import Registration from '../DataModel/Registration';
import { Team } from '../DataModel/Team';
import { nextAlphabetLetter, teamGetNameAndLetter } from '../Utils/GeneralUtils';
import { NullObjects } from '../Utils/UtilTypes';
import { Player } from '../DataModel/Player';
import Tournament, { NullTournament } from '../DataModel/Tournament';

export class TempTeamManager {
  /** The registration whose team is being edited */
  tempRegistration: Registration = NullObjects.nullRegistration;

  /** The team being edited */
  tempTeam: Team = NullObjects.nullTeam;

  tournament: Tournament = NullTournament;

  modalIsOpen: boolean = false;

  errorDialogIsOpen: boolean = false;

  errorDialogContents: string[] = [];

  teamHasPlayed: boolean = false;

  /** Which players on this team have played, ever? */
  playersWithGameData: Player[] = [];

  dataChangedReactCallback: () => void;

  /** An arbitrary number to change each time open or reset the form. Used by some components to know when to reset/recompute */
  sessionID: number = 0;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.tempRegistration = NullObjects.nullRegistration;
    this.tempTeam = NullObjects.nullTeam;
  }

  /**
   * Get the form ready, and open it
   * @param reg Existing registration to edit. Required if team is provided
   * @param team Existing team to edit
   * @param letter Letter to assign to a new team. Ignored if team is provided
   */
  openModal(reg?: Registration, team?: Team, letter?: string) {
    this.modalIsOpen = true;
    if (team && !reg) return; // not allowed

    if (reg) {
      this.loadRegistration(reg);
    } else {
      this.createBlankRegistration();
    }

    if (team) {
      this.loadTeam(team);
      this.teamHasPlayed = this.tournament.teamHasPlayedAnyMatch(team);
      this.playersWithGameData = this.tournament.getPlayersWithData(team);
    } else {
      this.createBlankTeam(letter);
    }

    this.makeTeamName();
    this.sessionID++;
    this.dataChangedReactCallback();
  }

  /** Returns true if we can save the data */
  preSaveValidation() {
    if (!this.teamHasPlayed) {
      this.tempTeam.removeNullPlayers();
    }
    this.tempRegistration.validateAll();
    this.tempTeam.validateAll();
    const errs = this.tempRegistration.getErrorMessages().concat(this.tempTeam.getErrorMessages());
    if (errs.length > 0) {
      if (!this.teamHasPlayed) {
        this.tempTeam.pushBlankPlayer();
      }
      this.openErrorDialog(errs);
      return false;
    }
    return true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  /** Clear the form and leave it open so another team can be entered */
  resetForNewTeam() {
    this.openModal();
  }

  /** Clear the form but then populate, e.g., "Central B" if we just saved "Central A" */
  resetAndNextLetter(reg: Registration) {
    this.openModal(reg, undefined, nextAlphabetLetter(this.tempTeam.letter));
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

  createBlankRegistration() {
    this.tempRegistration = new Registration('');
    this.dataChangedReactCallback();
  }

  createBlankTeam(letter: string | undefined) {
    // don't actually put the team in the registration, because we might end up saving to a different registration
    this.tempTeam = new Team('');
    if (letter) {
      this.tempTeam.letter = letter;
      this.makeTeamName();
    }
    this.tempTeam.pushBlankPlayer();
    this.dataChangedReactCallback();
  }

  loadRegistration(reg: Registration) {
    this.tempRegistration = reg.makeCopy();
  }

  loadTeam(team: Team) {
    this.tempTeam = team.makeCopy();
    this.tempTeam.pushBlankPlayer();
    this.dataChangedReactCallback();
  }

  /** When the team name is changed to match some other registration, load data from that registration */
  copyDataFromOtherRegistration(regThatWasOpened: Registration | null, allRegistrations: Registration[]) {
    const matchingReg = this.getRegistrationToSaveTo(regThatWasOpened, allRegistrations);
    if (matchingReg === null) return;
    if (matchingReg === regThatWasOpened) return;

    this.tempRegistration.isSmallSchool = matchingReg.isSmallSchool;
    this.dataChangedReactCallback();
  }

  /** Get the registration we would actually need to change (if any), since changing the organization
   *  name can switch which regitration we're editing. Returns null if we should create a new registration.
   */
  getRegistrationToSaveTo(
    regThatWasOpened: Registration | null,
    allRegistrations: Registration[],
  ): Registration | null {
    if (this.tempRegistration.name === regThatWasOpened?.name) {
      return regThatWasOpened;
    }
    const matchingReg = allRegistrations.find((val) => val.name === this.tempRegistration.name);
    if (matchingReg === undefined) return null;

    return matchingReg;
  }

  /**
   * Transfer data from temp object to real object
   * @param targetReg real Registration object to save to
   * @param teamIsNew is this team new to this Registration? (regardless of whether it previously existed on another Registration)
   */
  saveRegistration(targetReg: Registration, teamIsNew?: boolean) {
    if (teamIsNew) {
      this.tempRegistration.teams = [];
      if (targetReg.teams.length === 1 && this.tempTeam.letter === 'B') {
        targetReg.teams[0].makeThisTheATeam();
      }
      this.tempRegistration.addTeams(targetReg.teams);
      this.tempRegistration.addTeam(this.tempTeam);
    }
    targetReg.copyFromRegistration(this.tempRegistration);
    targetReg.sortTeams();
  }

  /** Transfer data from temp objects to real objects */
  saveTeam(targetReg: Registration, targetTeam: Team) {
    this.saveRegistration(targetReg);
    targetTeam.copyFromTeam(this.tempTeam, 'restoreSource');
  }

  changeTeamName(name: string) {
    const trimmedName = name.trim();
    if (this.tempTeam.letter === '') {
      const [orgName, letter] = teamGetNameAndLetter(trimmedName);
      this.tempRegistration.name = orgName;
      this.tempTeam.letter = letter;
    } else {
      this.tempRegistration.name = trimmedName;
    }
    this.tempRegistration.validateName();
    this.tempTeam.validateLetter();
    this.makeTeamName();
    this.dataChangedReactCallback();
  }

  /** Keep the official team name, which is not directly edited, up to date */
  makeTeamName() {
    const teamLetter = this.tempTeam.letter;
    const orgName = this.tempRegistration.name;
    this.tempTeam.name = teamLetter === '' ? orgName : `${orgName} ${teamLetter}`;
  }

  changeTeamLetter(letter: string) {
    let trimmedStr = letter.trim();
    if (trimmedStr.length === 1) trimmedStr = trimmedStr.toLocaleUpperCase();
    this.tempTeam.letter = trimmedStr;
    this.tempTeam.validateLetter();
    this.makeTeamName();
    this.dataChangedReactCallback();
  }

  changeSS(checked: boolean) {
    this.tempRegistration.isSmallSchool = checked;
    this.dataChangedReactCallback();
  }

  changeJV(checked: boolean) {
    this.tempTeam.isJV = checked;
    this.dataChangedReactCallback();
  }

  changeUG(checked: boolean) {
    this.tempTeam.isUG = checked;
    this.dataChangedReactCallback();
  }

  changeD2(checked: boolean) {
    this.tempTeam.isD2 = checked;
    this.dataChangedReactCallback();
  }

  addEmptyPlayer() {
    this.tempTeam.pushBlankPlayer();
    this.dataChangedReactCallback();
  }

  changePlayerName(playerIdx: number, newName: string) {
    const trimmedName = newName.trim();
    const player = this.tempTeam.players[playerIdx];
    if (!player) return;

    player.name = trimmedName;
    player.validateName(this.teamHasPlayed && !!player.sourcePlayer);
    this.tempTeam.validatePlayerUniqueness();
    this.dataChangedReactCallback();
  }

  changePlayerYear(playerIdx: number, newYear: string) {
    let trimmedYear = newYear.trim();
    trimmedYear = trimmedYear.charAt(0).toLocaleUpperCase() + trimmedYear.slice(1);
    const player = this.tempTeam.players[playerIdx];
    player.yearString = trimmedYear;
    player.validateYearString();
    this.dataChangedReactCallback();
  }

  changePlayerUG(playerIdx: number, checked: boolean) {
    this.tempTeam.players[playerIdx].isUG = checked;
    this.dataChangedReactCallback();
  }

  changePlayerD2(playerIdx: number, checked: boolean) {
    this.tempTeam.players[playerIdx].isD2 = checked;
    this.dataChangedReactCallback();
  }

  deletePlayer(playerIdx: number) {
    this.tempTeam.players.splice(playerIdx, 1);
    this.dataChangedReactCallback();
  }

  checkForDuplicateTeam(allRegistrations: Registration[], originalTeamOpened: Team | null) {
    const matchingReg = allRegistrations.find(
      (val) => val.name.toLocaleUpperCase() === this.tempRegistration.name.toLocaleUpperCase(),
    );
    if (!matchingReg) {
      this.tempTeam.setDuplicateStatus(false);
      return;
    }

    const matchingTeam = matchingReg.teams.find((tm) => tm.letter === this.tempTeam.letter);
    const isDup = matchingTeam !== undefined && matchingTeam !== originalTeamOpened;
    this.tempTeam.setDuplicateStatus(isDup);
  }
}

export const TeamEditModalContext = createContext<TempTeamManager>(new TempTeamManager());
