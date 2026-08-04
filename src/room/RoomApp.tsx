import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModaqControl, IGameFormat, IPacket, IPlayer } from 'modaq';
import buildScaffoldPacket from './ScaffoldPacket';
import {
  ISessionCredentials,
  ITournamentInfo,
  createSession,
  getRounds,
  getStatus,
  getTeams,
  getTournament,
  putSnapshot,
} from './api';
import { IRoomRound, IRoomTeam } from '../main/server/ServerTypes';
import {
  clearPendingSubmission,
  flushPendingSubmission,
  getPendingSubmission,
  queueSubmission,
} from './SubmissionQueue';

/** MODAQ requires a status object back from a custom export */
type ModaqStatus = { isError: false; status: string } | { isError: true; status: string };

/** How MODAQ tells us why it's exporting. From modaq's ExportSource type. */
type ExportSource = 'Menu' | 'NewGame' | 'NextButton' | 'Timer';

/** Smallest interval MODAQ allows for automatic custom exports */
const snapshotIntervalMs = 5000;

/** How often to re-check whether YellowFruit is reachable */
const connectivityIntervalMs = 10000;

/** How often to retry a queued final submission */
const retryIntervalMs = 15000;

type Phase = 'loading' | 'setup' | 'scoring' | 'submitted';

interface IGameSetup {
  round: IRoomRound;
  leftTeam: IRoomTeam;
  rightTeam: IRoomTeam;
}

/** Turn the two chosen rosters into the player list MODAQ expects */
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

