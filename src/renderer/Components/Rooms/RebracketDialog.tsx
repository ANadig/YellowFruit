import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { Phase } from '../../DataModel/Phase';
import Tournament from '../../DataModel/Tournament';
import { PoolStats } from '../../DataModel/StatSummaries';
import { ScheduledMatchStatus } from '../../DataModel/ScheduledMatch';
import { TournamentRoom } from '../../DataModel/TournamentRoom';
import {
  ScheduleIssueSeverity,
  generateSchedule,
  hasBlockingIssue,
  mergeGeneratedSchedule,
  validatePhaseScheduleCompleteness,
  validateSchedule,
} from '../../Services/ScheduleService';
import { TournamentManager } from '../../TournamentManager';

interface IRebracketDialogProps {
  open: boolean;
  tournament: Tournament;
  manager: TournamentManager;
  completedPhase: Phase | null;
  nextPhase: Phase | null;
  rooms: TournamentRoom[];
  pendingFinals: number;
  onClose: () => void;
  onDone: () => void;
}

function phaseRoundNumbers(phase: Phase | null): number[] {
  return phase?.rounds.map((round) => round.number).sort((a, b) => a - b) ?? [];
}

export default function RebracketDialog(props: IRebracketDialogProps) {
  const { open, tournament, manager, completedPhase, nextPhase, rooms, pendingFinals, onClose, onDone } = props;
  const [standings, setStandings] = useState<PoolStats[]>([]);
  const [generatedPreview, setGeneratedPreview] = useState<ReturnType<typeof generateSchedule> | null>(null);
  const [previewIssues, setPreviewIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !completedPhase) return;
    manager.compileStats();
    const phaseStandings = tournament.stats.find((stats) => stats.phase === completedPhase);
    setStandings(phaseStandings?.pools ?? []);
    setGeneratedPreview(null);
    setPreviewIssues([]);
  }, [open, completedPhase, manager, tournament, tournament.stats]);

  const roundNumbers = useMemo(() => phaseRoundNumbers(completedPhase), [completedPhase]);
  const phaseMatches = tournament.scheduledMatches.filter((match) => roundNumbers.includes(match.roundNumber));
  const unresolvedMatches = phaseMatches.filter(
    (match) => match.status !== ScheduledMatchStatus.Accepted && match.status !== ScheduledMatchStatus.Cancelled,
  );
  const scheduleErrors = validateSchedule(tournament.scheduledMatches, rooms).filter(
    (issue) => issue.severity === ScheduleIssueSeverity.Error,
  );
  const missingSchedule = completedPhase
    ? validatePhaseScheduleCompleteness(completedPhase, tournament.scheduledMatches)
    : [];
  const tiedAdvancement = standings.flatMap((pool) => pool.poolTeams).filter((team) => team.recordTieForAdvancement);
  const cannotReview =
    completedPhase === null ||
    nextPhase === null ||
    pendingFinals > 0 ||
    unresolvedMatches.length > 0 ||
    scheduleErrors.length > 0 ||
    missingSchedule.length > 0 ||
    tiedAdvancement.length > 0 ||
    standings.length === 0;

  const previewNextPhase = () => {
    if (!nextPhase) return;
    const errors: string[] = [];
    const additions = new Map(nextPhase.pools.map((pool) => [pool, [] as string[]]));
    for (const poolStats of standings) {
      for (const teamStats of poolStats.poolTeams) {
        if (!teamStats.currentSeed) continue;
        const targetPool = nextPhase.findPoolWithSeed(teamStats.currentSeed);
        if (!targetPool) {
          errors.push(`${teamStats.team.name} has no destination pool for seed ${teamStats.currentSeed}.`);
          continue;
        }
        if (!nextPhase.findPoolWithTeam(teamStats.team)) additions.get(targetPool)?.push(teamStats.team.name);
      }
    }

    const pools = nextPhase.pools.map((pool, index) => ({
      poolId: `${nextPhase.code}-${index}`,
      teamIds: [...pool.poolTeams.map((team) => team.team.name), ...(additions.get(pool) ?? [])],
      roundRobins: pool.roundRobins,
    }));
    const generation = generateSchedule(
      {
        pools,
        roundNumbers: phaseRoundNumbers(nextPhase),
        phaseCode: nextPhase.code,
        poolNames: Object.fromEntries(nextPhase.pools.map((pool, index) => [`${nextPhase.code}-${index}`, pool.name])),
      },
      rooms.filter((room) => room.enabled),
    );
    const merged = mergeGeneratedSchedule(tournament.scheduledMatches, generation.scheduledMatches, rooms);
    errors.push(
      ...generation.issues
        .filter((issue) => issue.severity === ScheduleIssueSeverity.Error)
        .map((issue) => issue.message),
      ...merged.issues.filter((issue) => issue.severity === ScheduleIssueSeverity.Error).map((issue) => issue.message),
    );
    if (generation.scheduledMatches.length === 0) {
      errors.push(
        'No next-phase matches were generated. Verify the standings and destination pools before continuing.',
      );
    }
    setGeneratedPreview(generation);
    setPreviewIssues(errors);
  };

  const confirm = () => {
    if (!nextPhase || !generatedPreview || previewIssues.length > 0 || cannotReview) return;
    for (const poolStats of standings) manager.rebracketPool(poolStats, nextPhase);
    const merged = mergeGeneratedSchedule(tournament.scheduledMatches, generatedPreview.scheduledMatches, rooms);
    if (hasBlockingIssue(merged.issues)) return;
    tournament.scheduledMatches = merged.scheduledMatches;
    // Crossing a phase boundary always requires the director to release the new round explicitly.
    tournament.releasedRoundNumber = null;
    if (completedPhase && !tournament.rebracketedPhaseCodes.includes(completedPhase.code)) {
      tournament.rebracketedPhaseCodes.push(completedPhase.code);
    }
    manager.markTournamentDataChanged();
    onDone();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Review standings and confirm next pools</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
        >
          {completedPhase?.name ?? 'Current phase'} is complete. YellowFruit will use its existing standings and pool
          advancement rules; it will stop if an advancement tie needs a human decision.
        </Typography>

        {pendingFinals > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Rebracketing unavailable: {pendingFinals} final{pendingFinals === 1 ? '' : 's'} waiting for review.
          </Alert>
        )}
        {unresolvedMatches.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Rebracketing unavailable: {unresolvedMatches.length} scheduled game
            {unresolvedMatches.length === 1 ? '' : 's'} are not accepted or explicitly cancelled.
          </Alert>
        )}
        {scheduleErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Resolve these schedule conflicts first:
            {scheduleErrors.map((issue) => (
              <div key={issue.message}>{issue.message}</div>
            ))}
          </Alert>
        )}
        {missingSchedule.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            The completed phase is missing scheduled games:
            {missingSchedule.map((issue) => (
              <div key={issue.message}>{issue.message}</div>
            ))}
          </Alert>
        )}
        {tiedAdvancement.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Advancement requires manual resolution for: {tiedAdvancement.map((team) => team.team.name).join(', ')}.
          </Alert>
        )}
        {standings.length === 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Rebracketing unavailable: standings for the completed phase are not available yet.
          </Alert>
        )}

        <div className="rooms-dialog-section">
          <h3>Current qualification results</h3>
          {standings.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Standings are not available for this phase yet.
            </Typography>
          ) : (
            standings.map((pool) => (
              <div key={pool.pool.name}>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  {pool.pool.name}
                </Typography>
                {pool.poolTeams.map((team) => (
                  <Stack key={team.team.name} direction="row" spacing={2} sx={{ py: 0.5 }}>
                    <Typography sx={{ width: 45 }}>{team.rank ?? '—'}</Typography>
                    <Typography sx={{ flex: 1 }}>{team.team.name}</Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      {team.wins}–{team.losses} · {team.currentSeed ? `Seed ${team.currentSeed}` : 'Does not advance'}
                    </Typography>
                  </Stack>
                ))}
              </div>
            ))
          )}
        </div>

        {nextPhase && !cannotReview && (
          <div className="rooms-dialog-section">
            <h3>Next phase</h3>
            <Typography variant="body2">
              {nextPhase.name} · {nextPhase.pools.length} pools · {phaseRoundNumbers(nextPhase).length} rounds
            </Typography>
            <Button variant="outlined" sx={{ mt: 1 }} onClick={previewNextPhase}>
              Preview playoff schedule
            </Button>
          </div>
        )}

        {generatedPreview && (
          <Alert severity={previewIssues.length > 0 ? 'error' : 'success'}>
            {previewIssues.length > 0 ? (
              <>
                The next phase cannot be applied yet:
                {previewIssues.map((issue) => (
                  <div key={issue}>{issue}</div>
                ))}
              </>
            ) : (
              <>✓ {generatedPreview.scheduledMatches.length} next-phase matches are ready to assign.</>
            )}
          </Alert>
        )}
        {nextPhase && cannotReview && <Divider sx={{ mt: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={cannotReview || generatedPreview === null || previewIssues.length > 0}
        >
          Confirm playoff pools
        </Button>
      </DialogActions>
    </Dialog>
  );
}
