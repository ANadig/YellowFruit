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
