/***********************************************************
QbjUtils.ts
Andrew Nadig

Functions for parsing QBJ files
***********************************************************/

import StatUtils = require('./StatUtils');
import { TournamentSettings, PowerRule, YfTeam, YfGame } from './YfTypes';
const MAX_PLAYERS_PER_TEAM = 50;
const MAX_ALLOWED_TEAMS = 200;
const MAX_ALLOWED_GAMES = 900;

/**
 * Neg5's implementation of the ScoringRules object
 */
interface N5QbjScoringRules {
  id?: string;
  name?: string;
  teams_per_match?: number;
  maximum_players_per_team?: number;
  maximum_bonus_score?: number;
  bonuses_bounce_back?: boolean;
  answer_types?: QbjAnswerType[];
  bonus_divisor?: number;
}

/**
 * Parse the scoring_rules object from a qbj file. Returns the rules in YF format,
 * plus any errors
 * @param  rules Qbj ScoringRules object
 * @return       tuple of YF tournament settings and list of errors
 */
export function parseQbjRules(rules: N5QbjScoringRules): [TournamentSettings, string[]] {
  let yfRules: TournamentSettings = {
    powers: PowerRule.None,
    negs: false,
    bonuses: false,
    bonusesBounce: false,
    playersPerTeam: 4,
    lightning: false,
    defaultPhases: [],
    rptConfig: ''
  }
  yfRules.playersPerTeam = rules.maximum_players_per_team;
  let errors = [];
  // miscellaneous weird things that we don't support
  if(rules.teams_per_match != 2) {
    errors.push(rules.teams_per_match + ' teams per match');
  }
  if(rules.maximum_players_per_team > MAX_PLAYERS_PER_TEAM) {
    errors.push('Maximum of ' + rules.maximum_players_per_team + ' players per team is not supported');
  }
  if(rules.maximum_bonus_score != 30) {
    errors.push('Maximum bonus score of ' + rules.maximum_bonus_score + ' is not supported');
  }
  if(rules.bonus_divisor != 10) {
    errors.push('Bonus divisor of ' + rules.bonus_divisor + ' is not supported');
  }
  // tournament must have 10 points tossups, plus at most one of 15- or 20-point powers,
  // optional -5 negs, and no other point values
  const answerTypes = rules.answer_types;
  let tensExist = false, tensBonus = false, powersBonus = false;
  for(let a of answerTypes) {
    switch (a.value) {
      case 10:
        tensExist = true;
        if(a.awards_bonus) { tensBonus = true; }
        break;
      case 15:
        if(yfRules.powers != PowerRule.None) {
          errors.push('Multiple point values greater than 10 are not supported');
        }
        else {
          yfRules.powers = PowerRule.Fifteen;
          if(a.awards_bonus) { powersBonus = true; }
        }
        break;
      case 20:
        if(yfRules.powers != 'none') {
          errors.push('Multiple point values greater than 10 are not supported');
        }
        else {
          yfRules.powers = PowerRule.Twenty;
          if(a.awards_bonus) { powersBonus = true; }
        }
        break;
      case -5:
        if(a.awards_bonus) { errors.push('Negs with bonuses are not supported'); }
        yfRules.negs = true;
        break;
      default:
        errors.push(a.value + ' point questions are not supported');
    }
  }
  if(!tensExist) { errors.push('10-point tossups are required'); }
  if(yfRules.powers != 'none' && (tensBonus !== powersBonus)) {
    errors.push('Both or neither of tens and powers must have bonuses');
  }
  if(tensBonus) { yfRules.bonuses = true; }
  if(yfRules.bonuses && rules.bonuses_bounce_back) { yfRules.bonusesBounce = true; }
  return [yfRules, errors];
}

/**
 * Load teams from a QBJ file
 * @param  tournament    QBJ tournament object from Neg5
 * @param  registrations array of QBJ registration objects from Neg5
 * @return               tuple: list of YF teams, a list of teams indexed by their ID in
 *                       the QBJ file, and a list of errors
 */
