import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import Team from './Team';

/** A group of teams, e.g. a single prelim bracket */
export interface IQbjPool extends IQbjObject {
  /** name of the pool */
  name?: string;
  /** Further info about the pool */
  description?: string;
  /** The position/rank of this Pool among all Pool objects used for its Phase. Need not be unique (e.g. in the case of parallel pools) */
  position?: number;
  /** The assignments of teams to pools for this phase */
  poolTeams?: IQbjPoolTeam[];
}

/** A single team's assignment to a single pool */
interface IQbjPoolTeam extends IQbjObject {
  team: Team;
  /** The final position/rank of this Team within this Pool */
  position: number;
}

export class Pool implements IQbjPool, IYftDataModelObject {
  name: string = '';

  description: string = '';

  position: number;

  constructor(position: number) {
    this.position = position;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPool {
    const qbjObject: IQbjPool = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Pool;
    if (isReferenced) qbjObject.id = `Pool_${this.name}`;

    return qbjObject;
  }
}
