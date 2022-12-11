/**
 * SingleGameQBJImport.ts
 * Alejandro Lopez-Lago
 *
 * Import logic for QBJ files produced by MODAQ
 * QBJ: https://schema.quizbowl.technology/
 * MODAQ: https://github.com/alopezlago/MODAQ/
 */

import StringSimilarity = require('string-similarity-js');
import {  YfTeam, YfGame, TeamGameLine, TournamentSettings } from './YfTypes';

// Confidence threshold for string matching; if it's not past 50%, reject the match
const confidenceThreshold = 0.8;

// How many n-grams to look at. Team names can be pretty short, so by the documentation from
// https://www.npmjs.com/package/string-similarity-js we'll go with 1 as the substring length.
const similaritySubstringLength = 1;

export type Result<T> = { success: true, result: T} | {success: false, error: string };

export function importGame(teams: YfTeam[], qbjString: string, settings: TournamentSettings): Result<YfGame> {
    const qbj: IMatch = JSON.parse(qbjString);

    if (qbj.match_teams == undefined || qbj.match_teams.length !== 2) {
        return createFailure("QBJ file doesn't have two teams specified");
    }

    // qbj allows double forfeits but we don't
    if(qbj.match_teams[0].forfeit_loss && qbj.match_teams[1].forfeit_loss) {
      return createFailure('YellowFruit does not support games where both teams forfeit.');
    }
    if(qbj.match_teams[0].forfeit_loss) {
      // switch the teams around because the first team is always the winner of a forfeit in YF.
      const tempMatchTeam = qbj.match_teams[1];
      qbj.match_teams[1] = qbj.match_teams[0];
      qbj.match_teams[0] = tempMatchTeam;
    }

    const firstTeamResult: Result<YfTeam> = getYfTeam(teams, qbj.match_teams[0].team.name);
    if (firstTeamResult.success === false) {
        return createFailure(firstTeamResult.error);
    }

    const secondTeamResult: Result<YfTeam> = getYfTeam(teams, qbj.match_teams[1].team.name);
    if (secondTeamResult.success === false) {
        return createFailure(secondTeamResult.error);
    }

    const tiebreaker: boolean = qbj.tiebreaker === true;

    if(qbj.match_teams[1].forfeit_loss) {
      return createForfeit(firstTeamResult.result.teamName, secondTeamResult.result.teamName,
        tiebreaker, qbj.notes);
    }

    const round: number = getRoundNumber(qbj._round);
    const tuhtot: number = getTuhtot(qbj.tossups_read);
    const bbPts1: number = getBounceBackPoints(qbj.match_teams[0], settings);
    const bbPts2: number = getBounceBackPoints(qbj.match_teams[1], settings);

    const playerLine1Result = getPlayerLines(firstTeamResult.result, qbj.match_teams[0].match_players);
    if (playerLine1Result.success === false) {
        return createFailure(playerLine1Result.error);
    }

    const playerLine2Result = getPlayerLines(secondTeamResult.result, qbj.match_teams[1].match_players);
    if (playerLine2Result.success === false) {
        return createFailure(playerLine2Result.error);
    }

    const score1: number = getScore(qbj.match_teams[0], settings);
    const score2: number = getScore(qbj.match_teams[1], settings);

    const ottu: number = getOttu(qbj.overtime_tossups_read);
    const otTen1: number = getOtTen(qbj.match_teams[0], settings);
    const otTen2: number = getOtTen(qbj.match_teams[1], settings);

    const lightningPts1 = getLightningPoints(qbj.match_teams[0], settings);
    const lightningPts2 = getLightningPoints(qbj.match_teams[1], settings);

    const game: YfGame = {
        bbPts1,
        bbPts2,
        forfeit: false,
        lightningPts1,
        lightningPts2,
        notes: qbj.notes ?? '',
        otNeg1: 0,
        otNeg2: 0,
        otPwr1: 0,
        otPwr2: 0,
        otTen1,
        otTen2,
        ottu,
        phases: [],
        players1: playerLine1Result.result,
        players2: playerLine2Result.result,
        round,
        score1,
        score2,
        team1: firstTeamResult.result.teamName,
        team2: secondTeamResult.result.teamName,
        tiebreaker,
        tuhtot,
        validationMsg: ''
    };
    return createSuccess(game);
}

