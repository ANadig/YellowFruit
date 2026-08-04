/**
 * Shared helpers for building small in-memory tournaments and MODAQ-style QBJ payloads, so tests
 * for the reusable importer, the tournament server, and the MODAQ format adapter can all use the
 * same fixtures.
 */
import Tournament from '../renderer/DataModel/Tournament';
import Registration from '../renderer/DataModel/Registration';
import { Team } from '../renderer/DataModel/Team';
import { Player } from '../renderer/DataModel/Player';
import { Sched4TeamsSingleRR } from '../renderer/DataModel/Schedules/4-team';
import { CommonRuleSets } from '../renderer/DataModel/ScoringRules';

export const testTeamNames = ['Ninety Six A', 'Greenwood A', 'Emerald A', 'Abbeville A'];

/** Give every test team the same four-player roster shape, named after the team */
function makeTeam(name: string): Team {
  const team = new Team(name);
  team.players = [1, 2, 3, 4].map((i) => new Player(`${name} Player ${i}`));
  return team;
}

/**
 * A 4-team, 3-round single round robin using the given rule set. Enough structure for matches to
 * resolve rounds, phases, pools, and rosters.
 */
export function makeTestTournament(ruleSet: CommonRuleSets = CommonRuleSets.AcfPowers): Tournament {
  const tourn = new Tournament('Test Tournament');
  tourn.scoringRules.applyRuleSet(ruleSet);
  for (const name of testTeamNames) {
    tourn.addRegistration(new Registration(name.replace(/ A$/, ''), makeTeam(name)));
  }
  tourn.setStandardSchedule(Sched4TeamsSingleRR);
  return tourn;
}

interface IModaqPlayerLine {
  name: string;
  tossupsHeard: number;
  /** [answer value, count] pairs, e.g. [[15, 2], [10, 1], [-5, 1]] */
  buzzes: [number, number][];
}

interface IModaqTeamLine {
  name: string;
  bonusPoints: number;
  players: IModaqPlayerLine[];
}

/**
 * Build a MODAQ-shaped QBJ Match. MODAQ emits snake_case and omits `_round` from custom exports,
 * so the shape here mirrors that rather than YellowFruit's internal camelCase.
 */
export function makeModaqQbjMatch(options: {
  tossupsRead?: number;
  round?: number;
  left: IModaqTeamLine;
  right: IModaqTeamLine;
}): Record<string, any> {
  const { tossupsRead = 20, round, left, right } = options;

  const matchTeam = (line: IModaqTeamLine) => ({
    team: { name: line.name },
    bonus_points: line.bonusPoints,
    match_players: line.players.map((p) => ({
      player: { name: p.name },
      tossups_heard: p.tossupsHeard,
      answer_counts: p.buzzes.map(([value, number]) => ({ number, answer: { value } })),
    })),
    lineups: [{ first_question: 1, players: line.players.map((p) => ({ name: p.name })) }],
  });

  const match: Record<string, any> = {
    tossups_read: tossupsRead,
    match_teams: [matchTeam(left), matchTeam(right)],
    match_questions: [],
  };
  if (round !== undefined) match._round = round;
  return match;
}

/** One team in a cycle-level MODAQ export */
interface IModaqCycleTeam {
  name: string;
  /** Starters, present in the lineup from question 1 */
  starters: string[];
  /** Players who enter partway through: question number they first appear on */
  substitutes?: { name: string; firstQuestion: number }[];
}

/**
 * Build a MODAQ QBJ export at cycle granularity, the way a scaffold-packet game really comes out.
 *
 * MODAQ emits one `match_questions` entry per playable cycle and counts `tossups_read` and every
 * player's `tossups_heard` from that same list, so a fixture has to model all three together to be
 * worth testing against. `cycleCount` is what MODAQ's `playableCycles` returned — which is the
 * padded scaffold size when a game stayed tied — and `playedIndices` are the cycles that actually
 * saw a buzz.
 */
