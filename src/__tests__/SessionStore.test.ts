import { describe, expect, test } from 'vitest';
import SessionStore, { SessionWriteError } from '../main/server/SessionStore';
import { SessionDisplayState, SessionStatus, staleSessionThresholdMs } from '../main/server/ServerTypes';
import { makeStandardModaqMatch, testTeamNames } from './TestFixtures';

/** A store with a clock the test controls */
function makeStore() {
  let now = new Date('2026-08-04T12:00:00.000Z');
  const store = new SessionStore(() => now);
  return {
    store,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
  };
}

function newSession(store: SessionStore) {
  return store.create(1, testTeamNames[0], testTeamNames[1]);
}

describe('create session', () => {
  test('a new session starts in created with no snapshot', () => {
    const { store } = makeStore();
    const session = newSession(store);

    expect(session.status).toBe(SessionStatus.Created);
    expect(session.latestQbj).toBeNull();
    expect(session.finalReceived).toBe(false);
    expect(session.roundNumber).toBe(1);
    expect(session.leftTeam).toBe(testTeamNames[0]);
    expect(session.rightTeam).toBe(testTeamNames[1]);
    expect(session.createdAt).toBe('2026-08-04T12:00:00.000Z');
  });

  test('ids and tokens are unique across sessions', () => {
    const { store } = makeStore();
    const ids = new Set<string>();
    const tokens = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const session = newSession(store);
      ids.add(session.id);
      tokens.add(session.token);
    }

    expect(ids.size).toBe(25);
    expect(tokens.size).toBe(25);
  });

  test('sessions can be looked up and listed', () => {
    const { store } = makeStore();
    const session = newSession(store);

    expect(store.get(session.id)).toBe(session);
    expect(store.getAll()).toHaveLength(1);
    expect(store.get('nope')).toBeUndefined();
  });

  test('the state projection never includes the token', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const projected = SessionStore.toStateResponse(session) as unknown as Record<string, unknown>;

    expect(projected.token).toBeUndefined();
    expect(projected.latestQbj).toBeUndefined();
    expect(projected.sessionId).toBe(session.id);
  });
});

describe('snapshot update', () => {
  test('the first snapshot moves the session to playing', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(result.ok).toBe(true);
    expect(session.status).toBe(SessionStatus.Playing);
    expect(session.latestQbj).not.toBeNull();
  });

  test('a snapshot replaces the previous one rather than accumulating', () => {
    const { store } = makeStore();
    const session = newSession(store);

    store.updateSnapshot(session.id, session.token, { match_teams: [], marker: 'first' });
    store.updateSnapshot(session.id, session.token, { match_teams: [], marker: 'second' });

    expect((session.latestQbj as any).marker).toBe('second');
  });

  test('a snapshot never marks the game as finished', () => {
    const { store } = makeStore();
    const session = newSession(store);

    store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(session.finalReceived).toBe(false);
    expect(session.status).not.toBe(SessionStatus.Submitted);
  });

  test('lastSeenAt advances with each snapshot', () => {
    const { store, advance } = makeStore();
    const session = newSession(store);
    const original = session.lastSeenAt;

    advance(7000);
    store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(session.lastSeenAt).not.toBe(original);
  });

  test('the wrong token is refused', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.updateSnapshot(session.id, 'not-the-token', makeStandardModaqMatch());

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe(SessionWriteError.BadToken);
    expect(session.latestQbj).toBeNull();
  });

  test('a missing token is refused', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.updateSnapshot(session.id, undefined, makeStandardModaqMatch());

    expect(result.ok === false && result.error).toBe(SessionWriteError.BadToken);
  });

  test('an unknown session is refused', () => {
    const { store } = makeStore();

    const result = store.updateSnapshot('nope', 'token', makeStandardModaqMatch());

    expect(result.ok === false && result.error).toBe(SessionWriteError.NotFound);
  });
});

describe('final transition', () => {
  test('a final submission moves the session to submitted and is new', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.submitFinal(session.id, session.token, makeStandardModaqMatch());

    expect(result.ok && result.isNew).toBe(true);
    expect(session.status).toBe(SessionStatus.Submitted);
    expect(session.finalReceived).toBe(true);
  });

  test('a final can arrive without any prior snapshot', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.submitFinal(session.id, session.token, makeStandardModaqMatch());

    expect(result.ok).toBe(true);
    expect(session.status).toBe(SessionStatus.Submitted);
  });

  test('the wrong token cannot submit a final', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const result = store.submitFinal(session.id, 'wrong', makeStandardModaqMatch());

    expect(result.ok === false && result.error).toBe(SessionWriteError.BadToken);
    expect(session.finalReceived).toBe(false);
  });
});

describe('duplicate-safe final submission', () => {
  test('resubmitting reports isNew false so no duplicate match is created', () => {
    const { store } = makeStore();
    const session = newSession(store);

    const first = store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    const second = store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    const third = store.submitFinal(session.id, session.token, makeStandardModaqMatch());

    expect(first.ok && first.isNew).toBe(true);
    expect(second.ok && second.isNew).toBe(false);
    expect(third.ok && third.isNew).toBe(false);
  });

  test('a resubmission still refreshes the stored QBJ, so late corrections land', () => {
    const { store } = makeStore();
    const session = newSession(store);

    store.submitFinal(session.id, session.token, { match_teams: [], marker: 'first' });
    store.submitFinal(session.id, session.token, { match_teams: [], marker: 'corrected' });

    expect((session.latestQbj as any).marker).toBe('corrected');
  });

  test('resubmitting after acceptance changes nothing', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, { match_teams: [], marker: 'accepted-version' });
    store.markAccepted(session.id);

    const result = store.submitFinal(session.id, session.token, { match_teams: [], marker: 'too-late' });

    expect(result.ok && result.isNew).toBe(false);
    expect(session.status).toBe(SessionStatus.Accepted);
    expect((session.latestQbj as any).marker).toBe('accepted-version');
  });
});

