/**
 * End-to-end test of the room scorekeeping path:
 *
 *   room client -> real HTTP -> TournamentServer -> MatchImportService -> Match Inbox -> accept
 *   -> a normal Match in a YellowFruit Round
 *
 * The pieces are wired together the same way the Electron app wires them, but with the IPC hop
 * replaced by direct calls, since IPC is a transport rather than logic. Everything else is real: a
 * real HTTP server, real QBJ over the wire, and the same importer the manual file import uses.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import TournamentServer from '../main/server/TournamentServer';
import {
  IMatchSubmission,
  ISubmissionVerdict,
  ITournamentSnapshot,
  SessionStatus,
  sessionTokenHeader,
} from '../main/server/ServerTypes';
import TournamentServerService from '../renderer/Services/TournamentServerService';
import MatchImportService from '../renderer/Services/MatchImportService';
import scoringRulesToModaqGameFormat from '../renderer/Services/YellowFruitScoringRulesToModaq';
import { ImportResultStatus } from '../renderer/DataModel/MatchImportResult';
import { StatsValidity } from '../renderer/DataModel/Match';
import Tournament from '../renderer/DataModel/Tournament';
import { makeModaqQbjMatch, makeStandardModaqMatch, makeTestTournament, testTeamNames } from './TestFixtures';

let server: TournamentServer;
let service: TournamentServerService;
let tournament: Tournament;
let baseUrl: string;
let bundleDir: string;
let verdicts: ISubmissionVerdict[];
let acceptedCount: number;

/** Build the snapshot from the tournament, the way the renderer service does */
function snapshotFor(t: Tournament): ITournamentSnapshot {
  const formatResult = scoringRulesToModaqGameFormat(t.scoringRules);
  return {
    name: t.name,
    rounds: t.phases.flatMap((p) => p.rounds.map((r) => ({ number: r.number, name: r.displayName() }))),
    teams: t.getListOfAllTeams().map((team) => ({
      name: team.name,
      players: team.players.map((p) => ({ name: p.name })),
    })),
    gameFormat: formatResult.ok ? formatResult.gameFormat : null,
    gameFormatErrors: formatResult.ok ? [] : formatResult.errors,
    gameFormatWarnings: formatResult.ok ? formatResult.warnings : [],
  };
}

beforeEach(async () => {
  verdicts = [];
  acceptedCount = 0;
  bundleDir = mkdtempSync(path.join(tmpdir(), 'yf-e2e-'));
  writeFileSync(path.join(bundleDir, 'index.html'), '<!doctype html><title>Room</title>');

  tournament = makeTestTournament();

  // Stand in for the preload bridge. The renderer service only uses sendMessage and invoke, so this
  // routes those straight to the server instead of across processes.
  const submissions: IMatchSubmission[] = [];
  (global as any).window = {
    electron: {
      ipcRenderer: {
        on: () => () => {},
        once: () => {},
        removeAllListeners: () => {},
        sendMessage: (channel: string, payload: unknown) => {
          if (channel.includes('SubmissionVerdict')) {
            const verdict = payload as ISubmissionVerdict;
            verdicts.push(verdict);
            if (verdict.accepted) server.acceptSession(verdict.sessionId);
            else server.rejectSession(verdict.sessionId, verdict.reason);
          }
          if (channel.includes('SetSnapshot')) {
            server.setTournamentSnapshot(payload as ITournamentSnapshot);
          }
        },
        invoke: async () => ({ running: true, port: 0, addresses: [] }),
      },
    },
  };

  server = new TournamentServer({
    roomBundleDirectory: bundleDir,
    // This is the hop the Electron main process makes to the renderer.
    onFinalSubmission: (submission) => {
      submissions.push(submission);
      service.handleSubmission(submission);
    },
  });
  server.setTournamentSnapshot(snapshotFor(tournament));

  service = new TournamentServerService(tournament);
  service.onMatchAccepted = () => {
    acceptedCount += 1;
  };

  const status = await server.start(0);
  expect(status.running).toBe(true);
  baseUrl = `http://127.0.0.1:${(server as any).server.address().port}`;
});

afterEach(async () => {
  await server.stop();
  rmSync(bundleDir, { recursive: true, force: true });
  delete (global as any).window;
});

/** Do what the room app does: create a session, then send a final QBJ match */
async function playAndSubmit(qbj: unknown, roundNumber = 1, teams = [testTeamNames[0], testTeamNames[1]]) {
  const createResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roundNumber, leftTeam: teams[0], rightTeam: teams[1] }),
  });
  const session = await createResponse.json();

  const finalResponse = await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
    body: JSON.stringify(qbj),
  });

  return { session, finalResponse, finalBody: await finalResponse.json() };
}

