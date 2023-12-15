import { IQbjObject } from './Interfaces';
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
export class TournamentSite implements IQbjTournamentSite {
  name: string = '';
}
