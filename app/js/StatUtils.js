//Statutils.js - contains the code for generating the html report

var _ = require('lodash');

//wrapper around toFixed that handles divide-by-zero
//anything negative is a dummy value indicating a zero denominator
function formatRate(r, precision) {
  return isNaN(r) ? '&mdash;&ensp;' : r.toFixed(precision);
}

//bonusesHeard for a single game
function bonusesHeard (game, whichTeam) {
  var tot = 0, pwr, gt;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    gt = parseFloat(players[p]["tens"]);
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
    gt = parseFloat(players[p]["tens"]);
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
function teamTens(game, whichTeam) {
  var totTens = 0, gt;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    gt = parseFloat(players[p]["tens"]);
    totTens = isNaN(gt) ? totTens : totTens+gt;
  }
  return totTens;
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

//tuh-powers-tens-negs for a player, as an int
function playerSlashLine(player) {
  var tuh = parseFloat(player.tuh);
  var pwr = parseFloat(player.powers);
  var gt = parseFloat(player.tens);
  var ng = parseFloat(player.negs);
  return [isNaN(tuh) ? 0 : tuh, isNaN(pwr) ? 0 : pwr,
    isNaN(gt) ? 0 : gt, isNaN(ng) ? 0 : ng];
}

//header row of the team standings
function standingsHeader() {
  return '<tr>' + '\n' +
  '<td align=left><b>Rank</b></td>' + '\n' +
  '<td align=left><b>Team</b></td>' + '\n' +
  '<td align=right><b>W</b></td>' + '\n' +
  '<td align=right><b>L</b></td>' + '\n' +
  '<td align=right><b>T</b></td>' + '\n' +
  '<td align=right><b>Pct</b></td>' + '\n' +
  '<td align=right><b>PPG</b></td>' + '\n' +
  '<td align=right><b>PAPG</b></td>' + '\n' +
  '<td align=right><b>Mrg</b></td>' + '\n' +
  '<td align=right><b>15</b></td>' + '\n' +
  '<td align=right><b>10</b></td>' + '\n' +
  '<td align=right><b>-5</b></td>' + '\n' +
  '<td align=right><b>TUH</b></td>' + '\n' +
  '<td align=right><b>PPTH</b></td>' + '\n' +
  '<td align=right><b>P/N</b></td>' + '\n' +
  '<td align=right><b>G/N</b></td>' + '\n' +
  '<td align=right><b>BHrd</b></td>' + '\n' +
  '<td align=right><b>BPts</b></td>' + '\n' +
  '<td align=right><b>PPB</b></td>' + '\n' +
  '</tr>'
}

//one row in the team standings
function standingsRow(teamEntry, rank) {
  var linkId = teamEntry.teamName.replace(/\W/g, '');
  var rowHtml = '<tr>';
  rowHtml += '<td align=left>' + rank + '</td>' + '\n';
  rowHtml += '<td align=left>' + '<a href=\"teamdetail.html#' + linkId + '\">' +
    teamEntry.teamName + '</a>' + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.wins + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.losses + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.ties + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.winPct + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.ppg + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.papg + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.margin + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.powers + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.tens + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.negs + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.tuh + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.ppth + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.pPerN + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.gPerN + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.bHeard + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.bPts + '</td>' + '\n';
  rowHtml += '<td align=right>' + teamEntry.ppb + '</td>' + '\n';
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
        tens: 0,
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
        forfeits: 0
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
    if(g.forfeit) { //team1 is by default the winner of a forfeit
      team1Line.wins += 1;
      team2Line.losses += 1;
      team1Line.forfeits += 1;
      team2Line.forfeits += 1;
    }
    else { //not a forfeit
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
      team1Line.tens += teamTens(g, 1);
      team2Line.tens += teamTens(g, 2);
      team1Line.negs += teamNegs(g, 1);
      team2Line.negs += teamNegs(g, 2);

      team1Line.bHeard += bonusesHeard(g,1);
      team2Line.bHeard += bonusesHeard(g,2);
      team1Line.bPts += bonusPoints(g,1);
      team2Line.bPts += bonusPoints(g,2);
    }
  }//loop over all games

  for(var i in standings) {
    var t = standings[i];
    var gamesPlayed = t.wins + t.losses + t.ties - t.forfeits;
    var gamesPlayedWithForfeits = t.wins + t.losses + t.ties;
    var winPct = gamesPlayedWithForfeits == 0 ?
      0 : (t.wins + t.ties/2) / gamesPlayedWithForfeits;
    var ppg = gamesPlayed == 0 ? 'inf' : t.points / gamesPlayed;
    var papg = gamesPlayed == 0 ? 'inf' : t.ptsAgainst / gamesPlayed;
    var margin = ppg - papg;
    if(isNaN(margin)) margin = 0;
    var ppth = t.tuh == 0 ? 'inf' : t.points / t.tuh;
    var pPerN = t.negs == 0 ? 'inf' : t.powers / t.negs;
    var gPerN = t.negs == 0 ? 'inf' : (t.powers + t.tens) / t.negs;
    var ppb = t.bHeard == 0 ? 'inf' : t.bPts / t.bHeard;

    t.winPct = winPct.toFixed(3);
    t.ppg = formatRate(ppg, 1);
    t.papg = formatRate(papg, 1);
    t.margin = margin.toFixed(1);
    t.ppth = formatRate(ppth, 2);
    t.pPerN = formatRate(pPerN, 2);
    t.gPerN = formatRate(gPerN, 2);
    t.ppb = formatRate(ppb, 2);
  }

  return _.orderBy(standings, ['winPct', 'ppg'], ['desc', 'desc']);
} //compileStandings

