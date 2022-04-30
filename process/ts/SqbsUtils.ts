/***********************************************************
SqbsUtils.ts
Andrew Nadig

code for generating an SQBS-format file.

Callable functions: getPacketRounds, getSqbsFile
***********************************************************/

import * as StatUtils from './StatUtils';
import { PacketList, GameIndex, YfTeam, YfGame, TournamentSettings, WhichTeam, TeamGameLine, PowerRule } from './YfTypes';

/**
 * Return the list of rounds for which we care about packet names. This is all rounds
 * from 1 to the last round for which there is a game, or a named packet, including
 * any intervening rounds with no games or packets
 * @param  packets   packets indexed by round
 * @param  gameIndex number of games in each round
 * @return           Numbers from 1 to whatever the last round we care about
 */
export function getPacketRounds(packets: PacketList, gameIndex: GameIndex): number[] {
  let maxGameRound = +(Object.keys(gameIndex).sort((a,b) => { return +a-+b; }).pop());
  let maxPacketRound = +(Object.keys(packets).sort((a,b) => { return +a-+b; }).pop());
  if(maxGameRound == NaN) { maxGameRound = 0; }
  if(maxPacketRound == NaN) { maxPacketRound = 0; }
  let maxRound: number;
  if(!StatUtils.packetNamesExist(packets)) { maxRound = maxGameRound; }
  else {
    maxRound = maxGameRound >= maxPacketRound ? maxGameRound : maxPacketRound;
  }
  let rounds: number[] = [];
  for(let i=1; i<=maxRound; i++) { rounds.push(i); }
  return rounds;
}

/**
 * The first part of the file:
 * - number of teams
 * - for each team:
 *   - number of players + 1
 *   - team name
 *   - for each player: player name (year/grade)
 * @param  teams List of teams
 * @return       Teams and rosters in sqbs format
 */
function teamList(teams: YfTeam[]): string {
  let output = '';
  output += teams.length + '\n';
  for(let t of teams) {
    output += (Object.keys(t.roster).length + 1) + '\n';
    output += t.teamName + '\n';
    for(let p in t.roster) {
      output += p;
      const year = t.roster[p].year;
      if(year != undefined && year != '') {
        output += ' (' + year + ')';
      }
      output += '\n';
    }
  }
  return output;
}

/**
 * The SQBS game ID. This isn't a concept in YF, so generate one here using the round
 * number and the names of the two teams. Validation in the AddGameModal ensures that
 * this will be unique
 * @param  g game
 * @return   a unique ID
 */
function gameID(g: YfGame): string {
  return `R${g.round}-${g.team1}-${g.team2}`;
}

/**
 * One player's stat line for a game.
 * @param  settings   Tournament settings
 * @param  teams      list of teams
 * @param  game       the game to write one player's stat line for
 * @param  whichTeam  team 1 or 2
 * @param  playerName which player to get stats for
 * @return            player's stats in SQBS format
 */
function addOnePlayer(settings: TournamentSettings, teams: YfTeam[], game: YfGame,
  whichTeam: WhichTeam, playerName: string): string {

  let output = '';
  const teamName = whichTeam == 1 ? game.team1 : game.team2;
  const teamObj: YfTeam = teams.find((t) => { return t.teamName == teamName; });
  const playerIdx: number = Object.keys(teamObj.roster).indexOf(playerName);
  output += playerIdx + '\n';
  const gameLine: TeamGameLine = whichTeam == 1 ? game.players1 : game.players2;
  const [tuh, powers, tens, negs] = StatUtils.playerSlashLine(gameLine[playerName]);
  output += (tuh / game.tuhtot).toFixed(2) + '\n'; //games played
  let pointCatCounter = 0;
  if(settings.powers != PowerRule.None) {
    output += powers + '\n';
    pointCatCounter++;
  }
  output += tens + '\n';
  pointCatCounter++;
  if(settings.negs) {
    output += negs + '\n';
    pointCatCounter++;
  }
  while(pointCatCounter < 4) { //there must be exactly four point-category lines
    output += '0\n';
    pointCatCounter++;
  }
  //total points
  output += (powers*StatUtils.powerValue(settings) + tens*10 + negs*StatUtils.negValue(settings)) + '\n';

  return output;
}

