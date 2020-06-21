/**
 * YfTypes.ts
 * Andrew Nadig
 *
 * Type definitions of the tournament schema (QBJ)
 * https://schema.quizbowl.technology/
 */

/**
 * The top-level Qbj obejct.
 */
type QbjFile = {
  version: string;
  objects: object[];
}

/**
 * Reference that can be substituted for an object that is defined elsewhere.
 * The types below define exactly where we will and won't use refs since defining
 * "either/or" types is very difficult
 */
interface QbjRef {
  $ref: string;
}

/**
 * General attributes of the tournament
 */
interface QbjTournament {
  type: 'Tournament';
  name: string;
  scoring_rules?: QbjRef;     // ref to QbjScoringRules
  registrations?: QbjRegistration[];
  phases?: QbjRef[];          // ref to QbjPhase
  rankings?: QbjRef[];        // ref to QbjRanking
  // not implemented yet in YF
  short_name?: string;
  tournament_site?: object;    // TournamentSite object not implemented
  start_date?: string;
  end_date?: string;
  audience?: 'elementary_school' | 'middle_school' | 'high_school' | 'community_college' | 'college' | 'open' | 'other';
  level?: 'novice' | 'regular' | 'nationals' | 'other';
  question_set?: string;
  content?: 'general_academic' | 'specialized_academic' | 'trash' | 'other';
  info?: string;
}

/**
 * Rules of the game
 */
interface QbjScoringRules {
  type: 'ScoringRules';
  id?: string;
  name: string;
  teams_per_match?: number;
  maximum_players_per_team?: number;
  overtime_includes_bonuses?: boolean;
  total_divisor?: number;
  maximum_bonus_score?: number;
  bonuses_bounce_back?: boolean;
  lightning_count_per_team?: number;
  lightnings_bounce_back?: boolean;
  answer_types?: QbjRef[];        // ref to QbjAnswerType
  // not implemented yet in YF
  regulation_tossup_count?: number;
  maximum_regulation_tossup_count?: number;
  minimum_overtime_question_count?: number;
  bonus_divisor?: number;
  minimum_parts_per_bonus?: number;
  maximum_parts_per_bonus?: number;
  points_per_bonus_part?: number;
  maximum_lightning_score?: number;
  lightning_divisor?: number;
}

/**
 * A particular way in which you can answer a tossup
 */
interface QbjAnswerType {
  type: 'AnswerType';
  id?: string;
  value: number;
  // not implemented currently in YF
  label?: string;
  short_label?: string;
  awards_bonus?: boolean; // not needed because we don't support anything weird
}

/**
 * Registration for a school.
 * Currently YF uses this 'incorrectly' with one registration for each team
 */
interface QbjRegistration {
  type: 'Registration';
  id?: string;
  name: string;
  teams: QbjRef[];      // ref to QbjTeam
  // not implemented currently in YF
  location?: string;
}

/**
 * A single team
 */
interface QbjTeam {
  type: 'Team';
  id?: string;
  name: string;
  players?: QbjRef[];   // ref to QbjPlayer
  ranks?: QbjRank[];
}

/**
 * A single player
 */
interface QbjPlayer {
  type: 'Player';
  id?: string;
  name: string;
  year?: number;
}

/**
 * A specific rank achieved by a specific team
 */
interface QbjRank {
  type: 'Rank';
  id?: string;
  ranking: QbjRef;      // ref to QbjRanking
  position?: number;
}

/**
 * A type of ranking for which teams may be eligible
 */
interface QbjRanking {
  type: 'Ranking';
  id?: string;
  name?: string;
  // not implemented currently in YF
  description?: string;
}

/**
 * Phase, e.g. prelims, playoffs
 */
interface QbjPhase {
  type: 'Phase';
  id?: string;
  name: string;
  rounds?: QbjRef[];      // ref to QbjRound
  pools?: QbjPool[];
  // not implement d currently in YF
  description?: string;
  cards_traded?: boolean;
}

/**
 * One round of a tournament
 */
interface QbjRound {
  type: 'Round';
  id?: string;
  name: string;
  packets?: QbjPacket[];
  matches?: QbjRef[];   // ref to QbjMatch
  // not implemented currently in YF
  description?: string;
}

/**
 * One pool of teams within a single phase
 */
interface QbjPool {
  type: 'Pool';
  id?: string;
  name: string;
  pool_teams: QbjPoolTeam[]
  // not implemented currently in YF
  description?: string;
  position?: string;
}

/**
 * One team within a pool
 */
interface QbjPoolTeam {
  type: 'PoolTeam';
  id?: string;
  team: QbjRef;     // ref to QbjTeam
  // not implemented currently in YF
  position?: number;
}

/**
 * A single game
 */
interface QbjMatch {
  type: 'Match';
  id?: string;
  match_teams: QbjMatchTeam[];
  tossups_read?: number;
  overtime_tossups_read?: number;
  tiebreaker?: boolean;
  carryover_phases?: QbjRef[];    // ref to QbjPhase
  notes?: string;
  // not implemented currently in YF
  location?: string;
  packets?: string;
  moderator?: string;
  scorekeeper?: string;
  serial?: string;
  match_questions?: object[];     // MatchQuestion object not implemented
}

/**
 * One team's performance in one match
 */
interface QbjMatchTeam {
  type: 'MatchTeam';
  id?: string;
  team: QbjRef;    // ref to QbjTeam. Required because we don't use cards
  forfeit_loss?: boolean;
  points?: number;
  bonus_points?: number;
  correct_tossups_without_bonuses?: number;
  bonus_bounceback_points?: number;
  lightning_points?: number;
  match_players?: QbjMatchPlayer[];
  // not implemented currently in YF
  card?: string;
  lightning_bounceback_points?: number;
  lineups?: object[]; // Lineup object not implemented
  signature?: object; // Signature object not implemented
  suppress_from_statistics?: boolean;
}

/**
 * One player's performance in one match
 */
interface QbjMatchPlayer {
  type: 'MatchPlayer';
  id?: string;
  player: QbjRef;   // ref to QbjPlayer
  tossups_heard: number;
  answer_counts: QbjPlayerAnswerCount[];
}

/**
 * The number of answers of one particular type by one player in one match
 */
interface QbjPlayerAnswerCount {
  type: 'PlayerAnswerCount';
  id?: string;
  number: number;
  answer_type: QbjRef;    // ref to QbjAnswerType
}

/**
 * A packet (one round of questions)
 */
interface QbjPacket {
  type: 'Packet';
  id?: string;
  name: string;
  // not implemented currently in YF
  number?: number;
  authors?: string[];
  rule?: 'regular' | 'finals' | 'extra' | 'overtime' | 'replacement' | 'backup' | 'tiebreaker' | 'scrimmage';
  questions?: object[]; // Question object not implemented
}