export default function RoomApp() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState('');
  const [tournament, setTournament] = useState<ITournamentInfo | null>(null);
  const [rounds, setRounds] = useState<IRoomRound[]>([]);
  const [teams, setTeams] = useState<IRoomTeam[]>([]);
  const [online, setOnline] = useState(true);

  const [roundNumber, setRoundNumber] = useState<number | ''>('');
  const [leftTeamName, setLeftTeamName] = useState('');
  const [rightTeamName, setRightTeamName] = useState('');
  const [setupError, setSetupError] = useState('');
  const [starting, setStarting] = useState(false);

  const [setup, setSetup] = useState<IGameSetup | null>(null);
  const [credentials, setCredentials] = useState<ISessionCredentials | null>(null);
  const [pendingFinal, setPendingFinal] = useState(getPendingSubmission() !== null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [lastSnapshotError, setLastSnapshotError] = useState('');

  // Held in a ref so MODAQ's export callback always sees the current session without being
  // re-created (which would reset MODAQ's export interval).
  const credentialsRef = useRef<ISessionCredentials | null>(null);
  credentialsRef.current = credentials;

  // Load the tournament projection once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tournamentResult, roundsResult, teamsResult] = await Promise.all([
        getTournament(),
        getRounds(),
        getTeams(),
      ]);
      if (cancelled) return;
      if (!tournamentResult.ok) {
        setLoadError(tournamentResult.error);
        setPhase('setup');
        return;
      }
      setTournament(tournamentResult.value);
      if (roundsResult.ok) setRounds(roundsResult.value.rounds);
      if (teamsResult.ok) setTeams(teamsResult.value.teams);
      setPhase('setup');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Watch connectivity so the scorekeeper always knows whether YellowFruit can hear them.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const result = await getStatus();
      if (!cancelled) setOnline(result.ok);
    };
    check();
    const handle = setInterval(check, connectivityIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  // Retry a queued final submission in the background until it lands.
  useEffect(() => {
    if (!pendingFinal) return undefined;
    const attempt = async () => {
      const outcome = await flushPendingSubmission();
      if (outcome.state === 'accepted') {
        setPendingFinal(false);
        setPhase('submitted');
        setSubmitMessage('Game submitted successfully. Waiting for tournament control to accept the result.');
      } else if (outcome.state === 'rejectedByServer' && outcome.status === 404) {
        setPendingFinal(false);
        setSubmitMessage(
          'This game could not be submitted because tournament control restarted the server. Use Export in the MODAQ menu to save the game and hand the file to the statskeeper.',
        );
      }
    };
    attempt();
    const handle = setInterval(attempt, retryIntervalMs);
    return () => clearInterval(handle);
  }, [pendingFinal]);

  const handleStartGame = async () => {
    setSetupError('');
    if (roundNumber === '' || leftTeamName === '' || rightTeamName === '') {
      setSetupError('Choose a round and both teams.');
      return;
    }
    if (leftTeamName === rightTeamName) {
      setSetupError('The two teams must be different.');
      return;
    }
    const round = rounds.find((r) => r.number === roundNumber);
    const leftTeam = teams.find((t) => t.name === leftTeamName);
    const rightTeam = teams.find((t) => t.name === rightTeamName);
    if (!round || !leftTeam || !rightTeam) {
      setSetupError('That round or team is no longer part of the tournament. Reload the page.');
      return;
    }

    setStarting(true);
    const result = await createSession({
      roundNumber: round.number,
      leftTeam: leftTeam.name,
      rightTeam: rightTeam.name,
    });
    setStarting(false);
    if (!result.ok) {
      setSetupError(result.error);
      return;
    }

    setCredentials({ sessionId: result.value.sessionId, token: result.value.token });
    setSetup({ round, leftTeam, rightTeam });
    setPhase('scoring');
  };

  /**
   * MODAQ's custom export callback.
   *
   * The export source decides what this means. A Timer export is a live snapshot for the desktop
   * dashboard and must never be treated as a finished game. Pressing Next on the last tossup, or
   * choosing the export item in MODAQ's menu, is a real submission.
   */
  const handleExport = useCallback(async (qbj: object, context?: { source: ExportSource }): Promise<ModaqStatus> => {
    const activeCredentials = credentialsRef.current;
    if (!activeCredentials) {
      return { isError: true, status: 'This room is not connected to a game yet.' };
    }

    const source = context?.source ?? 'Menu';

    if (source === 'Timer') {
      const result = await putSnapshot(activeCredentials, qbj);
      if (!result.ok) {
        setLastSnapshotError(result.error);
        // Reported as an error so MODAQ shows the scorekeeper that the upload didn't land, but
        // nothing local is discarded and scoring continues.
        return { isError: true, status: result.error };
      }
      setLastSnapshotError('');
      return { isError: false, status: 'Sent to YellowFruit' };
    }

    if (source === 'NewGame') {
      // Starting a fresh game in MODAQ isn't a submission for this session.
      return { isError: false, status: 'Not submitted' };
    }

    // A real submission. Store it locally first so a network failure can't lose the game.
    queueSubmission(activeCredentials, qbj);
    setPendingFinal(true);

    const outcome = await flushPendingSubmission();
    if (outcome.state === 'accepted') {
      setPendingFinal(false);
      setPhase('submitted');
      setSubmitMessage('Game submitted successfully. Waiting for tournament control to accept the result.');
      return { isError: false, status: 'Submitted to YellowFruit' };
    }

    if (outcome.state === 'rejectedByServer') {
      if (outcome.status === 404) {
        clearPendingSubmission();
        setPendingFinal(false);
      }
      return { isError: true, status: outcome.error };
    }

    // Offline: the submission stays queued and the retry loop keeps trying.
    return {
      isError: true,
      status: 'Saved on this device. It will be sent automatically when YellowFruit is reachable again.',
    };
  }, []);

  const gameFormat = tournament?.gameFormat ?? null;

  const modaqPlayers = useMemo(() => (setup ? toModaqPlayers(setup.leftTeam, setup.rightTeam) : []), [setup]);

  // MODAQ has no scoring cycles without a packet, so give it a placeholder one sized to the format.
  const scaffoldPacket = useMemo(
    () => (gameFormat ? (buildScaffoldPacket(gameFormat) as unknown as IPacket) : undefined),
    [gameFormat],
  );

  // A stable store name per session, so a refresh restores this game and only this game.
  const storeName = credentials ? `yf-room-${credentials.sessionId}` : undefined;

  const customExport = useMemo(
    () => ({
      type: 'QBJ' as const,
      label: 'Submit to YellowFruit',
      customExportInterval: snapshotIntervalMs,
      onExport: handleExport as any,
    }),
    [handleExport],
  );

  if (phase === 'loading') {
    return <div className="room-shell">Loading tournament information&hellip;</div>;
  }

  const connectionBanner = !online && (
    <div className="room-banner room-banner-warning">
      <strong>YellowFruit is not reachable.</strong> You can keep scoring &mdash; this game is saved on this device and
      will be sent when the connection comes back.
    </div>
  );

  if (phase === 'scoring' && setup && gameFormat) {
    return (
      <div className="room-scoring">
        {connectionBanner}
        {lastSnapshotError !== '' && online && (
          <div className="room-banner room-banner-warning">
            The last automatic update didn&apos;t reach YellowFruit ({lastSnapshotError}). Scoring is unaffected.
          </div>
        )}
        <div className="room-scoring-header">
          <span>
            <strong>Round {setup.round.name}</strong> &middot; {setup.leftTeam.name} vs {setup.rightTeam.name}
          </span>
          <span className={online ? 'room-pill room-pill-online' : 'room-pill room-pill-offline'}>
            {online ? 'Connected' : 'Offline'}
          </span>
        </div>
        <ModaqControl
          players={modaqPlayers}
          gameFormat={gameFormat as IGameFormat}
          packet={scaffoldPacket}
          packetName="No packet loaded"
          hideNewGame
          persistState
          storeName={storeName}
          customExport={customExport}
        />
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="room-shell">
        <h1>Game submitted</h1>
        <p>{submitMessage}</p>
        <p className="room-muted">
          You can close this page, or start the next game to score another round in this room.
        </p>
        <button
          type="button"
          className="room-button"
          onClick={() => {
            setSetup(null);
            setCredentials(null);
            setSubmitMessage('');
            setRoundNumber('');
            setLeftTeamName('');
            setRightTeamName('');
            setPhase('setup');
          }}
        >
          Start Next Game
        </button>
      </div>
    );
  }

  // Setup screen
  const rulesUnusable = tournament !== null && gameFormat === null;

  return (
    <div className="room-shell">
      {connectionBanner}
      <h1>{tournament?.name || 'YellowFruit'}</h1>
      <p className="room-muted">Scorekeeping room</p>

      {loadError !== '' && (
        <div className="room-banner room-banner-error">
          Couldn&apos;t load tournament information: {loadError}
          <div>Make sure the YellowFruit computer is on the same network and its server is running.</div>
        </div>
      )}

      {rulesUnusable && (
        <div className="room-banner room-banner-error">
          <strong>This tournament&apos;s scoring rules can&apos;t be used for browser scorekeeping.</strong>
          <ul>{tournament?.gameFormatErrors.map((message) => <li key={message}>{message}</li>)}</ul>
        </div>
      )}

      {pendingFinal && (
        <div className="room-banner room-banner-warning">
          A finished game is still waiting to be sent to YellowFruit. It will go automatically once the connection is
          back. Don&apos;t clear this browser&apos;s data.
        </div>
      )}

      {submitMessage !== '' && <div className="room-banner room-banner-error">{submitMessage}</div>}

      {!rulesUnusable && tournament !== null && (
        <>
          {tournament.gameFormatWarnings.length > 0 && (
            <div className="room-banner room-banner-info">
              {tournament.gameFormatWarnings.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          )}

          <label className="room-field" htmlFor="round-select">
            <span>Round</span>
            <select
              id="round-select"
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Choose a round</option>
              {rounds.map((round) => (
                <option key={round.number} value={round.number}>
                  {round.name}
                </option>
              ))}
            </select>
          </label>

          <label className="room-field" htmlFor="left-team-select">
            <span>Team 1</span>
            <select id="left-team-select" value={leftTeamName} onChange={(e) => setLeftTeamName(e.target.value)}>
              <option value="">Choose a team</option>
              {teams.map((team) => (
                <option key={team.name} value={team.name} disabled={team.name === rightTeamName}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="room-field" htmlFor="right-team-select">
            <span>Team 2</span>
            <select id="right-team-select" value={rightTeamName} onChange={(e) => setRightTeamName(e.target.value)}>
              <option value="">Choose a team</option>
              {teams.map((team) => (
                <option key={team.name} value={team.name} disabled={team.name === leftTeamName}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          {setupError !== '' && <div className="room-banner room-banner-error">{setupError}</div>}

          <button type="button" className="room-button" onClick={handleStartGame} disabled={starting}>
            {starting ? 'Starting…' : 'Start Game'}
          </button>
        </>
      )}
    </div>
  );
}