//the header for the table in the individual standings
function individualsHeader() {
  return '<tr>' + '\n' +
    '<td align=left><b>Rank</b></td>' + '\n' +
    '<td align=left><b>Player</b></td>' + '\n' +
    '<td align=left><b>Team</b></td>' + '\n' +
    '<td align=right><b>GP</b></td>' + '\n' +
    '<td align=right><b>15</b></td>' + '\n' +
    '<td align=right><b>10</b></td>' + '\n' +
    '<td align=right><b>-5</b></td>' + '\n' +
    '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>P/TU</b></td>' + '\n' +
    '<td align=right><b>P/N</b></td>' + '\n' +
    '<td align=right><b>G/N</b></td>' + '\n' +
    '<td align=right><b>Pts</b></td>' + '\n' +
    '<td align=right><b>PPG</b></td>' + '\n' +
    '</tr>';
}

//a single row in the individual standings
function individualsRow(playerEntry, rank) {
  var linkId = playerEntry.teamName.replace(/\W/g, '') + '-' +
    playerEntry.playerName.replace(/\W/g, '');
  var rowHtml = '<tr>' + '\n';
  rowHtml += '<td align=left>' + rank + '</td>' + '\n';
  rowHtml += '<td align=left><a href=\"playerdetail.html#' + linkId + '\">' +
    playerEntry.playerName + '</a></td>' + '\n';
  rowHtml += '<td align=left>' + playerEntry.teamName + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.gamesPlayed + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.powers + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.tens + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.negs + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.tuh + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.pptu + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.pPerN + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.gPerN + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.points + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.ppg + '</td>' + '\n';
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
        tens: 0,
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
      var [tuh, powers, tens, negs] = playerSlashLine(players1[p]);
      pEntry.gamesPlayed += tuh / parseFloat(g.tuhtot);
      pEntry.powers += powers;
      pEntry.tens += tens;
      pEntry.negs += negs;
      pEntry.tuh += tuh;
    }
    for(var p in players2) {
      pEntry = _.find(individuals, function (o) {
        return o.teamName == g.team2 && o.playerName == p;
      });
      var [tuh, powers, tens, negs] = playerSlashLine(players2[p]);
      pEntry.gamesPlayed += tuh / parseFloat(g.tuhtot);
      pEntry.powers += powers;
      pEntry.tens += tens;
      pEntry.negs += negs;
      pEntry.tuh += tuh;
    }
  } //for loop for each game

  for(var i in individuals) {
    var p = individuals[i];
    var pPerN = p.negs == 0 ? 'inf' : p.powers / p.negs;
    var gPerN = p.negs == 0 ? 'inf' : (p.powers + p.tens) / p.negs;
    var totPoints = p.powers*15 + p.tens*10 - p.negs*5;
    var pptu = p.tuh == 0 ? 'inf' : totPoints / p.tuh;
    var ppg = p.gamesPlayed == 0 ? 'inf' : totPoints / p.gamesPlayed;

    p.gamesPlayed = p.gamesPlayed.toFixed(1);
    p.pptu = formatRate(pptu, 2);
    p.pPerN = formatRate(pPerN, 2);
    p.gPerN = formatRate(gPerN, 2);
    p.points = totPoints;
    p.ppg = formatRate(ppg, 2);
  }

  return _.orderBy(individuals,
    [function(item) {
      if(isNaN(item.ppg)) return -999;
      return parseFloat(item.ppg);
    },
    function(item) {
      return parseFloat(item.gamesPlayed);
    }],
    ['desc', 'desc']);//orderBy
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
  return '<font size=+1 color=red>Round ' + roundNo + '</font>';
}

