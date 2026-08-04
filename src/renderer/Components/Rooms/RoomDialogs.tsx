import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ContentCopy, OpenInNew, Refresh, Settings, QrCode2 } from '@mui/icons-material';
import { TournamentManager } from '../../TournamentManager';
import Tournament from '../../DataModel/Tournament';
import { TournamentRoom } from '../../DataModel/TournamentRoom';
import { IRoomPresence, ISessionSummary, SessionStatus } from '../../../main/server/ServerTypes';
import RoomQr from './RoomQr';

export interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog(props: IConfirmDialogProps) {
  const { open, title, message, confirmLabel, destructive, onClose, onConfirm } = props;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color={destructive ? 'error' : 'primary'} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface IRoomEditorDialogProps {
  open: boolean;
  room: TournamentRoom | null;
  tournament: Tournament;
  manager: TournamentManager;
  onClose: () => void;
}

export function RoomEditorDialog(props: IRoomEditorDialogProps) {
  const { open, room, tournament, manager, onClose } = props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(room?.name ?? '');
    setDescription(room?.description ?? '');
    setEnabled(room?.enabled ?? true);
    setError('');
  }, [open, room]);

  const save = () => {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      setError('Room name is required.');
      return;
    }

    if (room) {
      room.name = trimmedName;
      room.description = description.trim();
      room.enabled = enabled;
    } else {
      const created = new TournamentRoom(trimmedName, tournament.rooms.length);
      created.description = description.trim();
      created.enabled = enabled;
      tournament.rooms.push(created);
    }
    manager.markTournamentDataChanged();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{room ? `Edit ${room.name}` : 'Add tournament room'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Room name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="English Hall"
            helperText="Optional location note for the director."
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
            label="Room is enabled for new assignments"
          />
          {error !== '' && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          {room ? 'Save room' : 'Add room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface IRoomDetailDialogProps {
  open: boolean;
  room: TournamentRoom | null;
  tournament: Tournament;
  manager: TournamentManager;
  serverAddress: string;
  sessions: ISessionSummary[];
  // eslint-disable-next-line react/require-default-props
  presence?: IRoomPresence;
  onClose: () => void;
  onEdit: (room: TournamentRoom) => void;
  onCopyUrl: (room: TournamentRoom) => void;
  onShowQr: (room: TournamentRoom) => void;
  onRegenerate: (room: TournamentRoom) => void;
}

export function RoomDetailDialog(props: IRoomDetailDialogProps) {
  const {
    open,
    room,
    tournament,
    manager,
    serverAddress,
    sessions,
    presence,
    onClose,
    onEdit,
    onCopyUrl,
    onShowQr,
    onRegenerate,
  } = props;
  const session = room
    ? sessions
        .filter(
          (candidate) =>
            candidate.roomId === room.id &&
            candidate.status !== SessionStatus.Accepted &&
            candidate.status !== SessionStatus.Rejected,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;
  const schedule = room
    ? tournament.scheduledMatches
        .filter((match) => match.roomId === room.id)
        .slice()
        .sort((a, b) => a.roundNumber - b.roundNumber)
    : [];
  if (!room) return null;

  const url = serverAddress === '' ? '' : room.url(serverAddress);
  const currentMatch = schedule.find((match) => !match.isResolved());
  const scoreSuffix = session?.score
    ? ` · Q${session.score.tossupsRead} · ${session.score.leftPoints}–${session.score.rightPoints}`
    : '';
  let checkInLabel = 'No check-in recorded';
  if (presence?.connected) {
    checkInLabel = `Connected · last check-in ${new Date(presence.lastSeenAt ?? '').toLocaleTimeString()}`;
  } else if (presence?.lastSeenAt) {
    checkInLabel = `Offline · last check-in ${new Date(presence.lastSeenAt).toLocaleTimeString()}`;
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <span>{room.name}</span>
          <Typography variant="caption" color={room.enabled ? 'success.main' : 'text.secondary'}>
            {room.enabled ? 'Enabled' : 'Disabled'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <div className="rooms-dialog-section">
          <Typography variant="body2" color="text.secondary">
            {room.description || 'No description'}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            {checkInLabel}
          </Typography>
        </div>

        <div className="rooms-dialog-section">
          <h3>Current</h3>
          {session && (
            <Typography variant="body2">
              Round {session.roundNumber} · {session.leftTeam} vs {session.rightTeam}
              {scoreSuffix}
            </Typography>
          )}
          {!session && currentMatch && (
            <Typography variant="body2">
              Round {currentMatch.roundNumber} · {currentMatch.describe()} · Waiting
            </Typography>
          )}
          {!session && !currentMatch && (
            <Typography variant="body2" color="text.secondary">
              No open game in this room.
            </Typography>
          )}
        </div>

        <div className="rooms-dialog-section">
          <h3>Permanent URL</h3>
          {url === '' ? (
            <Alert severity="info">Start the Tournament Server to see a reachable LAN URL.</Alert>
          ) : (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
              {url}
            </Typography>
          )}
        </div>

        <div className="rooms-dialog-section">
          <h3>Schedule</h3>
          {schedule.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No games assigned to this room.
            </Typography>
          ) : (
            <div className="rooms-table-wrap">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Match</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((match) => (
                    <tr key={match.id}>
                      <td>{match.roundNumber}</td>
                      <td>{match.describe()}</td>
                      <td>{match.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<Settings />} onClick={() => onEdit(room)}>
          Edit room
        </Button>
        <Button startIcon={<ContentCopy />} onClick={() => onCopyUrl(room)} disabled={url === ''}>
          Copy URL
        </Button>
        <Button
          startIcon={<OpenInNew />}
          onClick={() => url !== '' && manager.launchWebPageInBrowserWindow(url)}
          disabled={url === ''}
        >
          Open room
        </Button>
        <Button startIcon={<QrCode2 />} onClick={() => onShowQr(room)}>
          Show QR
        </Button>
        <Button startIcon={<Refresh />} color="warning" onClick={() => onRegenerate(room)}>
          Regenerate token
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

interface IRoomQrDialogProps {
  open: boolean;
  room: TournamentRoom | null;
  serverAddress: string;
  onClose: () => void;
}

export function RoomQrDialog({ open, room, serverAddress, onClose }: IRoomQrDialogProps) {
  if (!room) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{room.name} room QR</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <RoomQr room={room} serverAddress={serverAddress} />
        {serverAddress !== '' && (
          <Typography variant="caption" component="div" sx={{ mt: 1, overflowWrap: 'anywhere' }} color="text.secondary">
            {room.url(serverAddress)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

interface IRoomSetupDialogProps {
  open: boolean;
  rooms: TournamentRoom[];
  serverAddress: string;
  onClose: () => void;
}

export function RoomSetupDialog({ open, rooms, serverAddress, onClose }: IRoomSetupDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Room setup</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Print this page or scan each code from the Chromebook that will stay in the physical room.
        </Typography>
        {rooms.length === 0 ? (
          <Alert severity="info">Add rooms before printing the setup sheet.</Alert>
        ) : (
          <div className="rooms-qr-grid">
            {rooms.map((room) => (
              <div className="rooms-qr-card" key={room.id}>
                <h2>{room.name}</h2>
                <RoomQr room={room} serverAddress={serverAddress} />
                <div className="rooms-qr-url">
                  {serverAddress === '' ? 'Start server to show URL' : room.url(serverAddress)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => window.print()} disabled={rooms.length === 0}>
          Print setup sheet
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