function createFailure<T>(error: string): Result<T> {
    return {
        success: false,
        error
    };
}

function createSuccess<T>(value: T): Result<T> {
    return {
        success: true,
        result: value
    };
}

function createForfeit(team1: string, team2: string, tiebreaker: boolean, notes: string) : Result<YfGame> {
  const game : YfGame = {
    bbPts1: 0,
    bbPts2: 0,
    forfeit: true,
    invalid: false,
    lightningPts1: 0,
    lightningPts2: 0,
    notes: notes ?? '',
    otNeg1: 0,
    otNeg2: 0,
    otPwr1: 0,
    otPwr2: 0,
    otTen1: 0,
    otTen2: 0,
    ottu: 0,
    phases: [],
    players1: null,
    players2: null,
    round: 0,
    score1: 0,
    score2: 0,
    team1: team1,
    team2: team2,
    tiebreaker: tiebreaker,
    tuhtot: 0,
    validationMsg: ''
  }
  return createSuccess(game);
}

function getRoundNumber(round: number) : number {
    if(round === undefined || isNaN(round)) {
        return -1;
    }
    return round;
}

function getTuhtot(tossups_read: number) : number {
  if(tossups_read === undefined || isNaN(tossups_read)) {
    return null;
  }
  return tossups_read;
}

function getOttu(overtime_tossups_read: number) : number {
  if(overtime_tossups_read === undefined || isNaN(overtime_tossups_read)) {
    return 0;
  }
  return overtime_tossups_read;
}

function getBounceBackPoints(matchTeam: IMatchTeam, settings: TournamentSettings) {
  if(!settings.bonusesBounce) { return 0; }
  return matchTeam.bonus_bounceback_points ?? 0;
}

function getOtTen(matchTeam: IMatchTeam, settings: TournamentSettings) {
  // this only works if powers don't exist
  if(settings.powers != 'none') { return 0; }
  return matchTeam.correct_tossups_without_bonuses ?? 0;
}

function getLightningPoints(matchTeam: IMatchTeam, settings: TournamentSettings) {
  if(!settings.lightning) { return 0; }
  return (matchTeam.lightning_points ?? 0) + (matchTeam.lightning_bounceback_points ?? 0);
}

function getLikeliestPlayer(playerNames: string[], candidateName: string) : LikeliestPlayer {
    let result: LikeliestPlayer = { playerName: playerNames[0], confidence: 0 };
    for (const playerName of playerNames) {
        const confidence: number = StringSimilarity.stringSimilarity(playerName, candidateName, similaritySubstringLength);
        if (confidence > result.confidence) {
            result = {
                playerName,
                confidence
            };
        }
    }

    return result;
}

function getYfTeam(teams: YfTeam[], teamName: string): Result<YfTeam> {
    let result: LikeliestTeam = { team: teams[0], confidence: 0 };
    for (const team of teams) {
        const confidence: number = StringSimilarity.stringSimilarity(team.teamName, teamName, similaritySubstringLength);
        if (confidence > result.confidence) {
            result = {
                team,
                confidence
            };
        }
    }

    if (result.confidence < confidenceThreshold) {
        return createFailure(`Couldn't find team in the QBJ file in the tournament: '${teamName}'. Closest team name found: '${result.team.teamName}'.`);
    }

    return createSuccess(result.team);
}

