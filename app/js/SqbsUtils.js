/***********************************************************
SqbsUtils.js
Andrew Nadig

code for generating an SQBS-format file.
***********************************************************/


/*---------------------------------------------------------
Return the list of rounds for which we care about packet
names. This is all rounds from 1 to the last
round for which there is a game, or a named packet,
including any intervening rounds with no games or packets
---------------------------------------------------------*/
function getPacketRounds(packets, gameIndex) {
  var maxGameRound = Object.keys(gameIndex).sort((a,b) => { return a-b; }).pop();
  var maxPacketRound = Object.keys(packets).sort((a,b) => { return a-b; }).pop();
  if(maxGameRound == undefined) { maxGameRound = 0; }
  if(maxPacketRound == undefined) { maxPacketRound = 0; }
  var maxRound;
  if(!packetNamesExist(packets)) { maxRound = maxGameRound; }
  else { maxRound = +maxGameRound >= +maxPacketRound ? +maxGameRound : +maxPacketRound; }
  var rounds = [];
  for(var i=1; i<=maxRound; i++) { rounds.push(i); }
  return rounds;
}

/*---------------------------------------------------------
The first part of the file:
- number of teams
- for each team:
    number of players + 1
    team name
    for each player:
      player name (year/grade)
---------------------------------------------------------*/
function teamList(teams) {
  var output = '';
  output += teams.length + '\n';
  for(var i in teams) {
    var t = teams[i];
    output += (Object.keys(t.roster).length + 1) + '\n';
    output += t.teamName + '\n';
    for(var p in t.roster) {
      output += p;
      var year = t.roster[p].year;
      if(year != undefined && year != '') {
        output += ' (' + year + ')';
      }
      output += '\n';
    }
  }
  return output;
}

/*---------------------------------------------------------
The SQBS game ID. This isn't a concept in YellowFruit, so
generate one here using the round number and the names
of the two teams. Validation in the AddGameModal ensures
that this will be unique.
---------------------------------------------------------*/
function gameID(g) {
  return 'R' + g.round + '-' + g.team1 + '-' + g.team2;
}

/*---------------------------------------------------------
One player's stat line for a game.
---------------------------------------------------------*/
function addOnePlayer(settings, teams, game, whichTeam, playerName) {
  var output = '';
  var teamName = whichTeam == 1 ? game.team1 : game.team2;
  var teamObj = teams.find((t) => { return t.teamName == teamName; });
  var playerIdx = Object.keys(teamObj.roster).indexOf(playerName);
  output += playerIdx + '\n';
  var playersObj = whichTeam == 1 ? game.players1 : game.players2;
  [tuh, powers, tens, negs] = playerSlashLine(playersObj[playerName]);
  output += (tuh / game.tuhtot).toFixed(2) + '\n'; //games played
  var pointCatCounter = 0;
  if(settings.powers != 'none') {
    output += powers + '\n';
    pointCatCounter++;
  }
  output += tens + '\n';
  pointCatCounter++;
  if(settings.negs == 'yes') {
    output += negs + '\n';
    pointCatCounter++;
  }
  while(pointCatCounter < 4) { //there must be exactly four point-category lines
    output += '0\n';
    pointCatCounter++;
  }
  //total points
  output += (powers*powerValue(settings) + tens*10 + negs*negValue(settings)) + '\n';

  return output;
}

/*---------------------------------------------------------
A placeholder player stat line, because each game must
have eight player stat lines per team.
---------------------------------------------------------*/
function dummyPlayer() {
  return '-1\n0\n0\n0\n0\n0\n0\n';
}

