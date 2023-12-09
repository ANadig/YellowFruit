/**
 * Classes representing matches
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/match
 */

import MatchTeam from './MatchTeam';
import Phase from './Phase';
import Team from './Team';

/** A single match scheduled between two teams */
class Match {
  /** The number of tossups read, including any tossups read in overtime */
  tossupsRead: number = 0;

  /** number of TU read in overtime */
  overtimeTossupsRead: number = 0;

  /** Room number or other location where the match was played */
  location?: string;

  /** Override the packet indicated by the Round the match was played in */
  packets?: string;

  /** Was this match a tiebreaker? */
  tiebreaker: boolean = false;

  /** Name of the moderator */
  moderator?: string;

  /** Name of the scorekeeper */
  scorekeeper?: string;

  /** "For control room use only"-type serial number. */
  serial?: string;

  /** The first team in the match */
  team1: MatchTeam;

  /** The second team in the match */
  team2: MatchTeam;

  /** Additional phases in which this match should count, besides the one that actually contains it */
  carryoverPhases: Phase[];

  /** Additional notes about this match */
  notes?: string;

  constructor(team1: Team, team2: Team) {
    this.team1 = new MatchTeam(team1);
    this.team2 = new MatchTeam(team2);
    this.carryoverPhases = [];
  }
}

export default Match;
