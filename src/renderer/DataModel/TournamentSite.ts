import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';

/** The location where tournament happened. Corresponds to the Tournament Schema object */
export interface IQbjTournamentSite extends IQbjObject {
  type?: QbjTypeNames.TournamentSite;
  /** General name/description of where the tournament is happening */
  name: string;
  /** Specific location info such as an address */
  place?: string;
  /** The latitude of the tournament's site (for geolocation) */
  latitude?: Number;
  /** The longitude of the tournament's site (for geolocation) */
  longitude?: Number;
}

/** YellowFruit implementation of the TournamentSite object */
export class TournamentSite implements IQbjTournamentSite, IYftDataModelObject {
  name: string = '';

  static placeHolderName = 'unknown site';

  get id(): string {
    return `TournamentSite_${this.name}`;
  }

  constructor(name?: string) {
    if (name && name !== TournamentSite.placeHolderName) {
      this.name = name;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false) {
    const qbjObject: IQbjTournamentSite = {
      name: this.name || TournamentSite.placeHolderName,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.TournamentSite;
    if (isReferenced) qbjObject.id = this.id;

    return qbjObject;
  }
}
