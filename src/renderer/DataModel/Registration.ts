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

class Registration implements IQbjRegistration, IYftDataModelObject {
  /** name of the school / organization */
  name: string;

  /** The teams registered to play by this school/organization */
  teams: Team[] = [];

  constructor(orgName: string) {
    this.name = orgName;
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
}

export default Registration;
