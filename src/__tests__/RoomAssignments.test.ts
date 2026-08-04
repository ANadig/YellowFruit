/**
 * The room-assignment half of the tournament server, exercised over real HTTP.
 *
 * The property under test throughout is that the server, not the browser, decides what a room plays.
 * A room client says which room it is and which assignment it thinks it is starting; the round, the
 * teams, and whether it may start at all all come from the tournament snapshot.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import TournamentServer from '../main/server/TournamentServer';
import {
  IAssignmentDescriptor,
  IMatchSubmission,
  IRoomDescriptor,
  ITournamentSnapshot,
  RoomBlockedReason,
  SessionStatus,
  roomTokenHeader,
  sessionTokenHeader,
} from '../main/server/ServerTypes';
import { ScheduledMatchStatus } from '../renderer/DataModel/ScheduledMatch';
import scoringRulesToModaqGameFormat from '../renderer/Services/YellowFruitScoringRulesToModaq';
import { CommonRuleSets, ScoringRules } from '../renderer/DataModel/ScoringRules';
import { makeModaqQbjMatch, testTeamNames } from './TestFixtures';

/** Two rooms with fixed ids and tokens, so tests can address them directly */
const rooms: IRoomDescriptor[] = [
  { id: 'room-101', name: 'Room 101', accessToken: 'token-for-101', enabled: true },
  { id: 'room-102', name: 'Room 102', accessToken: 'token-for-102', enabled: true },
];

/** Room 101 plays rounds 1 and 2; room 102 plays round 1 */
function makeAssignments(): IAssignmentDescriptor[] {
  return [
    {
      scheduledMatchId: 'sched-r1-101',
      roomId: 'room-101',
      roundNumber: 1,
      roundName: '1',
      leftTeam: testTeamNames[0],
      rightTeam: testTeamNames[1],
      status: ScheduledMatchStatus.Scheduled,
    },
    {
      scheduledMatchId: 'sched-r1-102',
      roomId: 'room-102',
      roundNumber: 1,
      roundName: '1',
      leftTeam: testTeamNames[2],
      rightTeam: testTeamNames[3],
      status: ScheduledMatchStatus.Scheduled,
    },
    {
      scheduledMatchId: 'sched-r2-101',
      roomId: 'room-101',
      roundNumber: 2,
      roundName: '2',
      leftTeam: testTeamNames[0],
      rightTeam: testTeamNames[2],
      status: ScheduledMatchStatus.Scheduled,
    },
  ];
}

function makeSnapshot(overrides: Partial<ITournamentSnapshot> = {}): ITournamentSnapshot {
  const formatResult = scoringRulesToModaqGameFormat(new ScoringRules(CommonRuleSets.AcfPowers));
  return {
    name: 'Ninety Six Invitational',
    rounds: [1, 2, 3].map((n) => ({ number: n, name: String(n) })),
    teams: testTeamNames.map((name) => ({
      name,
      players: [{ name: `${name} Player 1` }, { name: `${name} Player 2` }],
    })),
    gameFormat: formatResult.ok ? formatResult.gameFormat : null,
    gameFormatErrors: formatResult.ok ? [] : formatResult.errors,
    gameFormatWarnings: formatResult.ok ? formatResult.warnings : [],
    timedRounds: false,
    rooms,
    assignments: makeAssignments(),
    currentRoundNumber: 1,
    ...overrides,
  };
}

let server: TournamentServer;
let baseUrl: string;
let bundleDir: string;
let submissions: IMatchSubmission[];
let startedSessions: { sessionId: string; scheduledMatchId: string }[];

beforeEach(async () => {
  submissions = [];
  startedSessions = [];
  bundleDir = mkdtempSync(path.join(tmpdir(), 'yf-room-assign-'));
  writeFileSync(path.join(bundleDir, 'index.html'), '<!doctype html><title>Room</title>');

  server = new TournamentServer({
    roomBundleDirectory: bundleDir,
    onFinalSubmission: (s) => submissions.push(s),
    onSessionStarted: (sessionId, scheduledMatchId) => startedSessions.push({ sessionId, scheduledMatchId }),
  });
  server.setTournamentSnapshot(makeSnapshot());
  await server.start(0);
  baseUrl = `http://127.0.0.1:${(server as any).server.address().port}`;
});

