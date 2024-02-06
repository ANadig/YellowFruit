import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjTeam, Team } from './Team';

/** A single team's assignment to a single pool */
export interface IQbjPoolTeam extends IQbjObject {
  /* The team being assigned to the pool */
  team: IQbjTeam | IQbjRefPointer;
  /** The final position/rank of this Team within this Pool */
  position?: number;
}

export class PoolTeam implements IQbjPoolTeam, IYftDataModelObject {
  team: Team;

  position?: number;

  get id() {
    return `PoolTeam_${this.team.name}`;
  }

  constructor(team: Team) {
    this.team = team;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPoolTeam {
    const qbjObject: IQbjPoolTeam = {
      team: this.team.toRefPointer(),
      position: this.position,
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.PoolTeam;
    if (isReferenced) qbjObject.id = this.id;

    return qbjObject;
  }
}
