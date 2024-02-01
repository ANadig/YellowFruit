import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjTeam, Team } from './Team';

export interface IQbjRegistration extends IQbjObject {
  /** name of the school / organization */
  name: string;
  /** Where the school/organization is, in any human-readable format */
  location?: string;
  /** The teams registered to play by this school/organization */
  teams?: IQbjTeam[];
}

/** An organization (e.g. school) with one or more teams participating in the tournament */
class Registration implements IQbjRegistration, IYftDataModelObject {
  name: string;

  teams: Team[] = [];

  /** Is this organization considered a "small school"? */
  isSmallSchool: boolean = false;

  constructor(orgName: string, team?: Team) {
    this.name = orgName;
    if (team) {
      this.teams = [team];
    }
  }

  makeCopy(): Registration {
    const copy = new Registration('');
    copy.copyFromRegistration(this);
    return copy;
  }

  copyFromRegistration(source: Registration) {
    this.name = source.name;
    this.teams = source.teams;
    this.isSmallSchool = source.isSmallSchool;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjRegistration {
    const qbjObject: IQbjRegistration = {
      name: this.name,
      teams: this.teams.map((tm) => tm.toFileObject(qbjOnly)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Registration;
    if (isReferenced) qbjObject.id = `Registration_${this.name}`;

    return qbjObject;
  }

  addTeam(teamToAdd: Team) {
    this.teams.push(teamToAdd);
  }

  addTeams(teams: Team[]) {
    this.teams = this.teams.concat(teams);
  }

  deleteTeam(teamToDelete: Team | null) {
    if (teamToDelete === null) return;
    this.teams = this.teams.filter((tm) => tm !== teamToDelete);
  }
}

export default Registration;