afterEach(async () => {
  await server.stop();
  rmSync(bundleDir, { recursive: true, force: true });
});

/** GET a room's assignment the way its Chromebook does */
async function getAssignment(roomId: string, token: string) {
  const res = await fetch(`${baseUrl}/api/v1/rooms/${roomId}/assignment`, {
    headers: { [roomTokenHeader]: token },
  });
  return { res, body: await res.json().catch(() => null) };
}

/** POST to start a room's assigned game */
async function startMatch(roomId: string, token: string, scheduledMatchId: string) {
  const res = await fetch(`${baseUrl}/api/v1/rooms/${roomId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [roomTokenHeader]: token },
    body: JSON.stringify({ scheduledMatchId }),
  });
  return { res, body: await res.json().catch(() => null) };
}

describe('room authorization', () => {
  test('a room with a valid token gets its own assignment', async () => {
    const { res, body } = await getAssignment('room-101', 'token-for-101');

    expect(res.status).toBe(200);
    expect(body.roomName).toBe('Room 101');
    expect(body.tournamentName).toBe('Ninety Six Invitational');
    expect(body.current.scheduledMatchId).toBe('sched-r1-101');
  });

  test("a room token cannot read another room's assignment", async () => {
    const { res } = await getAssignment('room-102', 'token-for-101');

    expect(res.status).toBe(403);
  });

  test("a room token cannot start another room's game", async () => {
    const { res } = await startMatch('room-102', 'token-for-101', 'sched-r1-102');

    expect(res.status).toBe(403);
    expect(server.getSessionSummaries()).toHaveLength(0);
  });

  test('no token is refused', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rooms/room-101/assignment`);

    expect(res.status).toBe(403);
  });

  test('an unknown room and a bad token are indistinguishable, so rooms cannot be enumerated', async () => {
    const unknown = await getAssignment('room-nope', 'token-for-101');
    const badToken = await getAssignment('room-101', 'wrong');

    expect(unknown.res.status).toBe(badToken.res.status);
    expect(unknown.body.error).toBe(badToken.body.error);
  });

  test('a room access token is never included in a response', async () => {
    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(JSON.stringify(body)).not.toContain('token-for-101');
    expect(JSON.stringify(body)).not.toContain('token-for-102');
  });
});

describe('what a room is told to play', () => {
  test('the current game comes with both rosters, so MODAQ can be set up', async () => {
    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.current.leftTeam.name).toBe(testTeamNames[0]);
    expect(body.current.leftTeam.players).toHaveLength(2);
    expect(body.current.rightTeam.name).toBe(testTeamNames[1]);
  });

  test('a room is told about its next game for context', async () => {
    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.next.roundNumber).toBe(2);
    expect(body.next.leftTeam).toBe(testTeamNames[0]);
    // No rosters on the context lines; a room only needs those for the game it's playing.
    expect(body.next.leftTeam).toBe(testTeamNames[0]);
  });

  test('a room with nothing assigned is told so rather than erroring', async () => {
    server.setTournamentSnapshot(makeSnapshot({ assignments: [] }));

    const { res, body } = await getAssignment('room-101', 'token-for-101');

    expect(res.status).toBe(200);
    expect(body.current).toBeNull();
    expect(body.next).toBeNull();
  });

  test('once a round is accepted the next round becomes current on its own', async () => {
    const assignments = makeAssignments();
    assignments[0].status = ScheduledMatchStatus.Accepted;
    server.setTournamentSnapshot(makeSnapshot({ assignments, currentRoundNumber: 2 }));

    const { body } = await getAssignment('room-101', 'token-for-101');

    // No action from the scorekeeper: the page simply now shows round 2.
    expect(body.current.scheduledMatchId).toBe('sched-r2-101');
    expect(body.current.roundNumber).toBe(2);
    expect(body.previous.roundNumber).toBe(1);
    expect(body.blockedReason).toBeUndefined();
  });

  test('a cancelled game is skipped rather than offered', async () => {
    const assignments = makeAssignments();
    assignments[0].status = ScheduledMatchStatus.Cancelled;
    server.setTournamentSnapshot(makeSnapshot({ assignments, currentRoundNumber: 2 }));

    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.current.scheduledMatchId).toBe('sched-r2-101');
  });
});

