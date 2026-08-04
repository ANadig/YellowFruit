import { createContext } from 'react';
import Tournament from '../DataModel/Tournament';
import MatchImportResult, { ImportResultStatus } from '../DataModel/MatchImportResult';
import { StatsValidity } from '../DataModel/Match';
import MatchImportService from './MatchImportService';
import scoringRulesToModaqGameFormat from './YellowFruitScoringRulesToModaq';
import { IpcBidirectional, IpcMainToRend, IpcRendToMain } from '../../IPCChannels';
import {
  IMatchSubmission,
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
  /** Result of running the submission through the shared QBJ importer */
  importResult: MatchImportResult;
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

  /** Set when starting the server fails, so the Rooms page can show why */
  lastError: string = '';

  dataChangedReactCallback: () => void;

  /** Called when a match is accepted, so TournamentManager can mark the file dirty and recompile */
  onMatchAccepted: (result: MatchImportResult) => void;

  private tournament: Tournament;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
    this.dataChangedReactCallback = () => {};
    this.onMatchAccepted = () => {};
  }

  setTournament(tournament: Tournament) {
    this.tournament = tournament;
    if (this.status.running) this.pushTournamentSnapshot();
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

    return {
      name: this.tournament.name || 'Untitled tournament',
      rounds: rounds.sort((a, b) => a.number - b.number),
      teams: teams.sort((a, b) => a.name.localeCompare(b.name)),
      gameFormat: formatResult.ok ? formatResult.gameFormat : null,
      gameFormatErrors: formatResult.ok ? [] : formatResult.errors,
      gameFormatWarnings: formatResult.ok ? formatResult.warnings : [],
      timedRounds: this.tournament.scoringRules.timed,
    };
  }

  /** Send the current tournament projection to the main process so the server can serve it */
  pushTournamentSnapshot() {
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
        importResult,
      },
      ...this.inbox.filter((item) => item.sessionId !== submission.sessionId),
    ];
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

    // Mirror MatchImportResultsManager.finishImport exactly, so a remote match is indistinguishable
    // from a manually imported one.
    if (status === ImportResultStatus.ErrNonFatal) match.statsValidity = StatsValidity.omit;
    match.importedFile = importResult.filePath;
    Tournament.validateHaveTeamsPlayedInRound(match, round, phase, false);
    round.addMatch(match);

    this.inbox = this.inbox.filter((i) => i.sessionId !== sessionId);
    this.sendVerdict({ sessionId, accepted: true });
    this.onMatchAccepted(importResult);
    this.dataChangedReactCallback();
    return true;
  }

  /** Reject a submission. The room is told, and may correct and resubmit. */
  rejectSubmission(sessionId: string, reason?: string) {
    const item = this.findInboxItem(sessionId);
    if (!item) return false;

    this.inbox = this.inbox.filter((i) => i.sessionId !== sessionId);
    this.sendVerdict({ sessionId, accepted: false, reason });
    this.dataChangedReactCallback();
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  private sendVerdict(verdict: ISubmissionVerdict) {
    window.electron.ipcRenderer.sendMessage(IpcRendToMain.TournamentServerSubmissionVerdict, verdict);
  }

  /** Drop everything, e.g. when a different tournament file is opened */
  reset() {
    this.inbox = [];
    this.sessions = [];
  }
}

export const TournamentServerContext = createContext<TournamentServerService | null>(null);
