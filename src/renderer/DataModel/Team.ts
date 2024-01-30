import { IQbjObject, IYftDataModelObject } from './Interfaces';
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

  constructor(name: string) {
    this.name = name;
    this.players = [];
  }

  makeCopy(): Team {
    const copy = new Team('');
    copy.copyFromTeam(this);
    return copy;
  }

  copyFromTeam(source: Team) {
    this.name = source.name;
    this.players = source.players;
    this.ranks = source.ranks;
    this.letter = source.letter;
    this.isJV = source.isJV;
    this.isUG = source.isUG;
    this.isD2 = source.isD2;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjTeam {
    const qbjObject: IQbjTeam = {
      name: this.name,
      players: this.players.map((plr) => plr.toFileObject(qbjOnly, false, false, this.name)),
      ranks: this.ranks?.map((rk) => rk.toFileObject(qbjOnly, false, false, this.name)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Team;
    if (isReferenced) qbjObject.id = `Team_${this.name}`;

    return qbjObject;
  }

  /** Add a new player to the end of the list */
  pushBlankPlayer() {
    this.players.push(new Player(''));
  }

  removeNullPlayers() {
    this.players = this.players.filter((player) => player.name !== '');
  }
}