export function parseQbjTeams(tournament: any, registrations: any): [YfTeam[], any, string[]] {
  var yfTeams = [], yfTeamIds = {}, errors = [];
  var teamCount = 0;
  for(let i in tournament.registrations) {
    let regObj = registrations.find((r :any) => { return refCheck(tournament.registrations[i], r); });
    if(regObj == undefined) { continue; }
    for(let j in regObj.teams) {
      if(teamCount++ > MAX_ALLOWED_TEAMS) {
        errors.push('You may not load more than ' + MAX_ALLOWED_TEAMS + ' teams');
        break;
      }
      let teamObj = regObj.teams[j];
      let teamName = teamObj.name;
      if(teamName.length > 100) {
        errors.push('Team name is too long: ' + teamName);
        continue;
      }
      let roster = {}, rosterWithIds = {}, rosterError = false;
      for(var k in teamObj.players) {
        let p = teamObj.players[k];
        if(+k > MAX_PLAYERS_PER_TEAM) {
          errors.push(teamName + ' has more than' + MAX_PLAYERS_PER_TEAM + 'players');
          rosterError = true;
          break;
        }
        if(p.name.length > 100) {
          errors.push(teamName + ': Player name is too long (' + p.name + ')');
          rosterError = true;
          break;
        }
        roster[p.name] = { year: '', div2: false, undergrad: false };
        rosterWithIds[p.id] = p.name;
      }
      if(rosterError) { continue; }
      yfTeams.push({
        teamName: teamName,
        roster: roster,
        divisions: {},
        teamUGStatus: false,
        teamD2Status: false,
        smallSchool: false,
        jrVarsity: false
      });
      yfTeamIds[teamObj.id] = { teamName: teamObj.name, roster: rosterWithIds };
    }
  }
  return [yfTeams, yfTeamIds, errors];
}

/**
 * Load games from a QBJ file
 * @param  rounds  list of Round objects from the Neg5 QBJ file
 * @param  matches list of Match objects from the Neg5 QBJ fiile
 * @param  teamIds teams indexed by their QBJ file team ID (returned by parseQbjTeams)
 * @return         tuple: list of games, and list of errors
 */
export function parseQbjMatches(rounds: any, matches: any, teamIds: any): [YfGame[], string[]] {
  let yfGames = [], errors = [];
  let tmRdIdx = {}; // keep track of how many matches each team played in each round
  let gameCount = 0;
  for(let r of rounds) {
    let roundNo = r.name.replace('Round ', '');
    tmRdIdx[roundNo] = {};
    let oneRoundsMatches = r.matches;
    for(var j in oneRoundsMatches) {
      let matchObj = matches.find((m:any) => { return refCheck(oneRoundsMatches[j], m); });
      if(matchObj == undefined) { continue; }
      if(gameCount++ > MAX_ALLOWED_GAMES) {
        errors.push('You may not load more than ' + MAX_ALLOWED_GAMES + ' games');
        break;
      }
      let team1Obj = matchObj.match_teams[0], team2Obj = matchObj.match_teams[1];
      let team1Id = team1Obj.team.$ref, team2Id = team2Obj.team.$ref;
      let players1Obj = team1Obj.match_players, players2Obj = team2Obj.match_players;
      let yfPlayers1 = {}, yfPlayers2 = {};
      for(let p of players1Obj) {
        let answers = p.answer_counts;
        let powers = '', tens = '', negs = '';
        for(let a of answers) {
          if(a.answer_type == undefined) { continue; }
          if(a.answer_type.value == 15 && a.number != undefined) { powers = a.number; }
          else if(a.answer_type.value == 10 && a.number != undefined) { tens = a.number; }
          else if(a.answer_type.value == -5 && a.number != undefined) { negs = a.number; }
          else { errors.push('Unsupported answer type'); }
        }
        yfPlayers1[teamIds[team1Id].roster[p.player.$ref]] = {
          tuh: p.tossups_heard != undefined ? p.tossups_heard : 20, //assume 20 if not specified
          powers: powers,
          tens: tens,
          negs: negs
        };
      }
      for(let p of players2Obj) {
        let answers = p.answer_counts;
        let powers = '', tens = '', negs = '';
        for(let a of answers) {
          if(a.answer_type == undefined) { continue; }
          if(a.answer_type.value == 15 && a.number != undefined) { powers = a.number; }
          else if(a.answer_type.value == 10 && a.number != undefined) { tens = a.number; }
          else if(a.answer_type.value == -5 && a.number != undefined) { negs = a.number; }
          else { errors.push('Unsupported answer type'); }
        }
        yfPlayers2[teamIds[team2Id].roster[p.player.$ref]] = {
          tuh: p.tossups_heard != undefined ? p.tossups_heard : '',
          powers: powers,
          tens: tens,
          negs: negs
        };
      }
      let team1Name = teamIds[team1Id].teamName, team2Name = teamIds[team2Id].teamName;
      if(tmRdIdx[roundNo][team1Name] == undefined) {
        tmRdIdx[roundNo][team1Name] = 0;
      }
      if(tmRdIdx[roundNo][team2Name] == undefined) {
        tmRdIdx[roundNo][team2Name] = 0;
      }
      tmRdIdx[roundNo][team1Name]++;
      tmRdIdx[roundNo][team2Name]++;

      yfGames.push({
        round: roundNo,
        phases: [],
        tuhtot: matchObj.tossups_read,
        ottu: matchObj.overtime_tossups_read != undefined ? matchObj.overtime_tossups_read : 0 ,
        forfeit: false, // apparently you can't enter forfeits in Neg5?
        tiebreaker: false, // will be handled in addTiebreakers
        team1: teamIds[team1Id].teamName,
        team2: teamIds[team2Id].teamName,
        score1: team1Obj.points,
        score2: team2Obj.points,
        players1: yfPlayers1,
        players2: yfPlayers2,
        otPwr1: 0,
        otTen1: 0, // Neg5 doesn't seem to export info about which team got OT tossups
        otNeg1: 0,
        otPwr2: 0,
        otTen2: 0,
        otNeg2: 0,
        bbPts1: team1Obj.bonus_bounceback_points != undefined ? team1Obj.bonus_bounceback_points : 0,
        bbPts2: team2Obj.bonus_bounceback_points != undefined ? team2Obj.bonus_bounceback_points : 0,
        lightningPts1: 0, lightningPts2: 0,
        notes: matchObj.notes != undefined ? matchObj.notes : ''
      });
    }
  }
  addTiebreakers(yfGames, tmRdIdx);
  return [yfGames, errors];
}