/**
 * A placeholder player stat line, because each game must have eight player stat lines
 * per team.
 * @return stats for dummy player, in SQBS format
 */
function dummyPlayer(): string {
  return '-1\n0\n0\n0\n0\n0\n0\n';
}

/**
 * The list of games, including totals and individual stat lines
 * @param  settings tournament settings
 * @param  teams    list of teams
 * @param  games    list of all games
 * @param  phase    name of phase to show games for, or 'all' for all games
 * @param  showTbs  whether to include tiebreakers if showing all games
 * @return          List of games in SQBS format
 */
function gameList(settings: TournamentSettings, teams: YfTeam[], games: YfGame[],
  phase: string, showTbs: boolean): string {

  let output = '', gameCount = 0;
  for(let g of games) {
    if(g.invalid) { continue; }
    if(!StatUtils.matchFilterPhase(g, phase, showTbs)) { continue; }
    gameCount++;
    output += gameID(g) + '\n';
    output += teams.findIndex((t) => { return t.teamName==g.team1; }) + '\n';
    output += teams.findIndex((t) => { return t.teamName==g.team2; }) + '\n';
    //team total scores
    if(g.forfeit) {
      output += '-1\n';
      output += '-1\n';
    }
    else {
      output += g.score1 + '\n';
      output += g.score2 + '\n';
    }
    //total tossups heard and round number
    if(g.forfeit) { output += '0' + '\n'; }
    else { output += g.tuhtot + '\n'; }
    output += g.round + '\n';
    //bonuses
    if(settings.bonuses && !settings.bonusesBounce) {
      output += StatUtils.bonusesHeard(g, 1) + '\n';
      output += StatUtils.bonusPoints(g, 1, settings) + '\n';
      output += StatUtils.bonusesHeard(g, 2) + '\n';
      output += StatUtils.bonusPoints(g, 2, settings) + '\n';
    }
    else if(settings.bonusesBounce) {
      // track bouncebacks heard in units of bonus parts, not bonuses
      let bbHrd1 = (3*StatUtils.bbHrdToFloat(StatUtils.bbHeard(g, 1, settings))).toFixed(0);
      output += 10000*+bbHrd1 + StatUtils.bonusesHeard(g, 1) + '\n';
      output += 10000*g.bbPts1 + StatUtils.bonusPoints(g, 1, settings) + '\n';
      let bbHrd2 = (3*StatUtils.bbHrdToFloat(StatUtils.bbHeard(g, 2, settings))).toFixed(0);
      output += 10000*+bbHrd2 + StatUtils.bonusesHeard(g, 2) + '\n';
      output += 10000*g.bbPts2 + StatUtils.bonusPoints(g, 2, settings) + '\n';
    }
    else { // no bonuses, so just fill with zeros
      output += '0\n0\n0\n0\n';
    }
    // overtime
    output += g.ottu>0 ? '1\n' : '0\n';
    output += (+g.otPwr1 + +g.otTen1) + '\n';
    output += (+g.otPwr2 + +g.otTen2) + '\n';
    // forfeit?
    output += g.forfeit ? '1\n' : '0\n';
    // lightning rounds (if tournament doesn't use them, adds 0s, which is correct)
    output += +g.lightningPts1 + '\n';
    output += +g.lightningPts2 + '\n';
    // eight lines of player stats; further lines will be ignored
    // but skip players with 0 TUH
    const gamePlayers1 = g.forfeit ? [] : Object.keys(g.players1);
    const gamePlayers2 = g.forfeit ? [] : Object.keys(g.players2);
    let playerIdx1 = 0, playerIdx2 = 0;
    for(let i=0; i<8; i++) {
      while(playerIdx1 < gamePlayers1.length && +(g.players1[gamePlayers1[playerIdx1]].tuh) <= 0) {
        playerIdx1++;
      }
      if(playerIdx1 < gamePlayers1.length) {
        output += addOnePlayer(settings, teams, g, 1, gamePlayers1[playerIdx1]);
        playerIdx1++;
      }
      else {
        output += dummyPlayer();
      }
      while(playerIdx2 < gamePlayers2.length && +(g.players2[gamePlayers2[playerIdx2]].tuh) <= 0) {
        playerIdx2++;
      }
      if(playerIdx2 < gamePlayers2.length) {
        output += addOnePlayer(settings, teams, g, 2, gamePlayers2[playerIdx2]);
        playerIdx2++;
      }
      else {
        output += dummyPlayer();
      }
    }
  }
  output = gameCount + '\n' + output; // add number of games to beginning

  return output;
}

