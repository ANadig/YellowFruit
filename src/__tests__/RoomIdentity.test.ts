/**
 * The room page works out which room it is from its own URL. That URL is what the QR code encodes
 * and what a Chromebook stays on all day, so parsing it has to be exact: a page that misreads it
 * either can't connect or, worse, claims to be a different room.
 */
import { describe, expect, test } from 'vitest';
import { readRoomIdentity } from '../room/api';
import { TournamentRoom } from '../renderer/DataModel/TournamentRoom';

/** Split a URL into the shape the room app reads from `window.location` */
function locationOf(url: string) {
  const parsed = new URL(url);
  return { pathname: parsed.pathname, search: parsed.search };
}

describe('readRoomIdentity', () => {
  test('a permanent room URL yields the room and its token', () => {
    const identity = readRoomIdentity(locationOf('http://192.168.1.50:4732/room/room-abc123?token=secret'));

    expect(identity).toEqual({ roomId: 'room-abc123', token: 'secret' });
  });

  test('the URL a TournamentRoom generates parses back to that room', () => {
    // The two halves have to agree, or a QR code takes a Chromebook to a page that can't identify
    // itself.
    const room = new TournamentRoom('Cafeteria Left', 0);

    const identity = readRoomIdentity(locationOf(room.url('http://192.168.1.50:4732')));

    expect(identity).toEqual({ roomId: room.id, token: room.accessToken });
  });

  test('a trailing slash is tolerated', () => {
    const identity = readRoomIdentity(locationOf('http://host/room/room-1/?token=t'));

    expect(identity?.roomId).toBe('room-1');
  });

  test('extra query parameters are ignored', () => {
    const identity = readRoomIdentity(locationOf('http://host/room/room-1?foo=bar&token=t&baz=1'));

    expect(identity?.token).toBe('t');
  });

  test('a percent-encoded room id is decoded', () => {
    const identity = readRoomIdentity(locationOf('http://host/room/room%20one?token=t'));

    expect(identity?.roomId).toBe('room one');
  });

  test('the plain root falls back to the manual workflow', () => {
    // Not an error: a tournament with no rooms configured still scores games this way.
    expect(readRoomIdentity(locationOf('http://host/'))).toBeNull();
  });

  test('a room URL with no token falls back rather than connecting unauthenticated', () => {
    expect(readRoomIdentity(locationOf('http://host/room/room-1'))).toBeNull();
  });

  test('an empty token is not accepted', () => {
    expect(readRoomIdentity(locationOf('http://host/room/room-1?token='))).toBeNull();
  });

  test('a deeper path is not mistaken for a room URL', () => {
    expect(readRoomIdentity(locationOf('http://host/room/room-1/extra?token=t'))).toBeNull();
  });

  test('a similar-looking path is not a room URL', () => {
    expect(readRoomIdentity(locationOf('http://host/rooms/room-1?token=t'))).toBeNull();
    expect(readRoomIdentity(locationOf('http://host/room?token=t'))).toBeNull();
  });
});
