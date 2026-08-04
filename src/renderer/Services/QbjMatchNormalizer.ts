/**
 * Corrects the question counts in a QBJ Match that MODAQ produced from a scaffold packet.
 *
 * # Why this exists
 *
 * MODAQ derives every question count in its QBJ export from `GameState.playableCycles`, and it has
 * one cycle per tossup in the loaded packet. YellowFruit doesn't serve real packets, so the room
 * client hands MODAQ a scaffold packet padded with overtime headroom (see `ScaffoldPacket.ts`).
 * That padding is what breaks the counts.
 *
 * `playableCycles` (GameState.js in modaq 1.41.1) walks forward from the end of regulation in steps
 * of `minimumOvertimeQuestionCount`, looking for the first checkpoint where the game isn't tied, and
 * truncates there. If it never finds one it returns *every* cycle in the packet. So:
 *
 *  - A game decided in regulation truncates at regulation. Correct already.
 *  - A game decided in overtime truncates at the end of the overtime period that broke the tie.
 *    Also correct.
 *  - A game that is still tied at the last checkpoint reports the packet's full capacity — the
 *    padding included. `tossups_read` becomes the scaffold size (regulation + headroom) even though
 *    nobody read those questions, and `match_questions` and every starter's `tossups_heard` inflate
 *    with it.
 *
 * That last case is the bug. It happens whenever a tie survives to the end of the cycles that were
 * actually played, which is exactly the overtime situation the headroom exists to support.
 *
 * # The fix
 *
 * Trailing cycles that were never played carry no evidence of play: no buzzes, no bonus, no thrown-
 * out tossup. Find the last cycle that does, and rebuild the counts from there. Overtime is rounded
 * up to a whole overtime period because that's how the format is played and how MODAQ counts it.
 *
 * Deliberately *not* a clamp to regulation: real overtime questions have to count.
 *
 * This never raises a count above what MODAQ reported. It only removes padding.
 *
 * Pure and dependency-free on purpose — it runs in the browser room bundle, in the Electron main
 * process, and in tests, and must not pull in `modaq` or any part of YellowFruit's object graph.
 */

/** What the normalizer needs to know about the format being played */
export interface IQbjNormalizeOptions {
  /** Tossups in regulation, from the tournament's scoring rules */
  regulationTossupCount: number;
  /** Questions per overtime period. Overtime is counted in whole periods. */
  minimumOvertimeQuestionCount: number;
  /**
   * The number of tossups the scorekeeper says were actually read.
   *
   * Inference can't tell "read, and nobody buzzed" apart from "never read", so a game that stopped
   * early has to be told. When set, this wins.
   */
  tossupsHeardOverride?: number;
  /**
   * Set for formats where regulation can end before every tossup is read, i.e. timed rounds. Without
   * it, regulation is assumed to have been read in full, which is true for untimed play even when
   * individual tossups go dead.
   */
  gameMayEndEarly?: boolean;
}

export interface IQbjNormalizeResult {
  /** A corrected deep copy. The input is never mutated. */
  qbj: Record<string, any>;
  /** The corrected `tossups_read` */
  tossupsRead: number;
  /** What MODAQ had reported, for logging and tests */
  reportedTossupsRead: number;
  /** How many phantom cycles were removed */
  trimmedQuestionCount: number;
  /** Tossups attributed to overtime, always a whole number of overtime periods */
  overtimeTossups: number;
  /** False when nothing needed correcting */
  changed: boolean;
}

/** One QBJ lineup entry, as MODAQ emits it */
interface IQbjLineup {
  first_question?: number;
  players?: { name?: string }[];
}

/**
 * Did anything happen on this question?
 *
 * A cycle MODAQ padded in but nobody played is completely empty. Anything recorded against a
 * question — a buzz of any value including a neg, a bonus, or a thrown-out tossup — means a
 * scorekeeper was on that question.
 */
function questionHasActivity(question: any): boolean {
  if (typeof question !== 'object' || question === null) return false;
  if (Array.isArray(question.buzzes) && question.buzzes.length > 0) return true;
  // A bonus can only follow a correct buzz, so this is belt-and-braces.
  if (question.bonus !== undefined && question.bonus !== null) return true;
  // A thrown-out tossup is real play even if the replacement went dead.
  if (question.replacement_tossup_question !== undefined && question.replacement_tossup_question !== null) return true;
  return false;
}

/** Index of the last question with any evidence of play, or -1 if there is none */
function lastPlayedIndex(questions: any[]): number {
  for (let i = questions.length - 1; i >= 0; i--) {
    if (questionHasActivity(questions[i])) return i;
  }
  return -1;
}

/**
 * How many questions have been played, from a match's own question list.
 *
 * The room UI uses this to show the scorekeeper which question they're on, which MODAQ's public
 * surface doesn't otherwise expose.
 */
export function countPlayedQuestions(match: unknown): number {
  const questions = (match as any)?.match_questions;
  if (!Array.isArray(questions)) return 0;
  return lastPlayedIndex(questions) + 1;
}

/** The lineup in effect for a given 1-based question number */
function activeLineupAt(lineups: IQbjLineup[], questionNumber: number): IQbjLineup | undefined {
  let active: IQbjLineup | undefined;
  for (const lineup of lineups) {
    const firstQuestion = typeof lineup?.first_question === 'number' ? lineup.first_question : 1;
    if (firstQuestion <= questionNumber) active = lineup;
  }
  return active;
}