function getPlayerLines(team: YfTeam, matchPlayers: IMatchPlayer[]): Result<TeamGameLine> {
    const playerNames: string[] = Object.keys(team.roster);
    const line: TeamGameLine = {}
    for (const matchPlayer of matchPlayers) {
        // Doing likeliest player matches like this is O(n^2), but n should be small here (< 10)
        const matchPlayerName: string = matchPlayer.player.name;
        const playerNameResult: LikeliestPlayer = getLikeliestPlayer(playerNames, matchPlayerName);
        if (playerNameResult.confidence < confidenceThreshold) {
            return createFailure(`Couldn't find player with name '${matchPlayerName}' on team '${team.teamName}'`);
        }

        // Merge the player if they have a duplicated entry in match_players
        let negs = 0;
        let powers = 0;
        let tens = 0;
        let tuh = 0;
        if (line[playerNameResult.playerName] != undefined) {
            const existingPlayer = line[playerNameResult.playerName];
            negs = existingPlayer.negs;
            powers = existingPlayer.powers;
            tens = existingPlayer.tens;
            tuh = existingPlayer.tuh;
        }

        tuh += matchPlayer.tossups_heard;
        for (const answer of matchPlayer.answer_counts) {
            const pointValue = answer.answer.value;
            if (pointValue > 10) {
                powers += answer.number;
            } else if (pointValue === 10) {
                tens += answer.number;
            } else if (pointValue < 0) {
                negs += answer.number;
            }
        }

        // If we ever support superpower, we need to redo the logic and import the game settings
        line[playerNameResult.playerName] = {
            negs,
            powers,
            tens,
            tuh
        };
    }

    return createSuccess(line);
}

function getScore(team: IMatchTeam, settings: TournamentSettings): number {
  if(!team.match_players) {
    return team.points ?? 0;
  }
  let score = team.match_players.reduce((teamTotal, player) => teamTotal + player.answer_counts.reduce(
      (playerTotal, answers) => playerTotal + (answers.number * answers.answer.value), 0),
      0);
  if(isNaN(score)) { return 0; }

  if(settings.bonuses) {
    score += team.bonus_points ?? 0;
    score += getBounceBackPoints(team, settings);
  }
  score += getLightningPoints(team, settings);
  return score;
}

type LikeliestPlayer = { playerName: string, confidence: number };
type LikeliestTeam = { team: YfTeam, confidence: number};

// Adapted from https://github.com/alopezlago/MODAQ/blob/master/src/qbj/QBJ.ts
interface IMatch {
    tossups_read: number;
    overtime_tossups_read?: number; //(leave empty for now, until formats are more integrated)
    match_teams: IMatchTeam[];
    match_questions: IMatchQuestion[];
    /** For storing protest info and thrown out Qs */
    notes?: string;
    /** The name of the packet */
    packets?: string;
    tiebreaker?: boolean;
    /** used by MODAQ but not part of the schema */
    _round?: number;
}

interface ITeam {
    name: string;
    players: IPlayer[];
}

interface IPlayer {
    name: string;
}

interface IMatchTeam {
    team: ITeam;
    points?: number;
    bonus_points?: number;
    bonus_bounceback_points?: number;
    match_players: IMatchPlayer[];
    lineups: ILineup[]; // Lineups seen. New entries happen when there are changes in the lineup
    forfeit_loss?: boolean;
    correct_tossups_without_bonuses?: number;
    lightning_points?: number;
    lightning_bounceback_points?: number;
}

interface IMatchPlayer {
    player: IPlayer;
    tossups_heard: number;
    answer_counts: IPlayerAnswerCount[];
}

interface IPlayerAnswerCount {
    number: number;
    answer: IAnswerType;
}

interface ILineup {
    first_question: number; // Which question number this lineup heard first
    players: IPlayer[];
    // could eventually do reason if we have formats restrict when subs occur
}

interface IAnswerType {
    value: number; // # of points
    // Could include label for neg/no penalty/get/power/etc.
}

interface IMatchQuestion {
    question_number: number; // The cycle, starts at 1
    tossup_question: IQuestion;
    replacement_tossup_question?: IQuestion; // multiple replacement tossups not currently supported
    buzzes: IMatchQuestionBuzz[];
    bonus?: IMatchQuestionBonus;
    replacement_bonus?: IMatchQuestionBonus; // multiple replacements not currently supported
}

interface IQuestion {
    question_number: number; // number of question in packet
    type: "tossup" | "bonus" | "lightning";
    parts: number; // 1 for tossup, n for bonuses
}

interface IMatchQuestionBuzz {
    team: ITeam;
    player: IPlayer;
    buzz_position: IBuzzPosition;
    result: IAnswerType;
}

interface IBuzzPosition {
    word_index: number; // 0-indexed
}

interface IMatchQuestionBonus {
    question?: IQuestion;
    parts: IMatchQuestionBonusPart[];
}

interface IMatchQuestionBonusPart {
    controlled_points: number;
    bounceback_points?: number;
}
