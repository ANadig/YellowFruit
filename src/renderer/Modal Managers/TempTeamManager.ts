import { createContext } from 'react';
import { Player } from '../DataModel/Player';
import Registration from '../DataModel/Registration';
import { Team } from '../DataModel/Team';
import { teamGetNameAndLetter } from '../Utils/GeneralUtils';
import { NullObjects } from '../Utils/UtilTypes';

export class TempTeamManager {
  /** The registration whose team is being edited */
  tempRegistration: Registration = NullObjects.nullRegistration;

  /** The team being edited */
  tempTeam: Team = NullObjects.nullTeam;

  modalIsOpen: boolean = false;

  dataChangedReactCallback: () => void;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    this.tempRegistration = NullObjects.nullRegistration;
    this.tempTeam = NullObjects.nullTeam;
  }

  openModal(reg?: Registration, team?: Team) {
    this.modalIsOpen = true;
    if (reg && team) {
      this.loadTeam(reg, team);
    } else {
      this.createBlankTeam();
    }
    this.dataChangedReactCallback();
  }

  closeModal() {
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  createBlankTeam() {
    // don't actually put the team in the registration, because we might end up saving to a different registration
    this.tempRegistration = new Registration('');
    this.tempTeam = new Team('');
    this.tempTeam.pushBlankPlayer();
    this.dataChangedReactCallback();
  }

  loadTeam(reg: Registration, team: Team) {
    this.tempRegistration = reg.makeCopy();
    this.tempTeam = team.makeCopy();
    this.tempTeam.pushBlankPlayer();
    this.dataChangedReactCallback();
  }

  /** Once the form is accepted, get the registration we actually need to change (if any), since changing the organization
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

  addExistingTeamsToReg(teams: Team[]) {
    this.tempRegistration.addTeams(teams);
  }

  /** Transfer data from temp object to real object */
  saveRegistration(targetReg: Registration, teamIsNew?: boolean) {
    if (teamIsNew) {
      this.tempRegistration.addTeams(targetReg.teams);
      this.tempRegistration.addTeam(this.tempTeam);
    }
    targetReg.copyFromRegistration(this.tempRegistration);
  }

  /** Transfer data from temp objects to real objects */
  saveTeam(targetReg: Registration, targetTeam: Team) {
    this.saveRegistration(targetReg);
    targetTeam.copyFromTeam(this.tempTeam);
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
    this.tempTeam.players.push(new Player(''));
    this.dataChangedReactCallback();
  }

  changePlayerName(playerIdx: number, newName: string) {
    const trimmedName = newName.trim();
    this.tempTeam.players[playerIdx].name = trimmedName;
    this.dataChangedReactCallback();
  }

  changePlayerYear(playerIdx: number, newYear: string) {
    const trimmedYear = newYear.trim();
    this.tempTeam.players[playerIdx].yearString = trimmedYear;
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

  cleanUpTeamForSaving() {
    this.tempTeam.removeNullPlayers();
  }
}

export const TeamEditModalContext = createContext<TempTeamManager>(new TempTeamManager());
