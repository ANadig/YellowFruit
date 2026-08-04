import { describe, expect, test } from 'vitest';
import TournamentServerService from '../renderer/Services/TournamentServerService';
import { ScheduledMatch, ScheduledMatchStatus } from '../renderer/DataModel/ScheduledMatch';
import { makeTestTournament, testTeamNames } from './TestFixtures';

function scheduled(
  roundNumber: number,
  leftIndex: number,
  rightIndex: number,
  status = ScheduledMatchStatus.Scheduled,
) {
  const match = new ScheduledMatch(roundNumber, testTeamNames[leftIndex], testTeamNames[rightIndex]);
  match.status = status;
  return match;
}

describe('tournament operations release state', () => {
  test('the next release skips accepted history after a rebracket', () => {
    const tournament = makeTestTournament();
    tournament.scheduledMatches = [scheduled(1, 0, 1, ScheduledMatchStatus.Accepted), scheduled(8, 0, 2)];

    const service = new TournamentServerService(tournament);

    expect(service.nextRoundToRelease()).toBe(8);
  });

  test('releasing a round makes scheduled assignments ready without changing history', () => {
    const tournament = makeTestTournament();
    const accepted = scheduled(1, 0, 1, ScheduledMatchStatus.Accepted);
    const future = scheduled(2, 0, 2);
    tournament.scheduledMatches = [accepted, future];
    const service = new TournamentServerService(tournament);
    let changes = 0;
    service.onScheduleChanged = () => {
      changes += 1;
    };

    expect(service.releaseRound(2)).toBe(true);
    expect(tournament.releasedRoundNumber).toBe(2);
    expect(future.status).toBe(ScheduledMatchStatus.Ready);
    expect(accepted.status).toBe(ScheduledMatchStatus.Accepted);
    expect(changes).toBe(1);
  });

  test('a started assignment moves from ready to playing', () => {
    const tournament = makeTestTournament();
    const future = scheduled(1, 0, 1, ScheduledMatchStatus.Ready);
    tournament.scheduledMatches = [future];
    const service = new TournamentServerService(tournament);

    service.handleSessionStarted(future.id);

    expect(future.status).toBe(ScheduledMatchStatus.Playing);
  });
});
