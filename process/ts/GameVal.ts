/***********************************************************
GameVal.ts
Andrew Nadig

Code for validating game data
***********************************************************/

import StatUtils = require('./StatUtils');
import { YfGame, FormValidation, TournamentSettings, WhichTeam } from "./YfTypes";


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
 * @return   FormValidation tuple
 */
export function validateGame(g: YfGame, settings: TournamentSettings): FormValidation {
  let team1 = g.team1, team2 = g.team2;
  let round = g.round, tuhtot = g.tuhtot;
  let score1 = g.score1, score2 = g.score2;
  let players1 = g.players1, players2 = g.players2;
  //teams are required
  if(!team1 || !team2) {
    return [false, 'error', 'One or more teams is missing'];
  }
  // a team can't play itself
  if(team1 == team2) {
    return [false, 'error', team1 + ' cannot play themselves'];
  }
  //round is required
  if(round === undefined || round === null) {
    return [false, 'error', 'Round number is missing'];
  }
  //two teams can't play each other twice in the same round
    // removed

  //teams can only play multiple games in the same round if they're tiebreakers
    // removed

  //team names and round are the only required info for a forfeit
    // removed -- only do errors and warnings here

  //total TUH and total scores are required.
  if(tuhtot <= 0) {
    return [false, 'error', 'Tossups heard must be greater than zero'];
  }
  if(score1 === undefined || score1 === null || score2 === undefined || score2 === null) {
    return [false, 'error', 'Total score is missing for one or more teams'];
  }

  //player stats need to exist
  if(players1 === undefined || players1 === null || players2 === undefined || players2 === null) {
    return [false, 'error', 'Player stats are missing for one or more teams'];
  }

  //no player can have more tossups heard than were read in the match,
  //and no player can answer more tossups than he's heard
  let playerTuhSums = [0,0];
  for(let p in players1) {
    if(players1[p].tuh > tuhtot) {
      return [false, 'error', p + ' has heard more than ' + tuhtot + ' tossups'];
    }
    const tuAnswered = players1[p].powers + players1[p].tens + players1[p].negs;
    if(players1[p].tuh < tuAnswered) {
      return [false, 'error', p + ' has more tossups answered than tossups heard']
    }
    playerTuhSums[0] += players1[p].tuh;
  }
  //likewise for team 2
  for(let p in players2) {
    if(players2[p].tuh > tuhtot) {
      return [false, 'error', p + ' has heard more than ' + tuhtot + ' tossups'];
    }
    const tuAnswered = players2[p].powers + players2[p].tens + players2[p].negs;
    if(players2[p].tuh < tuAnswered) {
      return [false, 'error', p + ' has more tossups answered than tossups heard']
    }
    playerTuhSums[1] += players2[p].tuh;
  }

  //A team's players cannot have heard more tossups collectively than the
  //total tossups for the game, times the number of players per team
  const idealCollectiveTuh = tuhtot * settings.playersPerTeam;
  if(idealCollectiveTuh > 0 && playerTuhSums[0] > idealCollectiveTuh) {
    return [false, 'error', `${team1}\'s players have heard more than ${idealCollectiveTuh} tossups`];
  }
  if(idealCollectiveTuh > 0 && playerTuhSums[1] > idealCollectiveTuh) {
    return [false, 'error', `${team2}\'s players have heard more than ${idealCollectiveTuh} tossups`];
  }

  // make sure there are tossups heard even if team scored zero points
  if(playerTuhSums[0] == 0) {
    return [false, 'error', `No players on ${team1} have heard any tossups`];
  }
  if(playerTuhSums[1] == 0) {
    return [false, 'error', `No players on ${team2} have heard any tossups`];
  }

  //if it's a tossup only format, sum of tossup points must equal total score
  const bPts1 = StatUtils.bonusPoints(g, 1, settings);
  const bPts2 = StatUtils.bonusPoints(g, 2, settings)
  if(!settings.bonuses) {
    if(bPts1 != 0) {
      return [false, 'error', team1 + '\'s tossup points and total score do not match'];
    }
    if(bPts2 != 0) {
      return [false, 'error', team2 + '\'s tossup points and total score do not match'];
    }
  }

  //PPB can't be over 30 (includes having bonus points but no bonuses heard).
  //exception is if there are no bonus points to account for
  const bHeard1 = StatUtils.bonusesHeard(g, 1);
  const bHeard2 = StatUtils.bonusesHeard(g, 2);
  const ppb1 = bPts1/bHeard1;
  const ppb2 = bPts2/bHeard2;

  if((isNaN(ppb1) && bPts1 > 0) || ppb1 > 30) {
    return [false, 'error', `${team1} has over 30 ppb`];
  }
  if((isNaN(ppb2) && bPts2 > 0) || ppb2 > 30) {
    return [false, 'error', `${team2} has over 30 ppb`];
  }

  //both teams combined can't convert more tossups than have been read
  if(bHeard1 + bHeard2 >  tuhtot) {
    return [false, 'error', 'Total tossups converted by both teams exceeds total tossups heard for the game'];
  }

  //Bonus points can't be negative
  if(bPts1 < 0 || bPts2 < 0) {
    return [false, 'error', 'Bonus points cannot be negative'];
  }

  //can't have over 30 ppbb
  if(settings.bonusesBounce && invalidPpbb(g, 1, settings)) {
    return [false, 'error', team1 + ' has over 30 ppbb'];
  }
  if(settings.bonusesBounce && invalidPpbb(g, 2, settings)) {
    return [false, 'error', team2 + ' has over 30 ppbb'];
  }

  // can't have more buzzes in overtime than tossups you actually heard
  const otPwr1 = g.otPwr1, otPwr2 = g.otPwr2;
  const otTen1 = g.otTen1, otTen2 = g.otTen2;
  const otNeg1 = g.otNeg1, otNeg2 = g.otNeg2;
  const ottu = g.ottu;

  if(otPwr1 + otTen1 + otNeg1 > ottu) {
    return [false, 'error', team1 + ' has more overtime buzzes than tossups heard'];
  }
  if(otPwr2 + otTen2 + otNeg2 > ottu) {
    return [false, 'error', team2 + ' has more overtime buzzes than tossups heard'];
  }

  //both teams can't have converted more overtime tossups than were read
  if(otPwr1 + otTen1 + otPwr2 + otTen2 > ottu) {
    return [false, 'error', 'More overtime tossups were converted than the total number of overtime tossups heard']
  }

  // negative points in lightning/worsheet is illegal
  if(g.lightningPts1 < 0 || g.lightningPts2 < 0) {
    return [false, 'error', 'Lightning round points cannot be negative'];
  }

  // negative bounceback points is illegal
  if(settings.bonusesBounce && (g.bbPts1 < 0 || g.bbPts2 < 0)) {
    return [false, 'error', 'Bounceback points cannot be negative'];
  }

  //If there are no errors, compile all overrideable warnings, and display them all
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

  if(warningsExist) { return [true, 'warning', warningList]; }

  return [true, null, ''];
}//validateGame
