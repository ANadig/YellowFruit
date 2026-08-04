import dayjs from 'dayjs';
import Tournament from '../DataModel/Tournament';
import { IIndeterminateQbj, IQbjWholeFile, IRefTargetDict } from '../DataModel/Interfaces';
import { IModaqMatch, IQbjMatch } from '../DataModel/Match';
import { Phase } from '../DataModel/Phase';
import { Round } from '../DataModel/Round';
import MatchImportResult from '../DataModel/MatchImportResult';
import FileParser from '../DataModel/FileParsing';
import { collectRefTargets } from '../DataModel/QbjUtils2';
import { qbjFileValidVersion } from '../DataModel/QbjUtils';
import { snakeCaseToCamelCase } from '../DataModel/CaseConversion';

/** One unit of QBJ text to import, plus a label describing where it came from */
export interface IMatchImportSource {
  /**
   * Where this QBJ came from. For file imports this is the file path; for matches submitted over
   * the network it's a synthetic label identifying the room/session. It ends up on
   * `Match.importedFile`, so it should be meaningful to a statskeeper.
   */
  filePath: string;
  fileContents: string;
}

/** Outcome of trying to import a batch of QBJ sources */
export interface IMatchImportBatch {
  results: MatchImportResult[];
  /**
   * True if any source didn't contain valid JSON. The manual import workflow aborts the whole
   * batch in that case, matching the behavior YellowFruit has always had.
   */
  hadInvalidJson: boolean;
}

/** Message shown when a file/payload isn't parseable as JSON at all */
export const invalidJsonMessage = 'This file does not contain valid JSON.';

/**
 * Parses and validates QBJ Match objects against a tournament, producing MatchImportResults.
 *
 * This deliberately does not insert anything into the tournament. Callers get back
 * MatchImportResult objects and it's up to them (ultimately, the user) to decide whether a match
 * should actually be added to a Round. Both the manual file-import workflow and matches submitted
 * over the local tournament server go through this class, so they validate identically.
 */
