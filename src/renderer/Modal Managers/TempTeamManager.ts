import { Player } from '../DataModel/Player';
import Registration from '../DataModel/Registration';
import { Team } from '../DataModel/Team';
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

  /** Transfer data from temp objects to real objects */
  saveTeam(targetReg: Registration, targetTeam: Team) {
    targetReg.copyFromRegistration(this.tempRegistration);
    targetTeam.copyFromTeam(this.tempTeam);
  }

  changeTeamName(name: string) {
    const trimmedName = name.trim();
    this.tempTeam.name = trimmedName;
    this.tempRegistration.name = trimmedName;
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
