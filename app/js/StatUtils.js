//Statutils.js - contains the code for generating the html report

var _ = require('lodash');

//bonusesHeard for a single game
function bonusesHeard (game, whichTeam) {
  var tot = 0, pwr, gt;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    gt = parseFloat(players[p]["gets"]);
    tot = isNaN(pwr) ? tot : tot+pwr;
    tot = isNaN(gt) ? tot : tot+gt;
  }
  return tot;
}

//bonus points for a single game
function bonusPoints(game, whichTeam) {
  var tuPts = 0, pwr, gt, ng;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  var totalPoints = whichTeam == 1 ? game.score1 : game.score2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    gt = parseFloat(players[p]["gets"]);
    ng = parseFloat(players[p]["negs"]);
    tuPts = isNaN(pwr) ? tuPts : tuPts+(15*pwr);
    tuPts = isNaN(gt) ? tuPts : tuPts+(10*gt);
    tuPts = isNaN(ng) ? tuPts : tuPts-(5*ng)
  }
  return parseFloat(totalPoints) - tuPts;
}

//number of powers for a single team in a single game
function teamPowers(game, whichTeam) {
  var totPowers = 0, pwr;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    totPowers = isNaN(pwr) ? totPowers : totPowers+pwr
  }
  return totPowers;
}

//number of 10s for a single team in a single game
function teamGets(game, whichTeam) {
  var totGets = 0, gt;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    gt = parseFloat(players[p]["gets"]);
    totGets = isNaN(gt) ? totGets : totGets+gt;
  }
  return totGets;
}

//number of negs for a single team in a single game
function teamNegs(game, whichTeam) {
  var totNegs = 0, ng;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    ng = parseFloat(players[p]["negs"]);
    totNegs = isNaN(ng) ? totNegs : totNegs+ng;
  }
  return totNegs;
}

//tuh-powers-gets-negs for a player, as an int
function playerSlashLine(player) {
  var tuh = parseFloat(player.tuh);
  var pwr = parseFloat(player.powers);
  var gt = parseFloat(player.gets);
  var ng = parseFloat(player.negs);
  return [isNaN(tuh) ? 0 : tuh, isNaN(pwr) ? 0 : pwr,
    isNaN(gt) ? 0 : gt, isNaN(ng) ? 0 : ng];
}

//header row of the team standings
function standingsHeader() {
  return '<tr>' + '\n' +
  '<td ALIGN=LEFT><B>Rank</B></td>' + '\n' +
  '<td ALIGN=LEFT><B>Team</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>W</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>L</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>T</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>Pct</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>PPG</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>PAPG</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>Mrg</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>15</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>10</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>-5</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>TUH</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>PPTH</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>P/N</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>G/N</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>BHrd</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>BPts</B></td>' + '\n' +
  '<td ALIGN=RIGHT><B>PPB</B></td>' + '\n' +
  '</tr>'
}

//one row in the team standings
function standingsRow(teamEntry, rank) {
  var rowHtml = '<tr>';
  rowHtml += '<td ALIGN=LEFT>' + rank + '</td>' + '\n';
  rowHtml += '<td ALIGN=LEFT>' + '<A HREF=teamdetail.html#>' + teamEntry.teamName + '</A>' + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.wins + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.losses + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.ties + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.winPct + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.ppg + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.papg + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.margin + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.powers + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.gets + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.negs + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.tuh + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.ppth + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.pPerN + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.gPerN + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.bHeard + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.bPts + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + teamEntry.ppb + '</td>' + '\n';
  return rowHtml + '</tr>';
}

