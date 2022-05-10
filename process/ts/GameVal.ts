/***********************************************************
GameVal.ts
Andrew Nadig

Code for validating game data
***********************************************************/

import StatUtils = require('./StatUtils');
import { YfGame, GameValidation, TournamentSettings, WhichTeam, PlayerLine } from "./YfTypes";


/**
 * Whether points per bounceback is invalid (>30, or >0 with no bouncebacks heard)
 * @param  g         game object
 * @param  whichTeam team 1 or team 2
 * @return           true if ppbb is invalid
 */
function invalidPpbb(g: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): boolean {
  const bbPts = whichTeam == 1 ? g.bbPts1 : g.bbPts2;
  const bbHrd = StatUtils.bbHrdToFloat(StatUtils.bbHeard(g, whichTeam, settings));
  let ppbb = bbPts / bbHrd;
  ppbb = Math.round(ppbb*10000) / 10000; // avoid floating point weirdness
  if(ppbb > 30) { return true; }
  return isNaN(ppbb) && bbPts > 0;
}

/**
 * The greatest integer guaranteed to divide a game score evenly
 * @return number
 */
export function scoreDivisor(settings: TournamentSettings): number {
  if(settings.powers == '15pts' || settings.negs) {
    return 5;
  }
  return 10;
}

/**
 * How many points the team scored on overtime tossups.
 * @param  whichTeam team 1 or team 2
 * @return           number of points
 */
function otPoints(g: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): number {
  if(g.ottu <= 0) { return 0; }
  const otPwr = whichTeam == 1 ? g.otPwr1 : g.otPwr2;
  const otTen = whichTeam == 1 ? g.otTen1 : g.otTen2;
  const otNeg = whichTeam == 1 ? g.otNeg1 : g.otNeg2;
  return StatUtils.powerValue(settings)*otPwr + 10*otTen - 5*otNeg;
}

/**
 * Determines whether there are any issues with the game. Note that GameAddModal
 * (and possibly other callers in the future) does additional checks to what is
 * done here.
 * @param  g game object
 * @return   GameValidation object
 */
