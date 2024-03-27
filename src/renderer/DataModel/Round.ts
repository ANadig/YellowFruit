import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
// eslint-disable-next-line import/no-cycle
import { IQbjMatch, Match } from './Match';
import { IQbjPacket, Packet } from './Packet';
import { Player } from './Player';
import { QbjTypeNames } from './QbjEnums';
import { Team } from './Team';

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
  matches?: IQbjMatch[];
}

/** Round object as written to a .yft file */
export interface IYftFileRound extends IQbjRound, IYftFileObject {
  YfData: IRoundExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IRoundExtraData {
  number: number;
}

/** One round of games */
export class Round implements IQbjRound, IYftDataModelObject {
  /** Number for ordering. For normal rounds, an interger. For tiebreakers/finals, might not be */
  number: number;

  private _name?: string;

  /** The name of the round */
  get name(): string {
    return this._name ? this._name : this.number.toString();
  }

  set name(str) {
    this._name = str;
  }

  description?: string;

  /** Packet used for the round. YF only supports one packet per round. */
  packet?: Packet;

  /** The matches that took place in this round */
  matches: Match[] = [];

  get id(): string {
    return `Round_${this.name}`;
  }

  constructor(roundNo: number, name?: string) {
    this.number = roundNo;
    if (name) this.name = name;
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjRound {
    const qbjObject: IQbjRound = {
      name: this.name,
      matches: this.matches.map((m) => m.toFileObject(qbjOnly)),
      // TODO: packet
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Round;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    const yfData: IRoundExtraData = { number: this.number };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  displayName(forceNumeric: boolean): string {
    return this._name && !forceNumeric ? this._name : `Round ${this.number}`;
  }

  teamHasPlayedIn(team: Team) {
    return !!this.matches.find((m) => m.leftTeam.team === team || m.rightTeam.team === team);
  }

  anyMatchesExist() {
    return this.matches.length > 0;
  }

  getPlayersWithData(team: Team) {
    const players: Player[] = [];
    for (const m of this.matches) {
      for (const mt of [m.leftTeam, m.rightTeam]) {
        if (mt.team !== team) continue;
        const inThisMatch = mt.getPlayerList();
        inThisMatch.forEach((player) => {
          if (!players.includes(player)) players.push(player);
        });
      }
    }
    return players;
  }

  findMatchesWithTeam(team: Team): Match[] {
    const ary = [];
    for (const match of this.matches) {
      if (match.leftTeam.team === team || match.rightTeam.team === team) {
        ary.push(match);
      }
    }
    return ary;
  }

  findMatchBetweenTeams(team1: Team, team2: Team) {
    for (const match of this.matches) {
      if (
        (match.leftTeam.team === team1 && match.rightTeam.team === team2) ||
        (match.rightTeam.team === team1 && match.leftTeam.team === team2)
      ) {
        return match;
      }
    }
    return undefined;
  }

  addMatch(match: Match) {
    this.matches.push(match);
  }

  deleteMatch(match: Match) {
    this.matches = this.matches.filter((m) => m !== match);
  }
}

/** Sort a list of rounds in ascending order. */
export function sortRounds(ary: Round[]) {
  ary.sort((a, b) => a.number - b.number);
}