describe('the full path from room submission to an accepted match', () => {
  test('a submitted game is validated and lands in the Match Inbox without touching the tournament', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch());

    // In the inbox, validated.
    expect(service.inbox).toHaveLength(1);
    const item = service.inbox[0];
    expect(item.sessionId).toBe(session.sessionId);
    expect(item.roundNumber).toBe(1);
    expect(item.importResult.status).toBe(ImportResultStatus.Success);
    expect(item.importResult.messages).toHaveLength(0);
    expect(item.importResult.match?.leftTeam.points).toBe(265);
    expect(item.importResult.match?.rightTeam.points).toBe(155);

    // Crucially, nothing is in the tournament yet.
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(0);
    expect(server.sessions.get(session.sessionId)?.status).toBe(SessionStatus.Submitted);
  });

  test('accepting produces a normal Match in the right round', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 2);

    expect(service.acceptSubmission(session.sessionId)).toBe(true);

    const round2 = tournament.getRoundObjByNumber(2);
    expect(round2?.matches).toHaveLength(1);

    const match = round2!.matches[0];
    expect(match.leftTeam.team?.name).toBe(testTeamNames[0]);
    expect(match.rightTeam.team?.name).toBe(testTeamNames[1]);
    expect(match.leftTeam.points).toBe(265);
    expect(match.rightTeam.points).toBe(155);
    expect(match.tossupsRead).toBe(20);
    // Counts toward stats, exactly like a manually imported game.
    expect(match.statsValidity).toBe(StatsValidity.valid);
    // Labeled with the room it came from, in the same field a file import uses.
    expect(match.importedFile).toContain(testTeamNames[0]);

    // The inbox is cleared, the session is marked accepted, and the file is dirty.
    expect(service.inbox).toHaveLength(0);
    expect(server.sessions.get(session.sessionId)?.status).toBe(SessionStatus.Accepted);
    expect(verdicts).toEqual([{ sessionId: session.sessionId, accepted: true }]);
    expect(acceptedCount).toBe(1);
  });

  test('an accepted remote match is indistinguishable from a manually imported one', async () => {
    // Import the same QBJ by hand into round 1...
    const manualService = new MatchImportService(tournament);
    const manual = manualService.importMatches(
      [{ filePath: 'byhand.qbj', fileContents: JSON.stringify(makeStandardModaqMatch(1)) }],
      tournament.getRoundObjByNumber(1),
    );
    const manualMatch = manual.results[0].match!;

    // ...and the same QBJ through a room into round 2.
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 2);
    service.acceptSubmission(session.sessionId);
    const remoteMatch = tournament.getRoundObjByNumber(2)!.matches[0];

    // Everything that feeds statistics matches.
    expect(remoteMatch.leftTeam.points).toBe(manualMatch.leftTeam.points);
    expect(remoteMatch.rightTeam.points).toBe(manualMatch.rightTeam.points);
    expect(remoteMatch.tossupsRead).toBe(manualMatch.tossupsRead);
    expect(remoteMatch.statsValidity).toBe(manualMatch.statsValidity);
    expect(remoteMatch.leftTeam.team).toBe(manualMatch.leftTeam.team);
    expect(remoteMatch.leftTeam.getActivePlayerList().length).toBe(manualMatch.leftTeam.getActivePlayerList().length);
  });

  test('the accepted match feeds standings through the normal stats flow', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 1);
    service.acceptSubmission(session.sessionId);

    // `true` asks for the full report, which is what populates cumulative standings.
    tournament.compileStats(true);

    const standings = tournament.cumulativeStats;
    const winner = standings?.teamStats.find((t) => t.team.name === testTeamNames[0]);
    const loser = standings?.teamStats.find((t) => t.team.name === testTeamNames[1]);

    expect(winner?.wins).toBe(1);
    expect(winner?.losses).toBe(0);
    expect(winner?.totalPoints).toBe(265);
    expect(loser?.wins).toBe(0);
    expect(loser?.losses).toBe(1);
    expect(loser?.totalPoints).toBe(155);
  });

  test('rejecting tells the room and leaves the tournament alone', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 1);

    expect(service.rejectSubmission(session.sessionId, 'Teams were swapped')).toBe(true);

    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(0);
    expect(service.inbox).toHaveLength(0);
    expect(server.sessions.get(session.sessionId)?.status).toBe(SessionStatus.Rejected);
    expect(server.sessions.get(session.sessionId)?.rejectionReason).toBe('Teams were swapped');
    expect(acceptedCount).toBe(0);
  });

  test('a rejected room can correct and resubmit, and that submission can be accepted', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 1);
    service.rejectSubmission(session.sessionId, 'Wrong game');

    // The room submits again with the same credentials.
    const retry = await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
      body: JSON.stringify(makeStandardModaqMatch()),
    });
    expect(retry.status).toBe(200);
    expect(service.inbox).toHaveLength(1);

    service.acceptSubmission(session.sessionId);
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(1);
  });

  test('a duplicate final submission never produces two matches', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 1);

    // The room retries three more times, as it would over a flaky connection.
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
        body: JSON.stringify(makeStandardModaqMatch()),
      });
    }

    expect(service.inbox).toHaveLength(1);
    service.acceptSubmission(session.sessionId);
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(1);
  });

  test('live snapshots never create a match, no matter how many arrive', async () => {
    const createResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundNumber: 1, leftTeam: testTeamNames[0], rightTeam: testTeamNames[1] }),
    });
    const session = await createResponse.json();

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/snapshot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
        body: JSON.stringify(makeStandardModaqMatch()),
      });
    }

    expect(service.inbox).toHaveLength(0);
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(0);
    // But the dashboard can see the game.
    expect(server.getSessionSummaries()[0].score?.leftPoints).toBe(265);
  });
});