export function validateGame(g: YfGame, settings: TournamentSettings): GameValidation {
  let result: GameValidation = { isValid: false };
  let team1 = g.team1, team2 = g.team2;
  let round = g.round, tuhtot = g.tuhtot;
  let score1 = g.score1, score2 = g.score2;
  let players1 = g.players1, players2 = g.players2;
  //teams are required
  if(!team1 || !team2) {
    result.type = 'error';
    result.message = 'One or more teams is missing';
    result.suppressFromForm = true;
    return result;
  }
  // a team can't play itself
  if(team1 == team2) {
    result.type = 'error';
    result.message = team1 + ' cannot play themselves';
    return result;
  }
  //round is required
  if(round === undefined || round === null) {
    result.type = 'error';
    result.message = 'Round number is missing';
    result.suppressFromForm = true;
    return result;
  }

  //team names and round are the only required info for a forfeit
  if(g.forfeit) {
    result.isValid = true;
    result.type = 'info';
    result.message = team1 + ' defeats ' + team2 + ' by forfeit';
    return result;
  }

  //total TUH and total scores are required.
  if(tuhtot === undefined || tuhtot === null) {
    result.type = 'error';
    result.message = 'Number of tossups heard is required';
    result.suppressFromForm = true;
    return result;
  }
  if(tuhtot <= 0) {
    result.type = 'error';
    result.message = 'Tossups heard must be greater than zero';
    return result;
  }
  if(score1 === undefined || score1 === null || score2 === undefined || score2 === null) {
    result.type = 'error';
    result.message = 'Total score is missing for one or more teams';
    result.suppressFromForm = true;
    return result;
  }

  if(g.ottu < 0) {
    result.type = 'error';
    result.message = 'Overtime tossups heard cannot be negative';
    return result;
  }

  //player stats need to exist
  if(players1 === undefined || players1 === null || players2 === undefined || players2 === null) {
    result.type = 'error';
    result.message = 'Player stats are missing for one or more teams';
    result.suppressFromForm = true;
    return result;
  }

  //no player can have more tossups heard than were read in the match,
  //and no player can answer more tossups than he's heard
  let playerTuhSums = [0,0];
  for(let p in players1) {
    if(players1[p].tuh > tuhtot) {
      result.type = 'error';
      result.message = p + ' has heard more than ' + tuhtot + ' tossups';
      return result;
    }
    if(anyNegativeBuzzes(players1[p])) {
      result.type = 'error';
      result.message = 'A player cannot hear or answer a negative number of tossups';
      return result;
    }
    const tuAnswered = players1[p].powers + players1[p].tens + players1[p].negs;
    if(players1[p].tuh < tuAnswered) {
      result.type = 'error';
      result.message = p + ' has more tossups answered than tossups heard';
      return result;
    }
    playerTuhSums[0] += players1[p].tuh;
  }
  //likewise for team 2
  for(let p in players2) {
    if(players2[p].tuh > tuhtot) {
      result.type = 'error';
      result.message = p + ' has heard more than ' + tuhtot + ' tossups';
      return result;
    }
    if(anyNegativeBuzzes(players2[p])) {
      result.type = 'error';
      result.message = 'A player cannot hear or answer a negative number of tossups';
      return result;
    }
    const tuAnswered = players2[p].powers + players2[p].tens + players2[p].negs;
    if(players2[p].tuh < tuAnswered) {
      result.type = 'error';
      result.message = p + ' has more tossups answered than tossups heard';
      return result;
    }
    playerTuhSums[1] += players2[p].tuh;
  }

  //A team's players cannot have heard more tossups collectively than the
  //total tossups for the game, times the number of players per team
  const idealCollectiveTuh = tuhtot * settings.playersPerTeam;
  if(idealCollectiveTuh > 0 && playerTuhSums[0] > idealCollectiveTuh) {
    result.type = 'error';
    result.message =  `${team1}\'s players have heard more than ${idealCollectiveTuh} tossups`;
    return result;
  }
  if(idealCollectiveTuh > 0 && playerTuhSums[1] > idealCollectiveTuh) {
    result.type = 'error';
    result.message =  `${team2}\'s players have heard more than ${idealCollectiveTuh} tossups`;
    return result;
  }

  // make sure there are tossups heard even if team scored zero points
  if(playerTuhSums[0] == 0) {
    result.type = 'error';
    result.message = `No players on ${team1} have heard any tossups`;
    return result;
  }
  if(playerTuhSums[1] == 0) {
    result.type = 'error';
    result.message = `No players on ${team2} have heard any tossups`;
    return result;
  }

  //if it's a tossup only format, sum of tossup points must equal total score
  const bPts1 = StatUtils.bonusPoints(g, 1, settings);
  const bPts2 = StatUtils.bonusPoints(g, 2, settings)
  if(!settings.bonuses) {
    if(bPts1 != 0) {
      result.type = 'error';
      result.message = team1 + '\'s tossup points and total score do not match';
      return result;
    }
    if(bPts2 != 0) {
      result.type = 'error';
      result.message = team2 + '\'s tossup points and total score do not match';
      return result;
    }
  }

  //PPB can't be over 30 (includes having bonus points but no bonuses heard).
  //exception is if there are no bonus points to account for
  const bHeard1 = StatUtils.bonusesHeard(g, 1);
  const bHeard2 = StatUtils.bonusesHeard(g, 2);
  const ppb1 = bPts1/bHeard1;
  const ppb2 = bPts2/bHeard2;

  if((isNaN(ppb1) && bPts1 > 0) || ppb1 > 30) {
    result.type = 'error';
    result.message = `${team1} has over 30 ppb`;
    return result;
  }
  if((isNaN(ppb2) && bPts2 > 0) || ppb2 > 30) {
    result.type = 'error';
    result.message = `${team2} has over 30 ppb`;
    return result;
  }

  //both teams combined can't convert more tossups than have been read
  if(bHeard1 + bHeard2 >  tuhtot) {
    result.type = 'error';
    result.message = 'Total tossups converted by both teams exceeds total tossups heard for the game';
    return result;
  }

  //Bonus points can't be negative
  if(bPts1 < 0 || bPts2 < 0) {
    result.type = 'error';
    result.message = 'Bonus points cannot be negative';
    return result;
  }

  //can't have over 30 ppbb
  if(settings.bonusesBounce && invalidPpbb(g, 1, settings)) {
    result.type = 'error';
    result.message = team1 + ' has over 30 ppbb';
    return result;
  }
  if(settings.bonusesBounce && invalidPpbb(g, 2, settings)) {
    result.type = 'error';
    result.message = team2 + ' has over 30 ppbb';
    return result;
  }

  // can't have more buzzes in overtime than tossups you actually heard
  const otPwr1 = g.otPwr1, otPwr2 = g.otPwr2;
  const otTen1 = g.otTen1, otTen2 = g.otTen2;
  const otNeg1 = g.otNeg1, otNeg2 = g.otNeg2;
  const ottu = g.ottu;

  if(otPwr1 < 0 || otTen1 < 0 || otNeg1 < 0 || otPwr2 < 0 || otTen2 < 0 || otNeg2 < 0) {
    result.type = 'error';
    result.message = 'Negative numbers of questions answered are not allowed';
    return result;
  }

  if(otPwr1 + otTen1 + otNeg1 > ottu) {
    result.type = 'error';
    result.message = team1 + ' has more overtime buzzes than tossups heard';
    return result;
  }
  if(otPwr2 + otTen2 + otNeg2 > ottu) {
    result.type = 'error';
    result.message = team2 + ' has more overtime buzzes than tossups heard';
    return result;
  }

  //both teams can't have converted more overtime tossups than were read
  if(otPwr1 + otTen1 + otPwr2 + otTen2 > ottu) {
    result.type = 'error';
    result.message = 'More overtime tossups were converted than the total number of overtime tossups heard';
    return result;
  }

  // negative points in lightning/worksheet is illegal
  if(g.lightningPts1 < 0 || g.lightningPts2 < 0) {
    result.type = 'error';
    result.message = 'Lightning round points cannot be negative';
    return result;
  }

  // negative bounceback points is illegal
  if(settings.bonusesBounce && (g.bbPts1 < 0 || g.bbPts2 < 0)) {
    result.type = 'error';
    result.message = 'Bounceback points cannot be negative';
    return result;
  }

  //We now have a valid game. Compile all overrideable warnings, and display them all
  result.isValid = true;
  let warningsExist = false, warningList = '';

  //warn if score isn't divisible by 5
  const divisor = scoreDivisor(settings);
  if(score1 % divisor != 0 || score2 % divisor != 0) {
    warningsExist = true;
    warningList += 'Score is not divisible by ' + divisor + '. ';
  }

  //bonus points shouldn't end in 5
  if(bPts1 % 10 != 0 || bPts2 % 10 != 0) {
    warningsExist = true;
    warningList += 'Bonus points are not divisible by 10. ';
  }

  //Subtract overtime points from each team. You should get a tie game.
  if(ottu > 0 && (score1 - otPoints(g, 1, settings) != score2 - otPoints(g, 2, settings))) {
    warningsExist = true;
    warningList += 'Game went to overtime but score was not tied at the ' +
      'end of regulation based on each team\'s points scored in overtime. ';
  }

  //there shouldn't be empty chairs if your team had enough players to fill them
  if(playerTuhSums[0] < idealCollectiveTuh &&
    Object.keys(players1).length >= settings.playersPerTeam) {
    warningsExist = true;
    warningList += team1 + '\'s players have heard fewer than ' +
      idealCollectiveTuh + ' tossups. ';
  }
  if(playerTuhSums[1] < idealCollectiveTuh &&
    Object.keys(players2).length >= settings.playersPerTeam) {
    warningsExist = true;
    warningList += team2 + '\'s players have heard fewer than ' +
      idealCollectiveTuh + ' tossups. ';
  }

  //Warn if the score is a tie. Ties are bad. You shouldn't have ties.
  if(score1 == score2) {
    warningsExist = true;
    warningList += 'This game is a tie.'
  }

  if(warningsExist) {
    result.type = 'warning';
    result.message = warningList;
    return result;
  }

  return result;
}//validateGame

/**
 * Whether the player has negative numbers for any TU heard/answered field
 * @param  line               player stats
 * @return      boolean
 */
function anyNegativeBuzzes(line: PlayerLine) : boolean {
  return line.powers < 0 || line.tens < 0 || line.negs < 0 || line.tuh < 0;
}
