import { createContext } from 'react';
import Tournament from '../DataModel/Tournament';
import { ScheduledMatchStatus } from '../DataModel/ScheduledMatch';
import MatchImportResult, { ImportResultStatus } from '../DataModel/MatchImportResult';
import { StatsValidity } from '../DataModel/Match';
import MatchImportService from './MatchImportService';
import scoringRulesToModaqGameFormat from './YellowFruitScoringRulesToModaq';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain } from '../../IPCChannels';
import {
  IMatchSubmission,
  IRoomPresence,
  IServerStatus,
  ISessionSummary,
  ISubmissionVerdict,
  ITournamentSnapshot,
  defaultServerPort,
} from '../../main/server/ServerTypes';

/** One remote submission waiting on the statskeeper's decision */
export interface IInboxItem {
  sessionId: string;
  roundNumber: number;
  /** Team names as the room reported them, for display before validation resolves them */
  leftTeam: string;
  rightTeam: string;
  /** ISO 8601 */
  submittedAt: string;
  /** The scheduled game this is a result for, when the room was playing an assignment */
  scheduledMatchId?: string;
  roomId?: string;
  roomName?: string;
  /** Result of running the submission through the shared QBJ importer */
  importResult: MatchImportResult;
}

/**
 * A submission that arrived for a game the tournament has already recorded.
 *
 * Kept rather than dropped: two results for one game means something went wrong in the room, and the
 * director needs to see both payloads to work out which one is right.
 */
export interface IMatchSubmissionConflict {
  submission: IMatchSubmission;
  /** The accepted match this collides with */
  existingMatchId: string;
  noticedAt: string;
}

/**
 * Owns the renderer's view of the local tournament server: its status, the live room dashboard, and
 * the Match Inbox of submissions awaiting approval.
 *
 * Remote submissions are validated with the same MatchImportService the manual file import uses,
 * and are never added to the tournament without an explicit accept.
 */
export default class TournamentServerService {
  status: IServerStatus = { running: false, port: defaultServerPort, addresses: [] };

  /** Port the user wants to use next time they start the server */
  requestedPort: number = defaultServerPort;

  sessions: ISessionSummary[] = [];

  /** Submissions awaiting the statskeeper's decision, newest first */
  inbox: IInboxItem[] = [];

  /** Last check-in for every configured room, including idle rooms with no open session */
  roomPresence: IRoomPresence[] = [];

  /** Set when starting the server fails, so the Rooms page can show why */
  lastError: string = '';

  /**
   * Round the director has explicitly opened, overriding the automatic choice.
   *
   * Normally the current round is derived, so it advances on its own as results are accepted. This
   * exists for the case where control genuinely wants to open the next round early — it is a
   * control-room action and is deliberately not something a room client can trigger.
   */
  roundOverride: number | null = null;

  /** Conflicting submissions kept for the director to look at. Never silently discarded. */
  conflicts: IMatchSubmissionConflict[] = [];

  dataChangedReactCallback: () => void;

  /** Called when a match is accepted, so TournamentManager can mark the file dirty and recompile */
  onMatchAccepted: (result: MatchImportResult) => void;

  /** Called when operational scheduling state changes outside of a result import. */
  onScheduleChanged: () => void;