describe('accepted transition', () => {
  test('accepting sets the status and clears any rejection reason', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    store.markRejected(session.id, 'wrong round');

    store.markAccepted(session.id);

    expect(session.status).toBe(SessionStatus.Accepted);
    expect(session.rejectionReason).toBeUndefined();
  });

  test('an accepted session refuses further snapshots', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    store.markAccepted(session.id);

    const result = store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(result.ok === false && result.error).toBe(SessionWriteError.AlreadyResolved);
  });

  test('accepting an unknown session is a no-op', () => {
    const { store } = makeStore();

    expect(store.markAccepted('nope')).toBeUndefined();
  });
});

describe('rejected transition', () => {
  test('rejecting records the reason and reopens the session for resubmission', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, makeStandardModaqMatch());

    store.markRejected(session.id, 'Teams were swapped');

    expect(session.status).toBe(SessionStatus.Rejected);
    expect(session.rejectionReason).toBe('Teams were swapped');
    // finalReceived is cleared so a corrected submission counts as new.
    expect(session.finalReceived).toBe(false);

    const result = store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    expect(result.ok && result.isNew).toBe(true);
  });

  test('a rejected session refuses snapshots until it resubmits', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.markRejected(session.id);

    const result = store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(result.ok === false && result.error).toBe(SessionWriteError.AlreadyResolved);
  });
});

describe('score derivation for the live dashboard', () => {
  test('tossup buzzes and bonus points are added up per team', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    const score = SessionStore.deriveScore(session);

    expect(score?.leftPoints).toBe(265);
    expect(score?.rightPoints).toBe(155);
    expect(score?.tossupsRead).toBe(20);
    // Labels come from the session, which is the authority on which team is which.
    expect(score?.leftTeam).toBe(testTeamNames[0]);
  });

  test('bounceback points count toward the team that earned them', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.updateSnapshot(session.id, session.token, {
      tossups_read: 5,
      match_teams: [
        { bonus_points: 30, bonus_bounceback_points: 10, match_players: [] },
        { bonus_points: 0, match_players: [] },
      ],
    });

    expect(SessionStore.deriveScore(session)?.leftPoints).toBe(40);
  });

  test('no snapshot means no score rather than a zero', () => {
    const { store } = makeStore();
    const session = newSession(store);

    expect(SessionStore.deriveScore(session)).toBeNull();
  });

  test('a malformed snapshot does not throw', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.updateSnapshot(session.id, session.token, { match_teams: [{ garbage: true }, null] });

    expect(() => SessionStore.deriveScore(session)).not.toThrow();
    expect(SessionStore.deriveScore(session)?.leftPoints).toBe(0);
  });
});

describe('display state', () => {
  test('a session with no snapshot shows as waiting', () => {
    const { store } = makeStore();
    newSession(store);

    expect(store.summarize()[0].displayState).toBe(SessionDisplayState.Waiting);
  });

  test('a recently updated session shows as live', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    expect(store.summarize()[0].displayState).toBe(SessionDisplayState.Live);
  });

  test('a session that stops reporting shows as disconnected', () => {
    const { store, advance } = makeStore();
    const session = newSession(store);
    store.updateSnapshot(session.id, session.token, makeStandardModaqMatch());

    advance(staleSessionThresholdMs + 1000);

    const summary = store.summarize()[0];
    expect(summary.displayState).toBe(SessionDisplayState.Stale);
    expect(summary.msSinceLastSeen).toBeGreaterThan(staleSessionThresholdMs);
  });

  test('a submitted session shows as submitted even when stale', () => {
    const { store, advance } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, makeStandardModaqMatch());

    advance(staleSessionThresholdMs * 10);

    expect(store.summarize()[0].displayState).toBe(SessionDisplayState.Submitted);
  });

  test('an accepted session shows as accepted', () => {
    const { store } = makeStore();
    const session = newSession(store);
    store.submitFinal(session.id, session.token, makeStandardModaqMatch());
    store.markAccepted(session.id);

    expect(store.summarize()[0].displayState).toBe(SessionDisplayState.Accepted);
  });
});

describe('housekeeping', () => {
  test('sessions can be removed and cleared', () => {
    const { store } = makeStore();
    const session = newSession(store);
    newSession(store);

    expect(store.remove(session.id)).toBe(true);
    expect(store.remove(session.id)).toBe(false);
    expect(store.getAll()).toHaveLength(1);

    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });

  test('summaries list the newest room first', () => {
    const { store, advance } = makeStore();
    store.create(1, testTeamNames[0], testTeamNames[1]);
    advance(1000);
    const newer = store.create(2, testTeamNames[2], testTeamNames[3]);

    expect(store.summarize()[0].sessionId).toBe(newer.id);
  });
});
