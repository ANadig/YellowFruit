import {
  IQbjObject,
  IValidationInfo,
  IYftDataModelObject,
  IYftFileObject,
  ValidationStatuses,
  makeEmptyValidator,
} from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { makeQbjRefPointer } from './QbjUtils';

/** Grades/years in school */
enum PlayerYear {
  NotApplicable = -1,
  Kindergarten = 0,
  Grade1 = 1,
  Grade2 = 2,
  Grade3 = 3,
  Grade4 = 4,
  Grade5 = 5,
  Grade6 = 6,
  Grade7 = 7,
  Grade8 = 8,
  Grade9 = 9,
  Grade10 = 10,
  Grade11 = 11,
  Grade12 = 12,
  CollFreshman = 13,
  CollSophomore = 14,
  CollJunior = 15,
  CollSenior = 16,
  CollPostSenior = 17,
  GradStudent = 18,
}

export interface IQbjPlayer extends IQbjObject {
  /** The player's name */
  name: string;
  /** The player's year in school */
  year?: PlayerYear;
}

/** Player object as written to a .yft file */
export interface IYftFilePlayer extends IQbjPlayer, IYftFileObject {
  YfData: IPlayerExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IPlayerExtraData {
  yearString: string;
  isUG: boolean;
  isD2: boolean;
}

/** A player on a single team */
export class Player implements IQbjPlayer, IYftDataModelObject {
  name: string;

  /** Grade in school as a string. */
  yearString: string = '';

  static readonly nameMaxLength = 200;

  static readonly yearStringMaxLength = 20;

  /** counter to make sure player IDs are unique */
  private static idCounter = 1000;

  private idNumber: number;

  get id(): string {
    return `Player_${this.name}_${this.idNumber}`;
  }

  /** Grade in school, in the schema's numerical format. Is undefined if we can't parse to something valid */
  get year(): PlayerYear | undefined {
    if (!this.yearString) {
      return undefined;
    }
    let grade = Player.parseNonNumericYear(this.yearString);
    if (grade === null) {
      grade = parseInt(this.yearString, 10);
    }
    if (Number.isNaN(grade) || PlayerYear[grade] === undefined) {
      return undefined;
    }
    return grade;
  }

  /** Is this player considered "undergrad"? */
  isUG: boolean = false;

  /** Is this player considered "divison 2"? */
  isD2: boolean = false;

  nameValidation: IValidationInfo;

  yearStringValidation: IValidationInfo;

  static readonly duplicateErrorMessage = 'Duplicate player';

  static yearTitles = {
    0: 'Kindergarten',
    1: '1st Grade',
    2: '2nd Grade',
    3: '3rd Grade',
    4: '4th Grade',
    5: '5th Grade',
    6: '6th Grade',
    7: '7th Grade',
    8: '8th Grade',
    9: '9th Grade',
    10: '10th Grade',
    11: '11th Grade',
    12: '12th Grade',
    13: 'Freshman',
    14: 'Sophomore',
    15: 'Junior',
    16: 'Senior',
    17: 'Post-senior',
    18: 'Grad Student',
  };

  static yearAbbrevs = {
    0: 'K',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '10',
    11: '11',
    12: '12',
    13: 'Fr.',
    14: 'So.',
    15: 'Jr.',
    16: 'Sr.',
    17: 'Post-Sr.',
    18: 'Grad.',
  };

  /** Substrings that indicate that a value matches a non-numeric year */
  static yearSearchStr = {
    13: ['fr'],
    14: ['so'],
    15: ['ju', 'jr'],
    16: ['sen', 'sr'],
    17: ['post-s', 'post s'],
    18: ['grad'],
  };

  /** Player that this player was copied from. Used while editing teams. */
  sourcePlayer?: Player;

  constructor(name: string) {
    this.name = name;
    this.idNumber = Player.idCounter++;

    this.nameValidation = makeEmptyValidator();
    this.yearStringValidation = makeEmptyValidator();
  }

