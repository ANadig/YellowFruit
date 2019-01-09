//SqbsUtils.js - contains the code for generating the SQBS-format files


//the first part of the file
/*
number of teams
for each team:
  number of players + 1
  team name
  for each player:
    player name
*/
function teamList(teams) {
  var output = '';
  output += teams.length + '\n';
  for(var i in teams) {
    var t = teams[i];
    output += (t.roster.length + 1) + '\n';
    output += t.teamName + '\n';
    output += t.roster.join('\n') + '\n';
    // for(var j in t.roster) {
    //   output += t.roster[j] + '\n';
    // }
  }
  return output;
}

//the Game ID in SQBS. User doesn't enter this in YellowFruit, so
//we generate one, e.g. "R1-Central A-West B"
function gameID(g) {
  return 'R' + g.round + '-' + g.team1 + '-' + g.team2;
}

//pads a number to four digits with leading zeros
//returns a string
function padFour(x) {
  var s = x.toString();
  if(s.length >= 4) { return s; }
  for(var i=s.length; i<4; i++) {
    s = '0' + s;
  }
  return s;
}

//one player's stat line for a game
function addOnePlayer(settings, teams, game, whichTeam, playerName) {
  var output = '';
  var teamName = whichTeam == 1 ? game.team1 : game.team2;
  var teamObj = teams.find((t) => { return t.teamName == teamName; });
  var playerIdx = teamObj.roster.indexOf(playerName);
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
  while(pointCatCounter < 4) { //there must be exactly four lines
    output += '0\n';
    pointCatCounter++;
  }
  //total points
  output += (powers*powerValue(settings) + tens*10 + negs*negValue(settings)) + '\n';

  return output;
}

//add a placeholder player to pad games to eight player stat lines per team
function dummyPlayer() {
  return '-1\n0\n0\n0\n0\n0\n0\n';
}

//the list of games
function gameList(settings, teams, games) {
  var output = '';
  output += games.length + '\n';
  for(var i in games) {
    var g = games[i];
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
    output += g.tuhtot + '\n';
    output += g.round + '\n';
    //bonuses
    if(settings.bonuses == 'noBb') {
      output += bonusesHeard(g, 1) + '\n';
      output += bonusPoints(g, 1, settings) + '\n';
      output += bonusesHeard(g, 2) + '\n';
      output += bonusPoints(g, 2, settings) + '\n';
    }
    else if(settings.bonuses == 'yesBb') {
      output += bbHrdToFloat(bbHeard(g, 1, settings)).toFixed(0);
      output += padFour(bonusesHeard(g, 1)) + '\n';
      output += g.bbPts1;
      output += padFour(bonusPoints(g, 1, settings)) + '\n';
      output += bbHrdToFloat(bbHeard(g, 2, settings)).toFixed(0);
      output += padFour(bonusesHeard(g, 2)) + '\n';
      output += g.bbPts2;
      output += padFour(bonusPoints(g, 2, settings)) + '\n';
    }
    else { // no bonuses, so just fill with zeros
      output += '0\n0\n0\n0\n';
    }
    //overtime
    output += g.ottu>0 ? '1\n' : '0\n';
    output += (toNum(g.otPwr1) + toNum(g.otTen1)) + '\n';
    output += (toNum(g.otPwr2) + toNum(g.otTen2)) + '\n';
    //forfeit?
    output += g.forfeit ? '1\n' : '0\n';
    //lightning rounds. Don't exist here, so just add zeroes
    output += '0\n';
    output += '0\n';
    //eight lines of player stats; further lines will be ignored
    var gamePlayers1 = Object.keys(g.players1);
    var gamePlayers2 = Object.keys(g.players2);
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

  return output;
}

//other SQBS settings. Many of these don't matter much
function miscSettings(settings, divisions) {
  var output = '';
  output += '1\n'; //turn on bonus conversion tracking
  output += '1\n'; //turn on automatic bonus calculation
  if(settings.powers == 'none' && settings.negs == 'no') {
    output += '2\n'; //don't track power and neg stats if there are neither powers nor negs
  }
  else {
    output += '3\n'; //track power and neg stats
  }
  output += '0\n'; // no lightning rounds
  output += '1\n'; //track tossups heard
  output += '1\n'; //sort players by Pts/TUH
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

//the specified number of newline characters
function blankLines(n) {
  var output = '';
  for(var i=1; i<=n; i++) {
    output += '\n';
  }
  return output;
}

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

//the number of divisions, then the list of divisions
function divisionList(divisions) {
  if(divisions == undefined || divisions.length == 0) { return '0\n'; }
  var output = '';
  output += divisions.length + '\n';
  output += divisions.join('\n') + '\n';
  return output;
}

//the number of teams, then the division each team is assigned to
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

//the list of possible tossup point values (padded with zeroes to four lines)
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

//YellowFruit doesn't support exhibition teams, so it's all zeroes
function exhibitionStatuses(teams) {
  var output = '';
  output += teams.length + '\n';
  for(var i in teams) {
    output += '0\n';
  }
  return output;
}

//returns the entire SQBS file contents
function getSqbsFile(settings, phase, divisions, teams, games) {
  var output = teamList(teams);
  output += gameList(settings, teams, games);
  output += miscSettings(settings, divisions);
  output += blankLines(5); // tournament name + FTP settings. Leave blank
  output += '1\n'; // weird FTP setting. This is the default
  output += fileSuffixes();
  output += blankLines(1);
  output += divisionList(divisions);
  output += divisionAssignments(phase, divisions, teams);
  output += pointValueList(settings);
  output += '0\n'; // not using packet names
  output += exhibitionStatuses(teams);
  return output;
}
