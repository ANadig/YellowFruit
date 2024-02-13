import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';

/** A kind of ranking that teams might be ranked by, such as "JV" or "Small school" */
export interface IQbjRanking extends IQbjObject {
  /** short name */
  name?: string;
  /** A description of the ranking, such as information on eligibility */
  description?: string;
}

export class Ranking implements IQbjRanking, IYftDataModelObject {
  name: string;

  get id(): string {
    return `Ranking_${this.name}`;
  }

  constructor(name: string) {
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjRanking {
    const qbjObject: IQbjRanking = { name: this.name };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Ranking;
    if (isReferenced) qbjObject.id = this.id;

    return qbjObject;
  }
}