//gather data for the team standings
function compileStandings(myTeams, myGames) {
  var standings = myTeams.map(function(item, index) {
    var obj =
      { teamName: item.teamName,
        wins: 0,
        losses: 0,
        ties: 0,
        winPct: 0,
        ppg: 0,
        papg: 0,
        margin: 0,
        powers: 0,
        gets: 0,
        negs: 0,
        tuh: 0,
        ppth: 0,
        pPerN: 0,
        gPerN: 0,
        bHeard: 0,
        bPts: 0,
        ppb: 0,
        points: 0,
        ptsAgainst: 0,
      };
    return obj;
  }); //map

  for(var i in myGames) {
    var g = myGames[i];
    var team1Line = _.find(standings, function (o) {
      return o.teamName == g.team1;
    });
    var team2Line = _.find(standings, function (o) {
      return o.teamName == g.team2;
    });
    if(g.score1 > g.score2) {
      team1Line.wins += 1;
      team2Line.losses += 1;
    }
    else if(g.score2 > g.score1) {
      team1Line.losses += 1;
      team2Line.wins += 1;
    }
    else { //it's a tie
      team1Line.ties += 1;
      team2Line.ties += 1;
    }
    team1Line.points += parseFloat(g.score1);
    team2Line.points += parseFloat(g.score2);
    team1Line.ptsAgainst += parseFloat(g.score2);
    team2Line.ptsAgainst += parseFloat(g.score1);

    team1Line.tuh += parseFloat(g.tuhtot);
    team2Line.tuh += parseFloat(g.tuhtot);

    team1Line.powers += teamPowers(g, 1);
    team2Line.powers += teamPowers(g, 2);
    team1Line.gets += teamGets(g, 1);
    team2Line.gets += teamGets(g, 2);
    team1Line.negs += teamNegs(g, 1);
    team2Line.negs += teamNegs(g, 2);

    team1Line.bHeard += bonusesHeard(g,1);
    team2Line.bHeard += bonusesHeard(g,2);
    team1Line.bPts += bonusPoints(g,1);
    team2Line.bPts += bonusPoints(g,2);
  }

  for(var i in standings) {
    var t = standings[i];
    var gamesPlayed = t.wins + t.losses + t.ties;
    var winPct = gamesPlayed == 0 ? 0 : (t.wins + t.ties/2) / gamesPlayed;
    var ppg = gamesPlayed == 0 ? 0 : t.points / gamesPlayed;
    var papg = gamesPlayed == 0 ? 0 : t.ptsAgainst / gamesPlayed;
    var margin = ppg - papg;
    var ppth = t.tuh == 0 ? 0 : t.points / t.tuh;
    var pPerN = t.negs == 0 ? 0 : t.powers / t.negs;
    var gPerN = t.negs == 0 ? 0 : t.gets / t.negs;
    var ppb = t.bHeard == 0 ? 0 : t.bPts / t.bHeard;

    t.winPct = winPct.toFixed(3);
    t.ppg = ppg.toFixed(1);
    t.papg = papg.toFixed(1);
    t.margin = margin.toFixed(1);
    t.ppth = ppth.toFixed(2);
    t.pPerN = pPerN.toFixed(2);
    t.gPerN = gPerN.toFixed(2);
    t.ppb = ppb.toFixed(2);
  }

  return _.orderBy(standings, ['winPct', 'ppg'], ['desc', 'desc']);
} //compileStandings

//the header for the table in the individual standings
function individualsHeader() {
  return '<tr>' + '\n' +
    '<td ALIGN=LEFT><B>Rank</B></td>' + '\n' +
    '<td ALIGN=LEFT><B>Player</B></td>' + '\n' +
    '<td ALIGN=LEFT><B>Team</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>GP</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>15</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>10</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>-5</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>TUH</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/TU</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>G/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>Pts</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PPG</B></td>' + '\n' +
    '</tr>';
}

//a single row in the individual standings
function individualsRow(playerEntry, rank) {
  var rowHtml = '<tr>' + '\n';
  rowHtml += '<td ALIGN=LEFT>' + rank + '</td>' + '\n';
  rowHtml += '<td ALIGN=LEFT><A HREF=playerdetail.html#>' + playerEntry.playerName + '</A></td>' + '\n';
  rowHtml += '<td ALIGN=LEFT>' + playerEntry.teamName + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.gamesPlayed + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.powers + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.gets + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.negs + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.tuh + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.pptu + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.pPerN + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.gPerN + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.points + '</td>' + '\n';
  rowHtml += '<td ALIGN=RIGHT>' + playerEntry.ppg + '</td>' + '\n';
  return rowHtml + '</tr>';
}

