/**
 * Classes representing matches
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/match
 */

// eslint-disable-next-line import/no-cycle
import { IQbjPhase, Phase } from './Phase';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';
import { MatchTeam, IQbjMatchTeam } from './MatchTeam';
import { Team } from './Team';

export interface IQbjMatch extends IQbjObject {
  /** The number of tossups read, including any tossups read in overtime */
  tossupsRead?: number;
  /** number of TU read in overtime */
  overtimeTossupsRead?: number;
  /** Room number or other location where the match was played */
  location?: string;
  /** Override the packet indicated by the Round the match was played in */
  packets?: string;
  /** Was this match a tiebreaker? */
  tiebreaker?: boolean;
  /** Name of the moderator */
  moderator?: string;
  /** Name of the scorekeeper */
  scorekeeper?: string;
  /** "For control room use only"-type serial number. */
  serial?: string;
  /** The performances of the teams in this match */
  matchTeams: IQbjMatchTeam[];
  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases?: IQbjPhase[] | IQbjRefPointer[];
  /** Additional notes about this match */
  notes?: string;
}

/** A single match scheduled between two teams */
export class Match implements IQbjMatch, IYftDataModelObject {
  tossupsRead: number = 0;

  overtimeTossupsRead: number = 0;

  location?: string;

  packets?: string;

  tiebreaker: boolean = false;

  moderator?: string;

  scorekeeper?: string;

  serial?: string;

  /** The first team in the match */
  team1?: MatchTeam;

  /** The second team in the match */
  team2?: MatchTeam;

  get matchTeams(): MatchTeam[] {
    if (!this.team1 || !this.team2) return [];
    return [this.team1, this.team2];
  }

  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases: Phase[] = [];

  notes?: string;

  constructor(team1?: Team, team2?: Team) {
    if (team1) this.team1 = new MatchTeam(team1);
    if (team2) this.team2 = new MatchTeam(team2);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatch {
    const qbjObject: IQbjMatch = {
      matchTeams: this.matchTeams.map((mt) => mt.toFileObject(qbjOnly)),
      carryoverPhases: this.carryoverPhases.map((ph) => ph.toRefPointer()),
      tossupsRead: this.tossupsRead,
      overtimeTossupsRead: this.overtimeTossupsRead,
      tiebreaker: this.tiebreaker,
      location: this.location,
      packets: this.packets,
      moderator: this.moderator,
      scorekeeper: this.scorekeeper,
      serial: this.serial,
      notes: this.notes,
    };
    return qbjObject;
  }
}

export default Match;