export function makeModaqCycleExport(options: {
  /** Cycles in the export, i.e. what MODAQ's playableCycles returned */
  cycleCount: number;
  /** 0-based indices of cycles that recorded a buzz */
  playedIndices: number[];
  /** 0-based indices of cycles with a thrown-out tossup but no buzz */
  thrownOutIndices?: number[];
  left?: IModaqCycleTeam;
  right?: IModaqCycleTeam;
}): Record<string, any> {
  const {
    cycleCount,
    playedIndices,
    thrownOutIndices = [],
    left = { name: testTeamNames[0], starters: [`${testTeamNames[0]} Player 1`] },
    right = { name: testTeamNames[1], starters: [`${testTeamNames[1]} Player 1`] },
  } = options;

  const played = new Set(playedIndices);
  const thrownOut = new Set(thrownOutIndices);

  const matchTeam = (line: IModaqCycleTeam, buzzingPlayer: string) => {
    const subs = line.substitutes ?? [];
    // MODAQ's first lineup is the starters, and each substitution appends a whole new lineup.
    const lineups: { first_question: number; players: { name: string }[] }[] = [
      { first_question: 1, players: line.starters.map((name) => ({ name })) },
    ];
    for (const sub of [...subs].sort((a, b) => a.firstQuestion - b.firstQuestion)) {
      const previous = lineups[lineups.length - 1];
      lineups.push({
        first_question: sub.firstQuestion,
        players: previous.players.concat({ name: sub.name }),
      });
    }

    // MODAQ credits a tossup heard for every question a player was in the lineup for.
    const heardFor = (name: string) => {
      let heard = 0;
      for (let questionNumber = 1; questionNumber <= cycleCount; questionNumber++) {
        const lineup = lineups.filter((l) => l.first_question <= questionNumber).pop();
        if (lineup?.players.some((p) => p.name === name)) heard++;
      }
      return heard;
    };

    const allPlayers = line.starters.concat(subs.map((s) => s.name));
    return {
      team: { name: line.name },
      bonus_points: 0,
      lineups,
      match_players: allPlayers.map((name) => ({
        player: { name },
        tossups_heard: heardFor(name),
        answer_counts: name === buzzingPlayer ? [{ number: playedIndices.length, answer: { value: 10 } }] : [],
      })),
    };
  };

  const matchQuestions = [];
  for (let i = 0; i < cycleCount; i++) {
    const question: Record<string, any> = {
      question_number: i + 1,
      buzzes: [],
      tossup_question: { parts: 1, type: 'tossup', question_number: i + 1 },
    };
    if (played.has(i)) {
      // Alternate which side buzzes so the running score changes, as a real game's would.
      const team = i % 2 === 0 ? left : right;
      question.buzzes = [
        {
          buzz_position: { word_index: 3 },
          player: { name: team.starters[0] },
          team: { name: team.name },
          result: { value: 10 },
        },
      ];
    }
    if (thrownOut.has(i)) {
      question.replacement_tossup_question = { parts: 1, type: 'tossup', question_number: i + 2 };
    }
    matchQuestions.push(question);
  }

  return {
    // MODAQ derives this straight from playableCycles.length.
    tossups_read: cycleCount,
    match_teams: [matchTeam(left, left.starters[0]), matchTeam(right, right.starters[0])],
    match_questions: matchQuestions,
  };
}

/** A well-formed MODAQ match between the first two test teams. 300-165 with powers. */
export function makeStandardModaqMatch(round?: number): Record<string, any> {
  return makeModaqQbjMatch({
    round,
    tossupsRead: 20,
    left: {
      name: testTeamNames[0],
      bonusPoints: 150,
      players: [
        {
          name: `${testTeamNames[0]} Player 1`,
          tossupsHeard: 20,
          buzzes: [
            [15, 4],
            [10, 4],
            [-5, 1],
          ],
        },
        {
          name: `${testTeamNames[0]} Player 2`,
          tossupsHeard: 20,
          buzzes: [
            [15, 0],
            [10, 2],
            [-5, 0],
          ],
        },
      ],
    },
    right: {
      name: testTeamNames[1],
      bonusPoints: 90,
      players: [
        {
          name: `${testTeamNames[1]} Player 1`,
          tossupsHeard: 20,
          buzzes: [
            [15, 1],
            [10, 5],
            [-5, 2],
          ],
        },
        {
          name: `${testTeamNames[1]} Player 2`,
          tossupsHeard: 20,
          buzzes: [
            [15, 0],
            [10, 1],
            [-5, 0],
          ],
        },
      ],
    },
  });
}