  private tournament: Tournament;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
    this.dataChangedReactCallback = () => {};
    this.onMatchAccepted = () => {};
    this.onScheduleChanged = () => {};
  }

  setTournament(tournament: Tournament) {
    this.tournament = tournament;
    // Push even while stopped so the main process can scope any recovery data before the next
    // start. This does not bind a port or make the optional server visible on the LAN.
    this.pushTournamentSnapshot();
  }

  /** Subscribe to the main process's tournament-server messages */
  addIpcListeners() {
    window.electron.ipcRenderer.on(IpcMainToRend.TournamentServerStatusChanged, (status) => {
      this.status = status as IServerStatus;
      this.lastError = this.status.errorMessage ?? '';
      this.dataChangedReactCallback();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.TournamentServerSessionsChanged, (sessions) => {
      this.sessions = (sessions as ISessionSummary[]) ?? [];
      this.dataChangedReactCallback();
    });
    window.electron.ipcRenderer.on(IpcMainToRend.TournamentServerMatchSubmitted, (submission) => {
      this.handleSubmission(submission as IMatchSubmission);
    });
    window.electron.ipcRenderer.on(IpcMainToRend.TournamentServerSessionStarted, (payload) => {
      const { scheduledMatchId } = (payload ?? {}) as { scheduledMatchId?: string };
      if (scheduledMatchId) this.handleSessionStarted(scheduledMatchId);
    });
  }

  /** Build the small read-only projection of the tournament that room clients are allowed to see */
  buildTournamentSnapshot(): ITournamentSnapshot {
    const formatResult = scoringRulesToModaqGameFormat(this.tournament.scoringRules);
    const rounds = this.tournament.phases.flatMap((phase) =>
      phase.rounds.map((round) => ({ number: round.number, name: round.displayName() })),
    );
    const teams = this.tournament.getListOfAllTeams().map((team) => ({
      name: team.name,
      players: team.players.filter((p) => p.name !== '').map((p) => ({ name: p.name })),
    }));
    const roundNames = new Map(rounds.map((round) => [round.number, round.name]));

    return {
      name: this.tournament.name || 'Untitled tournament',
      rounds: rounds.sort((a, b) => a.number - b.number),
      teams: teams.sort((a, b) => a.name.localeCompare(b.name)),
      gameFormat: formatResult.ok ? formatResult.gameFormat : null,
      gameFormatErrors: formatResult.ok ? [] : formatResult.errors,
      gameFormatWarnings: formatResult.ok ? formatResult.warnings : [],
      timedRounds: this.tournament.scoringRules.timed,
      rooms: this.tournament.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        accessToken: room.accessToken,
        enabled: room.enabled,
      })),
      // Only games that have a room can be served to one.
      assignments: this.tournament.scheduledMatches
        .filter((match) => match.roomId !== undefined)
        .map((match) => ({
          scheduledMatchId: match.id,
          roomId: match.roomId as string,
          roundNumber: match.roundNumber,
          roundName: roundNames.get(match.roundNumber) ?? String(match.roundNumber),
          leftTeam: match.leftTeamName,
          rightTeam: match.rightTeamName,
          status: match.status,
        })),
      currentRoundNumber: this.currentRoundNumber,
      releasedRoundNumber: this.tournament.releasedRoundNumber,
      recoveryKey: this.recoveryKey(),
    };
  }

  /** Stable identity for transient recovery; live status and scores are intentionally excluded. */
  private recoveryKey(): string {
    return JSON.stringify({
      name: this.tournament.name,
      roomIds: this.tournament.rooms.map((room) => room.id).sort(),
      scheduled: this.tournament.scheduledMatches
        .map((match) => [match.id, match.roundNumber, match.leftTeamName, match.rightTeamName])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    });
  }

  /**
   * The round rooms are allowed to play.
   *
   * Derived rather than tracked, so it advances by itself: it is the earliest round that still has a
   * game nobody has accepted. Once tournament control accepts the last result of round 4, round 5
   * becomes current and every Chromebook picks up its next game on the following poll without anyone
   * pressing anything.
   *
   * `roundOverride` lets control open a round early when it really means to.
   */
  get currentRoundNumber(): number | null {
    if (this.roundOverride !== null) return this.roundOverride;

    const unresolved = this.tournament.scheduledMatches.filter((match) => !match.isResolved());
    if (unresolved.length === 0) return null;
    return unresolved.reduce((earliest, match) => Math.min(earliest, match.roundNumber), Infinity);
  }

  /** Open a round explicitly. A control-room action; rooms cannot do this. */
  setRoundOverride(roundNumber: number | null) {
    this.roundOverride = roundNumber;
    this.tournament.releasedRoundNumber = roundNumber;
    if (roundNumber !== null) {
      for (const scheduled of this.tournament.scheduledMatches) {
        if (scheduled.roundNumber === roundNumber && scheduled.status === ScheduledMatchStatus.Scheduled) {
          scheduled.status = ScheduledMatchStatus.Ready;
        }
      }
    }
    if (this.status.running) this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
  }

  get releasedRoundNumber(): number | null {
    return this.tournament.releasedRoundNumber;
  }

  /** Release one round to rooms without touching accepted history. */
  releaseRound(roundNumber: number): boolean {
    const hasGames = this.tournament.scheduledMatches.some((match) => match.roundNumber === roundNumber);
    if (!hasGames) return false;

    this.tournament.releasedRoundNumber = roundNumber;
    this.roundOverride = null;
    for (const scheduled of this.tournament.scheduledMatches) {
      if (scheduled.roundNumber === roundNumber && scheduled.status === ScheduledMatchStatus.Scheduled) {
        scheduled.status = ScheduledMatchStatus.Ready;
      }
    }
    this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
    return true;
  }

  clearReleasedRound() {
    this.tournament.releasedRoundNumber = null;
    this.roundOverride = null;
    this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
  }

  setAutoReleaseNextRound(enabled: boolean) {
    this.tournament.autoReleaseNextRound = enabled;
    this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
  }

  /** Candidate next round for the manual release control. */
  nextRoundToRelease(): number | null {
    const rounds = Array.from(new Set(this.tournament.scheduledMatches.map((match) => match.roundNumber))).sort(
      (a, b) => a - b,
    );
    const released = this.tournament.releasedRoundNumber;
    if (released === null) {
      return (
        rounds.find((roundNumber) =>
          this.tournament.scheduledMatches.some((match) => match.roundNumber === roundNumber && !match.isResolved()),
        ) ?? null
      );
    }
    return rounds.find((roundNumber) => roundNumber > released) ?? null;
  }

  /** Automatically release only after the current round is actually complete. */
  private maybeAutoReleaseNextRound() {
    if (!this.tournament.autoReleaseNextRound) return;
    const released = this.tournament.releasedRoundNumber;
    if (released === null) return;

    const releasedMatches = this.tournament.scheduledMatches.filter((match) => match.roundNumber === released);
    if (releasedMatches.length === 0 || releasedMatches.some((match) => !match.isResolved())) return;

    const next = this.nextRoundToRelease();
    if (next === null) return;

    // A phase boundary is a deliberate TD checkpoint. The next phase can only be released after
    // rebracketing confirmation, even when continuous release is enabled for ordinary rounds.
    const previousPhase = this.tournament.whichPhaseIsRoundNumberIn(released);
    const nextPhase = this.tournament.whichPhaseIsRoundNumberIn(next);
    if (previousPhase && nextPhase && previousPhase !== nextPhase) return;
    this.releaseRound(next);
  }

  /** Find a scheduled match by id */
  private findScheduledMatch(scheduledMatchId: string | undefined) {
    if (!scheduledMatchId) return undefined;
    return this.tournament.scheduledMatches.find((match) => match.id === scheduledMatchId);
  }

  /**
   * A room opened its assigned game, so show it as being played.
   *
   * Only moves a game forward from waiting. A game already submitted or accepted must not be dragged
   * back to playing by a stale request.
   */
  handleSessionStarted(scheduledMatchId: string) {
    const scheduled = this.findScheduledMatch(scheduledMatchId);
    if (!scheduled) return;
    if (
      scheduled.status === ScheduledMatchStatus.Scheduled ||
      scheduled.status === ScheduledMatchStatus.Ready ||
      scheduled.status === ScheduledMatchStatus.NeedsAttention
    ) {
      scheduled.status = ScheduledMatchStatus.Playing;
      this.pushTournamentSnapshot();
      this.onScheduleChanged();
      this.dataChangedReactCallback();
    }
  }

  /** Send the current tournament projection to the main process so the server can serve it */
  pushTournamentSnapshot() {
    // TournamentManager is also exercised in Node-only tests where the Electron preload bridge
    // does not exist yet. The real renderer always has window.electron.
    if (typeof window === 'undefined' || !window.electron) return;
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.TournamentServerSetSnapshot, this.buildTournamentSnapshot());
  }

  async startServer(port?: number) {
    const portToUse = port ?? this.requestedPort;
    this.requestedPort = portToUse;
    // Give the server the tournament before it can take any requests.
    this.pushTournamentSnapshot();
    const status = (await window.electron.ipcRenderer.invoke(
      IpcBidirectional.TournamentServerStart,
      portToUse,
    )) as IServerStatus;
    this.status = status;
    this.lastError = status.errorMessage ?? '';
    if (status.running) this.pushTournamentSnapshot();
    this.dataChangedReactCallback();
    return status;
  }

  async stopServer() {
    const status = (await window.electron.ipcRenderer.invoke(IpcBidirectional.TournamentServerStop)) as IServerStatus;
    this.status = status;
    this.sessions = [];
    this.dataChangedReactCallback();
    return status;
  }

  async refreshStatus() {
    this.status = (await window.electron.ipcRenderer.invoke(
      IpcBidirectional.TournamentServerGetStatus,
    )) as IServerStatus;
    const pending = (await window.electron.ipcRenderer.invoke(
      IpcBidirectional.TournamentServerGetPendingSubmissions,
    )) as IMatchSubmission[];
    pending.forEach((submission) => this.handleSubmission(submission));
    await this.refreshPresence();
    this.dataChangedReactCallback();
  }

  /** Poll the main process for the live room dashboard */
  async refreshSessions() {
    if (!this.status.running) return;
    this.sessions =
      ((await window.electron.ipcRenderer.invoke(IpcBidirectional.TournamentServerGetSessions)) as ISessionSummary[]) ??
      [];
    this.dataChangedReactCallback();
  }

  async refreshPresence() {
    this.roomPresence =
      ((await window.electron.ipcRenderer.invoke(
        IpcBidirectional.TournamentServerGetRoomPresence,
      )) as IRoomPresence[]) ?? [];
    this.dataChangedReactCallback();
  }

  setRequestedPort(port: number) {
    this.requestedPort = port;
    this.dataChangedReactCallback();
  }

  /**
   * Validate a remote submission and put it in the Match Inbox.
   *
   * The round comes from the session rather than the QBJ: MODAQ 1.41 omits `_round` from custom
   * exports, and the room already told the server which round it picked.
   */
  handleSubmission(submission: IMatchSubmission) {
    const scheduled = this.findScheduledMatch(submission.scheduledMatchId);

    // A game the tournament has already recorded must not be quietly overwritten. Keep both
    // payloads and surface the collision instead: two results for one game means something went
    // wrong in the room and a human has to decide which is right.
    if (scheduled?.isAccepted()) {
      this.conflicts = [
        {
          submission,
          existingMatchId: scheduled.resultMatchId ?? '(unknown)',
          noticedAt: new Date().toISOString(),
        },
        ...this.conflicts.filter((c) => c.submission.sessionId !== submission.sessionId),
      ];
      this.dataChangedReactCallback();
      return;
    }

    if (scheduled) scheduled.status = ScheduledMatchStatus.Submitted;

    const service = new MatchImportService(this.tournament);
    const round = this.tournament.getRoundObjByNumber(submission.roundNumber);
    const sourceLabel = TournamentServerService.makeSourceLabel(submission);

    const { results, hadInvalidJson } = service.importMatches(
      [{ filePath: sourceLabel, fileContents: JSON.stringify(submission.qbj) }],
      round,
    );

    let importResult: MatchImportResult;
    if (hadInvalidJson || results.length === 0) {
      importResult = new MatchImportResult(sourceLabel);
      importResult.markFatal("This room's submission could not be read as a QBJ match.");
    } else {
      [importResult] = results;
    }

    // Replace any earlier submission from the same room rather than stacking duplicates.
    this.inbox = [
      {
        sessionId: submission.sessionId,
        roundNumber: submission.roundNumber,
        leftTeam: submission.leftTeam,
        rightTeam: submission.rightTeam,
        submittedAt: submission.submittedAt,
        scheduledMatchId: submission.scheduledMatchId,
        roomId: submission.roomId,
        roomName: submission.roomId
          ? this.tournament.rooms.find((room) => room.id === submission.roomId)?.name
          : undefined,
        importResult,
      },
      ...this.inbox.filter((item) => item.sessionId !== submission.sessionId),
    ];
    this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
  }

  /**
   * A label identifying which room a match came from. This ends up on `Match.importedFile`, the same
   * field a manually imported file's name goes in, so accepted remote matches look like any other
   * imported match downstream.
   */
  static makeSourceLabel(submission: IMatchSubmission) {
    return `Room: ${submission.leftTeam} vs ${submission.rightTeam} (R${submission.roundNumber})`;
  }

  findInboxItem(sessionId: string) {
    return this.inbox.find((item) => item.sessionId === sessionId);
  }

  /** How many submissions are waiting, for the nav bar badge */
  pendingCount() {
    return this.inbox.length;
  }

  /**
   * Accept a submission: insert its match into the round, tell the server, and let
   * TournamentManager mark the file dirty so the normal stats flow picks it up.
   *
   * `acceptAnyway` is required for a submission with non-fatal validation errors, matching how the
   * manual import dialog treats the same situation.
   */
  acceptSubmission(sessionId: string, acceptAnyway = false) {
    const item = this.findInboxItem(sessionId);
    if (!item) return false;

    const { importResult } = item;
    const { match, round, phase, status } = importResult;
    if (!match || !round) return false;
    if (status === ImportResultStatus.FatalErr) return false;
    if (status === ImportResultStatus.ErrNonFatal && !acceptAnyway) return false;

    const scheduled = this.findScheduledMatch(item.scheduledMatchId);
    // Accepting twice would put two copies of one game into the standings. The scheduled match's
    // result link is the guard, and it survives a save and reopen.
    if (scheduled?.isAccepted()) return false;

    // Mirror MatchImportResultsManager.finishImport exactly, so a remote match is indistinguishable
    // from a manually imported one.
    if (status === ImportResultStatus.ErrNonFatal) match.statsValidity = StatsValidity.omit;
    match.importedFile = importResult.filePath;
    Tournament.validateHaveTeamsPlayedInRound(match, round, phase, false);
    round.addMatch(match);

    if (scheduled) {
      scheduled.status = ScheduledMatchStatus.Accepted;
      scheduled.resultMatchId = match.id;
    }

    this.inbox = this.inbox.filter((i) => i.sessionId !== sessionId);
    this.sendVerdict({ sessionId, accepted: true });
    this.onMatchAccepted(importResult);
    this.maybeAutoReleaseNextRound();
    // The accepted result may have made the next round current, so rooms need to hear about it.
    this.pushTournamentSnapshot();
    this.dataChangedReactCallback();
    return true;
  }

  /** Reject a submission. The room is told, and may correct and resubmit. */
  rejectSubmission(sessionId: string, reason?: string) {
    const item = this.findInboxItem(sessionId);
    if (!item) return false;

    const scheduled = this.findScheduledMatch(item.scheduledMatchId);
    // Back to needing a human rather than to plain waiting, so the round-readiness view keeps
    // showing that something is wrong here.
    if (scheduled && !scheduled.isAccepted()) scheduled.status = ScheduledMatchStatus.NeedsAttention;

    this.inbox = this.inbox.filter((i) => i.sessionId !== sessionId);
    this.sendVerdict({ sessionId, accepted: false, reason });
    this.pushTournamentSnapshot();
    this.onScheduleChanged();
    this.dataChangedReactCallback();
    return true;
  }

  /** Forget a recorded conflict once the director has dealt with it */
  dismissConflict(sessionId: string) {
    this.conflicts = this.conflicts.filter((c) => c.submission.sessionId !== sessionId);
    this.dataChangedReactCallback();
  }

  // eslint-disable-next-line class-methods-use-this
  private sendVerdict(verdict: ISubmissionVerdict) {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.TournamentServerSubmissionVerdict, verdict);
  }

  /** Drop everything, e.g. when a different tournament file is opened */
  reset() {
    this.inbox = [];
    this.sessions = [];
    this.conflicts = [];
    this.roomPresence = [];
    this.roundOverride = null;
  }
}

export const TournamentServerContext = createContext<TournamentServerService | null>(null);