  makeCopy(logSource: boolean = false): Player {
    const copy = new Player('');
    copy.copyFromPlayer(this, logSource);
    return copy;
  }

  copyFromPlayer(source: Player, logSource: boolean = false) {
    this.name = source.name;
    this.yearString = source.yearString;
    this.idNumber = source.idNumber;
    this.isUG = source.isUG;
    this.isD2 = source.isD2;
    if (logSource) this.sourcePlayer = source;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPlayer {
    const qbjObject: IQbjPlayer = {
      name: this.name,
      year: this.year,
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Player;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    const yfData: IPlayerExtraData = { yearString: this.yearString, isUG: this.isUG, isD2: this.isD2 };
    const yftFileObj: IYftFilePlayer = { YfData: yfData, ...qbjObject };
    return yftFileObj;
  }

  toRefPointer() {
    return makeQbjRefPointer(this.id);
  }

  validateAll(nameIsRequired: boolean) {
    this.validateName(nameIsRequired);
    this.validateYearString();
  }

  validateName(nameIsRequired: boolean) {
    if (nameIsRequired && this.name === '') {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = 'Name is required';
    } else if (this.name.length > Player.nameMaxLength) {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = `Maximum allowed length is ${Player.nameMaxLength} characters.`;
    } else {
      this.nameValidation = makeEmptyValidator();
    }
  }

  /** Mark this player as invalid because they don't have a name but should */
  setNameRequiredError() {
    this.nameValidation.status = ValidationStatuses.Error;
  }

  validateYearString() {
    if (this.yearString.length > Player.yearStringMaxLength) {
      this.yearStringValidation.status = ValidationStatuses.Error;
      this.yearStringValidation.message = `Maximum allowed length is ${Player.yearStringMaxLength} characters.`;
    } else if (this.yearString !== '' && this.year === undefined) {
      this.yearStringValidation.status = ValidationStatuses.Warning;
      this.yearStringValidation.message = 'Unrecognized grade/year.';
    } else {
      this.yearStringValidation = makeEmptyValidator();
    }
  }

  setDuplicateStatus(isDup: boolean) {
    if (
      this.nameValidation.status === ValidationStatuses.Error &&
      this.nameValidation.message !== Player.duplicateErrorMessage
    ) {
      return; // already invalid? don't bother
    }

    if (isDup) {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = Player.duplicateErrorMessage;
      return;
    }

    if (this.nameValidation.message !== Player.duplicateErrorMessage) return;

    this.nameValidation = makeEmptyValidator();
  }

  getErrorMessages() {
    const errs: string[] = [];
    if (this.nameValidation.status === ValidationStatuses.Error) {
      errs.push(`Name: ${this.nameValidation.message}`);
    }
    if (this.yearStringValidation.status === ValidationStatuses.Error) {
      errs.push(`Grade/year: ${this.yearStringValidation.message}`);
    }
    return errs;
  }

  /** Try to find a matching non-numeric year (e.g. "Freshman") and return the
   * schema-definied numeric value. If none found, return null.
   */
  static parseNonNumericYear(text: string): number | null {
    const lcText = text.toLocaleLowerCase();
    for (const yr in this.yearSearchStr) {
      if (this._startsWithAny(lcText, this.yearSearchStr[yr as unknown as keyof typeof this.yearSearchStr])) {
        const yrInt = parseInt(yr, 10);
        if (yrInt === undefined) return null;
        return yrInt;
      }
    }
    return null;
  }

  private static _startsWithAny(text: string, ary: string[]): boolean {
    if (!ary) return false;

    for (const s of ary) {
      if (text.startsWith(s)) {
        return true;
      }
    }
    return false;
  }

  static getPlayerNameFromId(id: string) {
    return id.replace('Player_', '').replace(/_\d{4,}$/, '');
  }
}
