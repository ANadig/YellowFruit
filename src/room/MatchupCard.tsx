/**
 * What a room shows between games.
 *
 * The scorekeeper is standing at a Chromebook in a noisy room, so this is deliberately spare: the
 * room, the round, the two teams, and one button. Previous and next games are there for context, in
 * small type, because a scorekeeper asked "are you done with round 4?" should be able to answer
 * without leaving the page.
 *
 * No celebration when a game lands. A submitted result is a piece of tournament administration, and
 * the useful thing to show is what happens next.
 */
import { IRoomAssignmentResponse, IRoomMatchupSummary, RoomBlockedReason } from '../main/server/ServerTypes';

export interface IMatchupCardProps {
  assignment: IRoomAssignmentResponse;
  online: boolean;
  starting: boolean;
  startError: string;
  pendingFinal: boolean;
  submittedSummary: string;
  canStart: boolean;
  // eslint-disable-next-line react/require-default-props
  blockedReason?: RoomBlockedReason;
  onStart: () => void;
}

function ContextLine({ label, matchup }: { label: string; matchup: IRoomMatchupSummary | null }) {
  if (!matchup) return null;
  return (
    <div className="room-context-line">
      <span className="room-context-label">{label}</span>
      <span className="room-context-round">Round {matchup.roundName}</span>
      <span className="room-context-teams">
        {matchup.leftTeam} vs {matchup.rightTeam}
      </span>
    </div>
  );
}

export default function MatchupCard(props: IMatchupCardProps) {
  const { assignment, online, starting, startError, pendingFinal, submittedSummary, canStart, blockedReason, onStart } =
    props;
  const { current, previous, next, roomName, tournamentName } = assignment;

  return (
    <div className="room-shell">
      <header className="room-header">
        <p className="room-tournament">{tournamentName}</p>
        <h1 className="room-name">{roomName}</h1>
      </header>

      {!online && (
        <div className="room-banner room-banner-warning">
          <strong>YellowFruit is not reachable.</strong> This page will update as soon as the connection comes back.
        </div>
      )}

      {assignment.gameFormat === null && (
        <div className="room-banner room-banner-error">
          <strong>This tournament&apos;s scoring rules can&apos;t be used for browser scorekeeping.</strong>
          <ul>
            {assignment.gameFormatErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {pendingFinal && (
        <div className="room-banner room-banner-warning">
          A finished game is still waiting to be sent to YellowFruit. It will go automatically once the connection is
          back. Don&apos;t clear this browser&apos;s data.
        </div>
      )}

      {submittedSummary !== '' && <div className="room-banner room-banner-error">{submittedSummary}</div>}

      {current === null ? (
        <div className="room-empty">
          <p className="room-empty-title">No game assigned</p>
          <p className="room-muted">
            This room has nothing scheduled right now. Leave this page open &mdash; it will update by itself when
            tournament control assigns a game.
          </p>
        </div>
      ) : (
        <div className="room-matchup">
          <p className="room-matchup-round">Round {current.roundName}</p>
          <p className="room-matchup-team">{current.leftTeam.name}</p>
          <p className="room-matchup-vs">vs.</p>
          <p className="room-matchup-team">{current.rightTeam.name}</p>

          {blockedReason !== undefined && assignment.blockedMessage !== undefined && (
            <p className="room-blocked">{assignment.blockedMessage}</p>
          )}

          {startError !== '' && <div className="room-banner room-banner-error">{startError}</div>}

          <button type="button" className="room-button" onClick={onStart} disabled={!canStart || starting}>
            {starting ? 'Starting…' : 'Start Match'}
          </button>
        </div>
      )}

      <div className="room-context">
        <ContextLine label="Previous" matchup={previous} />
        <ContextLine label="Next" matchup={next} />
      </div>

      <p className="room-connection">
        <span className={online ? 'room-status room-status-online' : 'room-status room-status-offline'}>
          <span className="room-status-dot" aria-hidden="true" />
          {online ? 'Server connected' : 'Server unreachable'}
        </span>
      </p>
    </div>
  );
}
