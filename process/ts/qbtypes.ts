/**
 * qbtypes.ts
 * Andrew Nadig
 *
 * A file for widely-used type definitions
 */

/**
 * How powers are socred
 */
export enum PowerRule {
  Twenty = '20pts',
  Fifteen = '15pts',
  None = 'none'
}

/**
 * Rules and settings for the tournament
 */
export interface TournamentSettings {
    powers: PowerRule;          // powers setting
    negs: boolean;              // whether to user negs
    bonuses: boolean;           // whether there are bonuses
    bonusesBounce: boolean;     // whether bonuses have bouncebacks
    lightning: boolean;         // whether there are lightning rounds
    playersPerTeam: string;     // how many players per team play at one time
    defaultPhases: string[];    // Used to group teams when viewing all games
    rptConfig: string;          // report configuration to use for the stat report
}

/**
 * The phase/divisions structure of a tournament
 */
export interface PhaseList {
  [phaseName: string]: string[];    // index the list of divisions in a phase by that phase's name
}

/**
 * Information about a single player
 */
export interface PlayerDemogs {
  year: string;
  undergrad: boolean;
  div2: boolean;
}

/**
 * The list of players on one team
 */
export interface TeamRoster {
  [playerName: string]: PlayerDemogs;
}

/**
 * Information for a single team
 */
export interface QbTeam {
  teamName: string;
  teamUGStatus: boolean;
  teamD2Status: boolean;
  smallSchool: boolean;
  jrVarsity: boolean;
  rank: number;           // the overall rank manually specified by the user
  roster: TeamRoster;
  divisions: { [phase: string]: string; }   // the divisions the team belongs to, indexed by phase
}

/**
 * Team1 (left side of the game modal) or Team2 (right side)
 */
export type WhichTeam = 1 | 2;

/**
 * One player's stats for one game
 */
export interface PlayerLine {
  tuh: string;        // tossups heard
  powers: string;
  tens: string;
  negs: string;
}

/**
 * One team's tossup stats for one game
 */
export interface TeamGameLine {
  [playerName: string]: PlayerLine;   // index each player's stats by their name
}

/**
 * Information for a single match. Most of these are strings because that's how they
 * come in the from the html fields themselves
 */
export interface QbGame {
  round: string;            // the round number
  phases: string[];         // list or phases this match belongs to
  tuhtot: string;           // total number of tossups read, including overtime
  ottu: string;             // total number of tossups read in overtime
  forfeit: boolean;         // if true, team1 defeats teawm2 by forfeit
  team1: string;            // name of team
  team2: string;            // name of team
  score1: string;           // team1's total points
  score2: string;           // team2's total points
  otPwr1: string;           // team1's powers in overtime
  otPwr2: string;           // team2's powers in overtime
  otTen1: string;           // team1's tens in overtime
  otTen2: string;           // team2's tens in overtime
  otNeg1: string;           // team1's negs in overtime
  otNeg2: string;           // team2's negs in overtime
  bbPts1: string;           // team1's bounceback points
  bbPts2: string;           // team2's bounceback points
  notes: string;            // free-text notes about the game
  tiebreaker: boolean;      // whether the game was a tiebreaker
  lightningPts1: string;    // lightning round points for team1
  lightningPts2: string;    // lightning round points for team2
  players1: TeamGameLine;   // team1's players' stats
  players2: TeamGameLine;   // team2's players' stats
}
