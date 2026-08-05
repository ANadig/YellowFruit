import { useContext, useState } from 'react';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { IInboxItem, IMatchSubmissionConflict, TournamentServerContext } from '../../Services/TournamentServerService';
import { ImportResultStatus } from '../../DataModel/MatchImportResult';

function submittedTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function InboxRow({ item }: { item: IInboxItem }) {
  const service = useContext(TournamentServerContext);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  if (!service) return null;

  const { importResult } = item;
  const { match, status, messages } = importResult;
  const isFatal = status === ImportResultStatus.FatalErr;
  const needsOverride = status === ImportResultStatus.ErrNonFatal;
  const leftName = match?.leftTeam.team?.name ?? item.leftTeam;
  const rightName = match?.rightTeam.team?.name ?? item.rightTeam;
  const leftScore = match?.leftTeam.points ?? '–';
  const rightScore = match?.rightTeam.points ?? '–';

  return (
    <div className="rooms-inbox-row">
      <div className="rooms-inbox-teams">
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          Round {item.roundNumber} · {item.roomName ?? (item.roomId ? `Room ${item.roomId}` : 'Manual room')}
        </Typography>
        <strong>
          {leftName} <span className="rooms-secondary">vs</span> {rightName}
        </strong>
        <div className="rooms-inbox-score">
          {leftScore} <span className="rooms-secondary">–</span> {rightScore}
        </div>
      </div>

      <div>
        {status === ImportResultStatus.Success && (
          <div className="rooms-validation-clean" aria-label="No validation issues">
            ✓ No validation issues
          </div>
        )}
        {needsOverride && <div className="rooms-validation-warning">Warning · review before accepting</div>}
        {isFatal && <div className="rooms-state is-error">Cannot be imported</div>}
        {messages.length > 0 && (
          <div className="rooms-inline-message">
            {messages.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        )}
      </div>

      <div className="rooms-secondary">
        Submitted {submittedTime(item.submittedAt)}
        <br />
        Session {item.sessionId.slice(0, 8)}
        {needsOverride && <div className="rooms-inline-message">Accepting anyway omits this result from stats.</div>}
        {isFatal && <div className="rooms-inline-message">Reject it and have the room correct the game.</div>}
      </div>

      <div className="rooms-inbox-actions">
        {rejecting ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              label="Reason (optional)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              sx={{ width: 190 }}
            />
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => service.rejectSubmission(item.sessionId, reason.trim() || undefined)}
            >
              Reject
            </Button>
            <Button size="small" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </Stack>
        ) : (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: 'flex-end',
            }}
          >
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
                Accept anyway
              </Button>
            )}
            <Button size="small" color="error" startIcon={<Close />} onClick={() => setRejecting(true)}>
              Reject
            </Button>
          </Stack>
        )}
      </div>
    </div>
  );
}

export default function MatchInboxCard() {
  const service = useContext(TournamentServerContext);
  if (!service) return null;

  return (
    <section className="rooms-panel" aria-labelledby="match-inbox-heading">
      <div className="rooms-panel-header">
        <div>
          <h2 id="match-inbox-heading">Match Inbox</h2>
          <p>Final QBJ results stay here until tournament control accepts them into standings.</p>
        </div>
        {service.inbox.length > 0 && (
          <Typography
            sx={{
              color: 'warning.main',
            }}
          >
            {service.inbox.length} pending
          </Typography>
        )}
      </div>
      {service.inbox.length === 0 ? (
        <div className="rooms-empty-state">
          <strong>No finals waiting for review</strong>
          Submitted room results will appear here with validation details and inline actions.
        </div>
      ) : (
        <Box>
          {service.inbox.map((item) => (
            <InboxRow key={item.sessionId} item={item} />
          ))}
        </Box>
      )}

      {service.conflicts.length > 0 && (
        <Box sx={{ borderTop: '1px solid #d9dde3' }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2">Submission conflicts</Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              An accepted game was not overwritten. Review the incoming QBJ before deciding what to keep.
            </Typography>
          </Box>
          <Divider />
          {service.conflicts.map((conflict) => (
            <ConflictRow
              key={conflict.submission.sessionId}
              conflict={conflict}
              onKeep={() => service.dismissConflict(conflict.submission.sessionId)}
            />
          ))}
        </Box>
      )}
    </section>
  );
}

function ConflictRow({ conflict, onKeep }: { conflict: IMatchSubmissionConflict; onKeep: () => void }) {
  const [reviewing, setReviewing] = useState(false);
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="body2">
        Round {conflict.submission.roundNumber} · {conflict.submission.leftTeam} vs {conflict.submission.rightTeam}
      </Typography>
      <Typography
        variant="caption"
        component="div"
        sx={{
          color: 'text.secondary',
        }}
      >
        Existing match {conflict.existingMatchId} · incoming session {conflict.submission.sessionId.slice(0, 8)}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" onClick={onKeep}>
          Keep existing
        </Button>
        <Button size="small" onClick={() => setReviewing((current) => !current)}>
          {reviewing ? 'Hide incoming QBJ' : 'Review incoming QBJ'}
        </Button>
      </Stack>
      {reviewing && (
        <Box
          component="pre"
          sx={{
            maxHeight: 240,
            overflow: 'auto',
            mt: 1,
            p: 1,
            backgroundColor: '#f7f8fa',
            fontSize: '0.7rem',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {JSON.stringify(conflict.submission.qbj, null, 2)}
        </Box>
      )}
    </Box>
  );
}
