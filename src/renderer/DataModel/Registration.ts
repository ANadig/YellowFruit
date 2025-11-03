import { teamGetNameAndLetter } from '../Utils/GeneralUtils';
import {
  IQbjObject,
  IValidationInfo,
  IYftDataModelObject,
  IYftFileObject,
  ValidationStatuses,
  makeEmptyValidator,
} from './Interfaces';
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

/** Registration object as written to a .yft file */
export interface IYftFileRegistration extends IQbjRegistration, IYftFileObject {
  YfData: IRegistrationExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IRegistrationExtraData {
  isSmallSchool: boolean;
}

/** An organization (e.g. school) with one or more teams participating in the tournament */
class Registration implements IQbjRegistration, IYftDataModelObject {
  name: string;

  teams: Team[] = [];

  /** Is this organization considered a "small school"? */
  isSmallSchool: boolean = false;

  static maxNameLength = 300;

  nameValidation: IValidationInfo;

  get id(): string {
    return `Registration_${this.name}`;
  }

  constructor(orgName: string, team?: Team) {
    this.name = orgName;
    if (team) {
      this.teams = [team];
    }
    this.nameValidation = makeEmptyValidator();
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
      teams: this.teams.map((tm) => tm.toFileObject(qbjOnly, false, true)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Registration;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    const yfData: IRegistrationExtraData = { isSmallSchool: this.isSmallSchool };
    const yftFileObj: IYftFileRegistration = { YfData: yfData, ...qbjObject };

    return yftFileObj;
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

  sortTeams() {
    this.teams.sort((a, b) => a.letter.localeCompare(b.letter));
  }

  /** Set Team.name for each member team according to the registration name */
  compileTeamNames() {
    this.teams.forEach((tm) => tm.compileName(this.name));
  }

  /** Look through the list of teams and determine each team's letter and the overall registration name.
   *  For example, if the registration and team are both "Central A", the registration name should be "Central".
   *  Use for registrations that were just created from non-YellowFruit files.
   */
  computeLettersAndRegName() {
    if (this.teams.length === 0) return;

    let registrationName;
    let regNameIsConsistent = true;
    for (const tm of this.teams) {
      const [name, letter] = teamGetNameAndLetter(tm.name);
      if (letter !== '') tm.letter = letter;

      if (!registrationName) registrationName = name;
      else if (name !== registrationName) regNameIsConsistent = false;
    }
    if (regNameIsConsistent && registrationName) this.name = registrationName;
  }

  validateAll() {
    this.validateName();
  }

  validateName() {
    if (this.name === '') {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = `Name is required.`;
    } else if (this.name.length > Registration.maxNameLength) {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = `Maximum allowed name length is ${Registration.maxNameLength} characters.`;
    } else {
      this.nameValidation = makeEmptyValidator();
    }
  }

  getErrorMessages(): string[] {
    const errs: string[] = [];
    if (this.nameValidation.status === ValidationStatuses.Error) {
      errs.push(`Organization name: ${this.nameValidation.message}`);
    }
    return errs;
  }
}

export default Registration;
