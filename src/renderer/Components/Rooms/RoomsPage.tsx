import { useContext, useEffect, useMemo, useState } from 'react';
import type { ContextType, JSX } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  ContentCopy,
  Delete,
  Edit,
  ExpandMore,
  PlayArrow,
  Print,
  QrCode2,
  Settings,
  Stop,
} from '@mui/icons-material';
import { TournamentContext } from '../../TournamentManager';
import { TournamentServerContext } from '../../Services/TournamentServerService';
import {
  ISessionSummary,
  SessionDisplayState,
  SessionStatus,
  staleRoomThresholdMs,
} from '../../../main/server/ServerTypes';
import { ScheduledMatch, ScheduledMatchStatus } from '../../DataModel/ScheduledMatch';
import { TournamentRoom } from '../../DataModel/TournamentRoom';
import {
  ScheduleIssueSeverity,
  checkRoomDeletion,
  hasBlockingIssue,
  mergeGeneratedSchedule,
  moveRoom,
  normalizeRoomOrder,
  roundsWithGames,
  summarizeRound,
  validatePhaseScheduleCompleteness,
  validateDraft,
  validateSchedule,
} from '../../Services/ScheduleService';
import { ConfirmDialog, RoomDetailDialog, RoomEditorDialog, RoomQrDialog, RoomSetupDialog } from './RoomDialogs';
import { MatchEditorDialog, ScheduleGeneratorDialog } from './ScheduleDialogs';
import RebracketDialog from './RebracketDialog';
import MatchInboxCard from './MatchInboxCard';
import './rooms.css';

const pollIntervalMs = 3000;

function elapsed(ms: number | null): string {
  if (ms === null) return 'Never';
  const minutes = Math.floor(ms / 60000);
  if (minutes > 0) return `${minutes}m ago`;
  const seconds = Math.max(1, Math.floor(ms / 1000));
  return `${seconds}s ago`;
}

function scheduleStatusLabel(status: ScheduledMatchStatus): string {
  switch (status) {
    case ScheduledMatchStatus.Ready:
      return 'Ready';
    case ScheduledMatchStatus.Playing:
      return 'Playing';
    case ScheduledMatchStatus.Submitted:
      return 'Submitted';
    case ScheduledMatchStatus.Accepted:
      return 'Accepted';
    case ScheduledMatchStatus.NeedsAttention:
      return 'Needs attention';
    case ScheduledMatchStatus.Cancelled:
      return 'Cancelled';
    case ScheduledMatchStatus.Scheduled:
    default:
      return 'Scheduled';
  }
}

