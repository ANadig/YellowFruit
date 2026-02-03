import { Match } from './Match';
import { Phase } from './Phase';
import { Pool } from './Pool';
import { Round } from './Round';
import { Team } from './Team';

export enum ImportResultStatus {
  Success,
  /** For matches with overrideable warnings */
  Warning,
  /** For matches that aren't valid but are still parseable */
  ErrNonFatal,
  /** For things that make no sense at all, like having only one team */
  FatalErr,
}

class MatchImportResult {
  filePath: string;

  match?: Match;

  phase?: Phase;

  round?: Round;

  status: ImportResultStatus;

  messages: string[] = [];

  /** Whether the user wants to continue importing this match */
  proceedWithImport: boolean = false;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.status = ImportResultStatus.FatalErr;
  }

  /** Associate this object with the given match, then use the match to determine the status and message */
  evaluateMatch(m: Match) {
    this.match = m;
    const errors = m.getErrorMessages();
    if (errors.length > 0) {
      this.status = ImportResultStatus.ErrNonFatal;
      this.messages = errors;
      this.proceedWithImport = false;
      return;
    }
    this.proceedWithImport = true;
    this.validateSamePool();
    const warnings = m.getWarningMessages();
    if (warnings.length > 0) {
      this.status = ImportResultStatus.Warning;
      this.messages = warnings;
    } else {
      this.status = ImportResultStatus.Success;
    }
  }

  markFatal(msg: string) {
    this.status = ImportResultStatus.FatalErr;
    this.messages = [msg];
  }

  markWarning(msg?: string) {
    if (msg) this.messages.push(msg);
    if (this.status === ImportResultStatus.Success) this.status = ImportResultStatus.Warning;
  }

  /** Determine whether the match is between two teams from the same pool */
  validateSamePool() {
    if (!this.match || !this.phase) return;
    if (!this.phase.isFullPhase()) return;

    const leftTeam = this.match.leftTeam.team;
    const rightTeam = this.match.rightTeam.team;
    const leftPool = leftTeam && this.phase.findPoolWithTeam(leftTeam);
    const rightPool = rightTeam && this.phase.findPoolWithTeam(rightTeam);
    if (leftPool !== rightPool || (!leftPool && !rightPool)) {
      this.match.setSamePoolValidation(false, false);
    }
  }

  /**
   * Determine whether the user is trying to import multiple matches for the same team (for the same round)
   */
  static validateImportSetForTeamDups(results: MatchImportResult[]) {
    const sortedResults = results.slice().sort((a, b) => (a.round?.number ?? -1) - (b.round?.number ?? -1));
    let curRound: Round | undefined = undefined;
    let teamsInRound: Team[] = [];
    for (const rslt of sortedResults) {
      const { match, round } = rslt;
      if (!match || !round) continue;

      if (curRound !== round) {
        curRound = round;
        teamsInRound = [];
      }

      const leftTeam = match.leftTeam.team;
      const rightTeam = match.rightTeam.team;
      const leftDup = leftTeam && teamsInRound.includes(leftTeam);
      const rightDup = rightTeam && teamsInRound.includes(rightTeam);
      let msg = '';
      if (leftDup) msg += `You are importing multiple games for ${leftTeam.name} into this round.`;
      if (rightDup) msg += `You are importing multiple games for ${rightTeam.name} into this round.`;
      if (leftDup || rightDup) {
        rslt.markWarning(msg);
      }
      if (leftTeam && !leftDup) teamsInRound.push(leftTeam);
      if (rightTeam && !rightDup) teamsInRound.push(rightTeam);
    }
  }
}

export default MatchImportResult;