describe('validation failures reaching the inbox', () => {
  test('a game with errors requires an explicit override to accept', async () => {
    // Same team on both sides: a non-fatal error.
    const badMatch = makeModaqQbjMatch({
      left: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[0],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[0]} Player 2`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    // The room can't pick the same team twice, so this has to be a session whose QBJ disagrees with
    // the session's own teams, which is exactly the case validation has to catch.
    const { session } = await playAndSubmit(badMatch, 1);

    const item = service.inbox[0];
    expect(item.importResult.status).toBe(ImportResultStatus.ErrNonFatal);
    expect(item.importResult.messages.length).toBeGreaterThan(0);

    // A plain accept is refused.
    expect(service.acceptSubmission(session.sessionId)).toBe(false);
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(0);

    // "Accept Anyway" works, and omits it from stats.
    expect(service.acceptSubmission(session.sessionId, true)).toBe(true);
    expect(tournament.getRoundObjByNumber(1)!.matches[0].statsValidity).toBe(StatsValidity.omit);
  });

  test('a submission naming a team that is not in the tournament is fatal and cannot be accepted', async () => {
    // The server blocks unknown teams at session creation, so reach the importer by submitting QBJ
    // whose teams differ from the session's.
    const strangerMatch = makeModaqQbjMatch({
      left: {
        name: 'Zzyzx Institute of Nothing',
        bonusPoints: 100,
        players: [{ name: 'Nobody', tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
      right: {
        name: testTeamNames[1],
        bonusPoints: 100,
        players: [{ name: `${testTeamNames[1]} Player 1`, tossupsHeard: 20, buzzes: [[10, 5]] }],
      },
    });
    const { session } = await playAndSubmit(strangerMatch, 1);

    const item = service.inbox[0];
    expect(item.importResult.status).toBe(ImportResultStatus.FatalErr);
    expect(item.importResult.messages[0]).toContain('Zzyzx');

    // Not acceptable at all, even with an override.
    expect(service.acceptSubmission(session.sessionId, true)).toBe(false);
    expect(tournament.getRoundObjByNumber(1)?.matches).toHaveLength(0);
  });

  test('a later submission from the same room replaces its earlier inbox entry', async () => {
    const { session } = await playAndSubmit(makeStandardModaqMatch(), 1);
    service.rejectSubmission(session.sessionId);

    await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
      body: JSON.stringify(makeStandardModaqMatch()),
    });
    await fetch(`${baseUrl}/api/v1/sessions/${session.sessionId}/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [sessionTokenHeader]: session.token },
      body: JSON.stringify(makeStandardModaqMatch()),
    });

    // One row per room, not one per attempt.
    expect(service.inbox.filter((i) => i.sessionId === session.sessionId)).toHaveLength(1);
  });
});

describe('multiple rooms at once', () => {
  test('two rooms submit independently and both become matches', async () => {
    const roomA = await playAndSubmit(makeStandardModaqMatch(), 1, [testTeamNames[0], testTeamNames[1]]);
    const roomB = await playAndSubmit(
      makeModaqQbjMatch({
        left: {
          name: testTeamNames[2],
          bonusPoints: 120,
          players: [{ name: `${testTeamNames[2]} Player 1`, tossupsHeard: 20, buzzes: [[10, 8]] }],
        },
        right: {
          name: testTeamNames[3],
          bonusPoints: 60,
          players: [{ name: `${testTeamNames[3]} Player 1`, tossupsHeard: 20, buzzes: [[10, 4]] }],
        },
      }),
      1,
      [testTeamNames[2], testTeamNames[3]],
    );

    expect(service.inbox).toHaveLength(2);

    service.acceptSubmission(roomA.session.sessionId);
    service.acceptSubmission(roomB.session.sessionId);

    const round1 = tournament.getRoundObjByNumber(1);
    expect(round1?.matches).toHaveLength(2);
    expect(service.inbox).toHaveLength(0);
    expect(acceptedCount).toBe(2);
  });

  test('the dashboard reports every room', async () => {
    await playAndSubmit(makeStandardModaqMatch(), 1, [testTeamNames[0], testTeamNames[1]]);
    await playAndSubmit(makeStandardModaqMatch(), 2, [testTeamNames[0], testTeamNames[1]]);

    expect(server.getSessionSummaries()).toHaveLength(2);
  });
});
