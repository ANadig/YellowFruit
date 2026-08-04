import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import { TournamentManager } from '../../TournamentManager';
import Tournament from '../../DataModel/Tournament';
import { ScheduledMatch, ScheduledMatchStatus } from '../../DataModel/ScheduledMatch';
import { TournamentRoom } from '../../DataModel/TournamentRoom';
import {
  IGenerationResult,
  IScheduledMatchDraft,
  ScheduleIssueSeverity,
  generateSchedule,
  hasBlockingIssue,
  mergeGeneratedSchedule,
  validateDraft,
} from '../../Services/ScheduleService';

function availableRounds(tournament: Tournament): number[] {
  return tournament.phases
    .flatMap((phase) => phase.rounds.map((round) => round.number))
    .filter((number, index, all) => all.indexOf(number) === index)
    .sort((a, b) => a - b);
}

interface IMatchEditorDialogProps {
  open: boolean;
  match: ScheduledMatch | null;
  tournament: Tournament;
  rooms: TournamentRoom[];
  manager: TournamentManager;
  onClose: () => void;
}

export function MatchEditorDialog(props: IMatchEditorDialogProps) {
  const { open, match, tournament, rooms, manager, onClose } = props;
  const rounds = availableRounds(tournament);
  const teams = tournament
    .getListOfAllTeams()
    .map((team) => team.name)
    .sort((a, b) => a.localeCompare(b));
  const [round, setRound] = useState<number>(rounds[0] ?? 1);
  const [leftTeam, setLeftTeam] = useState('');
  const [rightTeam, setRightTeam] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [issues, setIssues] = useState<ReturnType<typeof validateDraft>>([]);

  useEffect(() => {
    if (!open) return;
    setRound(match?.roundNumber ?? rounds[0] ?? 1);
    setLeftTeam(match?.leftTeamName ?? teams[0] ?? '');
    setRightTeam(match?.rightTeamName ?? teams[1] ?? '');
    setRoomId(match?.roomId ?? '');
    setIsAdHoc(match?.generated === false && match !== null);
    setIssues([]);
  }, [open, match, rounds, teams]);

  const draft: IScheduledMatchDraft = { roundNumber: round, leftTeamName: leftTeam, rightTeamName: rightTeam, roomId };

  const runValidation = () => {
    const nextIssues = validateDraft(draft, tournament.scheduledMatches, rooms, match?.id);
    setIssues(nextIssues);
    return nextIssues;
  };

  const save = () => {
    const nextIssues = runValidation();
    if (hasBlockingIssue(nextIssues)) return;
    if (match) {
      match.roundNumber = round;
      match.leftTeamName = leftTeam;
      match.rightTeamName = rightTeam;
      match.roomId = roomId || undefined;
      match.generated = !isAdHoc;
      match.phaseCode = tournament.whichPhaseIsRoundNumberIn(round)?.code ?? match.phaseCode;
      if (match.status === ScheduledMatchStatus.NeedsAttention) match.status = ScheduledMatchStatus.Scheduled;
    } else {
      const created = new ScheduledMatch(round, leftTeam, rightTeam);
      created.roomId = roomId || undefined;
      created.generated = !isAdHoc;
      created.phaseCode = tournament.whichPhaseIsRoundNumberIn(round)?.code ?? '';
      tournament.scheduledMatches.push(created);
    }
    manager.markTournamentDataChanged();
    onClose();
  };

  const isResolved = match?.isAccepted() || match?.status === ScheduledMatchStatus.Cancelled;
  const blocking = hasBlockingIssue(issues);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{match ? 'Edit scheduled match' : 'Add scheduled match'}</DialogTitle>
      <DialogContent>
        {isResolved && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Resolved matches are part of tournament history and cannot be edited.
          </Alert>
        )}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth disabled={isResolved}>
            <InputLabel id="scheduled-round-label">Round</InputLabel>
            <Select
              labelId="scheduled-round-label"
              label="Round"
              value={round}
              onChange={(event) => setRound(Number(event.target.value))}
            >
              {rounds.map((roundNumber) => (
                <MenuItem value={roundNumber} key={roundNumber}>
                  Round {roundNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth disabled={isResolved}>
              <InputLabel id="left-team-label">Left team</InputLabel>
              <Select
                labelId="left-team-label"
                label="Left team"
                value={leftTeam}
                onChange={(event) => setLeftTeam(event.target.value)}
              >
                {teams.map((team) => (
                  <MenuItem value={team} key={team}>
                    {team}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography color="text.secondary">vs</Typography>
            <FormControl fullWidth disabled={isResolved}>
              <InputLabel id="right-team-label">Right team</InputLabel>
              <Select
                labelId="right-team-label"
                label="Right team"
                value={rightTeam}
                onChange={(event) => setRightTeam(event.target.value)}
              >
                {teams.map((team) => (
                  <MenuItem value={team} key={team}>
                    {team}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              aria-label="Swap teams"
              title="Swap teams"
              onClick={() => {
                setLeftTeam(rightTeam);
                setRightTeam(leftTeam);
              }}
              disabled={isResolved}
            >
              <SwapHoriz />
            </Button>
          </Stack>
          <FormControl fullWidth disabled={isResolved}>
            <InputLabel id="scheduled-room-label">Room</InputLabel>
            <Select
              labelId="scheduled-room-label"
              label="Room"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {rooms.map((room) => (
                <MenuItem value={room.id} key={room.id} disabled={!room.enabled}>
                  {room.name}
                  {!room.enabled ? ' · disabled' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isAdHoc}
                onChange={(event) => setIsAdHoc(event.target.checked)}
                disabled={isResolved}
              />
            }
            label="Ad-hoc / tiebreaker game"
          />
          {issues.length > 0 && (
            <Alert severity={blocking ? 'error' : 'warning'}>
              {issues.map((issue) => (
                <div key={issue.message}>{issue.message}</div>
              ))}
            </Alert>
          )}
          {issues.length === 0 && leftTeam !== '' && rightTeam !== '' && (
            <Button variant="text" size="small" onClick={runValidation} sx={{ alignSelf: 'flex-start' }}>
              Check for schedule conflicts
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={isResolved}>
          {match ? 'Save match' : 'Add match'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function formatGenerationIssue(severity: ScheduleIssueSeverity, message: string) {
  return `${severity === ScheduleIssueSeverity.Error ? 'Error' : 'Warning'}: ${message}`;
}

interface IGeneratorPreview {
  generation: IGenerationResult;
  merged: ReturnType<typeof mergeGeneratedSchedule>;
  roomCount: number;
  roundCount: number;
}

interface IScheduleGeneratorDialogProps {
  open: boolean;
  tournament: Tournament;
  rooms: TournamentRoom[];
  onClose: () => void;
  onApply: (matches: ScheduledMatch[]) => void;
}

export function ScheduleGeneratorDialog(props: IScheduleGeneratorDialogProps) {
  const { open, tournament, rooms, onClose, onApply } = props;
  const phases = useMemo(
    () => tournament.phases.filter((phase) => phase.isFullPhase() && phase.rounds.length > 0),
    [tournament.phases],
  );
  const enabledRooms = useMemo(() => rooms.filter((room) => room.enabled), [rooms]);
  const [phaseCode, setPhaseCode] = useState(phases[0]?.code ?? '');
  const phase = phases.find((candidate) => candidate.code === phaseCode) ?? phases[0];
  const numericRounds = phase?.rounds.map((round) => round.number).sort((a, b) => a - b) ?? [];
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [fromRound, setFromRound] = useState(numericRounds[0] ?? 1);
  const [toRound, setToRound] = useState(numericRounds[numericRounds.length - 1] ?? 1);
  const [preview, setPreview] = useState<IGeneratorPreview | null>(null);

  useEffect(() => {
    if (!open) return;
    const nextPhase = phases[0];
    setPhaseCode(nextPhase?.code ?? '');
    setSelectedPoolIds(nextPhase?.pools.map((pool, index) => `${nextPhase.code}-${index}`) ?? []);
    setSelectedRoomIds(enabledRooms.map((room) => room.id));
    const roundNumbers = nextPhase?.rounds.map((round) => round.number).sort((a, b) => a - b) ?? [];
    setFromRound(roundNumbers[0] ?? 1);
    setToRound(roundNumbers[roundNumbers.length - 1] ?? 1);
    setPreview(null);
  }, [open, enabledRooms, phases]);

  useEffect(() => {
    if (!open || !phase) return;
    setSelectedPoolIds(phase.pools.map((pool, index) => `${phase.code}-${index}`));
    const roundNumbers = phase.rounds.map((round) => round.number).sort((a, b) => a - b);
    setFromRound(roundNumbers[0] ?? 1);
    setToRound(roundNumbers[roundNumbers.length - 1] ?? 1);
    setPreview(null);
  }, [open, phase]);

  const previewSchedule = () => {
    if (!phase) return;
    const poolRequests = phase.pools
      .map((pool, index) => ({ pool, id: `${phase.code}-${index}` }))
      .filter(({ id }) => selectedPoolIds.includes(id))
      .map(({ pool, id }) => ({
        poolId: id,
        teamIds: pool.poolTeams.map((poolTeam) => poolTeam.team.name),
        roundRobins: pool.roundRobins,
      }));
    const roundNumbers = phase.rounds
      .map((round) => round.number)
      .filter((roundNumber) => roundNumber >= fromRound && roundNumber <= toRound)
      .sort((a, b) => a - b);
    const selectedRooms = enabledRooms.filter((room) => selectedRoomIds.includes(room.id));
    const generation = generateSchedule(
      {
        pools: poolRequests,
        roundNumbers,
        phaseCode: phase.code,
        poolNames: Object.fromEntries(phase.pools.map((pool, index) => [`${phase.code}-${index}`, pool.name])),
      },
      selectedRooms,
    );
    const merged = mergeGeneratedSchedule(tournament.scheduledMatches, generation.scheduledMatches, rooms);
    setPreview({ generation, merged, roomCount: selectedRooms.length, roundCount: roundNumbers.length });
  };

  const generationErrors =
    preview?.generation.issues.filter((issue) => issue.severity === ScheduleIssueSeverity.Error) ?? [];
  const mergedErrors = preview?.merged.issues.filter((issue) => issue.severity === ScheduleIssueSeverity.Error) ?? [];
  const canApply =
    preview !== null &&
    generationErrors.length === 0 &&
    mergedErrors.length === 0 &&
    preview.generation.scheduledMatches.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Generate schedule</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Preview a deterministic round robin before changing future assignments. Accepted and in-flight games are
          retained; only future scheduled games are replaced.
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="generation-phase-label">Phase</InputLabel>
            <Select
              labelId="generation-phase-label"
              label="Phase"
              value={phase?.code ?? ''}
              onChange={(event) => setPhaseCode(event.target.value)}
            >
              {phases.map((candidate) => (
                <MenuItem key={candidate.code} value={candidate.code}>
                  {candidate.name} · {candidate.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {phase && (
            <div>
              <Typography variant="subtitle2" gutterBottom>
                Pools
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {phase.pools.map((pool, index) => {
                  const id = `${phase.code}-${index}`;
                  return (
                    <FormControlLabel
                      key={id}
                      control={
                        <Checkbox
                          checked={selectedPoolIds.includes(id)}
                          onChange={(event) =>
                            setSelectedPoolIds((current) =>
                              event.target.checked ? [...current, id] : current.filter((value) => value !== id),
                            )
                          }
                        />
                      }
                      label={`${pool.name} · ${pool.poolTeams.length} teams`}
                    />
                  );
                })}
              </Stack>
            </div>
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="First round"
              type="number"
              value={fromRound}
              onChange={(event) => setFromRound(Number(event.target.value))}
              inputProps={{ min: numericRounds[0] ?? 1, max: numericRounds[numericRounds.length - 1] ?? 1 }}
              sx={{ width: 150 }}
            />
            <TextField
              label="Last round"
              type="number"
              value={toRound}
              onChange={(event) => setToRound(Number(event.target.value))}
              inputProps={{ min: numericRounds[0] ?? 1, max: numericRounds[numericRounds.length - 1] ?? 1 }}
              sx={{ width: 150 }}
            />
          </Stack>

          <div>
            <Typography variant="subtitle2" gutterBottom>
              Enabled rooms used for this preview
            </Typography>
            {enabledRooms.length === 0 ? (
              <Alert severity="error">No enabled rooms are available. Add or enable rooms before generating.</Alert>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {enabledRooms.map((room) => (
                  <FormControlLabel
                    key={room.id}
                    control={
                      <Checkbox
                        checked={selectedRoomIds.includes(room.id)}
                        onChange={(event) =>
                          setSelectedRoomIds((current) =>
                            event.target.checked ? [...current, room.id] : current.filter((value) => value !== room.id),
                          )
                        }
                      />
                    }
                    label={room.name}
                  />
                ))}
              </Stack>
            )}
          </div>

          <Button variant="outlined" onClick={previewSchedule} disabled={!phase || selectedRoomIds.length === 0}>
            Preview
          </Button>

          {preview && (
            <div className="rooms-dialog-section">
              <h3>Preview</h3>
              <Typography variant="body2">
                {preview.generation.scheduledMatches.length} matches · {preview.roundCount} rounds · {preview.roomCount}{' '}
                rooms available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preview.merged.preservedMatches.filter((match) => match.isAccepted()).length} accepted games retained ·{' '}
                {preview.merged.replacedFutureCount} future assignments replaced
              </Typography>
              {preview.generation.issues.length > 0 && (
                <Alert severity={generationErrors.length > 0 ? 'error' : 'warning'} sx={{ mt: 1 }}>
                  {preview.generation.issues.map((issue) => (
                    <div key={issue.message}>{formatGenerationIssue(issue.severity, issue.message)}</div>
                  ))}
                </Alert>
              )}
              {mergedErrors.length > 0 && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  The generated future games conflict with retained history:
                  {preview.merged.issues
                    .filter((issue) => issue.severity === ScheduleIssueSeverity.Error)
                    .map((issue) => (
                      <div key={issue.message}>{issue.message}</div>
                    ))}
                </Alert>
              )}
              {canApply && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  ✓ Every generated game has one team per round and one room per round.
                </Alert>
              )}
            </div>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canApply}
          onClick={() => preview && onApply(preview.generation.scheduledMatches)}
        >
          Apply schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
