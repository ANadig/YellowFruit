/**
 * The room page a Chromebook stays on all day.
 *
 * It never asks the scorekeeper which teams are playing. The page polls YellowFruit for its
 * assignment, and when tournament control accepts a result or generates a new round, the next game
 * simply appears — no new URL, no reload, nothing to type. The scorekeeper's only decision is when to
 * press Start.
 *
 * Recovery is the other half of the job. A refresh, a dropped access point, or a closed and reopened
 * lid all land back here, and the assignment response carries the token of any session already open
 * for this game, so the page resumes the game it was scoring rather than starting a second one. A
 * completed game is written to this device before the first upload attempt and is not cleared until
 * YellowFruit acknowledges it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IPlayer } from 'modaq';
import { IRoomIdentity, ISessionCredentials, getRoomAssignment, putSnapshot, startAssignedMatch } from './api';
import {
  IRoomAssignmentResponse,
  IRoomMatchup,
  IRoomTeam,
  RoomBlockedReason,
  SessionStatus,
} from '../main/server/ServerTypes';
import normalizeQbjMatch, { IQbjNormalizeOptions, countPlayedQuestions } from '../renderer/Services/QbjMatchNormalizer';
import {
  clearPendingSubmission,
  flushPendingSubmission,
  getPendingSubmission,
  queueSubmission,
} from './SubmissionQueue';
import ScoringView from './ScoringView';
import MatchupCard from './MatchupCard';

/** MODAQ requires a status object back from a custom export */
type ModaqStatus = { isError: false; status: string } | { isError: true; status: string };

/** How MODAQ tells us why it's exporting. From modaq's ExportSource type. */
type ExportSource = 'Menu' | 'NewGame' | 'NextButton' | 'Timer';

/** Smallest interval MODAQ allows for automatic custom exports */
const snapshotIntervalMs = 5000;

/**
 * How often to ask YellowFruit what this room should be playing.
 *
 * Polling rather than a socket: the thing that has to work is that a new assignment reaches the room
 * without anyone touching it, and a five-second GET of one small object does that on a school LAN
 * without any realtime infrastructure to go wrong mid-tournament.
 */
const assignmentPollMs = 5000;

/** How often to retry a queued final submission */
const retryIntervalMs = 15000;

/** Turn a matchup's rosters into the player list MODAQ expects */
function toModaqPlayers(left: IRoomTeam, right: IRoomTeam): IPlayer[] {
  const forTeam = (team: IRoomTeam): IPlayer[] =>
    team.players.map((player, index) => ({
      name: player.name,
      teamName: team.name,
      // MODAQ needs a starting lineup; the scorekeeper can substitute from within MODAQ.
      isStarter: index < 4,
    }));
  return [...forTeam(left), ...forTeam(right)];
}

