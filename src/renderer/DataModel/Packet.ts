import { IQbjObject, IYftDataModelObject } from "./Interfaces";
import { QbjTypeNames } from "./QbjEnums";

enum PacketRoles {
  Regular = 'regular',
  Finals = 'finals',
  Extra = 'extra',
  Overtime = 'overtime',
  Replacement = 'replacement',
  Backup = 'backup',
  Tiebreaker = 'tiebreaker',
  Scrimmage = 'scrimmage',
}

export interface IQbjPacket extends IQbjObject {
  /** A human-readable identifier. Often primarily numeric (e.g., Packet 1), but could also be identified by
   *  authors (Chicago or Yale + Maryland), as for packet-submission tournaments. */
  name: string;
  /** The packet number, if that notion is meaningful */
  number?: string;
  /** The authors of the packet */
  authors?: string[];
  /** How the packet is expected to be used */
  role?: PacketRoles;
  /** Any further details on the packet */
  notes?: string;
  /** The contents of the packet */
  questions?: object[]; // Question type not supported in YF
}

export class Packet implements IQbjPacket, IYftDataModelObject {
  name: string = '';

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPacket {
    const qbjObject: IQbjPacket = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Packet;
    if (isReferenced) qbjObject.id = `Packet_${this.name}`;

    return qbjObject;
  }
}