export default class MatchImportService {
  private tournament: Tournament;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
  }

  /** Fields whose values should be revived as Dates rather than strings */
  static isNameOfDateField(key: string) {
    return (
      key === 'startDate' || key === 'endDate' || key === 'start_date' || key === 'end_date' || key === 'savedAtTime'
    );
  }

  /**
   * Parse JSON text using YellowFruit's date-field handling.
   * @returns the parsed object, or null if the text isn't valid JSON
   */
  static parseJson(fileContents: string): object | null {
    try {
      return JSON.parse(fileContents, (key, value) => {
        if (MatchImportService.isNameOfDateField(key)) return dayjs(value).toDate(); // must be ISO 8601 format
        return value;
      });
    } catch (err: any) {
      return null;
    }
  }

  /**
   * Parse QBJ (or MODAQ-flavored QBJ) sources and validate their matches against the tournament.
   * @param sources The QBJ payloads we're trying to parse
   * @param round Which round the matches should go into. If not passed, use the payloads to
   * determine the correct rounds.
   */
  importMatches(sources: IMatchImportSource[], round?: Round): IMatchImportBatch {
    if (sources.length === 0) return { results: [], hadInvalidJson: false };

    const phase = round ? this.tournament.findPhaseByRound(round) : undefined;

    let results: MatchImportResult[] = [];
    for (const oneSource of sources) {
      const { filePath, fileContents } = oneSource;
      const objFromFile = MatchImportService.parseJson(fileContents);
      if (!objFromFile) {
        // Historically YellowFruit abandons the entire import when a file isn't valid JSON, rather
        // than importing the rest of the batch. Preserve that.
        return { results: [], hadInvalidJson: true };
      }

      snakeCaseToCamelCase(objFromFile);

      if ((objFromFile as IQbjWholeFile).objects) {
        results = results.concat(this.importMatchesFromWholeQbj(objFromFile as IQbjWholeFile, filePath, phase, round));
      } else {
        const oneResult = this.importSingleMatchFile(objFromFile as IModaqMatch, filePath, phase, round);
        results.push(oneResult);
      }
    }

    MatchImportResult.validateImportSetForTeamDups(results);
    this.tournament.setMatchIdCounter();
    return { results, hadInvalidJson: false };
  }

  /**
   * Import a payload that is a bare Match object rather than a whole qbj file, e.g. a MODAQ export.
   * @param round Round to import into. If not passed, fall back to the match's MODAQ `_round`.
   */
  private importSingleMatchFile(match: IModaqMatch, filePath: string, phase?: Phase, round?: Round): MatchImportResult {
    const oneResult = new MatchImportResult(filePath);
    const roundToUse = round ?? this.tournament.getRoundObjByNumber(match._round);
    if (!roundToUse) {
      oneResult.markFatal("Couldn't determine a round for the game in this file");
      return oneResult;
    }
    const phaseToUse = phase ?? this.tournament.findPhaseByRound(roundToUse);
    if (!phaseToUse) {
      // just ignore this match; this isn't plausible and I don't know how I would explain it to a user
      return oneResult;
    }
    this.importSingleMatchObj(match as IQbjMatch, phaseToUse, roundToUse, oneResult);
    return oneResult;
  }

  /**
   * Import multiple matches from an arbitrary QBJ file
   * @param fileObj top-level file JSON object
   * @param filePath file that we're importing
   * @param phase phase we're importing matches into
   * @param round round we're importing matches into
   */
  private importMatchesFromWholeQbj(
    fileObj: IQbjWholeFile,
    filePath: string,
    phase?: Phase,
    round?: Round,
  ): MatchImportResult[] {
    const objectList = fileObj.objects;
    const importResults: MatchImportResult[] = [];
    const wholeFileFailureResult = new MatchImportResult(filePath);
    if (!qbjFileValidVersion(fileObj as IQbjWholeFile)) {
      wholeFileFailureResult.markFatal("This file doesn't use a supported version of the tournament schema.");
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    let refTargets: IRefTargetDict = {};
    try {
      refTargets = collectRefTargets(objectList);
    } catch (err: any) {
      wholeFileFailureResult.markFatal(err.message);
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    const matchesWithRoundNums = FileParser.findMatches(objectList);
    if (matchesWithRoundNums.length === 0) {
      wholeFileFailureResult.markFatal(`The file ${filePath} contains no Match objects.`);
      importResults.push(wholeFileFailureResult);
      return importResults;
    }

    const parser = new FileParser(refTargets, this.tournament, phase);
    parser.buildTypesByIdArrays(objectList);
    for (const matchAndRound of matchesWithRoundNums) {
      const singleResult = new MatchImportResult(filePath);
      const roundToUse = round ?? this.tournament.getRoundObjByNumber(Number.parseInt(matchAndRound.roundName, 10));
      if (roundToUse === undefined) {
        singleResult.markFatal(`Couldn't find a round in this tournament matching "${matchAndRound.roundName}"`);
        continue;
      }
      const phaseToUse = phase ?? this.tournament.findPhaseByRound(roundToUse);
      if (phaseToUse === undefined) {
        continue; // just ignore this match; this isn't plausible and I don't know how I would explain it to a user
      }
      this.importSingleMatchObj(matchAndRound.match, phaseToUse, roundToUse, singleResult, parser);
      importResults.push(singleResult);
    }
    return importResults;
  }

  /** Import a match based only on a single QBJ Match object and nothing else */
  private importSingleMatchObj(
    match: IQbjMatch,
    phase: Phase,
    round: Round,
    importResult: MatchImportResult,
    existingParser?: FileParser,
  ) {
    importResult.phase = phase;
    importResult.round = round;
    const parser = existingParser ?? new FileParser({}, this.tournament);
    parser.importPhase = phase;
    let yfMatch;
    try {
      yfMatch = parser.parseMatch(match as IIndeterminateQbj);
    } catch (err: any) {
      importResult.markFatal(err.message);
      return;
    }
    if (yfMatch) {
      Tournament.validateHaveTeamsPlayedInRound(yfMatch, round, phase, false);
      importResult.evaluateMatch(yfMatch);
    }
  }
}
