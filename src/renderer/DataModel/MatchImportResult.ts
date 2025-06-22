import { Match } from './Match';
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
    const warnings = m.getWarningMessages();
    if (warnings.length > 0) {
      this.status = ImportResultStatus.Warning;
      this.messages = warnings;
      this.proceedWithImport = true;
      return;
    }
    this.status = ImportResultStatus.Success;
    this.proceedWithImport = true;
  }

  markFatal(msg: string) {
    this.status = ImportResultStatus.FatalErr;
    this.messages = [msg];
  }

  /**
   * Determine whether the user is trying to import multiple matches for the same team (for the same round)
   */
  static validateImportSetForTeamDups(results: MatchImportResult[]) {
    const teamsFound: Team[] = [];
    for (const rslt of results) {
      const { match } = rslt;
      if (!match) continue;

      const leftTeam = match.leftTeam.team;
      const rightTeam = match.rightTeam.team;
      const leftDup = leftTeam && teamsFound.includes(leftTeam);
      const rightDup = rightTeam && teamsFound.includes(rightTeam);
      let msg = '';
      if (leftDup) msg += `You are importing multiple games for ${leftTeam.name} into this round.`;
      if (rightDup) msg += `You are importing multiple games for ${rightTeam.name} into this round.`;
      if (leftDup || rightDup) {
        rslt.messages.push(msg);
        if (rslt.status === ImportResultStatus.Success) rslt.status = ImportResultStatus.Warning;
      }
      if (leftTeam && !leftDup) teamsFound.push(leftTeam);
      if (rightTeam && !rightDup) teamsFound.push(rightTeam);
    }
  }
}

export default MatchImportResult;