/**
 * Other SQBS settings.
 * @param  settings  tournament settings
 * @param  divisions list of divisions in the phase(s) we're exporting
 * @return           settings in SQBS format
 */
function miscSettings(settings: TournamentSettings, divisions: string[]): string {
  let output = '';
  if(!settings.bonuses) {
    output += '0\n'; // turn off bonus conversion tracking
  }
  else {
    output += '1\n'; //turn on bonus conversion tracking
  }
  if(settings.bonusesBounce) {
    output += '3\n'; // Bonus conversion tracking: "manual with bouncebacks"
  }
  else {
    output += '1\n'; // Bonus conversion tracking: "automatic"
  }
  if(settings.powers == PowerRule.None && !settings.negs) {
    output += '2\n'; //don't track power and neg stats if there are neither powers nor negs
  }
  else {
    output += '3\n'; //track power and neg stats
  }
  if(settings.lightning) {
    output += '1\n'; // no lightning rounds
  }
  else {
    output += '0\n'; // no lightning rounds
  }
  output += '1\n'; //track tossups heard
  output += '3\n'; //needs to be 3 to allow packet names, apparently? This differs from QBWiki
  output += '254\n'; //turn on all validation warnings
  output += '1\n'; //enable round report
  output += '1\n'; //enable team standings report
  output += '1\n'; //enable individual report
  output += '1\n'; //enable scoreboard report
  output += '1\n'; //enable team detail report
  output += '1\n'; //enable individual detail report
  output += '1\n'; //enable stat key
  output += '0\n'; //no custom stylesheet
  if(divisions == undefined || divisions.length == 0) {
    output += '0\n'; //don't use divisions
  }
  else {
    output += '1\n'; //use divisions
  }
  output += '1\n'; //sort by record, then PPG
  return output;
}

/**
 * Returns the specified number of newline characters
 * @param  n number of blank lines to insert
 * @return   newline charaters
 */
function blankLines(n: number): string {
  var output = '';
  for(var i=1; i<=n; i++) {
    output += '\n';
  }
  return output;
}

/**
 * The suffixes for the html files.
 * @return suffixes separated by newlines
 */
function fileSuffixes(): string {
  let output = '';
  output += '_rounds.html\n';
  output += '_standings.html\n';
  output += '_individuals.html\n';
  output += '_games.html\n';
  output += '_teamdetail.html\n';
  output += '_playerdetail.html\n';
  output += '_statkey.html\n';
  return output;
}

/**
 * The number of divisions, then the list of division names
 * @param  divisions List of divisions in the phase we're exporting
 * @return           division list in SQBS format
 */
function divisionList(divisions: string[]): string {
  if(divisions == undefined || divisions.length == 0) { return '0\n'; }
  let output = '';
  output += divisions.length + '\n';
  output += divisions.join('\n') + '\n';
  return output;
}

/**
 * The number of teams, then the 0-indexed number of the division each team is assigned to
 * @param  groupingPhases list of phases to use to get a team's division, ordered by priority
 * @param  divisions      list of divisions we're including in the SQBS file
 * @param  teams          list of teams
 * @return                Teams' division assignments, in SQBS format
 */