export default function AssignedRoomApp({ identity }: { identity: IRoomIdentity }) {
  const [assignment, setAssignment] = useState<IRoomAssignmentResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [online, setOnline] = useState(true);

  /** The matchup we are actively scoring, frozen so a poll can't swap MODAQ out mid-game */
  const [scoring, setScoring] = useState<{ matchup: IRoomMatchup; credentials: ISessionCredentials } | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [pendingFinal, setPendingFinal] = useState(getPendingSubmission() !== null);
  const [submittedSummary, setSubmittedSummary] = useState<string>('');
  const [snapshotError, setSnapshotError] = useState('');
  const [questionsPlayed, setQuestionsPlayed] = useState(0);

  // Refs so MODAQ's export callback stays stable; re-creating it resets MODAQ's export interval.
  const credentialsRef = useRef<ISessionCredentials | null>(null);
  credentialsRef.current = scoring?.credentials ?? null;

  const normalizeOptionsRef = useRef<IQbjNormalizeOptions | null>(null);
  normalizeOptionsRef.current = assignment?.gameFormat
    ? {
        regulationTossupCount: assignment.gameFormat.regulationTossupCount,
        minimumOvertimeQuestionCount: assignment.gameFormat.minimumOvertimeQuestionCount,
        gameMayEndEarly: assignment.timedRounds,
      }
    : null;

  /** Which game we're scoring, so a poll result can be compared without re-rendering the world */
  const scoringMatchIdRef = useRef<string | null>(null);
  scoringMatchIdRef.current = scoring?.matchup.scheduledMatchId ?? null;

  // Poll for the assignment. This is the whole mechanism by which a room learns about a new round.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const result = await getRoomAssignment(identity);
      if (cancelled) return;

      if (!result.ok) {
        setOnline(false);
        // A 403 means the link itself is wrong, which no amount of retrying will fix.
        if (result.status === 403) {
          setLoadError(
            'This room link is not valid for the tournament that is open. Ask tournament control for a new one.',
          );
        }
        return;
      }

      setOnline(true);
      setLoadError('');
      setAssignment(result.value);

      const { current, session } = result.value;

      // A page that reloaded mid-game picks its session back up here rather than starting a new one.
      if (current && session && scoringMatchIdRef.current === null && !session.finalReceived) {
        setScoring({ matchup: current, credentials: { sessionId: session.sessionId, token: session.token } });
      }

      // Tournament control accepted or moved the game we were scoring, so hand the room back to the
      // waiting screen and let the next assignment come through.
      if (
        scoringMatchIdRef.current !== null &&
        current?.scheduledMatchId !== scoringMatchIdRef.current &&
        getPendingSubmission() === null
      ) {
        setScoring(null);
        setQuestionsPlayed(0);
      }
    };

    poll();
    const handle = setInterval(poll, assignmentPollMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [identity]);

  // Retry a queued final in the background until it lands.
  useEffect(() => {
    if (!pendingFinal) return undefined;
    const attempt = async () => {
      const outcome = await flushPendingSubmission();
      if (outcome.state === 'accepted') {
        setPendingFinal(false);
      } else if (outcome.state === 'rejectedByServer' && outcome.status === 404) {
        setPendingFinal(false);
        setSubmittedSummary(
          'This game could not be sent because tournament control restarted the server. Use Export in the MODAQ menu to save the game and hand the file to the statskeeper.',
        );
      }
    };
    attempt();
    const handle = setInterval(attempt, retryIntervalMs);
    return () => clearInterval(handle);
  }, [pendingFinal]);

  const handleStart = async () => {
    const current = assignment?.current;
    if (!current) return;

    setStartError('');
    setStarting(true);
    const result = await startAssignedMatch(identity, current.scheduledMatchId);
    setStarting(false);

    if (!result.ok) {
      setStartError(result.error);
      return;
    }

    setQuestionsPlayed(0);
    setScoring({
      matchup: current,
      credentials: { sessionId: result.value.sessionId, token: result.value.token },
    });
  };

  /**
   * MODAQ's custom export callback.
   *
   * The export source decides what this means. A Timer export is a live snapshot for the control
   * room and must never be treated as a finished game; pressing Next past the last tossup, or
   * choosing the export item in MODAQ's menu, is a real submission.
   */
  const handleExport = useCallback(async (rawQbj: object, context?: { source: ExportSource }): Promise<ModaqStatus> => {
    const activeCredentials = credentialsRef.current;
    if (!activeCredentials) return { isError: true, status: 'This room is not connected to a game yet.' };

    const source = context?.source ?? 'Menu';

    // MODAQ counts questions from the scaffold packet's length, which overstates them for a tied
    // game. Correct that before anything else sees the payload.
    const options = normalizeOptionsRef.current;
    const qbj = options ? normalizeQbjMatch(rawQbj, options).qbj : (rawQbj as Record<string, any>);
    setQuestionsPlayed(countPlayedQuestions(qbj));

    if (source === 'Timer') {
      const result = await putSnapshot(activeCredentials, qbj);
      if (!result.ok) {
        setSnapshotError(result.error);
        // Reported as an error so MODAQ shows the scorekeeper the upload didn't land. Nothing local
        // is discarded and scoring continues.
        return { isError: true, status: result.error };
      }
      setSnapshotError('');
      return { isError: false, status: 'Sent to YellowFruit' };
    }

    if (source === 'NewGame') return { isError: false, status: 'Not submitted' };

    // A real submission. Store it on this device before the first upload attempt, so a network
    // failure at exactly the wrong moment cannot lose the game.
    queueSubmission(activeCredentials, qbj);
    setPendingFinal(true);

    const outcome = await flushPendingSubmission();
    if (outcome.state === 'accepted') {
      setPendingFinal(false);
      return { isError: false, status: 'Submitted to YellowFruit' };
    }

    if (outcome.state === 'rejectedByServer') {
      if (outcome.status === 404) {
        clearPendingSubmission();
        setPendingFinal(false);
      }
      return { isError: true, status: outcome.error };
    }

    return {
      isError: true,
      status: 'Saved on this device. It will be sent automatically when YellowFruit is reachable again.',
    };
  }, []);

  const customExport = useMemo(
    () => ({
      type: 'QBJ' as const,
      label: 'Submit to YellowFruit',
      customExportInterval: snapshotIntervalMs,
      onExport: handleExport as unknown,
    }),
    [handleExport],
  );

  const players = useMemo(
    () => (scoring ? toModaqPlayers(scoring.matchup.leftTeam, scoring.matchup.rightTeam) : []),
    [scoring],
  );

  if (assignment === null) {
    return (
      <div className="room-shell">
        {loadError !== '' ? (
          <div className="room-banner room-banner-error">{loadError}</div>
        ) : (
          <p className="room-muted">Connecting to YellowFruit&hellip;</p>
        )}
      </div>
    );
  }

  if (scoring && assignment.gameFormat) {
    const sessionStatus = assignment.session?.status;
    return (
      <ScoringView
        roomName={assignment.roomName}
        roundName={scoring.matchup.roundName}
        leftTeamName={scoring.matchup.leftTeam.name}
        rightTeamName={scoring.matchup.rightTeam.name}
        gameFormat={assignment.gameFormat}
        players={players}
        storeName={`yf-room-${scoring.credentials.sessionId}`}
        customExport={customExport as any}
        online={online}
        questionsPlayed={questionsPlayed}
        awaitingReview={pendingFinal || sessionStatus === SessionStatus.Submitted}
        snapshotError={snapshotError}
      />
    );
  }

  return (
    <MatchupCard
      assignment={assignment}
      online={online}
      starting={starting}
      startError={startError}
      pendingFinal={pendingFinal}
      submittedSummary={submittedSummary}
      onStart={handleStart}
      canStart={
        assignment.current !== null &&
        assignment.blockedReason === undefined &&
        assignment.gameFormat !== null &&
        !pendingFinal &&
        assignment.session?.status !== SessionStatus.Submitted &&
        assignment.session?.finalReceived !== true
      }
      blockedReason={assignment.blockedReason as RoomBlockedReason | undefined}
    />
  );
}