//calculate each column of data for the individual standings page
function compileIndividuals(myTeams, myGames) {
  var individuals = [];
  for(var i in myTeams) {
    var t = myTeams[i];
    for(var j in t.roster) {
      var obj = {
        playerName: t.roster[j],
        teamName: t.teamName,
        division: '', //not implemented yet
        gamesPlayed: 0,
        powers: 0,
        gets: 0,
        negs: 0,
        tuh: 0,
        pptu: 0,
        pPerN: 0,
        gPerN: 0,
        points: 0,
        ppg: 0
      }
      individuals.push(obj);
    }
  }
  for(var i in myGames) {
    var pEntry, tuh;
    var g = myGames[i];
    var players1 = g.players1, players2 = g.players2;
    for(var p in players1) {
      pEntry = _.find(individuals, function (o) {
        return o.teamName == g.team1 && o.playerName == p;
      });
      var [tuh, powers, gets, negs] = playerSlashLine(players1[p]);
      pEntry.gamesPlayed += tuh / parseFloat(g.tuhtot);
      pEntry.powers += powers;
      pEntry.gets += gets;
      pEntry.negs += negs;
      pEntry.tuh += tuh;
    }
    for(var p in players2) {
      pEntry = _.find(individuals, function (o) {
        return o.teamName == g.team2 && o.playerName == p;
      });
      var [tuh, powers, gets, negs] = playerSlashLine(players2[p]);
      pEntry.gamesPlayed += tuh / parseFloat(g.tuhtot);
      pEntry.powers += powers;
      pEntry.gets += gets;
      pEntry.negs += negs;
      pEntry.tuh += tuh;
    }
  } //for loop for each game

  for(var i in individuals) {
    var p = individuals[i];
    var pPerN = p.negs == 0 ? 0 : p.powers / p.negs;
    var gPerN = p.negs == 0 ? 0 : p.gets / p.negs;
    var totPoints = p.powers*15 + p.gets*10 - p.negs*5;
    var pptu = p.tuh == 0 ? 0 : totPoints / p.tuh;
    var ppg = p.gamesPlayed == 0 ? 0 : totPoints / p.gamesPlayed;

    p.gamesPlayed = p.gamesPlayed.toFixed(1);
    p.pptu = pptu.toFixed(2);
    p.pPerN = pPerN.toFixed(2);
    p.gPerN = gPerN.toFixed(2);
    p.points = totPoints;
    p.ppg = ppg.toFixed(2);
  }

  return _.orderBy(individuals, function(item) {
    return parseFloat(item.ppg);
  }, ['desc']);
} //compileIndividuals

//a list of the rounds for which there are games
function getRoundsForScoreboard(myGames) {
  var rounds = [];
  for(var i in myGames) {
    var roundNo = parseFloat(myGames[i].round);
    if(!rounds.includes(roundNo)) {
      rounds.push(roundNo);
    }
  }
  return rounds.sort(function(a,b){ return a-b });
}

//the header for each section of the scoreboard
function scoreboardRoundHeader(roundNo) {
  return '<FONT SIZE=+1 COLOR=red>Round ' + roundNo + '</FONT>';
}

//the html for all the game summaries for a single round
function scoreboardGameSummaries(myGames, roundNo) {
  var html = '';
  for(var i in myGames) {
    var g = myGames[i];
    if(g.round == roundNo) {
      html += '<p>' + '\n';
      html += '<FONT SIZE=+1>' + g.team1 + ' ' + g.score1 + ', ' + g.team2 + ' ' + g.score2;
      if(g.ottu > 0) {
        html += ' (OT)';
      }
      html += '</FONT><br>' + '\n' +
        '<FONT SIZE=-1>' + '\n';
      html += g.team1 + ': ';
      for(var p in g.players1) {
        var [tuh, pwr, gt, ng] = playerSlashLine(g.players1[p]);
        html += p + ' ' + pwr + ' ' + gt + ' ' + ng + ' ' + (15*pwr + 10*gt - 5*ng) + ', ';
      }
      html = html.substr(0, html.length - 2); //remove the last comma+space
      html += '<br>' + '\n';
      html += g.team2 + ': ';
      for(var p in g.players2) {
        var [tuh, pwr, gt, ng] = playerSlashLine(g.players2[p]);
        html += p + ' ' + pwr + ' ' + gt + ' ' + ng + ' ' + (15*pwr + 10*gt - 5*ng) + ', ';
      }
      html = html.substr(0, html.length - 2); //remove the last comma+space
      html += '<br>' + '\n';
      var bHeard = bonusesHeard(g, 1), bPts = bonusPoints(g, 1);
      var ppb = bHeard == 0 ? 0 : bPts / bHeard;
      html += 'Bonuses: ' + g.team1 + ' ' + bHeard + ' ' + bPts + ' ' + ppb.toFixed(2) + ', ';
      bHeard = bonusesHeard(g, 2), bPts = bonusPoints(g, 2);
      ppb = bHeard == 0 ? 0 : bPts / bHeard;
      html += g.team2 + ' ' + bHeard + ' ' + bPts + ' ' + ppb.toFixed(2) + '<br>';
    }
  }
  return html + '</FONT>' + '\n' + '</p>' + '\n';
}

