import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
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

/** Tournament Site object as written to a .yft file */
interface IYftFileTournamentSite extends IQbjTournamentSite, IYftFileObject {}

/** YellowFruit implementation of the TournamentSite object */
export class TournamentSite implements IQbjTournamentSite, IYftDataModelObject {
  name: string = '';

  static placeHolderName = 'unknown site';

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  toQbjObject(isTopLevel = false, isReferenced = false) {
    const qbjObject: IQbjTournamentSite = {
      name: this.name || TournamentSite.placeHolderName,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.TournamentSite;
    if (isReferenced) qbjObject.id = `TournamentSite_${qbjObject.name}`;

    return qbjObject;
  }

  toYftFileObject(): IYftFileTournamentSite {
    return this.toQbjObject() as IYftFileTournamentSite;
  }
}
