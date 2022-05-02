/**
 * SingleGameQBJImport.ts
 * Alejandro Lopez-Lago
 *
 * Import logic for QBJ files produced by MODAQ
 * QBJ: https://schema.quizbowl.technology/
 * MODAQ: https://github.com/alopezlago/MODAQ/
 */

import StringSimilarity = require('string-similarity-js');
import {  YfTeam, YfGame, TeamGameLine } from './YfTypes';

// Confidence threshold for string matching; if it's not past 50%, reject the match
const confidenceThreshold = 0.5;

// How many n-grams to look at. Team names can be pretty short, so by the documentation from
// https://www.npmjs.com/package/string-similarity-js we'll go with 1 as the substring length.
const similaritySubstringLength = 1;

export type Result<T> = { success: true, result: T} | {success: false, error: string };

export function importGame(teams: YfTeam[], qbjString: string): Result<YfGame> {
    const qbj: IMatch = JSON.parse(qbjString);

    if (qbj.match_teams == undefined || qbj.match_teams.length !== 2) {
        return createFailure("QBJ file doesn't have two teams specified");
    }

    const firstTeamResult: Result<YfTeam> = getYfTeam(teams, qbj.match_teams[0].team.name);
    if (firstTeamResult.success === false) {
        return createFailure(firstTeamResult.error);
    }

    const secondTeamResult: Result<YfTeam> = getYfTeam(teams, qbj.match_teams[1].team.name);
    if (secondTeamResult.success === false) {
        return createFailure(secondTeamResult.error);
    }

    const tuhtot: number = getTuhtot(qbj.tossups_read);
    const bbPts1: number = qbj.match_teams[0].bonus_bounceback_points ?? 0;
    const bbPts2: number = qbj.match_teams[1].bonus_bounceback_points ?? 0;

    const playerLine1Result = getPlayerLines(firstTeamResult.result, qbj.match_teams[0].match_players);
    if (playerLine1Result.success === false) {
        return createFailure(playerLine1Result.error);
    }

    const playerLine2Result = getPlayerLines(secondTeamResult.result, qbj.match_teams[1].match_players);
    if (playerLine2Result.success === false) {
        return createFailure(playerLine2Result.error);
    }

    const score1: number = getScore(qbj.match_teams[0]);
    const score2: number = getScore(qbj.match_teams[1]);

    const ottu: number = getOttu(qbj.overtime_tossups_read);
    const tiebreaker: boolean = qbj.tiebreaker === true;
    

    // Potential issue: ottu, ot etc are unknown, since the format isn't included in the game format
    const game: YfGame = {
        bbPts1,
        bbPts2,
        forfeit: false,
        invalid: false,
        lightningPts1: 0,
        lightningPts2: 0,
        notes: qbj.notes,
        otNeg1: 0,
        otNeg2: 0,
        otPwr1: 0,
        otPwr2: 0,
        otTen1: 0,
        otTen2: 0,
        ottu,
        phases: [],
        players1: playerLine1Result.result,
        players2: playerLine2Result.result,
        round: 0,
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
        } else if (line[playerNameResult.playerName] != undefined) {
            return createFailure(`Duplicate player '${playerNameResult.playerName}' on team '${team.teamName}'. Was looking for a player named '${matchPlayerName}'`);
        }

        let negs = 0;
        let powers = 0;
        let tens = 0;
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
            tuh: matchPlayer.tossups_heard
        };
    }

    return createSuccess(line);
}

function getScore(team: IMatchTeam): number {
    return team.bonus_points +
    (team.bonus_bounceback_points ?? 0) +
    team.match_players.reduce((teamTotal, player) => teamTotal + player.answer_counts.reduce(
        (playerTotal, answers) => playerTotal + (answers.number * answers.answer.value), 0),
        0);
}

type LikeliestPlayer = { playerName: string, confidence: number };
type LikeliestTeam = { team: YfTeam, confidence: number};

// Taken from https://github.com/alopezlago/MODAQ/blob/master/src/qbj/QBJ.ts
interface IMatch {
    tossups_read: number;
    overtime_tossups_read?: number; //(leave empty for now, until formats are more integrated)
    match_teams: IMatchTeam[];
    match_questions: IMatchQuestion[];
    notes?: string; // For storing protest info and thrown out Qs
    packets?: string; // The name of the packet
    tiebreaker?: boolean; // whether this was a tiebreaker
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
    bonus_points: number;
    bonus_bounceback_points?: number;
    match_players: IMatchPlayer[];
    lineups: ILineup[]; // Lineups seen. New entries happen when there are changes in the lineup
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