/** True if this team's lineup data is complete enough to recompute tossups heard from */
function lineupsAreUsable(lineups: unknown): lineups is IQbjLineup[] {
  return (
    Array.isArray(lineups) &&
    lineups.length > 0 &&
    lineups.some((lineup) => Array.isArray((lineup as IQbjLineup)?.players))
  );
}

/**
 * Recompute every player's `tossups_heard` for a corrected question count.
 *
 * MODAQ counts a tossup heard for each player in the lineup at that question, so the lineup history
 * reproduces it exactly. When the lineups aren't usable we only clamp: a count can come down to the
 * corrected total but must never go up.
 */
function fixTossupsHeard(matchTeam: any, tossupsRead: number) {
  const matchPlayers = Array.isArray(matchTeam?.match_players) ? matchTeam.match_players : [];
  const { lineups } = matchTeam ?? {};

  if (!lineupsAreUsable(lineups)) {
    for (const matchPlayer of matchPlayers) {
      if (typeof matchPlayer?.tossups_heard === 'number') {
        matchPlayer.tossups_heard = Math.min(matchPlayer.tossups_heard, tossupsRead);
      }
    }
    return;
  }

  for (const matchPlayer of matchPlayers) {
    const name = matchPlayer?.player?.name;
    if (typeof name !== 'string') continue;
    let heard = 0;
    for (let questionNumber = 1; questionNumber <= tossupsRead; questionNumber++) {
      const lineup = activeLineupAt(lineups, questionNumber);
      if (lineup?.players?.some((player) => player?.name === name)) heard++;
    }
    matchPlayer.tossups_heard = heard;
  }
}

/**
 * Work out how many tossups were really read.
 *
 * Exported for tests and for the room UI, which shows the scorekeeper the count that will be
 * submitted.
 */
export function inferTossupsRead(
  questions: any[],
  reportedTossupsRead: number,
  options: IQbjNormalizeOptions,
): { tossupsRead: number; overtimeTossups: number } {
  const questionCount = questions.length;
  const regulation = Math.max(0, Math.floor(options.regulationTossupCount));
  // A malformed or zero overtime length would make the period arithmetic meaningless.
  const overtimePeriod = Math.max(1, Math.floor(options.minimumOvertimeQuestionCount));

  const lastPlayed = lastPlayedIndex(questions);
  const playedThrough = lastPlayed + 1;

  // Regulation is read in full even when tossups go dead, unless the format can stop early.
  const regulationHeard = options.gameMayEndEarly
    ? Math.min(regulation, playedThrough)
    : Math.min(regulation, questionCount);

  const overtimePlayed = Math.max(0, playedThrough - regulation);
  const overtimeTossups = Math.ceil(overtimePlayed / overtimePeriod) * overtimePeriod;

  let tossupsRead = regulationHeard + overtimeTossups;

  if (options.tossupsHeardOverride !== undefined && Number.isFinite(options.tossupsHeardOverride)) {
    tossupsRead = Math.max(0, Math.floor(options.tossupsHeardOverride));
  }

  // Never claim more questions than MODAQ counted or than the export actually contains.
  tossupsRead = Math.min(tossupsRead, questionCount, reportedTossupsRead);
  tossupsRead = Math.max(0, tossupsRead);

  return { tossupsRead, overtimeTossups: Math.max(0, tossupsRead - regulationHeard) };
}

/**
 * Correct the question counts in a MODAQ QBJ Match.
 *
 * @param match the QBJ Match object as MODAQ produced it
 * @returns a corrected copy plus what changed. A match with no `match_questions` to reason about is
 * returned untouched, because there is no evidence to correct it with.
 */
export default function normalizeQbjMatch(match: unknown, options: IQbjNormalizeOptions): IQbjNormalizeResult {
  const source = (typeof match === 'object' && match !== null ? match : {}) as Record<string, any>;
  // structuredClone is in every runtime this ships to (Electron 35, Chromebook browsers, Node 18+),
  // but fall back rather than throw if it somehow isn't.
  const qbj: Record<string, any> =
    typeof structuredClone === 'function' ? structuredClone(source) : JSON.parse(JSON.stringify(source));

  const reportedTossupsRead = typeof qbj.tossups_read === 'number' ? qbj.tossups_read : 0;

  // No cycle data means no evidence to correct with. An empty array counts as absent: hand-written
  // and non-MODAQ QBJ often omits per-question detail, and trimming those to zero questions would
  // destroy a perfectly good match.
  if (!Array.isArray(qbj.match_questions) || qbj.match_questions.length === 0) {
    return {
      qbj,
      tossupsRead: reportedTossupsRead,
      reportedTossupsRead,
      trimmedQuestionCount: 0,
      overtimeTossups: Math.max(0, reportedTossupsRead - options.regulationTossupCount),
      changed: false,
    };
  }

  const questions: any[] = qbj.match_questions;
  const { tossupsRead, overtimeTossups } = inferTossupsRead(questions, reportedTossupsRead, options);

  const trimmedQuestionCount = Math.max(0, questions.length - tossupsRead);

  qbj.tossups_read = tossupsRead;
  if (trimmedQuestionCount > 0) qbj.match_questions = questions.slice(0, tossupsRead);

  // Player counts have to move with the question count or the match contradicts itself.
  for (const matchTeam of Array.isArray(qbj.match_teams) ? qbj.match_teams : []) {
    fixTossupsHeard(matchTeam, tossupsRead);
  }

  return {
    qbj,
    tossupsRead,
    reportedTossupsRead,
    trimmedQuestionCount,
    overtimeTossups,
    changed: trimmedQuestionCount > 0 || tossupsRead !== reportedTossupsRead,
  };
}
