/***********************************************************
StatUtils2.js
Andrew Nadig

miscellaneous functions
***********************************************************/
import * as _ from 'lodash';
import { TournamentSettings, YfGame, YfTeam } from './YfTypes';

/**
 * Simple callback function for writeFile, etc.
 * @param  err error to print to the console
 */
export function printError(err: any): void {
  if (err) { console.log(err); }
}

/**
 * Equality test for settings objects
 * @param  s1 settings object
 * @param  s2 settings object
 * @return    whether they have the same game rules (other settings are ignored )
 */
export function settingsEqual(s1: TournamentSettings, s2: TournamentSettings): boolean {
  return s1.powers == s2.powers && s1.negs == s2.negs &&
    s1.bonuses == s2.bonuses && s1.bonusesBounce == s2.bonusesBounce &&
    +s1.playersPerTeam == +s2.playersPerTeam;
}

/**
 * Equality test for two games.
 * @param  g1 game object
 * @param  g2 game object
 * @return    whether they are the same game
 */
export function gameEqual(g1: YfGame, g2: YfGame) {
  if((g1 == undefined && g2 != undefined) || (g1 != undefined && g2 == undefined)) {
    return false;
  }
  return g1.round == g2.round && g1.tuhtot == g2.tuhtot &&
    g1.ottu == g2.ottu && g1.forfeit == g2.forfeit && g1.team1 == g2.team1 &&
    g1.team2 == g2.team2 && g1.score1 == g2.score1 && g1.score2 == g2.score2 &&
    g1.notes == g2.notes;
}

/**
 * Check whether newGame is allowed to be merged into curGames (a team can only play
 * twice in the same round if both games are tiebreakers)
 * @param  newGame  game to add
 * @param  curGames list of existing games
 * @return          true if newGame is conflicts with an existing game. False if we can merge
 */
export function mergeConflictGame(newGame: YfGame, curGames: YfGame[]): boolean {
  let dupBoth = curGames.find((g) => {
    return (g.team1 == newGame.team1 && g.team2 == newGame.team2 &&  g.round == newGame.round) ||
      (g.team1 == newGame.team2 && g.team2 == newGame.team1 &&  g.round == newGame.round);
    }
  );
  if(dupBoth) { return true; }

  let dupOne = curGames.find((g) => {
    return (g.team1 == newGame.team1 || g.team2 == newGame.team1) && g.round == newGame.round});
  let dupTwo = curGames.find((g) => {
    return (g.team1 == newGame.team2 || g.team2 == newGame.team2) && g.round == newGame.round});

  if(dupOne && !(dupOne.tiebreaker && newGame.tiebreaker)) { return true; }
  return dupTwo && !(dupTwo.tiebreaker && newGame.tiebreaker);
}

/**
 * Is version a less than version b? Versions are 3-piece dot-delimited, e.g. '1.2.3'
 * @param  a    version string
 * @param  b    version string
 * @param  type precision to use for the comparison. Default: 'patch' (third piece)
 * @return      true if a is less than b
 */
export function versionLt(a: string, b: string,
  type: 'major' | 'minor' | 'patch'): boolean {

  const aSplit = a.split('.'), bSplit = b.split('.');
  if(aSplit[0] != bSplit[0]) { return aSplit[0] < bSplit[0]; }
  if(type == 'major') { return false; }
  if(aSplit[1] != bSplit[1]) { return aSplit[1] < bSplit[1]; }
  if(type == 'minor') { return false; }
  return aSplit[2] < bSplit[2];
}

/**
 * conversion on team data structure (version 2.1.0). Changes rosters from arrays of
 * strings to arrays of objects with the year property
 * @param  loadTeams list of teams
 */
export function teamConversion2x1x0(loadTeams: any) {
  for(var i in loadTeams) {
    var curTeam = loadTeams[i];
    var rosterObj = {};
    for(var j in curTeam.roster) {
      rosterObj[curTeam.roster[j]] = {year: ''};
    }
    curTeam.roster = rosterObj;
  }
}

/**
 * conversion on team data structure (version 2.2.0). Adds the team-level UG and D2
 * preoperties, and adds the division 2 property to each player
 * @param  loadTeams list of teams
 */
export function teamConversion2x2x0(loadTeams: YfTeam[]) {
  for(var i in loadTeams) {
    var curTeam = loadTeams[i];
    curTeam.teamUGStatus = false;
    curTeam.teamD2Status = false;
    for(var player in curTeam.roster) {
      curTeam.roster[player].div2 = false;
      curTeam.roster[player].undergrad = false;
    }
  }
}

/**
 * conversion on team data structure (version 2.3.0). Adds the team-level small school
 * and JV properties
 * @param  loadTeams list of teams
 */
export function teamConversion2x3x0(loadTeams: YfTeam[]) {
  for(var i in loadTeams) {
    var curTeam = loadTeams[i];
    curTeam.smallSchool = false;
    curTeam.jrVarsity = false;
  }
}

/**
 * conversion on settings data structure (version 2.4.0). convert default phase to
 * an array of phases
 * @param  settings (old) tournament settings object
 */