/**
 * Check whether the $ref pointer in ref points to obj
 * @param  ref Reference we need to look up
 * @param  obj Object that the $ref might point to
 * @return     whether they match
 */
function refCheck(ref: QbjRef, obj: any) {
  return ref.$ref == obj.id;
}

/**
 * Validate games imported from a QBJ file
 * @param  games    list of games
 * @param  settings settings object
 * @return          a list of errors and a list of warnings
 */
export function validateMatches(games: YfGame[], settings: TournamentSettings): [string[], string[]] {
  let errors = [], warnings = [];
  let matchups = [];
  for(let g of games) {
    let round = g.round, team1 = g.team1, team2 = g.team2;
    let gameString = `Round ${round}: ${team1} vs. ${team2}`;
    /******************** ERRORS ******************************/
    if(team1 == team2) {
      errors.push(gameString + ' - A team cannot play itself');
      continue;
    }
    //teams can't play each other twice in the same round
    if(matchups[round] == undefined) { matchups[round] = {}; }
    if(matchups[round][team1] == undefined) {
      matchups[round][team1] = [team2];
    }
    else if(matchups[round][team1].includes(team2)) {
      errors.push(gameString + ' - These teams have already played each other in this round');
      continue;
    }
    else {
      matchups[round][team1].push(team2);
    }
    if(matchups[round][team2] == undefined) {
      matchups[round][team2] = [team1];
    }
    else if(matchups[round][team2].includes(team1)) {
      errors.push(gameString + ' - These teams have already played each other in this round');
      continue;
    }
    else {
      matchups[round][team2].push(team1);
    }
    //scores are required
    if(isNaN(g.score1)) {
      errors.push(gameString + ' - Score is invalid');
      continue;
    }
    if(isNaN(g.score2)) {
      errors.push(gameString + ' - Score is invalid');
      continue;
    }
    // validate tossups heard
    let tuhtot = g.tuhtot, tuhError = false, team1Tuh = 0, team2Tuh = 0;
    for(var p in g.players1) {
      let tuh = StatUtils.toNum(g.players1[p].tuh);
      team1Tuh += tuh;
      if(tuh > tuhtot) {
        errors.push(gameString + ' - One or more players have heard more tossups than were read');
        tuhError = true;
      }
    }
    if(tuhError) { continue; }
    for(var p in g.players2) {
      let tuh = StatUtils.toNum(g.players2[p].tuh);
      team2Tuh += tuh;
      if(tuh > tuhtot) {
        errors.push(gameString + ' - One or more players have heard more tossups than were read');
        tuhError = true;
      }
    }
    if(tuhError) { continue; }
    if(team1Tuh > tuhtot * settings.playersPerTeam || team2Tuh > tuhtot * settings.playersPerTeam) {
      errors.push(gameString + ' - Players have combined to hear more tossups than is allowed');
      continue;
    }
    if(team1Tuh == 0 || team2Tuh == 0) {
      errors.push(gameString + ' - Players on one team have not heard any tossups');
      continue;
    }
    // all points must be accounted for if it's tossup-only
    if(!settings.bonuses &&
      (StatUtils.bonusPoints(g, 1, settings) > 0 ||
      StatUtils.bonusPoints(g, 2, settings) > 0)) {
        errors.push(gameString + ' - Tossup points and total score do not match');
    }
    // validate ppb
    let bHeard1 = StatUtils.bonusesHeard(g, 1), bHeard2 = StatUtils.bonusesHeard(g, 2);
    let bPts1 = StatUtils.bonusPoints(g, 1, settings), bPts2 = StatUtils.bonusPoints(g, 2, settings);
    if(bPts1 < 0 || bPts2 < 0) {
      errors.push(gameString + ' - Bonus points are negative');
      continue;
    }
    if((bHeard1 > 0 && (bPts1 / bHeard1 > 30)) || (bHeard2 > 0 && (bPts2 / bHeard2 > 30))) {
      errors.push(gameString + ' - PPB is greater than 30');
      continue;
    }
    // can't hear more bonuses than there are tossups
    if(bHeard1 + bHeard2 > tuhtot) {
      errors.push(gameString + ' - Total tossups converted by both teams exceeds total tossups heard for the game');
      continue;
    }
    // validate ppBb
    if(settings.bonusesBounce) {
      let bbHeard1 = StatUtils.bbHeard(g, 1, settings), bbHeard2 = StatUtils.bbHeard(g, 1, settings);
      let bbhfloat1 = StatUtils.bbHrdToFloat(bbHeard1)
      let bbhfloat2 = StatUtils.bbHrdToFloat(bbHeard2);
      if(g.bbPts1 / bbhfloat1 > 30 || (g.bbPts1 > 0 && bbhfloat1 == 0)) {
        errors.push(gameString + ' - Points per bounceback is greater than 30');
        continue;
      }
      if(g.bbPts2 / bbhfloat2 > 30 || (g.bbPts2 > 0 && bbhfloat2 == 0)) {
        errors.push(gameString + ' - Points per bounceback is greater than 30');
        continue;
      }
    }
    /*********************** WARNINGS ***********************/
    if(bPts1 % 10 != 0 || bPts2 % 10 != 0) {
      warnings.push(gameString + ' - PPB is not divisible by 10');
    }
    let divisor = settings.powers == PowerRule.Fifteen || settings.negs ? 5 : 10;
    if(g.score1 % divisor != 0 || g.score2 % divisor != 0) {
      warnings.push(gameString + ' - Score is not divisible by ' + divisor);
    }
    if(g.tiebreaker) {
      warnings.push(gameString + ' - This game was assumed to be a tiebreaker');
    }
  }// loop over all games
  return [errors, warnings];
}

/**
 * Any time a team plays two games in the same round, assume that they're tiebreakers
 * @param yfGames list of games
 * @param tmRdIdx list of round. Each round has key of team name and value of number of
 *  games the team played in that round
 */
function addTiebreakers(yfGames: YfGame[], tmRdIdx: any): void {
  for(let round in tmRdIdx) {
    let oneRound = tmRdIdx[round];
    for(let t in oneRound) {
      if(oneRound[t] > 1) {
        for(let g of yfGames) {
          if(g.round == +round && (g.team1 == t || g.team2 == t)) {
            g.tiebreaker = true;
          }
        }
      }
    }
  }
}
