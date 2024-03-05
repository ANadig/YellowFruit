import {
  IQbjObject,
  IQbjRefPointer,
  IValidationInfo,
  IYftDataModelObject,
  IYftFileObject,
  ValidationStatuses,
  makeEmptyValidator,
} from './Interfaces';
import { IQbjPlayer, Player } from './Player';
import { QbjTypeNames } from './QbjEnums';
import { makeQbjRefPointer } from './QbjUtils';
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

  get id(): string {
    return `Team_${this.name}`;
  }

  /** Whether this is the A, B, C, etc. team. Not necessarily a letter -- e.g. colors */
  letter: string = '';

  /** Is this team considered "junior varsity"? */
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

  nameValidation: IValidationInfo; // for the overall team name

  /** Error that should prevent the team from being saved or used */
  validationError: string = '';

  /** Non-fatal issues */
  validationWarnings: string[] = [];

  constructor(name: string) {
    this.name = name;
    this.players = [];

    this.playerListValidation = makeEmptyValidator();
    this.letterValidation = makeEmptyValidator();
    this.nameValidation = makeEmptyValidator();
  }

  makeCopy(): Team {
    const copy = new Team('');
    copy.copyFromTeam(this, 'temp');
    return copy;
  }

  /**
   * Copy another team's data into this object.
   * @param source Team to copy
   * @param playerType 'temp' means create new Player objects that are copies of source's.
   *                   'restoreSource' means we are copying a temp team *back* into a real team,
   *                   so we also need to copy the temp players back into the real players.
   */
  copyFromTeam(source: Team, playerType: 'temp' | 'restoreSource') {
    this.name = source.name;
    this.ranks = source.ranks;
    this.letter = source.letter;
    this.isJV = source.isJV;
    this.isUG = source.isUG;
    this.isD2 = source.isD2;
    if (playerType === 'temp') {
      this.players = source.players.map((pl) => pl.makeCopy(true));
    } else {
      /** Copy the temp team's players' data back into this team's player objects, rather than replacing
       * them with new objects, which would break references in MatchPlayer objects */
      const tempTeam = source;
      const newlyAddedPlayers: Player[] = [];
      tempTeam.players.forEach((tempPlayer) => {
        const origPlayer = tempPlayer.sourcePlayer;
        if (origPlayer) {
          origPlayer.copyFromPlayer(tempPlayer);
        } else if(tempPlayer.name !== '') {
          newlyAddedPlayers.push(tempPlayer.makeCopy());
        }
      });
      // remove players that were just deleted
      for (let i = this.players.length - 1; i >= 0; i--) {
        if (!tempTeam.players.find((tempPlayer) => tempPlayer.sourcePlayer === this.players[i])) {
          this.players.splice(i, 1);
        }
      }
      this.players = this.players.concat(newlyAddedPlayers);
    }
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjTeam {
    const qbjObject: IQbjTeam = {
      name: this.name,
      players: this.players.map((plr) => plr.toFileObject(qbjOnly, false, true)),
      ranks: this.ranks?.map((rk) => rk.toFileObject(qbjOnly, false, false, this.name)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Team;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    const yfData: ITeamExtraData = { letter: this.letter, isJV: this.isJV, isUG: this.isUG, isD2: this.isD2 };
    const yftFileObj: IYftFileTeam = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  toRefPointer(): IQbjRefPointer {
    return makeQbjRefPointer(this.id);
  }

  /** Add a new player to the end of the list */
  pushBlankPlayer() {
    this.players.push(new Player(''));
  }

  removeNullPlayers() {
    this.players = this.players.filter((player) => player.name !== '');
  }

  /** Change a team with no letter to be the A team for its registration */
  makeThisTheATeam() {
    if (this.letter !== '') return;

    this.letter = 'A';
    this.name = this.name.concat(' A');
  }

  validateAll() {
    this.validatePlayerList();
    this.validateLetter();
    this.validatePlayerUniqueness();
  }

  /** Validate that the team has an appropriate number of players */
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

  /** Validated that there aren't duplicate players */
  validatePlayerUniqueness() {
    const nameDict: { [name: string]: Player[] } = {};
    for (const pl of this.players) {
      const name = pl.name.toLocaleUpperCase();
      if (name !== '') {
        if (nameDict[name] === undefined) nameDict[name] = [];
        nameDict[name].push(pl);
      }
    }
    let playersWithErrors: Player[] = [];
    for (const name in nameDict) {
      if (nameDict[name].length > 1) {
        playersWithErrors = playersWithErrors.concat(nameDict[name]);
      }
    }
    for (const pl of this.players) {
      pl.setDuplicateStatus(playersWithErrors.includes(pl));
    }
  }

  setDuplicateStatus(isDup: boolean) {
    if (isDup) {
      this.nameValidation.status = ValidationStatuses.Error;
      this.nameValidation.message = `${this.name} already exists`;
      return;
    }

    this.nameValidation = makeEmptyValidator();
  }

  getErrorMessages(): string[] {
    let errs: string[] = [];
    if (this.nameValidation.status === ValidationStatuses.Error) {
      errs.push(`Duplicate team: ${this.nameValidation.message}`);
    }
    if (this.playerListValidation.status === ValidationStatuses.Error) {
      errs.push(`Players: ${this.playerListValidation.message}`);
    }
    if (this.letterValidation.status === ValidationStatuses.Error) {
      errs.push(`Team modifier: ${this.letterValidation.message}`);
    }
    this.players.forEach((pl, idx) => {
      const errsOnePlayer = pl.getErrorMessages();
      errs = errs.concat(errsOnePlayer.map((err) => `Players row ${idx + 1}: ${err}`));
    });
    return errs;
  }
}
