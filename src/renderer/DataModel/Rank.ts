import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjRanking, Ranking } from './Ranking';

/** A single placement in the tournament, such as "2nd place overall" or "3rd place JV" */
export interface IQbjRank extends IQbjObject {
  /** A Ranking for which the team is eligible */
  ranking: IQbjRanking;
  /** The position/rank the team has achieved among all teams eligible for the given Ranking.
   *  Omitting this field indicates that the rank has not been determined yet (e.g. because
   *  the tournament is still in progress) but the team is eligible for the Ranking.
   */
  position?: number;
}

export class Rank implements IQbjRank, IYftDataModelObject {
  ranking: Ranking;

  position?: number;

  constructor(ranking: Ranking, position?: number) {
    this.ranking = ranking;
    this.position = position;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false, idXtraPc = ''): IQbjRank {
    const qbjObject: IQbjRank = {
      ranking: this.ranking.toFileObject(qbjOnly),
      position: this.position,
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Rank;
    if (isReferenced) qbjObject.id = `Rank_${this.ranking.name}-${idXtraPc}`;

    return qbjObject;
  }
}