/*---------------------------------------------------------
The list of games, including totals and individual stat
lines.
---------------------------------------------------------*/
function gameList(settings, teams, games, phase) {
  var output = '', gameCount = 0;
  for(var i in games) {
    var g = games[i];
    if(phase != 'all' && !g.phases.includes(phase)) { continue; }
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
    //total tossups heard and round
    if(g.forfeit) { output += '0' + '\n'; }
    else { output += g.tuhtot + '\n'; }
    output += g.round + '\n';
    //bonuses
    if(settings.bonuses == 'noBb') {
      output += bonusesHeard(g, 1) + '\n';
      output += bonusPoints(g, 1, settings) + '\n';
      output += bonusesHeard(g, 2) + '\n';
      output += bonusPoints(g, 2, settings) + '\n';
    }
    else if(settings.bonuses == 'yesBb') {
      // track bouncebacks heard in units of bonus parts, not bonuses
      var bbHrd1 = (3*bbHrdToFloat(bbHeard(g, 1, settings))).toFixed(0);
      output += 10000*bbHrd1 + bonusesHeard(g, 1) + '\n';
      output += 10000*g.bbPts1 + bonusPoints(g, 1, settings) + '\n';
      var bbHrd2 = (3*bbHrdToFloat(bbHeard(g, 2, settings))).toFixed(0);
      output += 10000*bbHrd2 + bonusesHeard(g, 2) + '\n';
      output += 10000*g.bbPts2 + bonusPoints(g, 2, settings) + '\n';
    }
    else { // no bonuses, so just fill with zeros
      output += '0\n0\n0\n0\n';
    }
    // overtime
    output += g.ottu>0 ? '1\n' : '0\n';
    output += (toNum(g.otPwr1) + toNum(g.otTen1)) + '\n';
    output += (toNum(g.otPwr2) + toNum(g.otTen2)) + '\n';
    // forfeit?
    output += g.forfeit ? '1\n' : '0\n';
    // lightning rounds. Don't exist here, so just add zeroes
    output += '0\n';
    output += '0\n';
    // eight lines of player stats; further lines will be ignored
    // but skip players with 0 TUH
    var gamePlayers1 = g.forfeit ? [] : Object.keys(g.players1);
    var gamePlayers2 = g.forfeit ? [] : Object.keys(g.players2);
    var playerIdx1 = 0;
    var playerIdx2 = 0;
    for(i=0; i<8; i++) {
      while(playerIdx1 < gamePlayers1.length && toNum(g.players1[gamePlayers1[playerIdx1]].tuh) <= 0) {
        playerIdx1++;
      }
      if(playerIdx1 < gamePlayers1.length) {
        output += addOnePlayer(settings, teams, g, 1, gamePlayers1[playerIdx1]);
        playerIdx1++;
      }
      else {
        output += dummyPlayer();
      }
      while(playerIdx2 < gamePlayers2.length && toNum(g.players2[gamePlayers2[playerIdx2]].tuh) <= 0) {
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

/*---------------------------------------------------------
Other SQBS settings.
---------------------------------------------------------*/
function miscSettings(settings, divisions) {
  var output = '';
  if(settings.bonuses == 'none') {
    output += '0\n'; // turn off bonus conversion tracking
  }
  else {
    output += '1\n'; //turn on bonus conversion tracking
  }
  if(settings.bonuses == 'yesBb') {
    output += '3\n'; // Bonus conversion tracking: "manual with bouncebacks"
  }
  else {
    output += '1\n'; // Bonus conversion tracking: "automatic"
  }
  if(settings.powers == 'none' && settings.negs == 'no') {
    output += '2\n'; //don't track power and neg stats if there are neither powers nor negs
  }
  else {
    output += '3\n'; //track power and neg stats
  }
  output += '0\n'; // no lightning rounds
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

/*---------------------------------------------------------
Returns the specified number of newline characters
---------------------------------------------------------*/
function blankLines(n) {
  var output = '';
  for(var i=1; i<=n; i++) {
    output += '\n';
  }
  return output;
}

/*---------------------------------------------------------
The suffixes for the html files.
---------------------------------------------------------*/
function fileSuffixes() {
  var output = '';
  output += '_rounds.html\n';
  output += '_standings.html\n';
  output += '_individuals.html\n';
  output += '_games.html\n';
  output += '_teamdetail.html\n';
  output += '_playerdetail.html\n';
  output += '_statkey.html\n';
  return output;
}

/*---------------------------------------------------------
The number of divisions, then the list of division names.
---------------------------------------------------------*/
function divisionList(divisions) {
  if(divisions == undefined || divisions.length == 0) { return '0\n'; }
  var output = '';
  output += divisions.length + '\n';
  output += divisions.join('\n') + '\n';
  return output;
}

/*---------------------------------------------------------
The number of teams, then the 0-indexed number of the
division each team is assigned to.
---------------------------------------------------------*/
function divisionAssignments(phase, divisions, teams) {
  var output = '';
  output += teams.length + '\n';
  if(divisions == undefined || divisions.length == 0) {
    for(var i in teams) { //if not using divisions, just -1
      output += '-1\n';
    }
    return output;
  }
  for(var i in teams) {
    var t = teams[i];
    var div = t.divisions[phase];
    var index = divisions.indexOf(div);
    output += index + '\n'; //use the -1 if not found because that's how SQBS does it
  }
  return output;
}

/*---------------------------------------------------------
The list of possible tossup point values, padded with
zeroes to four lines.
---------------------------------------------------------*/
function pointValueList(settings) {
  var output = '';
  var pointCatCounter = 0;
  if(settings.powers == '20pts') {
    output += '20\n';
    pointCatCounter++;
  }
  else if(settings.powers == '15pts') {
    output += '15\n';
    pointCatCounter++;
  }
  output += '10\n';
  pointCatCounter++;
  if(settings.negs == 'yes') {
    output += '-5\n';
    pointCatCounter++;
  }
  while(pointCatCounter < 4) { //there must be exactly four lines
    output += '0\n';
    pointCatCounter++;
  }
  return output;
}

/*---------------------------------------------------------
The number of named packets (including blanks), follwed by
the list of packet names
---------------------------------------------------------*/
function packetNamesSqbs(packets, gameIndex) {
  if(!packetNamesExist(packets)) {
    return '0\n';
  }
  var output = '';
  var packetRounds = getPacketRounds(packets, gameIndex);
  output += packetRounds.length + '\n';
  var packetName;
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
function exhibitionStatuses(teams) {
  var output = '';
  output += teams.length + '\n';
  for(var i in teams) {
    output += '0\n';
  }
  return output;
}

/*---------------------------------------------------------
Generate the SQBS file contents.
---------------------------------------------------------*/
function getSqbsFile(settings, viewingPhase, groupingPhase, divisions, teams, games, packets, gameIndex) {
  var output = teamList(teams);
  output += gameList(settings, teams, games, viewingPhase);
  output += miscSettings(settings, divisions);
  output += blankLines(5); // tournament name + FTP settings. Leave blank
  output += '1\n'; // weird FTP setting. This is the default
  output += fileSuffixes();
  output += blankLines(1);
  output += divisionList(divisions);
  output += divisionAssignments(groupingPhase, divisions, teams);
  output += pointValueList(settings);
  output += packetNamesSqbs(packets, gameIndex);
  output += exhibitionStatuses(teams);
  return output;
}
