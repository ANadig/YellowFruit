import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjTeam, Team } from './Team';

/** A single team's assignment to a single pool */
export interface IQbjPoolTeam extends IQbjObject {
  /* The team being assigned to the pool */
  team: IQbjTeam | IQbjRefPointer;
  /** The final position/rank of this Team within this Pool */
  position?: number;
}

/** Pool object as written to a .yft file */
export interface IYftFilePoolTeam extends IQbjPoolTeam, IYftFileObject {
  YfData: IPoolTeamExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IPoolTeamExtraData {
  didNotAdvance?: boolean;
}

export class PoolTeam implements IQbjPoolTeam, IYftDataModelObject {
  team: Team;

  position?: number;

  /** Explicitly denote that this team didn't advance to the next phase */
  didNotAdvance?: boolean;

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

    if (qbjOnly) return qbjObject;

    const yfData: IPoolTeamExtraData = { didNotAdvance: this.didNotAdvance };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }
}
