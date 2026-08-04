/**
 * A physical playing location at the tournament: "Room 101", "Library", "Cafeteria Left".
 *
 * Rooms are YellowFruit's own concept, not part of the QBJ schema, so they live in the .yft file's
 * YfData and are omitted from QBJ export. They are deliberately durable: a room's id and access
 * token are what make its URL permanent, so the Chromebook in room 101 can stay on one page all day
 * and simply be told what to score next.
 *
 * Only stable configuration belongs here. Whether a room is currently connected, what it's playing
 * right now, and how far into a game it is are all server-side session state that changes by the
 * second and must never be written to the tournament file.
 */
import { randomHex, randomId } from '../Utils/RandomIds';

/** A room as written to a .yft file */
export interface IYftFileRoom {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  accessToken: string;
  sortOrder: number;
}

/** Bytes of entropy in a room access token */
const tokenBytes = 24;

export class TournamentRoom {
  /** Stable identifier. Appears in the room's URL and never changes once the room exists. */
  id: string;

  name: string = '';

  description: string = '';

  /**
   * A disabled room keeps its history and its URL but is not given new assignments. This is how a
   * room that turns out to be unusable on the day gets taken out of rotation without losing the
   * games already played in it.
   */
  enabled: boolean = true;

  /**
   * Capability token proving a client is this room. It authorizes only this room's own scorekeeping:
   * it is not an administrative credential and cannot read or write another room.
   */
  accessToken: string;

  /** Display order in the Rooms list, and the order rooms are offered to the allocator */
  sortOrder: number = 0;

  constructor(name: string, sortOrder: number, id?: string, accessToken?: string) {
    this.name = name;
    this.sortOrder = sortOrder;
    this.id = id ?? TournamentRoom.generateId();
    this.accessToken = accessToken ?? TournamentRoom.generateToken();
  }

  /** A fresh room id. Short and URL-safe, since it is part of the room's permanent address. */
  static generateId(): string {
    return randomId('room');
  }

  static generateToken(): string {
    return randomHex(tokenBytes);
  }

  /**
   * Issue a new token, which immediately invalidates the old room URL.
   *
   * Used when a room URL may have been shared beyond the people who should have it.
   */
  regenerateToken() {
    this.accessToken = TournamentRoom.generateToken();
  }

  /**
   * The permanent URL for this room.
   * @param serverAddress a LAN origin from the server's status, e.g. http://192.168.1.50:4732
   */
  url(serverAddress: string): string {
    const origin = serverAddress.replace(/\/+$/, '');
    return `${origin}/room/${encodeURIComponent(this.id)}?token=${encodeURIComponent(this.accessToken)}`;
  }

  /** Rooms are ordered by sortOrder, then by name so the list never jitter-sorts */
  static compare(a: TournamentRoom, b: TournamentRoom): number {
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  }

  /**
   * The .yft representation.
   *
   * Named differently from the data model's usual `toFileObject` on purpose: a room is not a QBJ
   * object and has no QBJ form, so there is no `qbjOnly` mode to support.
   */
  toYftFileObject(): IYftFileRoom {
    return {
      id: this.id,
      name: this.name,
      description: this.description || undefined,
      enabled: this.enabled,
      accessToken: this.accessToken,
      sortOrder: this.sortOrder,
    };
  }

  /**
   * Read a room back from a .yft file.
   *
   * Anything missing or malformed is replaced rather than rejected: a tournament file is the most
   * valuable thing the director has, and a room with a regenerated token is far better than a file
   * that won't open.
   */
  static fromYftFileObject(source: unknown, fallbackSortOrder = 0): TournamentRoom | null {
    if (typeof source !== 'object' || source === null) return null;
    const data = source as Partial<IYftFileRoom>;
    if (typeof data.name !== 'string') return null;

    const room = new TournamentRoom(
      data.name,
      typeof data.sortOrder === 'number' ? data.sortOrder : fallbackSortOrder,
      typeof data.id === 'string' && data.id !== '' ? data.id : undefined,
      typeof data.accessToken === 'string' && data.accessToken !== '' ? data.accessToken : undefined,
    );
    if (typeof data.description === 'string') room.description = data.description;
    room.enabled = data.enabled !== false;
    return room;
  }
}