function divisionAssignments(groupingPhases: string[], divisions: string[],
   teams: YfTeam[]): string {

  let output = '';
  output += teams.length + '\n';
  if(divisions == undefined || divisions.length == 0) {
    for(let _i in teams) { //if not using divisions, just -1
      output += '-1\n';
    }
    return output;
  }
  for(let t of teams) {
    let div = undefined, j = 0;
    while(div == undefined && j < groupingPhases.length) {
      div = t.divisions[groupingPhases[j++]];
    }
    let index = divisions.indexOf(div);
    output += index + '\n'; //use the -1 if not found because that's how SQBS does it
  }
  return output;
}

/**
 * The list of possible tossup point values, padded with zeroes to four lines
 * @param  settings tournament setting
 * @return          point values in SQBS format
 */
function pointValueList(settings: TournamentSettings): string {
  let output = '';
  let pointCatCounter = 0;
  if(settings.powers == PowerRule.Twenty) {
    output += '20\n';
    pointCatCounter++;
  }
  else if(settings.powers == PowerRule.Fifteen) {
    output += '15\n';
    pointCatCounter++;
  }
  output += '10\n';
  pointCatCounter++;
  if(settings.negs) {
    output += '-5\n';
    pointCatCounter++;
  }
  while(pointCatCounter < 4) { //there must be exactly four lines
    output += '0\n';
    pointCatCounter++;
  }
  return output;
}

/**
 * The number of named packets (including blanks), follwed by the list of packet names
 * @param  packets   packets indexed by round
 * @param  gameIndex number of games in each round
 * @return           list of packets in SQBS format
 */
function packetNamesSqbs(packets: PacketList, gameIndex: GameIndex): string {
  if(!StatUtils.packetNamesExist(packets)) {
    return '0\n';
  }
  let output = '';
  const packetRounds = getPacketRounds(packets, gameIndex);
  output += packetRounds.length + '\n';
  let packetName: string;
  for(var i in packetRounds) {
    packetName = packets[packetRounds[i]];
    if(packetName != undefined) {
      output += packetName + '\n';
    }
    else {output += '\n'}
  }
  return output;
}

/*---------------------------------------------------------
The number of teams, then whether each team is an
exhibition team. YellowFruit doesn't support this so it's
all zeroes.
---------------------------------------------------------*/
/**
 * The number of teams, then whether each team is an exhibition team. YF doesn't
 * support this so it's all zeroes
 * @param  teams list of teams
 * @return       exhibition team list in SQBS format
 */
function exhibitionStatuses(teams: YfTeam[]): string {
  let output = '';
  output += teams.length + '\n';
  for(let _i in teams) {
    output += '0\n';
  }
  return output;
}

/**
 * Generate the SQBS file contents.
 * @param  settings       tournamenet settings
 * @param  viewingPhase   phase we're exporting
 * @param  groupingPhases phases to use for grouping teams into divisions
 * @param  divisions      list of divisions to group teams into
 * @param  teams          list of all teams
 * @param  games          list of all games
 * @param  packets        list of packets by round
 * @param  gameIndex      number of games in each round
 * @param  showTbs        whether to include tiebreakers if we're exporting all games
 * @return                the contents of the SQBS file
 */
export function getSqbsFile(settings: TournamentSettings, viewingPhase: string,
  groupingPhases: string[], divisions: string[], teams: YfTeam[], games: YfGame[],
  packets: PacketList, gameIndex: GameIndex, showTbs: boolean) {

  let output = teamList(teams);
  output += gameList(settings, teams, games, viewingPhase, showTbs);
  output += miscSettings(settings, divisions);
  output += blankLines(5); // tournament name + FTP settings. Leave blank
  output += '1\n'; // weird FTP setting. This is the default
  output += fileSuffixes();
  output += blankLines(1);
  output += divisionList(divisions);
  output += divisionAssignments(groupingPhases, divisions, teams);
  output += pointValueList(settings);
  output += packetNamesSqbs(packets, gameIndex);
  output += exhibitionStatuses(teams);
  return output;
}
