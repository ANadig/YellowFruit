import { Player } from '../DataModel/Player';
import Registration from '../DataModel/Registration';
import { Team } from '../DataModel/Team';
import { teamGetNameAndLetter } from '../Utils/GeneralUtils';
import { NullObjects } from '../Utils/UtilTypes';

class TempTeamManager {
  /** The registration whose team is being edited */
  tempRegistration: Registration = NullObjects.nullRegistration;

  /** The team being edited */
  tempTeam: Team = NullObjects.nullTeam;

  dataChangedCallback: () => void;

  constructor(callback: () => void) {
    this.dataChangedCallback = callback;
  }

  reset() {
    this.tempRegistration = NullObjects.nullRegistration;
    this.tempTeam = NullObjects.nullTeam;
  }

  createBlankTeam() {
    // don't actually put the team in the registration, because we might end up saving to a different registration
    this.tempRegistration = new Registration('');
    this.tempTeam = new Team('');
    this.tempTeam.pushBlankPlayer();
    this.dataChangedCallback();
  }

  loadTeam(reg: Registration, team: Team) {
    this.tempRegistration = reg.makeCopy();
    this.tempTeam = team.makeCopy();
    this.tempTeam.pushBlankPlayer();
    this.dataChangedCallback();
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
    this.dataChangedCallback();
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
    this.dataChangedCallback();
  }

  changeSS(checked: boolean) {
    this.tempRegistration.isSmallSchool = checked;
    this.dataChangedCallback();
  }

  changeJV(checked: boolean) {
    this.tempTeam.isJV = checked;
    this.dataChangedCallback();
  }

  changeUG(checked: boolean) {
    this.tempTeam.isUG = checked;
    this.dataChangedCallback();
  }

  changeD2(checked: boolean) {
    this.tempTeam.isD2 = checked;
    this.dataChangedCallback();
  }

  addEmptyPlayer() {
    this.tempTeam.players.push(new Player(''));
    this.dataChangedCallback();
  }

  changePlayerName(playerIdx: number, newName: string) {
    const trimmedName = newName.trim();
    this.tempTeam.players[playerIdx].name = trimmedName;
    this.dataChangedCallback();
  }

  changePlayerYear(playerIdx: number, newYear: string) {
    const trimmedYear = newYear.trim();
    this.tempTeam.players[playerIdx].yearString = trimmedYear;
    this.dataChangedCallback();
  }

  changePlayerUG(playerIdx: number, checked: boolean) {
    this.tempTeam.players[playerIdx].isUG = checked;
    this.dataChangedCallback();
  }

  changePlayerD2(playerIdx: number, checked: boolean) {
    this.tempTeam.players[playerIdx].isD2 = checked;
    this.dataChangedCallback();
  }

  cleanUpTeamForSaving() {
    this.tempTeam.removeNullPlayers();
  }
}

export default TempTeamManager;