describe('starting an assigned game', () => {
  test('starting creates a session whose teams and round come from the assignment', async () => {
    const { res, body } = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    expect(res.status).toBe(201);
    expect(body.roundNumber).toBe(1);
    expect(body.leftTeam).toBe(testTeamNames[0]);
    expect(body.rightTeam).toBe(testTeamNames[1]);
    expect(body.token).toBeTruthy();

    const summary = server.getSessionSummaries()[0];
    expect(summary.roomId).toBe('room-101');
    expect(summary.scheduledMatchId).toBe('sched-r1-101');
  });

  test('the desktop is told a room started, so the game shows as being played', async () => {
    await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    expect(startedSessions).toHaveLength(1);
    expect(startedSessions[0].scheduledMatchId).toBe('sched-r1-101');
  });

  test('a room cannot start a game assigned to a different room', async () => {
    // Room 101's own token, but round 1's game in room 102.
    const { res } = await startMatch('room-101', 'token-for-101', 'sched-r1-102');

    expect(res.status).toBe(409);
    expect(server.getSessionSummaries()).toHaveLength(0);
  });

  test('a room cannot start a game that does not exist', async () => {
    const { res } = await startMatch('room-101', 'token-for-101', 'sched-made-up');

    expect(res.status).toBe(409);
  });

  test('a missing scheduledMatchId is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rooms/room-101/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [roomTokenHeader]: 'token-for-101' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  test('GET is not allowed for starting a game', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rooms/room-101/sessions`, {
      headers: { [roomTokenHeader]: 'token-for-101' },
    });

    expect(res.status).toBe(405);
  });
});

describe('operational safeguards', () => {
  test('a room cannot start a future round on its own', async () => {
    // Round 2 is visible on room 101's page as "next", but round 1 is still in play.
    const { res, body } = await startMatch('room-101', 'token-for-101', 'sched-r2-101');

    expect(res.status).toBe(409);
    expect(body.blockedReason).toBe(RoomBlockedReason.FutureRound);
    expect(server.getSessionSummaries()).toHaveLength(0);
  });

  test('control opening the round lets the same request through', async () => {
    server.setTournamentSnapshot(makeSnapshot({ currentRoundNumber: 2 }));
    const assignments = makeAssignments();
    assignments[0].status = ScheduledMatchStatus.Accepted;
    server.setTournamentSnapshot(makeSnapshot({ assignments, currentRoundNumber: 2 }));

    const { res } = await startMatch('room-101', 'token-for-101', 'sched-r2-101');

    expect(res.status).toBe(201);
  });

  test('an already-accepted game cannot be started again', async () => {
    const assignments = makeAssignments();
    assignments[0].status = ScheduledMatchStatus.Accepted;
    server.setTournamentSnapshot(makeSnapshot({ assignments }));

    const { res, body } = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    expect(res.status).toBe(409);
    expect(body.blockedReason).toBe(RoomBlockedReason.AlreadyResolved);
  });

  test('a disabled room cannot start a game', async () => {
    server.setTournamentSnapshot(makeSnapshot({ rooms: [{ ...rooms[0], enabled: false }, rooms[1]] }));

    const { res, body } = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    expect(res.status).toBe(409);
    expect(body.blockedReason).toBe(RoomBlockedReason.RoomDisabled);
  });

  test('a room is blocked when no round is in play', async () => {
    server.setTournamentSnapshot(makeSnapshot({ currentRoundNumber: null }));

    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.blockedReason).toBe(RoomBlockedReason.FutureRound);
  });

  test('unusable scoring rules block a room and explain why', async () => {
    server.setTournamentSnapshot(
      makeSnapshot({ gameFormat: null, gameFormatErrors: ['Lightning rounds cannot be scored.'] }),
    );

    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.blockedReason).toBe(RoomBlockedReason.RulesUnusable);
    expect(body.gameFormatErrors[0]).toContain('Lightning');
  });
});