//the html for all the game summaries for a single round
function scoreboardGameSummaries(myGames, roundNo) {
  var html = '';
  for(var i in myGames) {
    var g = myGames[i];
    if(g.round == roundNo) {
      if(g.forfeit) {
        html += '<font size=+1>' + g.team1 + ' defeats ' +
          g.team2 + ' by forfeit' + '</font><br>';
      }
      else {
        html += '<p>' + '\n';
        html += '<font size=+1>' + g.team1 + ' ' + g.score1 + ', ' + g.team2 + ' ' + g.score2;
        if(g.ottu > 0) {
          html += ' (OT)';
        }
        html += '</font><br>' + '\n' +
          '<font size=-1>' + '\n';
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
  }
  return html + '</font>' + '\n' + '</p>' + '\n';
}

//header row for the list of a team's games on the team detail page
function teamDetailGameTableHeader() {
  return '<tr>' + '\n' +
    '<td align=left><b>Opponent</b></td>' + '\n' +
    '<td align=right><b>Result</b></td>' + '\n' +
    '<td align=right><b>PF</b></td>' + '\n' +
    '<td align=right><b>PA</b></td>' + '\n' +
    '<td align=right><b>15</b></td>' + '\n' +
    '<td align=right><b>10</b></td>' + '\n' +
    '<td align=right><b>-5</b></td>' + '\n' +
    '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>PPTH</b></td>' + '\n' +
    '<td align=right><b>P/N</b></td>' + '\n' +
    '<td align=right><b>G/N</b></td>' + '\n' +
    '<td align=right><b>BHrd</b></td>' + '\n' +
    '<td align=right><b>BPts</b></td>' + '\n' +
    '<td align=right><b>PPB</b></td>' + '\n' +
    '</tr>'  + '\n';
}

//a mostly-blank row in a team detail table for a forfeit
function forfeitRow(opponent, result) {
  return '<tr>' + '\n' +
    '<td align=left>' + opponent + '</td>' + '\n' +
    '<td align=right>' + result + '</td>' + '\n' +
    '<td align=right>Forfeit</td>' + '\n' +
    '</tr>' + '\n';
}

//team detail row for a single game for a single team
function teamDetailGameRow(game, whichTeam) {
  var opponent, opponentScore, result, score, players;
  if(whichTeam == 1) {
    opponent = game.team2;
    if(game.forfeit) { //team1 is arbitrarily the winner of a forfeit
      return forfeitRow(opponent, 'W');
    }
    if(game.score1 > game.score2) { result = 'W'; }
    else if(game.score1 < game.score2) { result = 'L'; }
    else { result = 'T'; }
    score = game.score1;
    opponentScore = game.score2;
    players = game.players1;
  }
  else {
    opponent = game.team1;
    if(game.forfeit) { //team2 is arbitrarily the loser of a forfeit
      return forfeitRow(opponent, 'L');
    }
    if(game.score2 > game.score1) { result = 'W'; }
    else if(game.score2 < game.score1) { result = 'L'; }
    else { result = 'T'; }
    score = game.score2;
    opponentScore = game.score1;
    players = game.players2;
  }
  var powers = teamPowers(game, whichTeam);
  var tens = teamTens(game, whichTeam);
  var negs = teamNegs(game, whichTeam);
  var ppth = score / game.tuhtot;
  var pPerN = negs == 0 ? 'inf' : powers / negs;
  var gPerN = negs == 0 ? 'inf' : (powers + tens) / negs;
  var bHeard = bonusesHeard(game, whichTeam);
  var bPts = bonusPoints(game, whichTeam);
  var ppb = bHeard == 0 ? 'inf' : bPts / bHeard;

  var html = '<tr>' + '\n';
  html += '<td align=left>' + opponent + '</td>' + '\n';
  html += '<td align=right>' + result + '</td>' + '\n';
  html += '<td align=right>' + score + '</td>' + '\n';
  html += '<td align=right>' + opponentScore + '</td>' + '\n';
  html += '<td align=right>' + powers + '</td>' + '\n';
  html += '<td align=right>' + tens + '</td>' + '\n';
  html += '<td align=right>' + negs + '</td>' + '\n';
  html += '<td align=right>' + game.tuhtot + '</td>' + '\n';
  html += '<td align=right>' + formatRate(ppth, 2) + '</td>' + '\n';
  html += '<td align=right>' + formatRate(pPerN, 2) + '</td>' + '\n';
  html += '<td align=right>' + formatRate(gPerN, 2) + '</td>' + '\n';
  html += '<td align=right>' + bHeard + '</td>' + '\n';
  html += '<td align=right>' + bPts + '</td>' + '\n';
  html += '<td align=right>' + formatRate(ppb, 2) + '</td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

//the totals row of a games table in the team detail page
function teamDetailTeamSummaryRow(teamSummary) {
  var html = '<tr>' + '\n';
  html += '<td align=left><b>Total</b></td>' + '\n';
  html += '<td></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.points + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.ptsAgainst + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.powers + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.tens + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.negs + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.tuh + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.ppth + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.pPerN + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.gPerN + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.bHeard + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.bPts + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.ppb + '</b></td>' + '\n';
  html += '</tr>' + '\n';

  return html;
}

//header row for the list of a team's players on the team detail page
function teamDetailPlayerTableHeader() {
  return '<tr>' + '\n' +
    '<td align=left><b>Player</b></td>' + '\n' +
    '<td align=left><b>Team</b></td>' + '\n' +
    '<td align=right><b>GP</b></td>' + '\n' +
    '<td align=right><b>15</b></td>' + '\n' +
    '<td align=right><b>10</b></td>' + '\n' +
    '<td align=right><b>-5</b></td>' + '\n' +
    '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>P/TU</b></td>' + '\n' +
    '<td align=right><b>P/N</b></td>' + '\n' +
    '<td align=right><b>G/N</b></td>' + '\n' +
    '<td align=right><b>Pts</b></td>' + '\n' +
    '<td align=right><b>PPG</b></td>' + '\n' +
    '</tr>' + '\n';
}

//team detail row for a single player
function teamDetailPlayerRow(player) {
  var linkId = player.teamName.replace(/\W/g, '') + '-' +
    player.playerName.replace(/\W/g, '');
  var html = '<tr>' + '\n';
  html += '<td align=left><a href=\"playerdetail.html#' + linkId + '\">' +
    player.playerName + '</a></td>' + '\n';
  html += '<td align=left>' + player.teamName + '</td>' + '\n';
  html += '<td align=right>' + player.gamesPlayed + '</td>' + '\n';
  html += '<td align=right>' + player.powers + '</td>' + '\n';
  html += '<td align=right>' + player.tens + '</td>' + '\n';
  html += '<td align=right>' + player.negs + '</td>' + '\n';
  html += '<td align=right>' + player.tuh + '</td>' + '\n';
  html += '<td align=right>' + player.pptu + '</td>' + '\n';
  html += '<td align=right>' + player.pPerN + '</td>' + '\n';
  html += '<td align=right>' + player.gPerN + '</td>' + '\n';
  html += '<td align=right>' + player.points + '</td>' + '\n';
  html += '<td align=right>' + player.ppg + '</td>' + '\n';
  html += '</tr>' + '\n';

  return html;
}

//header row for a table on the player detail page
function playerDetailTableHeader() {
  return '<tr>' + '\n' +
    '<td align=left><b>Opponent</b></td>' + '\n' +
    '<td align=right><b>GP</b></td>' + '\n' +
    '<td align=right><b>15</b></td>' + '\n' +
    '<td align=right><b>10</b></td>' + '\n' +
    '<td align=right><b>-5</b></td>' + '\n' +
    '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>P/TU</b></td>' + '\n' +
    '<td align=right><b>P/N</b></td>' + '\n' +
    '<td align=right><b>G/N</b></td>' + '\n' +
    '<td align=right><b>Pts</b></td>' + '\n' +
    '</tr>' + '\n';
}

//row for one player's game on the player detail page
function playerDetailGameRow(player, tuhtot, opponent) {
  var [tuh, powers, tens, negs] = playerSlashLine(player);
  if(tuh <= 0) {
    return '';
  }
  var gp = tuh / tuhtot;
  var points = 15*powers + 10*tens - 5*negs;
  var pptu = points / tuh;
  var pPerN = negs == 0 ? 'inf' : powers / negs;
  var gPerN = negs == 0 ? 'inf' : (powers + tens) / negs;

  var html = '<tr>' + '\n';
  html += '<td align=left>' + opponent + '</td>' + '\n';
  html += '<td align=right>' + formatRate(gp, 1) + '</td>' + '\n';
  html += '<td align=right>' + powers + '</td>' + '\n';
  html += '<td align=right>' + tens + '</td>' + '\n';
  html += '<td align=right>' + negs + '</td>' + '\n';
  html += '<td align=right>' + tuh + '</td>' + '\n';
  html += '<td align=right>' + formatRate(pptu, 2) + '</td>' + '\n';
  html += '<td align=right>' + formatRate(pPerN, 2) + '</td>' + '\n';
  html += '<td align=right>' + formatRate(gPerN, 2) + '</td>' + '\n';
  html += '<td align=right>' + points + '</td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

//total row on the player detail page, using totals from compileIndividuals
function playerDetailTotalRow(player) {
  var html = '<tr>' + '\n';
  html += '<td align=left><b>Total</b></td>' + '\n';
  html += '<td align=right><b>' + player.gamesPlayed + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.powers + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.tens + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.negs + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.tuh + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.pptu + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.pPerN + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.gPerN + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.points + '</b></td>' + '\n';
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
        10*teamTens(game, 1) + 10*teamTens(game, 2) -
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
    '<td><b>Round</b></td>' + '\n' +
    '<td><b>PPG/Team</b></td>' + '\n' +
    '<td><b>TUPts/TUH</b></td>' + '\n' +
    '<td><b>PPB</b></td>' + '\n' +
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
      '<td><a href=standings.html>Standings</a></td>' + '\n' +
      '<td><a href=individuals.html>Individuals</a></td>' + '\n' +
      '<td><a href=games.html>Scoreboard</a></td>' + '\n' +
      '<td><a href=teamdetail.html>Team Detail</a></td>' + '\n' +
      '<td><a href=playerdetail.html>Individual Detail</a></td>' + '\n' +
      '<td><a href=rounds.html>Round Report</a></td>' + '\n' +
      '<td><a href=statkey.html#TeamStandings>Stat Key</a></td>' + '\n' +
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
    '<h1> Team Standings</h1>' + '\n' +
    '<table border=1 width=100%>' + standingsHeader();
  for(var i in standings) {
    html += standingsRow(standings[i], parseFloat(i)+1);
  }
  return html + '\n' + '</table>' + '\n' + getStatReportBottom();
}//getStandingsHtml

function getIndividualsHtml(teams, games) {
  var individuals = compileIndividuals(teams, games);
  var html = getStatReportTop() +
    '<h1> Individual Statistics</h1>' + '\n' +
    '<table border=1 width=100%>' + individualsHeader();
  for(var i in individuals) {
    html += individualsRow(individuals[i], parseFloat(i)+1);
  }
  return html + '\n' + '</table>' + '\n' +  getStatReportBottom();
}

function getScoreboardHtml(teams, games) {
  var html = getStatReportTop() +
    '<h1> Scoreboard</h1>' + '\n';
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
    '<h1> Team Detail</h1>' + '\n';
  for(var i in teams) {
    var teamName = teams[i].teamName;
    var linkId = teamName.replace(/\W/g, '');
    html += '<h2 id=\"' + linkId + '\">' + teams[i].teamName + '</h2>' + '\n';
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
    '<h1> Individual Detail</h1>' + '\n';

  for(var i in playerTotals) {
    var indvTot = playerTotals[i];
    var linkId = indvTot.teamName.replace(/\W/g, '') + '-' +
      indvTot.playerName.replace(/\W/g, '');
    html += '<h2 id=\"' + linkId + '\">' +
      indvTot.playerName + ', ' + indvTot.teamName + '</h2>' + '\n';
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
    '<h1> Round Report</h1>' + '\n';
  html += '<table border=1 width=100%>' + '\n';
  html += roundReportTableHeader();
  for(var i in roundSummaries) {
    html += roundReportRow(roundSummaries[i], i);
  }
  html += '</table>' + '\n';
  return html + getStatReportBottom();
}
