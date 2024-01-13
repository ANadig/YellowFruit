import { IQbjObject, IYftDataModelObject } from './Interfaces';
// eslint-disable-next-line import/no-cycle
import Match from './Match';
import { IQbjPacket, Packet } from './Packet';
import { QbjTypeNames } from './QbjEnums';

export interface IQbjRound extends IQbjObject {
  /** The name of the round. Possibly numerical; possibly something like "Preliminary Tiebreaker" */
  name: string;
  /** Further information about this round if needed */
  description?: string;
  /** Information on what packet(s) were used in this round. If multiple packets were used for regular play, the order
   * of this array should be the order in which they were used. If this is omitted and the question_set specified in the
   * Tournament object has a packet that logically matches this round's name (e.g. "Round 1" and "Packet 1"), it can be
   * assumed that the matching packet was used (and no other packets were used) */
  packets?: IQbjPacket[];
  /** The matches that took place in this round */
  matches?: Match[]; // TODO: make a QBJ object type for this
}

/** One round of games */
export class Round implements IQbjRound, IYftDataModelObject {
  /** In YF everything should have a numerical round even though this isn't in the schema */
  number: number;

  private _name?: string;

  /** The name of the round */
  get name(): string {
    return this._name ? this._name : `Round ${this.number}`;
  }

  set name(str) {
    this._name = str;
  }

  description?: string;

  /** Packet used for the round. YF only supports one packet per round. */
  packet?: Packet;

  /** The matches that took place in this round */
  matches?: Match[];

  constructor(roundNo: number) {
    this.number = roundNo;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjRound {
    const qbjObject: IQbjRound = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Round;
    if (isReferenced) qbjObject.id = `Round_${this.name}`;

    return qbjObject;
  }
}
