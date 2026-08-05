import { useContext, useEffect } from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import YfCard from '../YfCard';
import { TournamentServerContext } from '../../Services/TournamentServerService';
import { ISessionSummary, SessionDisplayState } from '../../../main/server/ServerTypes';

/** How often to poll the main process for room state. Polling is plenty for a live scoreboard. */
const pollIntervalMs = 3000;

function relativeTime(msAgo: number): string {
  const seconds = Math.round(msAgo / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
}

function stateChip(displayState: SessionDisplayState) {
  switch (displayState) {
    case SessionDisplayState.Live:
      return <Chip size="small" color="success" label="LIVE" />;
    case SessionDisplayState.Submitted:
      return <Chip size="small" color="warning" label="SUBMITTED" />;
    case SessionDisplayState.Accepted:
      return <Chip size="small" color="primary" label="ACCEPTED" />;
    case SessionDisplayState.Rejected:
      return <Chip size="small" color="error" label="REJECTED" />;
    case SessionDisplayState.Stale:
      return <Chip size="small" color="error" variant="outlined" label="DISCONNECTED" />;
    case SessionDisplayState.Waiting:
    default:
      return <Chip size="small" variant="outlined" label="WAITING" />;
  }
}

function GameRow({ session }: { session: ISessionSummary }) {
  const { score } = session;
  return (
    <Box>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">Round {session.roundNumber}</Typography>
        {stateChip(session.displayState)}
      </div>
      <Stack sx={{ mt: 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
          <Typography variant="body1">{session.leftTeam}</Typography>
          <Typography variant="body1">
            <strong>{score ? score.leftPoints : '–'}</strong>
          </Typography>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
          <Typography variant="body1">{session.rightTeam}</Typography>
          <Typography variant="body1">
            <strong>{score ? score.rightPoints : '–'}</strong>
          </Typography>
        </div>
      </Stack>
      <Typography
        variant="caption"
        component="div"
        sx={{
          color: 'text.secondary',
          mt: 0.5,
        }}
      >
        {score ? `Question ${score.tossupsRead} — ` : ''}
        Last update: {relativeTime(session.msSinceLastSeen)}
      </Typography>
      {session.rejectionReason && (
        <Typography variant="caption" color="error" component="div">
          Rejected: {session.rejectionReason}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Live view of every room game, driven by the latest QBJ snapshot each room has uploaded.
 *
 * These scores are display-only. Nothing here affects standings; only a match the statskeeper
 * accepts in the Match Inbox becomes part of the tournament.
 */
export default function ActiveGamesCard() {
  const service = useContext(TournamentServerContext);
  const running = service?.status.running ?? false;

  useEffect(() => {
    if (!service || !running) return undefined;
    service.refreshSessions();
    const handle = setInterval(() => service.refreshSessions(), pollIntervalMs);
    return () => clearInterval(handle);
  }, [service, running]);

  if (!service) return null;

  const { sessions } = service;

  return (
    <YfCard title="Active Games">
      {!running && <Typography variant="body2">Start the tournament server to see rooms here.</Typography>}
      {running && sessions.length === 0 && (
        <Typography variant="body2">
          No rooms have connected yet. Open the server address on a scorekeeping device to start a game.
        </Typography>
      )}
      <Stack divider={<Divider flexItem />} spacing={2}>
        {sessions.map((session) => (
          <GameRow key={session.sessionId} session={session} />
        ))}
      </Stack>
      {running && sessions.length > 0 && (
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: 'text.secondary',
            mt: 2,
          }}
        >
          Live scores are for monitoring only. Standings update when you accept a game in the Match Inbox.
        </Typography>
      )}
    </YfCard>
  );
}