function sessionForRoom(room: TournamentRoom, sessions: ISessionSummary[]): ISessionSummary | undefined {
  return sessions
    .filter(
      (session) =>
        session.roomId === room.id &&
        session.status !== SessionStatus.Accepted &&
        session.status !== SessionStatus.Rejected,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function currentMatchForRoom(room: TournamentRoom, matches: ScheduledMatch[]): ScheduledMatch | undefined {
  return matches
    .filter((match) => match.roomId === room.id && !match.isResolved())
    .sort((a, b) => a.roundNumber - b.roundNumber)[0];
}

function roomState(
  room: TournamentRoom,
  match: ScheduledMatch | undefined,
  session: ISessionSummary | undefined,
  connected: boolean,
  serverRunning: boolean,
) {
  if (!room.enabled) return { label: 'Disabled', className: 'is-disabled' };
  if (session?.displayState === SessionDisplayState.Stale) return { label: 'Stale', className: 'is-offline' };
  if (session?.displayState === SessionDisplayState.Submitted) return { label: 'Submitted', className: 'is-submitted' };
  if (session?.displayState === SessionDisplayState.Live) return { label: 'Playing', className: 'is-playing' };
  if (match?.status === ScheduledMatchStatus.NeedsAttention)
    return { label: 'Needs attention', className: 'is-warning' };
  if (connected) return { label: match ? 'Waiting' : 'Connected', className: 'is-connected' };
  if (!serverRunning) return { label: 'Server offline', className: 'is-offline' };
  return { label: 'Offline', className: 'is-offline' };
}

function sessionProgress(session: ISessionSummary | undefined, match: ScheduledMatch | undefined): string {
  if (session?.displayState === SessionDisplayState.Live && session.score) return `Q${session.score.tossupsRead}`;
  if (session?.displayState === SessionDisplayState.Submitted || match?.status === ScheduledMatchStatus.Submitted)
    return 'Final';
  if (match?.status === ScheduledMatchStatus.Accepted) return 'Final';
  return '—';
}

function formatRoundSummary(round: ReturnType<typeof summarizeRound>): string {
  const parts = [
    `${round.expected} expected`,
    `${round.roomsAssigned}/${round.scheduled} assigned`,
    `${round.accepted} accepted`,
    `${round.playing} playing`,
    `${round.submitted} submitted`,
    `${round.waiting} waiting`,
  ];
  if (round.needsAttention > 0) parts.push(`${round.needsAttention} needs attention`);
  if (round.cancelled > 0) parts.push(`${round.cancelled} cancelled`);
  return parts.join(' · ');
}

function roomPresenceFor(room: TournamentRoom, service: TournamentServerContextValue) {
  return service.roomPresence.find((presence) => presence.roomId === room.id);
}

type TournamentServerContextValue = NonNullable<ContextType<typeof TournamentServerContext>>;

interface IConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

function presenceLabel(connected: boolean, lastSeenAt: string | null, msSinceLastSeen: number | null): string {
  if (connected) return 'Connected';
  if (lastSeenAt !== null) return elapsed(msSinceLastSeen);
  return 'Never';
}

function scheduleStateClass(status: ScheduledMatchStatus): string {
  switch (status) {
    case ScheduledMatchStatus.Accepted:
      return 'is-accepted';
    case ScheduledMatchStatus.Submitted:
      return 'is-submitted';
    case ScheduledMatchStatus.Playing:
      return 'is-playing';
    case ScheduledMatchStatus.NeedsAttention:
      return 'is-warning';
    default:
      return '';
  }
}

function releaseMessage(
  releasedRound: number | null,
  currentRound: number | null,
  currentSummary: ReturnType<typeof summarizeRound> | null,
): string {
  if (releasedRound === null) return 'No round released yet.';
  if (currentSummary?.complete === true) return `Round ${currentRound} complete.`;
  return `Rooms may start through Round ${releasedRound}.`;
}

export default function RoomsPage() {
  const manager = useContext(TournamentContext);
  const service = manager.tournamentServerService;
  const { tournament } = manager;
  const [, setRefresh] = useState(0);
  const [roomDetail, setRoomDetail] = useState<TournamentRoom | null>(null);
  const [roomEditor, setRoomEditor] = useState<TournamentRoom | null | undefined>(undefined);
  const [qrRoom, setQrRoom] = useState<TournamentRoom | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [matchEditor, setMatchEditor] = useState<ScheduledMatch | null | undefined>(undefined);
  const [rebracketOpen, setRebracketOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<IConfirmState | null>(null);
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    service.dataChangedReactCallback = () => setRefresh((current) => current + 1);
    service.refreshStatus();
    return () => {
      service.dataChangedReactCallback = () => {};
    };
  }, [service]);

  useEffect(() => {
    if (!service.status.running) return undefined;
    service.refreshSessions();
    service.refreshPresence();
    const handle = setInterval(() => {
      service.refreshSessions();
      service.refreshPresence();
    }, pollIntervalMs);
    return () => clearInterval(handle);
  }, [service, service.status.running]);

  const rooms = tournament.rooms.slice().sort(TournamentRoom.compare);
  const matches = tournament.scheduledMatches
    .slice()
    .sort((a, b) => a.roundNumber - b.roundNumber || a.id.localeCompare(b.id));
  const roundNumbers = useMemo(() => roundsWithGames(matches), [matches]);
  const scheduleIssues = useMemo(() => validateSchedule(matches, rooms), [matches, rooms]);
  const blockingScheduleIssues = scheduleIssues.filter((issue) => issue.severity === ScheduleIssueSeverity.Error);
  const currentRound = service.currentRoundNumber;
  const currentSummary = currentRound === null ? null : summarizeRound(matches, currentRound);
  const activeSessions = service.sessions.filter(
    (session) => session.status !== SessionStatus.Accepted && session.status !== SessionStatus.Rejected,
  );
  const onlineRooms = service.roomPresence.filter((presence) => presence.connected).length;

  const rebracketBoundary = useMemo(() => {
    const fullPhases = tournament.getFullPhases();
    return (
      fullPhases.find((phase) => {
        const next = tournament.getNextFullPhase(phase);
        if (!next || tournament.rebracketedPhaseCodes.includes(phase.code)) return false;
        const phaseRoundNumbers = phase.rounds.map((round) => round.number);
        const phaseMatches = matches.filter((match) => phaseRoundNumbers.includes(match.roundNumber));
        const missing = validatePhaseScheduleCompleteness(phase, matches);
        return phaseMatches.length > 0 && phaseMatches.every((match) => match.isResolved()) && missing.length === 0;
      }) ?? null
    );
  }, [tournament, matches]);
  const rebracketNextPhase = rebracketBoundary ? tournament.getNextFullPhase(rebracketBoundary) ?? null : null;

  const serverAddress = service.status.addresses[0] ?? '';
  const nextRelease = service.nextRoundToRelease();
  const nextReleaseSummary = nextRelease === null ? null : summarizeRound(matches, nextRelease);
  const previousRelease =
    nextRelease === null
      ? null
      : roundNumbers.filter((roundNumber) => roundNumber < nextRelease).sort((a, b) => b - a)[0] ?? null;
  const previousReleaseSummary = previousRelease === null ? null : summarizeRound(matches, previousRelease);
  const disabledRoomAssignments =
    nextRelease === null
      ? 0
      : matches.filter(
          (match) =>
            match.roundNumber === nextRelease &&
            match.roomId !== undefined &&
            rooms.some((room) => room.id === match.roomId && !room.enabled),
        ).length;
  const releaseBlocked =
    nextReleaseSummary === null ||
    nextReleaseSummary.expected === 0 ||
    nextReleaseSummary.roomsAssigned < nextReleaseSummary.expected ||
    (previousReleaseSummary !== null && !previousReleaseSummary.complete) ||
    disabledRoomAssignments > 0 ||
    blockingScheduleIssues.some((issue) =>
      issue.scheduledMatchIds.some((id) => matches.find((match) => match.id === id)?.roundNumber === nextRelease),
    );

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      manager.makeToast('Copied to clipboard');
    } catch (err: any) {
      manager.makeToast('Could not copy to clipboard', 'error');
    }
  };

  const openRoomEditor = (room: TournamentRoom | null = null) => setRoomEditor(room);

  const requestDeleteRoom = (room: TournamentRoom) => {
    const check = checkRoomDeletion(room, matches);
    if (!check.canDelete) {
      setConfirmState({
        title: `Cannot delete ${room.name}`,
        message: check.reason ?? 'This room is still referenced by active tournament state. Disable it instead.',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmState(null),
      });
      return;
    }
    setConfirmState({
      title: `Delete ${room.name}?`,
      message:
        check.affectedScheduledMatchIds.length > 0
          ? `${check.affectedScheduledMatchIds.length} future assignment${
              check.affectedScheduledMatchIds.length === 1 ? '' : 's'
            } will become unassigned.`
          : 'This room has no scheduled games.',
      confirmLabel: 'Delete room',
      destructive: true,
      onConfirm: () => {
        tournament.scheduledMatches.forEach((match) => {
          if (match.roomId === room.id && check.affectedScheduledMatchIds.includes(match.id)) match.roomId = undefined;
        });
        tournament.rooms = normalizeRoomOrder(tournament.rooms.filter((candidate) => candidate.id !== room.id));
        manager.markTournamentDataChanged();
        setRoomDetail(null);
        setConfirmState(null);
      },
    });
  };

  const requestRegenerateToken = (room: TournamentRoom) => {
    setConfirmState({
      title: `Regenerate ${room.name} token?`,
      message: 'The current permanent URL will stop working immediately. Print or copy the new URL afterward.',
      confirmLabel: 'Regenerate token',
      onConfirm: () => {
        room.regenerateToken();
        manager.markTournamentDataChanged();
        setConfirmState(null);
      },
    });
  };

  const changeRoomAssignment = (match: ScheduledMatch, nextRoomId: string) => {
    setScheduleError('');
    if (
      match.status !== ScheduledMatchStatus.Scheduled &&
      match.status !== ScheduledMatchStatus.Ready &&
      match.status !== ScheduledMatchStatus.NeedsAttention
    )
      return;
    const issues = validateDraft(
      {
        roundNumber: match.roundNumber,
        leftTeamName: match.leftTeamName,
        rightTeamName: match.rightTeamName,
        roomId: nextRoomId,
      },
      matches,
      rooms,
      match.id,
    );
    if (hasBlockingIssue(issues)) {
      setScheduleError(issues.map((issue) => issue.message).join(' '));
      return;
    }
    match.roomId = nextRoomId || undefined;
    manager.markTournamentDataChanged();
  };

  const cancelMatch = (match: ScheduledMatch) => {
    if (
      match.status !== ScheduledMatchStatus.Scheduled &&
      match.status !== ScheduledMatchStatus.Ready &&
      match.status !== ScheduledMatchStatus.NeedsAttention
    )
      return;
    setConfirmState({
      title: 'Cancel scheduled match?',
      message: `${match.describe()} will remain in the schedule history as cancelled and will not count as an expected game.`,
      confirmLabel: 'Cancel match',
      destructive: true,
      onConfirm: () => {
        match.status = ScheduledMatchStatus.Cancelled;
        manager.markTournamentDataChanged();
        setConfirmState(null);
      },
    });
  };

  const applyGeneratedSchedule = (generated: ScheduledMatch[]) => {
    const merged = mergeGeneratedSchedule(matches, generated, rooms);
    if (hasBlockingIssue(merged.issues)) {
      manager.makeToast('The generated schedule conflicts with retained tournament history', 'error');
      return;
    }
    tournament.scheduledMatches = merged.scheduledMatches;
    manager.markTournamentDataChanged();
    setGeneratorOpen(false);
  };

  const releaseRound = () => {
    if (nextRelease === null || releaseBlocked) return;
    service.releaseRound(nextRelease);
  };

  return (
    <TournamentServerContext.Provider value={service}>
      <main className="rooms-operations">
        <header className="rooms-page-header">
          <div>
            <h1>Rooms</h1>
            <p>Tournament operations, room readiness, live games, and final-result review.</p>
          </div>
          <div className={`rooms-server-state ${service.status.running ? 'is-running' : 'is-offline'}`}>
            Server · {service.status.running ? 'Running' : 'Offline'}
          </div>
        </header>

        <div className="rooms-server-toolbar">
          <div className="rooms-server-address">
            <strong>
              {service.status.running ? serverAddress || 'No LAN address found' : 'Tournament Server is off'}
            </strong>
            {service.status.running && service.status.addresses.length > 1 && (
              <span> · {service.status.addresses.length} network addresses</span>
            )}
          </div>
          {service.status.running && serverAddress !== '' && (
            <Button size="small" startIcon={<ContentCopy />} onClick={() => copyText(serverAddress)}>
              Copy address
            </Button>
          )}
          <Button size="small" startIcon={<Settings />} onClick={() => setServerSettingsOpen(true)}>
            Server settings
          </Button>
          {!service.status.running && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setServerSettingsOpen(true)}
            >
              Start server
            </Button>
          )}
        </div>

        <div className="rooms-summary-strip" aria-label="Tournament progress summary">
          <SummaryItem label="Current round" value={currentRound === null ? '—' : `Round ${currentRound}`} />
          <SummaryItem
            label="Playing"
            value={String(activeSessions.filter((session) => session.status === SessionStatus.Playing).length)}
          />
          <SummaryItem label="Submitted finals" value={String(service.inbox.length)} />
          <SummaryItem label="Rooms online" value={`${onlineRooms} / ${rooms.length}`} />
          <SummaryItem
            label="Released"
            value={service.releasedRoundNumber === null ? 'None' : `Round ${service.releasedRoundNumber}`}
          />
          <SummaryItem label="Next rebracket" value={rebracketBoundary ? `After ${rebracketBoundary.name}` : '—'} />
        </div>

        {rebracketBoundary && (
          <section className="rooms-panel">
            <div className="rooms-panel-header">
              <div>
                <h2>Rebracketing required</h2>
                <p>
                  {rebracketBoundary.name} is complete. Review standings before publishing{' '}
                  {rebracketNextPhase?.name ?? 'the next phase'}.
                </p>
              </div>
              <Button variant="contained" onClick={() => setRebracketOpen(true)}>
                Review standings
              </Button>
            </div>
          </section>
        )}

        <section className="rooms-panel" aria-labelledby="rooms-list-heading">
          <div className="rooms-panel-header">
            <div>
              <h2 id="rooms-list-heading">Physical rooms</h2>
              <p>
                {rooms.length === 0
                  ? 'Add the physical rooms being used for matches.'
                  : `${rooms.length} configured room${rooms.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="rooms-panel-actions">
              <Button
                size="small"
                startIcon={<Print />}
                onClick={() => setSetupOpen(true)}
                disabled={rooms.length === 0}
              >
                Setup sheet
              </Button>
              <Button size="small" variant="contained" startIcon={<Add />} onClick={() => openRoomEditor()}>
                Add room
              </Button>
            </div>
          </div>
          {rooms.length === 0 ? (
            <div className="rooms-empty-state">
              <strong>No rooms configured</strong>
              Add the physical rooms being used for matches.
            </div>
          ) : (
            <div className="rooms-table-wrap">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Match</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Last check-in</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, index) => {
                    const match = currentMatchForRoom(room, matches);
                    const session = sessionForRoom(room, service.sessions);
                    const presence = roomPresenceFor(room, service);
                    const state = roomState(room, match, session, presence?.connected ?? false, service.status.running);
                    return (
                      <tr key={room.id}>
                        <td>
                          <Button
                            className="rooms-room-name"
                            size="small"
                            onClick={() => setRoomDetail(room)}
                            sx={{ textTransform: 'none', p: 0 }}
                          >
                            {room.name}
                          </Button>
                          {room.description && <div className="rooms-room-description">{room.description}</div>}
                        </td>
                        <td className="rooms-matchup">
                          {match ? (
                            <>
                              <strong>{match.leftTeamName}</strong> <span className="rooms-secondary">vs</span>{' '}
                              <strong>{match.rightTeamName}</strong>
                              <span className="rooms-secondary">Round {match.roundNumber}</span>
                            </>
                          ) : (
                            <span className="rooms-secondary">No current assignment</span>
                          )}
                        </td>
                        <td>
                          <span className={`rooms-state ${state.className}`}>{state.label}</span>
                        </td>
                        <td>{sessionProgress(session, match)}</td>
                        <td className="rooms-secondary">
                          {presenceLabel(
                            presence?.connected ?? false,
                            presence?.lastSeenAt ?? null,
                            presence?.msSinceLastSeen ?? null,
                          )}
                        </td>
                        <td>
                          <Stack
                            direction="row"
                            spacing={0.25}
                            sx={{
                              justifyContent: 'flex-end',
                            }}
                          >
                            <Tooltip title="Move up">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    tournament.rooms = moveRoom(tournament.rooms, room.id, -1);
                                    manager.markTournamentDataChanged();
                                  }}
                                  disabled={index === 0}
                                  aria-label={`Move ${room.name} up`}
                                >
                                  <ArrowUpward fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move down">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    tournament.rooms = moveRoom(tournament.rooms, room.id, 1);
                                    manager.markTournamentDataChanged();
                                  }}
                                  disabled={index === rooms.length - 1}
                                  aria-label={`Move ${room.name} down`}
                                >
                                  <ArrowDownward fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Edit room">
                              <IconButton
                                size="small"
                                onClick={() => openRoomEditor(room)}
                                aria-label={`Edit ${room.name}`}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Show QR">
                              <IconButton
                                size="small"
                                onClick={() => setQrRoom(room)}
                                aria-label={`Show QR for ${room.name}`}
                              >
                                <QrCode2 fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Room details">
                              <IconButton
                                size="small"
                                onClick={() => setRoomDetail(room)}
                                aria-label={`Open ${room.name} details`}
                              >
                                <ExpandMore fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete room">
                              <IconButton
                                size="small"
                                onClick={() => requestDeleteRoom(room)}
                                aria-label={`Delete ${room.name}`}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rooms-panel" aria-labelledby="attention-heading">
          <div className="rooms-panel-header">
            <div>
              <h2 id="attention-heading">Needs attention</h2>
              <p>Issues that can block the next operational step.</p>
            </div>
          </div>
          <AttentionList
            service={service}
            rooms={rooms}
            scheduleIssues={scheduleIssues}
            nextRelease={nextRelease}
            releaseBlocked={releaseBlocked}
            disabledRoomAssignments={disabledRoomAssignments}
          />
        </section>

        <section className="rooms-panel" aria-labelledby="release-heading">
          <div className="rooms-panel-header">
            <div>
              <h2 id="release-heading">Round readiness and release</h2>
              <p>Scheduled games are not playable until this control releases their round.</p>
            </div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={tournament.autoReleaseNextRound}
                  onChange={(event) => {
                    service.setAutoReleaseNextRound(event.target.checked);
                  }}
                />
              }
              label="Auto-release ordinary next rounds"
            />
          </div>
          {roundNumbers.length === 0 ? (
            <div className="rooms-empty-state">
              <strong>No scheduled matches</strong>
              Generate a schedule or add matches manually.
            </div>
          ) : (
            <div>
              {roundNumbers.map((roundNumber) => {
                const summary = summarizeRound(matches, roundNumber);
                const released = service.releasedRoundNumber === roundNumber;
                return (
                  <div className="rooms-round-block" key={roundNumber}>
                    <div className="rooms-round-header">
                      <strong>
                        Round {roundNumber} {released ? '· Released' : ''}
                      </strong>
                      <span>{formatRoundSummary(summary)}</span>
                    </div>
                  </div>
                );
              })}
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {releaseMessage(service.releasedRoundNumber, currentRound, currentSummary)}
                </Typography>
                <Button variant="contained" onClick={releaseRound} disabled={nextRelease === null || releaseBlocked}>
                  {nextRelease === null ? 'All rounds released' : `Release Round ${nextRelease}`}
                </Button>
              </Stack>
            </div>
          )}
        </section>

        <section className="rooms-panel" aria-labelledby="schedule-heading">
          <div className="rooms-panel-header">
            <div>
              <h2 id="schedule-heading">Schedule</h2>
              <p>
                Future scheduled games and accepted history are shown separately. Accepted history is never regenerated
                away.
              </p>
            </div>
            <div className="rooms-panel-actions">
              <Button size="small" startIcon={<Add />} onClick={() => setMatchEditor(null)}>
                Add match
              </Button>
              <Button size="small" variant="contained" onClick={() => setGeneratorOpen(true)}>
                Generate schedule
              </Button>
            </div>
          </div>
          {scheduleError !== '' && (
            <Alert severity="error" onClose={() => setScheduleError('')} sx={{ m: 2 }}>
              {scheduleError}
            </Alert>
          )}
          <ScheduleGroups
            matches={matches}
            rooms={rooms}
            onRoomChange={changeRoomAssignment}
            onEdit={(match) => setMatchEditor(match)}
            onCancel={cancelMatch}
          />
        </section>

        <MatchInboxCard />

        <RoomEditorDialog
          open={roomEditor !== undefined}
          room={roomEditor ?? null}
          tournament={tournament}
          manager={manager}
          onClose={() => setRoomEditor(undefined)}
        />
        <RoomDetailDialog
          open={roomDetail !== null}
          room={roomDetail}
          tournament={tournament}
          manager={manager}
          serverAddress={serverAddress}
          sessions={service.sessions}
          presence={roomDetail ? roomPresenceFor(roomDetail, service) : undefined}
          onClose={() => setRoomDetail(null)}
          onEdit={(room) => {
            setRoomDetail(null);
            setRoomEditor(room);
          }}
          onCopyUrl={(room) => copyText(room.url(serverAddress))}
          onShowQr={(room) => setQrRoom(room)}
          onRegenerate={requestRegenerateToken}
        />
        <RoomQrDialog
          open={qrRoom !== null}
          room={qrRoom}
          serverAddress={serverAddress}
          onClose={() => setQrRoom(null)}
        />
        <RoomSetupDialog
          open={setupOpen}
          rooms={rooms}
          serverAddress={serverAddress}
          onClose={() => setSetupOpen(false)}
        />
        <MatchEditorDialog
          open={matchEditor !== undefined}
          match={matchEditor ?? null}
          tournament={tournament}
          rooms={rooms}
          manager={manager}
          onClose={() => setMatchEditor(undefined)}
        />
        <ScheduleGeneratorDialog
          open={generatorOpen}
          tournament={tournament}
          rooms={rooms}
          onClose={() => setGeneratorOpen(false)}
          onApply={applyGeneratedSchedule}
        />
        <RebracketDialog
          open={rebracketOpen}
          tournament={tournament}
          manager={manager}
          completedPhase={rebracketBoundary}
          nextPhase={rebracketNextPhase}
          rooms={rooms}
          pendingFinals={service.inbox.length}
          onClose={() => setRebracketOpen(false)}
          onDone={() => setRebracketOpen(false)}
        />
        <ServerSettingsDialog
          service={service}
          open={serverSettingsOpen}
          onClose={() => setServerSettingsOpen(false)}
        />
        {confirmState && (
          <ConfirmDialog
            open
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            destructive={confirmState.destructive ?? false}
            onClose={() => setConfirmState(null)}
            onConfirm={confirmState.onConfirm}
          />
        )}
      </main>
    </TournamentServerContext.Provider>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rooms-summary-item">
      <div className="rooms-summary-label">{label}</div>
      <div className="rooms-summary-value">{value}</div>
    </div>
  );
}

function AttentionList({
  service,
  rooms,
  scheduleIssues,
  nextRelease,
  releaseBlocked,
  disabledRoomAssignments,
}: {
  service: TournamentServerContextValue;
  rooms: TournamentRoom[];
  scheduleIssues: ReturnType<typeof validateSchedule>;
  nextRelease: number | null;
  releaseBlocked: boolean;
  disabledRoomAssignments: number;
}) {
  const items: JSX.Element[] = [];
  if (!service.status.running) {
    items.push(
      <li key="server">
        <strong>Tournament Server is off.</strong> Room Chromebooks cannot connect until it is started.
      </li>,
    );
  }
  service.roomPresence
    .filter(
      (presence) =>
        !presence.connected && presence.lastSeenAt !== null && (presence.msSinceLastSeen ?? 0) > staleRoomThresholdMs,
    )
    .slice(0, 5)
    .forEach((presence) => {
      const room = rooms.find((candidate) => candidate.id === presence.roomId);
      items.push(
        <li key={`room-${presence.roomId}`}>
          <strong>{room?.name ?? presence.roomId}</strong> has not checked in for {elapsed(presence.msSinceLastSeen)}.
        </li>,
      );
    });
  if (service.inbox.length > 0) {
    items.push(
      <li key="inbox">
        <strong>
          {service.inbox.length} final result{service.inbox.length === 1 ? '' : 's'}
        </strong>{' '}
        waiting for review.
      </li>,
    );
  }
  scheduleIssues
    .filter((issue) => issue.severity === ScheduleIssueSeverity.Error)
    .slice(0, 3)
    .forEach((issue) => {
      items.push(
        <li key={`issue-${issue.message}`}>
          <strong>Schedule problem.</strong> {issue.message}
        </li>,
      );
    });
  if (nextRelease !== null && releaseBlocked) {
    if (disabledRoomAssignments > 0) {
      items.push(
        <li key="disabled-room">
          <strong>Round {nextRelease} uses disabled rooms.</strong> Reassign {disabledRoomAssignments}{' '}
          {disabledRoomAssignments === 1 ? 'game' : 'games'} before releasing the round.
        </li>,
      );
    }
    items.push(
      <li key="release">
        <strong>Round {nextRelease} is not ready to release.</strong> Assign every game and resolve conflicts first.
      </li>,
    );
  }
  if (items.length === 0) return <div className="rooms-attention-empty">No operational issues right now.</div>;
  return <ul className="rooms-attention-list">{items}</ul>;
}

function ScheduleGroups({
  matches,
  rooms,
  onRoomChange,
  onEdit,
  onCancel,
}: {
  matches: ScheduledMatch[];
  rooms: TournamentRoom[];
  onRoomChange: (match: ScheduledMatch, roomId: string) => void;
  onEdit: (match: ScheduledMatch) => void;
  onCancel: (match: ScheduledMatch) => void;
}) {
  const future = matches.filter(
    (match) => match.status !== ScheduledMatchStatus.Accepted && match.status !== ScheduledMatchStatus.Cancelled,
  );
  const history = matches.filter((match) => match.status === ScheduledMatchStatus.Accepted);
  const cancelled = matches.filter((match) => match.status === ScheduledMatchStatus.Cancelled);
  return (
    <>
      <ScheduleGroup
        title="Upcoming scheduled games"
        matches={future}
        rooms={rooms}
        onRoomChange={onRoomChange}
        onEdit={onEdit}
        onCancel={onCancel}
      />
      <ScheduleGroup
        title="Played / accepted history"
        matches={history}
        rooms={rooms}
        onRoomChange={onRoomChange}
        onEdit={onEdit}
        onCancel={onCancel}
      />
      {cancelled.length > 0 && (
        <ScheduleGroup
          title="Cancelled / resolved"
          matches={cancelled}
          rooms={rooms}
          onRoomChange={onRoomChange}
          onEdit={onEdit}
          onCancel={onCancel}
        />
      )}
    </>
  );
}

function ScheduleGroup({
  title,
  matches,
  rooms,
  onRoomChange,
  onEdit,
  onCancel,
}: {
  title: string;
  matches: ScheduledMatch[];
  rooms: TournamentRoom[];
  onRoomChange: (match: ScheduledMatch, roomId: string) => void;
  onEdit: (match: ScheduledMatch) => void;
  onCancel: (match: ScheduledMatch) => void;
}) {
  const roundNumbers = roundsWithGames(matches);
  if (matches.length === 0) {
    return (
      <div className="rooms-empty-state">
        <strong>{title}</strong>Nothing here yet.
      </div>
    );
  }
  return (
    <div>
      <div className="rooms-dialog-section" style={{ padding: '12px 16px 4px' }}>
        <Typography variant="subtitle2">{title}</Typography>
      </div>
      {roundNumbers.map((roundNumber) => (
        <div className="rooms-round-block" key={`${title}-${roundNumber}`}>
          <div className="rooms-round-header">
            <strong>Round {roundNumber}</strong>
            <span>{matches.filter((match) => match.roundNumber === roundNumber).length} games</span>
          </div>
          {matches
            .filter((match) => match.roundNumber === roundNumber)
            .map((match) => (
              <ScheduleRow
                key={match.id}
                match={match}
                rooms={rooms}
                onRoomChange={onRoomChange}
                onEdit={onEdit}
                onCancel={onCancel}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({
  match,
  rooms,
  onRoomChange,
  onEdit,
  onCancel,
}: {
  match: ScheduledMatch;
  rooms: TournamentRoom[];
  onRoomChange: (match: ScheduledMatch, roomId: string) => void;
  onEdit: (match: ScheduledMatch) => void;
  onCancel: (match: ScheduledMatch) => void;
}) {
  const editable =
    match.status === ScheduledMatchStatus.Scheduled ||
    match.status === ScheduledMatchStatus.Ready ||
    match.status === ScheduledMatchStatus.NeedsAttention;
  return (
    <div className="rooms-schedule-row">
      <div className="rooms-schedule-room">
        <select
          aria-label={`Room for ${match.describe()}`}
          value={match.roomId ?? ''}
          onChange={(event) => onRoomChange(match, event.target.value)}
          disabled={!editable}
        >
          <option value="">Unassigned</option>
          {rooms.map((room) => (
            <option value={room.id} key={room.id} disabled={!room.enabled}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rooms-schedule-teams">
        <strong>{match.leftTeamName}</strong> <span className="rooms-secondary">vs</span>{' '}
        <strong>{match.rightTeamName}</strong>
        {match.poolName && <div className="rooms-secondary">{match.poolName}</div>}
      </div>
      <div className="rooms-schedule-status">
        <span className={`rooms-state ${scheduleStateClass(match.status)}`}>{scheduleStatusLabel(match.status)}</span>
      </div>
      <div className="rooms-secondary">{match.generated ? 'Generated' : 'Manual'}</div>
      <div className="rooms-schedule-actions">
        <Button size="small" onClick={() => onEdit(match)} disabled={!editable}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={() => onCancel(match)} disabled={!editable}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ServerSettingsDialog({
  service,
  open,
  onClose,
}: {
  service: TournamentServerContextValue;
  open: boolean;
  onClose: () => void;
}) {
  const [portText, setPortText] = useState(String(service.requestedPort));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setPortText(String(service.requestedPort));
  }, [open, service.requestedPort]);
  const port = Number.parseInt(portText, 10);
  const validPort = Number.isInteger(port) && port >= 1024 && port <= 65535;
  const toggle = async () => {
    setBusy(true);
    try {
      if (service.status.running) await service.stopServer();
      else await service.startServer(port);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tournament Server settings</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
        >
          The server binds to every LAN interface on this computer. Room pages only work while it is running.
        </Typography>
        {!service.status.running && (
          <TextField
            label="Port"
            value={portText}
            onChange={(event) => {
              setPortText(event.target.value);
              const next = Number.parseInt(event.target.value, 10);
              if (Number.isInteger(next)) service.setRequestedPort(next);
            }}
            error={!validPort}
            helperText={validPort ? ' ' : 'Use a port between 1024 and 65535'}
          />
        )}
        {service.status.running && (
          <Alert severity="success">
            Running on port {service.status.port}. Stop the server before changing the port.
          </Alert>
        )}
        {service.lastError !== '' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {service.lastError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          color={service.status.running ? 'error' : 'primary'}
          startIcon={service.status.running ? <Stop /> : <PlayArrow />}
          onClick={toggle}
          disabled={busy || (!service.status.running && !validPort)}
        >
          {service.status.running ? 'Stop server' : 'Start server'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
