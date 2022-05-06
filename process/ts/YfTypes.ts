/**
 * YfTypes.ts
 * Andrew Nadig
 *
 * A file for widely-used type definitions
 */

/**
 * Panes in the UI, one of which the user is viewing at any time
 */
export enum YfPane {
  Settings = 'settingsPane',
  Teams = 'teamsPane',
  Games = 'gamesPane'
}

/**
 * Results of validating some data (team, division, etc):
 * index 0: whether the data is valid (user is allowed to save);
 * 1: type of message to show;
 * 2: message text
 */
export type FormValidation = [boolean, 'error' | 'warning' | 'info', string]

/**
 * Results of validating a game
 */
export interface GameValidation {
  isValid: boolean;           // whether the data is valid (user is allowed to save);
  type?: 'error' | 'warning' | 'info'; // type of validation message, if any
  message?: string;           // text of the message
  suppressFromForm?: boolean; // true if the game modal doesn't actually need to show the error
}

/**
 * How powers are scored
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
    playersPerTeam: number;     // how many players per team play at one time
    defaultPhases: string[];    // Used to group teams when viewing all games
    rptConfig: string;          // report configuration to use for the stat report
}

/**
 * A list of packets indexed by round number
 */
export interface PacketList {
  [round: number]: string;
}

/**
 * The phase/divisions structure of a tournament
 */
export interface PhaseList {
  [phaseName: string]: string[];    // index the list of divisions in a phase by that phase's name
}

/**
 * Demographic information about a single player
 */
export interface PlayerDemogs {
  year: string;
  undergrad: boolean;
  div2: boolean;
}

/**
 * The list of players on one team, indexed by player name
 */
export interface TeamRoster {
  [playerName: string]: PlayerDemogs;
}

/**
 * Information for a single team
 */
export interface YfTeam {
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
  tuh: number;        // tossups heard
  powers: number;
  tens: number;
  negs: number;
}

/**
 * One team's tossup stats for one game, indexed by player name
 */
export interface TeamGameLine {
  [playerName: string]: PlayerLine;   // index each player's stats by their name
}

/**
 * Information for a single match.
 */
export interface YfGame {
  invalid?: boolean;        // whether the game has valid data and can be fully used for statistics
  validationMsg?: string;   // warning or error message about this game's data
  round?: number;           // the round number
  phases: string[];         // list of phases this match belongs to
  tuhtot: number;           // total number of tossups read, including overtime
  ottu: number;             // total number of tossups read in overtime
  forfeit?: boolean;        // if true, team1 defeats teawm2 by forfeit
  team1: string;            // name of team
  team2: string;            // name of team
  score1: number;           // team1's total points
  score2: number;           // team2's total points
  otPwr1: number;           // team1's powers in overtime
  otPwr2: number;           // team2's powers in overtime
  otTen1: number;           // team1's tens in overtime
  otTen2: number;           // team2's tens in overtime
  otNeg1: number;           // team1's negs in overtime
  otNeg2: number;           // team2's negs in overtime
  bbPts1: number;           // team1's bounceback points
  bbPts2: number;           // team2's bounceback points
  notes?: string;           // free-text notes about the game
  tiebreaker: boolean;      // whether the game was a tiebreaker
  lightningPts1: number;    // lightning round points for team1
  lightningPts2: number;    // lightning round points for team2
  players1: TeamGameLine;   // team1's players' stats
  players2: TeamGameLine;   // team2's players' stats
}

/**
 * List the number of games in each round
 */
export interface GameIndex {
  [round: number]: number;
}

/**
 * Group of settings for the stat report
 */
export interface RptConfig {
  ppgOrPp20: 'ppg' | 'pp20';
  smallSchool: boolean;
  jrVarsity: boolean;
  teamUG: boolean;
  teamD2: boolean;
  teamCombinedStatus: boolean;
  playerYear: boolean;
  playerUG: boolean;
  playerD2: boolean;
  playerCombinedStatus: boolean;
  papg: boolean;
  margin: boolean;
  phaseRecord: boolean;
  pptuh: boolean;
  pPerN: boolean;
  gPerN: boolean;
}

/**
 * A file that couldn't be imported, and the reason why
 */
export interface RejectedFile {
  fileName: string;
  message: string;
}

/**
 * The results of importing a series of files
 */
export interface ImportResult {
  rejected: RejectedFile[];     // files that couldn't be imported
  errors: number;               // number of files imported with errors
  warnings: number;             // number of files imported with warnings
  successes: number;            // number of files imported with no issues
}

/**
 * Information about a qbj file that containts a game
 */
export interface ImportableGame {
  file: string;                 // either the full file path, or its base64-encoded contents
  fileName: string;             // file name
}