describe('reconnection and duplicate prevention', () => {
  test('a reload resumes the existing session instead of starting a second one', async () => {
    const first = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    const second = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    // 200 rather than 201 tells the client nothing new was created.
    expect(second.res.status).toBe(200);
    expect(second.body.sessionId).toBe(first.body.sessionId);
    expect(server.getSessionSummaries()).toHaveLength(1);
  });

  test('a resumed start does not tell the desktop a new game began', async () => {
    await startMatch('room-101', 'token-for-101', 'sched-r1-101');
    await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    expect(startedSessions).toHaveLength(1);
  });

  test('a reconnecting room is handed its open session and token in one request', async () => {
    const started = await startMatch('room-101', 'token-for-101', 'sched-r1-101');

    // What a Chromebook does after a refresh or a Wi-Fi drop: one GET, and it can carry on.
    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.session.sessionId).toBe(started.body.sessionId);
    expect(body.session.token).toBe(started.body.token);
    expect(body.session.status).toBe(SessionStatus.Created);
  });

  test('a room with no open session is told there is none', async () => {
    const { body } = await getAssignment('room-101', 'token-for-101');

    expect(body.session).toBeNull();
  });

  test('the resumed session token still works for writing', async () => {
    await startMatch('room-101', 'token-for-101', 'sched-r1-101');
    const { body } = await getAssignment('room-101', 'token-for-101');

    const res = await fetch(`${baseUrl}/api/v1/sessions/${body.session.sessionId}/snapshot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: body.session.token },
      body: JSON.stringify(assignedMatchQbj()),
    });

    expect(res.status).toBe(200);
  });
});

/** A QBJ match between the teams room 101 is assigned in round 1 */
function assignedMatchQbj(leftName = testTeamNames[0], rightName = testTeamNames[1]) {
  return makeModaqQbjMatch({
    left: {
      name: leftName,
      bonusPoints: 100,
      players: [{ name: `${leftName} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
    },
    right: {
      name: rightName,
      bonusPoints: 80,
      players: [{ name: `${rightName} Player 1`, tossupsHeard: 20, buzzes: [[10, 4]] }],
    },
  });
}

describe('wrong-team and wrong-round submissions', () => {
  async function startAndSubmit(qbj: unknown) {
    const { body: session } = await startMatch('room-101', 'token-for-101', 'sched-r1-101');
    const res = await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
      body: JSON.stringify(qbj),
    });
    return { res, session };
  }

  test('the assigned teams are accepted', async () => {
    const { res } = await startAndSubmit(assignedMatchQbj());

    expect(res.status).toBe(200);
    expect(submissions).toHaveLength(1);
  });

  test('the assigned teams in the opposite order are accepted', async () => {
    // A scorekeeper may set the two teams up either way round in MODAQ.
    const { res } = await startAndSubmit(assignedMatchQbj(testTeamNames[1], testTeamNames[0]));

    expect(res.status).toBe(200);
    expect(submissions).toHaveLength(1);
  });

  test('a game between different teams is refused', async () => {
    const { res } = await startAndSubmit(assignedMatchQbj(testTeamNames[2], testTeamNames[3]));

    expect(res.status).toBe(409);
    expect(submissions).toHaveLength(0);
  });

  test('a game with only one of the assigned teams is refused', async () => {
    const { res } = await startAndSubmit(assignedMatchQbj(testTeamNames[0], testTeamNames[3]));

    expect(res.status).toBe(409);
    expect(submissions).toHaveLength(0);
  });

  test('the round on the submission comes from the assignment, not the payload', async () => {
    const qbj = assignedMatchQbj() as Record<string, any>;
    // A room claiming round 3 for a game it was assigned in round 1.
    qbj._round = 3;

    await startAndSubmit(qbj);

    expect(submissions[0].roundNumber).toBe(1);
  });

  test('the submission carries its room and scheduled game, so accepting can link them', async () => {
    await startAndSubmit(assignedMatchQbj());

    expect(submissions[0].roomId).toBe('room-101');
    expect(submissions[0].scheduledMatchId).toBe('sched-r1-101');
  });

  test('resubmitting the same final does not produce a second candidate match', async () => {
    const { body: session } = await startMatch('room-101', 'token-for-101', 'sched-r1-101');
    const submit = () =>
      fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
        body: JSON.stringify(assignedMatchQbj()),
      });

    const first = await submit();
    const second = await submit();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json().then((b) => b.newSubmission)).toBe(false);
    expect(submissions).toHaveLength(1);
  });
});

describe('serving the room page', () => {
  test('a permanent room URL serves the room application', async () => {
    // The Chromebook stays on this URL all day; the room app reads its id and token from it.
    const res = await fetch(`${baseUrl}/room/room-101?token=token-for-101`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
