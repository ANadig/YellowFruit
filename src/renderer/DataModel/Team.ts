import {
  IQbjObject,
  IValidationInfo,
  IYftDataModelObject,
  IYftFileObject,
  ValidationStatuses,
  makeEmptyValidator,
} from './Interfaces';
import { IQbjPlayer, Player } from './Player';
import { QbjTypeNames } from './QbjEnums';
import { IQbjRank, Rank } from './Rank';

export interface IQbjTeam extends IQbjObject {
  /** name of the team */
  name: string;
  /** The players registered to play on this team */
  players?: IQbjPlayer[];
  /** The ranks this team has achieved and/or is eligible for */
  ranks?: IQbjRank[];
}

/** Team object as written to a .yft file */
export interface IYftFileTeam extends IQbjTeam, IYftFileObject {
  YfData: ITeamExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface ITeamExtraData {
  letter: string;
  isJV: boolean;
  isUG: boolean;
  isD2: boolean;
}

/** A single team */
export class Team implements IQbjTeam, IYftDataModelObject {
  name: string;

  players: Player[];

  ranks?: Rank[];

  /** Whether this is the A, B, C, etc. team. Not necessarily a letter -- e.g. colors */
  letter: string = '';

  /** Is this team considered "junion varsity"? */
  isJV: boolean = false;

  /** Is this team considered "undergrad"? */
  isUG: boolean = false;

  /** Is this team considered "division 2"? */
  isD2: boolean = false;

  /** Disallow creating teams with more than this many players on the roster */
  static maxPlayers = 30;

  static maxLetterLength = 20;

  playerListValidation: IValidationInfo;

  letterValidation: IValidationInfo;

  /** Error that should prevent the team from being saved or used */
  validationError: string = '';

  /** Non-fatal issues */
  validationWarnings: string[] = [];

  constructor(name: string) {
    this.name = name;
    this.players = [];

    this.playerListValidation = makeEmptyValidator();
    this.letterValidation = makeEmptyValidator();
  }

  makeCopy(): Team {
    const copy = new Team('');
    copy.copyFromTeam(this);
    return copy;
  }

  copyFromTeam(source: Team) {
    this.name = source.name;
    this.players = source.players.slice();
    this.ranks = source.ranks;
    this.letter = source.letter;
    this.isJV = source.isJV;
    this.isUG = source.isUG;
    this.isD2 = source.isD2;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjTeam {
    const qbjObject: IQbjTeam = {
      name: this.name,
      players: this.players.map((plr) => plr.toFileObject(qbjOnly, false, true, this.name)),
      ranks: this.ranks?.map((rk) => rk.toFileObject(qbjOnly, false, false, this.name)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Team;
    if (isReferenced) qbjObject.id = `Team_${this.name}`;

    if (qbjOnly) return qbjObject;

    const yfData: ITeamExtraData = { letter: this.letter, isJV: this.isJV, isUG: this.isUG, isD2: this.isD2 };
    const yftFileObj: IYftFileTeam = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  /** Add a new player to the end of the list */
  pushBlankPlayer() {
    this.players.push(new Player(''));
  }

  removeNullPlayers() {
    this.players = this.players.filter((player) => player.name !== '');
  }

  validateAll() {
    this.validatePlayerList();
    this.validateLetter();
  }

  validatePlayerList() {
    if (this.players.length > Team.maxPlayers) {
      this.playerListValidation.status = ValidationStatuses.Error;
      this.playerListValidation.message = `A team cannot have more than ${Team.maxPlayers} players.`;
    } else if (this.players.length < 1) {
      this.playerListValidation.status = ValidationStatuses.Error;
      this.playerListValidation.message = `At least one player is required.`;
    } else {
      this.playerListValidation = makeEmptyValidator();
    }
  }

  validateLetter() {
    if (this.letter.length > Team.maxLetterLength) {
      this.letterValidation.status = ValidationStatuses.Error;
      this.letterValidation.message = `Maximum allowed length is ${Team.maxLetterLength} characters.`;
    } else if (this.letter.trim().includes(' ')) {
      this.letterValidation.status = ValidationStatuses.Error;
      this.letterValidation.message = 'Cannot contain spaces';
    } else {
      this.letterValidation = makeEmptyValidator();
    }
  }

  getErrorMessages(): string[] {
    const errs: string[] = [];
    if (this.playerListValidation.status === ValidationStatuses.Error) {
      errs.push(`Players: ${this.playerListValidation.message}`);
    }
    if (this.letterValidation.status === ValidationStatuses.Error) {
      errs.push(`Team modifier: ${this.letterValidation.message}`);
    }
    return errs;
  }
}