//header row for the list of a team's games on the team detail page
function teamDetailGameTableHeader() {
  return '<tr>' + '\n' +
    '<td ALIGN=LEFT><B>Opponent</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>Result</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PF</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PA</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>15</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>10</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>-5</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>TUH</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PPTH</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>G/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>BHrd</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>BPts</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PPB</B></td>' + '\n' +
    '</tr>'  + '\n';
}

//team detail row for a single game for a single team
function teamDetailGameRow(game, whichTeam) {
  var opponent, opponentScore, result, score, players;
  if(whichTeam == 1) {
    opponent = game.team2;
    if(game.score1 > game.score2) { result = 'W'; }
    else if(game.score1 < game.score2) { result = 'L'; }
    else {result = 'T'; }
    score = game.score1;
    opponentScore = game.score2;
    players = game.players1;
  }
  else {
    opponent = game.team1;
    if(game.score2 > game.score1) { result = 'W'; }
    else if(game.score2 < game.score1) { result = 'L'; }
    else {result = 'T'; }
    score = game.score2;
    opponentScore = game.score1;
    players = game.players2;
  }
  var powers = teamPowers(game, whichTeam);
  var gets = teamGets(game, whichTeam);
  var negs = teamNegs(game, whichTeam);
  var ppth = score / game.tuhtot;
  var pPerN = negs == 0 ? 0 : powers / negs;
  var gPerN = negs == 0 ? 0 : gets / negs;
  var bHeard = bonusesHeard(game, whichTeam);
  var bPts = bonusPoints(game, whichTeam);
  var ppb = bHeard == 0 ? 0 : bPts / bHeard;

  var html = '<tr>' + '\n';
  html += '<td ALIGN=LEFT>' + opponent + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + result + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + score + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + opponentScore + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + powers + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + gets + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + negs + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + game.tuhtot + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + ppth.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + pPerN.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + gPerN.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + bHeard + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + bPts + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + ppb.toFixed(2) + '</td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

//the totals row of a games table in the team detail page
function teamDetailTeamSummaryRow(teamSummary) {
  var html = '<tr>' + '\n';
  html += '<td ALIGN=LEFT><B>Total</B></td>' + '\n';
  html += '<td></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.points + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.ptsAgainst + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.powers + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.gets + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.negs + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.tuh + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.ppth + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.pPerN + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.gPerN + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.bHeard + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.bPts + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + teamSummary.ppb + '</B></td>' + '\n';
  html += '</tr>' + '\n';

  return html;
}

//header row for the list of a team's players on the team detail page
function teamDetailPlayerTableHeader() {
  return '<tr>' + '\n' +
    '<td ALIGN=LEFT><B>Player</B></td>' + '\n' +
    '<td ALIGN=LEFT><B>Team</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>GP</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>15</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>10</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>-5</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>TUH</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/TU</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>G/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>Pts</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>PPG</B></td>' + '\n' +
    '</tr>' + '\n';
}

//team detail row for a single player
function teamDetailPlayerRow(player) {
  var html = '<tr>' + '\n';
  html += '<td ALIGN=LEFT>' + player.playerName + '</td>' + '\n';
  html += '<td ALIGN=LEFT>' + player.teamName + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.gamesPlayed + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.powers + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.gets + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.negs + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.tuh + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.pptu + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.pPerN + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.gPerN + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.points + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + player.ppg + '</td>' + '\n';
  html += '</tr>' + '\n';

  return html;
}

//header row for a table on the player detail page
function playerDetailTableHeader() {
  return '<tr>' + '\n' +
    '<td ALIGN=LEFT><B>Opponent</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>GP</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>15</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>10</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>-5</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>TUH</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/TU</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>P/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>G/N</B></td>' + '\n' +
    '<td ALIGN=RIGHT><B>Pts</B></td>' + '\n' +
    '</tr>' + '\n';
}

//row for one player's game on the player detail page
function playerDetailGameRow(player, tuhtot, opponent) {
  var [tuh, powers, gets, negs] = playerSlashLine(player);
  if(tuh <= 0) {
    return '';
  }
  var gp = tuh / tuhtot;
  var points = 15*powers + 10*gets - 5*negs;
  var pptu = points / tuh;
  var pPerN = negs == 0 ? 0 : powers / negs;
  var gPerN = negs == 0 ? 0 : gets / negs;

  var html = '<tr>' + '\n';
  html += '<td ALIGN=LEFT>' + opponent + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + gp.toFixed(1) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + powers + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + gets + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + negs + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + tuh + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + pptu.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + pPerN.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + gPerN.toFixed(2) + '</td>' + '\n';
  html += '<td ALIGN=RIGHT>' + points + '</td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

//total row on the player detail page, using totals from compileIndividuals
function playerDetailTotalRow(player) {
  var html = '<tr>' + '\n';
  html += '<td ALIGN=LEFT><B>Total</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.gamesPlayed + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.powers + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.gets + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.negs + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.tuh + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.pptu + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.pPerN + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.gPerN + '</B></td>' + '\n';
  html += '<td ALIGN=RIGHT><B>' + player.points + '</B></td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

//aggregate round data for the round report
function compileRoundSummaries(games) {
  var summaries = [];
  for(var i in games) {
    var game = games[i];
    var round = game.round;
    if(summaries[round] == undefined) {
      summaries[round] = {
        numberOfGames: 0,
        totalPoints: 0,
        tuPts: 0,
        tuh: 0,
        bPts: 0,
        bHeard: 0,
        ppg: 0,
        tuPtsPTu: 0,
        ppb: 0
      }
    }
    if(!game.forfeit) {
      var smry = summaries[round];
      smry.numberOfGames += 1;
      smry.totalPoints += parseFloat(game.score1) + parseFloat(game.score2);
      smry.tuPts += 15*teamPowers(game, 1) + 15*teamPowers(game, 2) +
        10*teamGets(game, 1) + 10*teamGets(game, 2) -
        5*teamNegs(game, 1) - 5*teamNegs(game, 2);
      smry.tuh += parseFloat(game.tuhtot);
      smry.bPts += bonusPoints(game, 1) + bonusPoints(game, 2);
      smry.bHeard += bonusesHeard(game, 1) + bonusesHeard(game, 2);
    }
  }
  for(var i in summaries) {
    var smry = summaries[i];
    smry.ppg = smry.totalPoints / (2 * smry.numberOfGames);
    smry.tuPtsPTu = smry.tuPts / smry.tuh;
    smry.ppb = smry.bHeard == 0 ? 0 : smry.bPts / smry.bHeard;
  }
  return summaries;
}

//the header row for the round report
function roundReportTableHeader() {
  return '<tr>' + '\n' +
    '<td><B>Round</B></td>' + '\n' +
    '<td><B>PPG/Team</B></td>' + '\n' +
    '<td><B>TUPts/TUH</B></td>' + '\n' +
    '<td><B>PPB</B></td>' + '\n' +
    '</tr>' + '\n';
}

//a row of data in the round report
function roundReportRow(smry, roundNo) {
  return '<tr>' + '\n' +
    '<td>' + roundNo + '</td>' + '\n' +
    '<td>' + smry.ppg.toFixed(1) + '</td>' + '\n' +
    '<td>' + smry.tuPtsPTu.toFixed(2) + '</td>' + '\n' +
    '<td>' + smry.ppb.toFixed(2) + '</td>' + '\n' +
    '</tr>' + '\n';
}

//the links that appear at the top of every page in the report
function getStatReportTop() {
  return '<HTML>' + '\n' +
    '<HEAD>' + '\n' +
    '<TITLE>  Team Standings </TITLE>' + '\n' +
    '</HEAD>' + '\n' +
    '<BODY>' + '\n' +
    '<table border=0 width=100%>' + '\n' +
    '<tr>' + '\n' +
      '<td><A HREF=standings.html>Standings</A></td>' + '\n' +
      '<td><A HREF=individuals.html>Individuals</A></td>' + '\n' +
      '<td><A HREF=games.html>Scoreboard</A></td>' + '\n' +
      '<td><A HREF=teamdetail.html>Team Detail</A></td>' + '\n' +
      '<td><A HREF=playerdetail.html>Individual Detail</A></td>' + '\n' +
      '<td><A HREF=rounds.html>Round Report</A></td>' + '\n' +
      '<td><A HREF=statkey.html#TeamStandings>Stat Key</A></td>' + '\n' +
    '</tr>' + '\n' +
    '</table>' + '\n';
}

//closing tags at the end of the page
function getStatReportBottom() {
  return '</BODY>' + '\n' +
  '</HTML>';
}

function getStandingsHtml(teams, games) {
  var standings = compileStandings(teams, games);
  var html = getStatReportTop() +
    '<H1> Team Standings</H1>' + '\n' +
    '<table border=1 width=100%>' + standingsHeader();
  for(var i in standings) {
    html += standingsRow(standings[i], parseFloat(i)+1);
  }
  return html + '\n' + '</table>' + '\n' + getStatReportBottom();
}//getStandingsHtml

function getIndividualsHtml(teams, games) {
  var individuals = compileIndividuals(teams, games);
  var html = getStatReportTop() +
    '<H1> Individual Statistics</H1>' + '\n' +
    '<table border=1 width=100%>' + individualsHeader();
  for(var i in individuals) {
    html += individualsRow(individuals[i], parseFloat(i)+1);
  }
  return html + '\n' + '</table>' + '\n' +  getStatReportBottom();
}

function getScoreboardHtml(teams, games) {
  var html = getStatReportTop() +
    '<H1> Scoreboard</H1>' + '\n';
  var roundList = getRoundsForScoreboard(games);
  for(var r in roundList) {
    html += scoreboardRoundHeader(roundList[r]);
    html += scoreboardGameSummaries(games, roundList[r]);
  }
  return html + '\n' + getStatReportBottom();
}

function getTeamDetailHtml(teams, games) {
  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return parseFloat(item.round); }, 'asc');
  var standings = compileStandings(teams, games);
  var individuals = compileIndividuals(teams, games);

  var html = getStatReportTop() + '\n' +
    '<H1> Team Detail</H1>'+ '<br>' + '\n';
  for(var i in teams) {
    var teamName = teams[i].teamName;
    html += '<H2>' + teams[i].teamName + '</H2>' + '\n';
    html += '<table border=1 width=100%>' + '\n';
    html += teamDetailGameTableHeader() + '\n';
    for(var j in games) {
      if(games[j].team1 == teamName) {
        html += teamDetailGameRow(games[j], 1);
      }
      else if(games[j].team2 == teamName) {
        html += teamDetailGameRow(games[j], 2);
      }
    }
    var teamSummary = _.find(standings, function(o) { return o.teamName == teamName; });
    html += teamDetailTeamSummaryRow(teamSummary);
    html += '</table>' + '<br>' + '\n';
    html += '<table border=1 width=100%>' + '\n';
    html += teamDetailPlayerTableHeader() + '\n';
    for(var i in individuals) {
      if(individuals[i].teamName == teamName) {
        html += teamDetailPlayerRow(individuals[i]);
      }
    }
    html += '</table>' + '<br>' + '\n';
  }
  return html + getStatReportBottom();
}

function getPlayerDetailHtml(teams, games) {
  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return parseFloat(item.round); }, 'asc');
  var playerTotals = compileIndividuals(teams, games);
  playerTotals = _.orderBy(playerTotals,
    [function(item) { return item.teamName.toLowerCase(); },
    function(item) { return item.playerName.toLowerCase(); }],
    ['asc', 'asc']);

  var html = getStatReportTop() +
    '<H1> Individual Detail</H1>' + '<br>' + '\n';

  for(var i in playerTotals) {
    var indvTot = playerTotals[i];
    html += '<H2>' + indvTot.playerName + ', ' + indvTot.teamName + '</H2>' + '\n';
    html += '<table border=1 width=100%>' + '\n';
    html += playerDetailTableHeader();
    for(var j in games) {
      var game = games[j];
      if (game.team1 == indvTot.teamName) {
        for(var p in game.players1) {
          if(p == indvTot.playerName) {
            html += playerDetailGameRow(game.players1[p], game.tuhtot, game.team2);
          }
        }
      }
      else if (game.team2 == indvTot.teamName) {
        for(var p in game.players2) {
          if(p == indvTot.playerName) {
            html += playerDetailGameRow(game.players2[p], game.tuhtot, game.team1);
          }
        }
      }
    }
    html += playerDetailTotalRow(indvTot);
    html += '</table>' + '<br>' + '\n';
  }//loop over all players in the tournament

  return html + getStatReportBottom();
}

function getRoundReportHtml(teams, games) {
  games = _.orderBy(games, function(item) { return parseFloat(item.round); }, 'asc');
  var roundSummaries = compileRoundSummaries(games);
  var html = getStatReportTop() +
    '<H1> Round Report</H1>' + '\n';
  html += '<table border=1 width=100%>' + '\n';
  html += roundReportTableHeader();
  for(var i in roundSummaries) {
    html += roundReportRow(roundSummaries[i], i);
  }
  html += '</table>' + '\n';
  return html + getStatReportBottom();
}
