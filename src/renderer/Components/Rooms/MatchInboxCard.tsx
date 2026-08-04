import { useContext, useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material';
import { Check, Close, Warning } from '@mui/icons-material';
import YfCard from '../YfCard';
import { TournamentServerContext, IInboxItem } from '../../Services/TournamentServerService';
import { ImportResultStatus } from '../../DataModel/MatchImportResult';

/** Chip summarizing whether a submission passed validation */
function validationChip(status: ImportResultStatus) {
  switch (status) {
    case ImportResultStatus.Success:
      return <Chip size="small" color="success" icon={<Check />} label="No validation errors" />;
    case ImportResultStatus.Warning:
      return <Chip size="small" color="warning" icon={<Warning />} label="Warnings" />;
    case ImportResultStatus.ErrNonFatal:
      return <Chip size="small" color="error" label="Errors" />;
    case ImportResultStatus.FatalErr:
    default:
      return <Chip size="small" color="error" label="Can't be imported" />;
  }
}

function InboxRow({ item }: { item: IInboxItem }) {
  const service = useContext(TournamentServerContext);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  if (!service) return null;

  const { importResult } = item;
  const { status, messages, match } = importResult;
  const isFatal = status === ImportResultStatus.FatalErr;
  const needsOverride = status === ImportResultStatus.ErrNonFatal;

  // Prefer the names the importer resolved, since those are the tournament's actual teams.
  const leftName = match?.leftTeam.team?.name ?? item.leftTeam;
  const rightName = match?.rightTeam.team?.name ?? item.rightTeam;

  const handleReject = () => {
    service.rejectSubmission(item.sessionId, reason.trim() === '' ? undefined : reason.trim());
  };

  return (
    <Box>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">Round {item.roundNumber}</Typography>
        {validationChip(status)}
      </div>

      <Typography variant="body1" sx={{ mt: 0.5 }}>
        {leftName} {match ? match.leftTeam.points ?? '–' : '–'} &ndash; {match ? match.rightTeam.points ?? '–' : '–'}{' '}
        {rightName}
      </Typography>

      <Typography variant="caption" color="text.secondary" component="div">
        From {importResult.filePath}
      </Typography>

      {messages.length > 0 && (
        <Alert severity={isFatal || needsOverride ? 'error' : 'warning'} sx={{ mt: 1 }}>
          {messages.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}

      {rejecting ? (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
          <TextField
            size="small"
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ width: 280 }}
          />
          <Button size="small" variant="contained" color="error" onClick={handleReject}>
            Send Rejection
          </Button>
          <Button size="small" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {!isFatal && !needsOverride && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Check />}
              onClick={() => service.acceptSubmission(item.sessionId)}
            >
              Accept
            </Button>
          )}
          {needsOverride && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => service.acceptSubmission(item.sessionId, true)}
            >
              Accept Anyway
            </Button>
          )}
          <Button size="small" color="error" startIcon={<Close />} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </Stack>
      )}

      {needsOverride && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          Accepting this game anyway will leave it out of the stat report, the same as a manually imported game with
          errors.
        </Typography>
      )}
      {isFatal && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          This submission can&apos;t be imported. Reject it and have the room fix the problem, or enter the game by
          hand.
        </Typography>
      )}
    </Box>
  );
}

/**
 * Games submitted by rooms, awaiting the statskeeper's decision.
 *
 * Nothing here is ever accepted automatically. Each submission has already been run through the same
 * QBJ importer the manual file import uses, and accepting one inserts it into its round exactly as a
 * manual import would.
 */
export default function MatchInboxCard() {
  const service = useContext(TournamentServerContext);
  if (!service) return null;

  const { inbox } = service;

  return (
    <YfCard
      title="Match Inbox"
      secondaryHeader={
        inbox.length > 0 ? <Chip size="small" color="warning" label={`${inbox.length} waiting`} /> : undefined
      }
    >
      {inbox.length === 0 ? (
        <Typography variant="body2">
          No games are waiting for approval. Games submitted from a room show up here for you to accept before they
          count toward standings.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />} spacing={2}>
          {inbox.map((item) => (
            <InboxRow key={item.sessionId} item={item} />
          ))}
        </Stack>
      )}
    </YfCard>
  );
}