export function settingsConversion2x4x0(settings: any) {
  if(settings.defaultPhase == 'noPhase') {
    settings.defaultPhases = [];
  }
  else {
    settings.defaultPhases = [settings.defaultPhase];
  }
  delete settings.defaultPhase;
}

/**
 * conversion on games data structure (version 2.4.0). Add tiebreaker property
 * @param  games list of games
 */
export function gameConversion2x4x0(games: YfGame[]) {
  for(var i in games) { games[i].tiebreaker = false; }
}

/**
 * conversion on settings data structure (version 2.5.0). Split bonus setting into two
 * booleans, converg negs setting from string to boolean, and set lightning round setting.
 * @param  settings settings object
 */
export function settingsConversion2x5x0(settings: any) {
  settings.bonusesBounce = settings.bonuses == 'yesBb';
  settings.bonuses = settings.bonuses != 'none';
  settings.negs = settings.negs == 'yes';
  settings.lightning = false;
}

/**
 * conversion on games data structure (version 2.5.0). Add lightning round properties
 * @param  games list of games
 */
export function gameConversion2x5x0(games: any) {
  for(var i in games) {
    games[i].lightningPts1 = '';
    games[i].lightningPts2 = '';
  }
}

/**
 * Change numeric fields to be numbers
 * @param  games list of games
 */
export function gameConversion2x5x2(games: any) {
  for(let g of games) {
    g.round = +g.round;
    g.tuhtot = +g.tuhtot;
    g.ottu = +g.ottu;
    g.score1 = +g.score1;
    g.score2 = +g.score2;
    g.otPwr1 = +g.otPwr1;
    g.otPwr2 = +g.otPwr2;
    g.otTen1 = +g.otTen1;
    g.otTen2 = +g.otTen2;
    g.otNeg1 = +g.otNeg1;
    g.otNeg2 = +g.otNeg2;
    g.bbPts1 = +g.bbPts1;
    g.bbPts2 = +g.bbPts2;
    g.lightningPts1 = +g.lightningPts1;
    g.lightningPts2 = +g.lightningPts2;

    for(let p in g.players1) {
      let line = g.players1[p];
      line.tuh = +line.tuh;
      line.powers = +line.powers;
      line.tens = +line.tens;
      line.negs = +line.negs;
    }
    for(let p in g.players2) {
      let line = g.players2[p];
      line.tuh = +line.tuh;
      line.powers = +line.powers;
      line.tens = +line.tens;
      line.negs = +line.negs;
    }
  }
}

/**
 * For each player in this game, increment that player's count in the index. Assumes
 * that teams and players are already defined.
 * @param  game  list of games
 * @param  index list of teams (indexed by team name) with lists of players (indexed by
 *                player) with their number of games played
 * @return       [description]
 */
export function addGameToPlayerIndex(game: YfGame, index: any) {
  let team1 = game.team1, team2 = game.team2;
  for(var p in game.players1) {
    if(+(game.players1[p].tuh) > 0) { index[team1][p]++; }
  }
  for(var p in game.players2) {
    if(+(game.players2[p].tuh) > 0) { index[team2][p]++; }
  }
}

/**
 * Update the player index when a game is modified. Decrementing every player in the old
 * game, then incrementing every player in the new game is superfluous but cleaner.
 * @param  oldGame game to delete
 * @param  newGame game to add. Set to null of deleting a game
 * @param  index   index of games played (indexed by team -> player)
 */
export function modifyGameInPlayerIndex(oldGame: YfGame, newGame: YfGame, index: any) {
  let oldTeam1 = oldGame.team1, oldTeam2 = oldGame.team2;
  for(var p in oldGame.players1) {
    if(+(oldGame.players1[p].tuh) > 0) { index[oldTeam1][p]--; }
  }
  for(var p in oldGame.players2) {
    if(+(oldGame.players2[p].tuh) > 0) { index[oldTeam2][p]--; }
  }
  if(newGame == null) { return; }
  var newTeam1 = newGame.team1, newTeam2 = newGame.team2;
  for(var p in newGame.players1) {
    if(+(newGame.players1[p].tuh) > 0) { index[newTeam1][p]++; }
  }
  for(var p in newGame.players2) {
    if(+(newGame.players2[p].tuh) > 0) { index[newTeam2][p]++; }
  }
}

/**
 * Update team names and rosters in the player index
 * @param  oldTeam team to remove
 * @param  newTeam team to add
 * @param  index   index of games played (indexed by team -> player)
 */
export function modifyTeamInPlayerIndex(oldTeam: any, newTeam: any, index: any) {
  const oldTeamName = oldTeam.teamName;
  let newPlayerList = Object.keys(newTeam.roster);
  let newIndexPiece = {};
  let count = 0;
  for(var p in oldTeam.roster) {
    let newPlayerName = newPlayerList[count++];
    if(newPlayerName != undefined && newTeam.roster[newPlayerName].deleted == undefined) {  // property only defined for players that were just deleted
      newIndexPiece[newPlayerName] = index[oldTeamName][p];
    }
  }
  //add any new players that the user just added
  while(count < newPlayerList.length) {
    newIndexPiece[newPlayerList[count++]] = 0;
  }
  delete index[oldTeamName];
  index[newTeam.teamName] = newIndexPiece;
}
