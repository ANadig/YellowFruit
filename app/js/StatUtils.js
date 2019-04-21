/***********************************************************
StatUtils.js
Andrew Nadig

code for generating the HTML stats report.
***********************************************************/
var _ = require('lodash');
var fs = require('fs');
var Path = require('path');

/*---------------------------------------------------------
Convert string to number, where '' is zero.
---------------------------------------------------------*/
function toNum(str) {
  return isNaN(+str) ? 0 : +str;
}

/*---------------------------------------------------------
Format numbers to the specified precision, and
divide-by-zero calculations to an em-dash.
---------------------------------------------------------*/
function formatRate(r, precision) {
  return isNaN(r) ? '&mdash;&ensp;' : r.toFixed(precision);
}

// include column for powers?
function usePowers(settings) { return settings.powers != 'none'; }

// include column for negs?
function useNegs(settings) { return settings.negs == 'yes'; }

// include column for powers per neg?
function usePPerN(settings) { return usePowers(settings) && useNegs(settings); }

// include column for gets per neg?
function useGPerN(settings) { return useNegs(settings); }

// include columns for bonus points and PPB?
function useBonus(settings) { return settings.bonuses != 'none'; }

// include columns for bounceback points and PPBB?
function useBb(settings) { return settings.bonuses == 'yesBb'; }

/*---------------------------------------------------------
Number of games played, including forfeits.
---------------------------------------------------------*/
function gamesPlayed(team, games) {
  var count = 0;
  for(var i in games) {
    if(games[i].team1 == team.teamName || games[i].team2 == team.teamName) {
      count += 1;
    }
  }
  return count;
}

/*---------------------------------------------------------
Point value of a power
---------------------------------------------------------*/
function powerValue(settings) {
  if(settings.powers == '15pts') { return 15; }
  if(settings.powers == '20pts') { return 20; }
  return 0;
}

/*---------------------------------------------------------
Point value of a neg
---------------------------------------------------------*/
function negValue(settings) {
  return settings.negs == 'yes' ? -5 : 0;
}

/*---------------------------------------------------------
Bonuses heard for a single game.
---------------------------------------------------------*/
function bonusesHeard (game, whichTeam) {
  var tot = 0;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  var otPwr = whichTeam == 1 ? game.otPwr1 : game.otPwr2;
  var otTen = whichTeam == 1 ? game.otTen1 : game.otTen2;
  for(var p in players) {
    tot += toNum(players[p].powers) + toNum(players[p].tens);
  }
  tot -= toNum(otPwr); //subtract TUs converted in overtime
  tot -= toNum(otTen);
  return tot;
}

/*---------------------------------------------------------
Bonus points for a single game.
---------------------------------------------------------*/
function bonusPoints(game, whichTeam, settings) {
  var tuPts = 0;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  var totalPoints = whichTeam == 1 ? game.score1 : game.score2;
  var bbPts = whichTeam == 1 ? game.bbPts1 : game.bbPts2;
  for(var p in players) {
    tuPts += powerValue(settings)*toNum(players[p].powers) +
      10*toNum(players[p].tens) + negValue(settings)*toNum(players[p].negs);
  }
  return toNum(totalPoints) - tuPts - bbPts;
}

/*---------------------------------------------------------
How many (30-point bonuses' worth of) bouncebacks a team
heard. Returns [integer part, number of additional thirds]
e.g. 3 and 2/3 is [3,2]
---------------------------------------------------------*/
function bbHeard(game, whichTeam, settings) {
  var otherTeam = whichTeam == 1 ? 2 : 1;
  var raw = (bonusesHeard(game, otherTeam)*30 - bonusPoints(game, otherTeam, settings)) / 30;
  var integer = Math.trunc(raw);
  var remainder = (raw*3) % 3;
  return [integer, remainder];
}

/*---------------------------------------------------------
Add two bounceback heard amounts together in the
[integer part, fractional part] format.
---------------------------------------------------------*/
function bbHrdAdd(x, y) {
  return [x[0]+y[0] + (x[1]+y[1]>=3), (x[1]+y[1]) % 3];
}

/*---------------------------------------------------------
Convert the internal representation of bouncebacks heard
to a decimal.
---------------------------------------------------------*/
function bbHrdToFloat(x) {
  return x[0] + x[1]/3;
}

/*---------------------------------------------------------
HTML code for printing bouncebacks heard.
---------------------------------------------------------*/
function bbHrdDisplay(x) {
  var fraction = '';
  if(x[1] == 1) { fraction = '&#8531;' } // '1/3'
  if(x[1] == 2) { fraction = '&#8532;' } // '2/3'
  return x[0] + fraction;
}

/*---------------------------------------------------------
Total points from overtime tossups for a game.
---------------------------------------------------------*/
function otPoints(game, whichTeam, settings) {
  var otPwr = whichTeam == 1 ? game.otPwr1 : game.otPwr2;
  var otTen = whichTeam == 1 ? game.otTen1 : game.otTen2;
  var otNeg = whichTeam == 1 ? game.otNeg1 : game.otNeg2;
  return powerValue(settings)*toNum(otPwr) + 10*toNum(otTen) + negValue(settings)*toNum(otNeg);
}

/*---------------------------------------------------------
Number of powers for a single team in a single game
---------------------------------------------------------*/
function teamPowers(game, whichTeam) {
  var totPowers = 0, pwr;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    totPowers += toNum(players[p].powers);
  }
  return totPowers;
}

/*---------------------------------------------------------
Number of tens for a single team in a single game
---------------------------------------------------------*/
function teamTens(game, whichTeam) {
  var totTens = 0, tn;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    totTens += toNum(players[p].tens);
  }
  return totTens;
}

/*---------------------------------------------------------
Number of negs for a single team in a single game
---------------------------------------------------------*/
function teamNegs(game, whichTeam) {
  var totNegs = 0, ng;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    totNegs += toNum(players[p].negs);
  }
  return totNegs;
}

/*---------------------------------------------------------
[TUH, powers, tens, negs] for a player, as numbers.
---------------------------------------------------------*/
function playerSlashLine(player) {
  return [toNum(player.tuh), toNum(player.powers),
    toNum(player.tens), toNum(player.negs)];
}

/*---------------------------------------------------------
Does at least one round have a packet name?
---------------------------------------------------------*/
function packetNamesExist(packets) {
  for(var r in packets) {
    if(packets[r] != '') { return true; }
  }
  return false;
}

/*---------------------------------------------------------
API to generate table cell <td> tags (with newline at the end)
  text: inner text
  align: 'left', etc.
  bold: boolean
  style: inline CSS. Don't include quotes around it
---------------------------------------------------------*/
function tdTag(text, align, bold, style) {
  var html = '<td';
  if(align != null) { html += ' align=' + align; }
  if(style != null) { html += ' style="' + style + '"'; }
  html += '>';
  if(bold) { html += '<b>'; }
  html += text;
  if(bold) { html += '</b>'; }
  return html + '</td>\n';
}

/*---------------------------------------------------------
Header row for the team standings.
---------------------------------------------------------*/
function standingsHeader(settings) {
  var html = '<tr>' + '\n' +
    tdTag('Rank','left',true) +
    tdTag('Team','left',true) +
    tdTag('W','right',true) +
    tdTag('L','right',true) +
    tdTag('T','right',true) +
    tdTag('Pct','right',true) +
    tdTag('PPG','right',true) +
    tdTag('PAPG','right',true) +
    tdTag('Mrg','right',true);
  if(usePowers(settings)) {
    html += tdTag(powerValue(settings),'right',true);
  }
  html += tdTag('10','right',true);
  if(useNegs(settings)) {
    html += tdTag('-5','right',true);
  }
  html += tdTag('TUH','right',true) +
    tdTag('PPTUH','right',true);
  if(usePPerN(settings)) {
    html += tdTag('Pwr/N','right',true);
  }
  if(useGPerN(settings)) {
    html += tdTag('G/N','right',true);
  }
  if(useBonus(settings)) {
    html += tdTag('BHrd','right',true) +
      tdTag('BPts','right',true) +
      tdTag('PPB','right',true);
  }
  if(useBb(settings)) {
    html += tdTag('BBHrd','right',true) +
      tdTag('BBPts','right',true) +
      tdTag('PPBB','right',true);
  }
  html += '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
One row in the team standings
---------------------------------------------------------*/
function standingsRow(teamEntry, rank, fileStart, settings) {
  var linkId = teamEntry.teamName.replace(/\W/g, '');
  var rowHtml = '<tr>';
  rowHtml += tdTag(rank,'left');
  rowHtml += tdTag('<a HREF=' + fileStart + 'teamdetail.html#' + linkId + '>' + teamEntry.teamName + '</a>','left');
  rowHtml += tdTag(teamEntry.wins,'right');
  rowHtml += tdTag(teamEntry.losses,'right');
  rowHtml += tdTag(teamEntry.ties,'right');
  rowHtml += tdTag(teamEntry.winPct,'right');
  rowHtml += tdTag(teamEntry.ppg,'right');
  rowHtml += tdTag(teamEntry.papg,'right');
  rowHtml += tdTag(teamEntry.margin,'right');
  if(usePowers(settings)) {
    rowHtml += tdTag(teamEntry.powers,'right');
  }
  rowHtml += tdTag(teamEntry.tens,'right');
  if(useNegs(settings)) {
    rowHtml += tdTag(teamEntry.negs,'right');
  }
  rowHtml += tdTag(teamEntry.tuh,'right');
  rowHtml += tdTag(teamEntry.ppth,'right');
  if(usePPerN(settings)) {
    rowHtml += tdTag(teamEntry.pPerN,'right');
  }
  if(useGPerN(settings)) {
    rowHtml += tdTag(teamEntry.gPerN,'right');
  }
  if(useBonus(settings)) {
    rowHtml += tdTag(teamEntry.bHeard,'right');
    rowHtml += tdTag(teamEntry.bPts,'right');
    rowHtml += tdTag(teamEntry.ppb,'right');
  }
  if(useBb(settings)) {
    rowHtml += tdTag(bbHrdDisplay(teamEntry.bbHeard),'right');
    rowHtml += tdTag(teamEntry.bbPts,'right');
    rowHtml += tdTag(teamEntry.ppbb,'right');
  }
  return rowHtml + '</tr>' + '\n';
}

/*---------------------------------------------------------
Gather data for the team standings
---------------------------------------------------------*/
function compileStandings(myTeams, myGames, phase, groupingPhase, settings) {
  var standings = myTeams.map(function(item, index) {
    var obj =
      { teamName: item.teamName,
        division: groupingPhase != null ? item.divisions[groupingPhase] : null,
        wins: 0, losses: 0, ties: 0,
        winPct: 0,
        ppg: 0, papg: 0, margin: 0,
        powers: 0, tens: 0, negs: 0,
        tuh: 0,
        ppth: 0,
        pPerN: 0, gPerN: 0,
        bHeard: 0, bPts: 0, ppb: 0,
        bbHeard: [0,0], bbPts: 0, ppbb: 0,
        points: 0,
        ptsAgainst: 0,
        forfeits: 0,
        otPts: 0,
        otPtsAgainst: 0,
        ottuh: 0,
      };
    return obj;
  }); //map

  for(var i in myGames) {
    var g = myGames[i];
    if(phase == 'all' || g.phases.includes(phase)) {
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
        if(+g.score1 > +g.score2) {
          team1Line.wins += 1;
          team2Line.losses += 1;
        }
        else if(+g.score2 > +g.score1) {
          team1Line.losses += 1;
          team2Line.wins += 1;
        }
        else { //it's a tie
          team1Line.ties += 1;
          team2Line.ties += 1;
        }
        team1Line.points += +g.score1;
        team2Line.points += +g.score2;
        team1Line.ptsAgainst += +g.score2;
        team2Line.ptsAgainst += +g.score1;

        team1Line.tuh += +g.tuhtot;
        team2Line.tuh += +g.tuhtot;

        team1Line.powers += teamPowers(g, 1);
        team2Line.powers += teamPowers(g, 2);
        team1Line.tens += teamTens(g, 1);
        team2Line.tens += teamTens(g, 2);
        team1Line.negs += teamNegs(g, 1);
        team2Line.negs += teamNegs(g, 2);

        team1Line.bHeard += bonusesHeard(g,1);
        team2Line.bHeard += bonusesHeard(g,2);
        team1Line.bPts += bonusPoints(g,1,settings);
        team2Line.bPts += bonusPoints(g,2,settings);

        team1Line.bbHeard = bbHrdAdd(team1Line.bbHeard, bbHeard(g,1,settings));
        team2Line.bbHeard = bbHrdAdd(team2Line.bbHeard, bbHeard(g,2,settings));
        team1Line.bbPts += +g.bbPts1;
        team2Line.bbPts += +g.bbPts2;

        team1Line.otPts += otPoints(g, 1, settings);
        team2Line.otPts += otPoints(g, 2, settings);
        team1Line.otPtsAgainst += otPoints(g, 2, settings);
        team2Line.otPtsAgainst += otPoints(g, 1, settings);
        team1Line.ottuh += +g.ottu;
        team2Line.ottuh += +g.ottu;
      }//else not a forfeit
    }//if game is in phase
  }//loop over all games

  for(var i in standings) {
    var t = standings[i];
    var gamesPlayed = t.wins + t.losses + t.ties - t.forfeits;
    var gamesPlayedWithForfeits = t.wins + t.losses + t.ties;
    var winPct = gamesPlayedWithForfeits == 0 ?
      0 : (t.wins + t.ties/2) / gamesPlayedWithForfeits;
    var ppg = gamesPlayed == 0 ? 'inf' : (t.points - t.otPts) / gamesPlayed;
    var papg = gamesPlayed == 0 ? 'inf' : (t.ptsAgainst - t.otPtsAgainst) / gamesPlayed;
    var margin = toNum(ppg - papg);
    var ppth = t.tuh == 0 ? 'inf' : (t.points - t.otPts) / (t.tuh - t.ottuh);
    var pPerN = t.negs == 0 ? 'inf' : t.powers / t.negs;
    var gPerN = t.negs == 0 ? 'inf' : (t.powers + t.tens) / t.negs;
    var ppb = t.bHeard == 0 ? 'inf' : t.bPts / t.bHeard;
    var ppbb = t.bbHeard == 0 ? 'inf' : t.bbPts / bbHrdToFloat(t.bbHeard);

    t.winPct = winPct.toFixed(3);
    t.ppg = formatRate(ppg, 1);
    t.papg = formatRate(papg, 1);
    t.margin = margin.toFixed(1);
    t.ppth = formatRate(ppth, 2);
    t.pPerN = formatRate(pPerN, 2);
    t.gPerN = formatRate(gPerN, 2);
    t.ppb = formatRate(ppb, 2);
    t.ppbb = formatRate(ppbb, 2);
  }

  return _.orderBy(standings, ['winPct', (t)=>{return toNum(t.ppg)}], ['desc', 'desc']);
} //compileStandings

/*---------------------------------------------------------
The header for the table in the individual standings.
---------------------------------------------------------*/
function individualsHeader(usingDivisions, settings) {
  var html = '<tr>' + '\n' +
    '<td align=left><b>Rank</b></td>' + '\n' +
    '<td align=left><b>Player</b></td>' + '\n' +
    '<td align=left><b>Team</b></td>' + '\n';
  if(usingDivisions) {
    html += '<td align=left><b>Division</b></td>' + '\n';
  }
  html += '<td align=right><b>GP</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
  }
  html += '<td align=right><b>10</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>-5</b></td>' + '\n';
  }
  html += '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>PPTUH</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>Pwr/N</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>G/N</b></td>' + '\n';
  }
  html += '<td align=right><b>Pts</b></td>' + '\n' +
    '<td align=right><b>PPG</b></td>' + '\n' +
    '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
A single row in the individual standings.
---------------------------------------------------------*/
function individualsRow(playerEntry, rank, fileStart, usingDivisions, settings) {
  var playerLinkId = playerEntry.teamName.replace(/\W/g, '') + '-' +
    playerEntry.playerName.replace(/\W/g, '');
  var teamLinkId = playerEntry.teamName.replace(/\W/g, '');

  var rowHtml = '<tr>' + '\n';
  rowHtml += '<td align=left>' + rank + '</td>' + '\n';
  rowHtml += '<td align=left><a HREF=' + fileStart + 'playerdetail.html#' + playerLinkId + '>' +
    playerEntry.playerName + '</a></td>' + '\n';
  rowHtml += '<td align=left>' + '<a HREF=' + fileStart + 'teamdetail.html#' + teamLinkId + '>' +
      playerEntry.teamName + '</a>' + '</td>' + '\n';
  if(usingDivisions) {
    var divDisplay = playerEntry.division;
    if(divDisplay == undefined) { divDisplay = '&mdash;&ensp;'; }
    rowHtml += '<td align=left>' + divDisplay + '</td>' + '\n';
  }
  rowHtml += '<td align=right>' + playerEntry.gamesPlayed + '</td>' + '\n';
  if(usePowers(settings)) {
    rowHtml += '<td align=right>' + playerEntry.powers + '</td>' + '\n';
  }
  rowHtml += '<td align=right>' + playerEntry.tens + '</td>' + '\n';
  if(useNegs(settings)) {
    rowHtml += '<td align=right>' + playerEntry.negs + '</td>' + '\n';
  }
  rowHtml += '<td align=right>' + playerEntry.tuh + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.pptu + '</td>' + '\n';
  if(usePPerN(settings)) {
    rowHtml += '<td align=right>' + playerEntry.pPerN + '</td>' + '\n';
  }
  if(useGPerN(settings)) {
    rowHtml += '<td align=right>' + playerEntry.gPerN + '</td>' + '\n';
  }
  rowHtml += '<td align=right>' + playerEntry.points + '</td>' + '\n';
  rowHtml += '<td align=right>' + playerEntry.ppg + '</td>' + '\n';
  return rowHtml + '</tr>' + '\n';
}

/*---------------------------------------------------------
Tabulate data for the individual standings page.
---------------------------------------------------------*/
function compileIndividuals(myTeams, myGames, phase, groupingPhase, settings) {
  var individuals = [];
  for(var i in myTeams) {
    var t = myTeams[i];
    for(var j in t.roster) {
      var obj = {
        playerName: t.roster[j],
        teamName: t.teamName,
        division: groupingPhase != null ? t.divisions[groupingPhase] : null,
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
    if(phase == 'all' || g.phases.includes(phase)) {
      var players1 = g.players1, players2 = g.players2;
      for(var p in players1) {
        pEntry = _.find(individuals, function (o) {
          return o.teamName == g.team1 && o.playerName == p;
        });
        var [tuh, powers, tens, negs] = playerSlashLine(players1[p]);
        pEntry.gamesPlayed += tuh / (+g.tuhtot);
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
        pEntry.gamesPlayed += tuh / (+g.tuhtot);
        pEntry.powers += powers;
        pEntry.tens += tens;
        pEntry.negs += negs;
        pEntry.tuh += tuh;
      }
    }
  } //for loop for each game

  for(var i in individuals) {
    var p = individuals[i];
    var pPerN = p.negs == 0 ? 'inf' : p.powers / p.negs;
    var gPerN = p.negs == 0 ? 'inf' : (p.powers + p.tens) / p.negs;
    var totPoints = p.powers*powerValue(settings) + p.tens*10 + p.negs*negValue(settings);
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
      if(isNaN(item.pptu)) return -999;
      return toNum(item.pptu);
    },
    function(item) {
      return toNum(item.gamesPlayed);
    }],
    ['desc', 'desc']);//orderBy
} //compileIndividuals

/*---------------------------------------------------------
A list of the rounds for which there are games, so as to
know how to organize the scorboard page.
---------------------------------------------------------*/
function getRoundsForScoreboard(myGames, phase) {
  var rounds = [];
  for(var i in myGames) {
    var roundNo = toNum(myGames[i].round);
    if((phase == 'all' || myGames[i].phases.includes(phase)) && !rounds.includes(roundNo)) {
      rounds.push(roundNo);
    }
  }
  return rounds.sort(function(a,b){ return a-b });
}

/*---------------------------------------------------------
A "table of contents" for the scoreboard page with links
to each round.
---------------------------------------------------------*/
function scoreboardRoundLinks(roundList, fileStart) {
  var html = '<table border=0 width=70% ' +
    'style="top:4px;position:sticky;background-color:#cccccc;margin-top:5px;box-shadow: 4px 4px 7px #999999">' + '\n' +
    '<tr>' + '\n';
  for(var i in roundList) {
    html += '<td><a HREF=' + fileStart + 'games.html#round-' + roundList[i] +
      '>' + roundList[i] + '</a></td>' + '\n';
  }
  html += '</tr>' + '\n' +
    '</table>' + '\n';
  return html;
}

/*---------------------------------------------------------
The title for each section of the scoreboard.
---------------------------------------------------------*/
function scoreboardRoundHeader(roundNo,packetName) {
  var title = 'Round ' + roundNo;
  if(packetName != undefined && packetName != '') {
    title += ' (Packet: ' + packetName + ')';
  }
  var html = '<div id=round-' + roundNo + ' style="margin:-3em;position:absolute"></div>' + '\n';
  return html + '<h2><font color=red>' + title + '</font></h2>' + '\n';
}

/*---------------------------------------------------------
The specified number of empty table cells, used for
padding box scores.
---------------------------------------------------------*/
function blankPlayerLineScore(size) {
  var output = [];
  while(output.length < size) {
    output.push('<td></td>');
  }
  return output.join('\n');
}

/*---------------------------------------------------------
Identifier for a specific game on the scorboard, so other
pages can link to it.
---------------------------------------------------------*/
function scoreboardLinkID(game) {
  return 'R' + game.round + '-' + game.team1.replace(/\W/g, '') + '-' +
    game.team2.replace(/\W/g, '');
}

/*---------------------------------------------------------
HTML for all the game summaries for a single round on the
scoreboard page.
---------------------------------------------------------*/
function scoreboardGameSummaries(myGames, roundNo, phase, settings, phaseColors) {
  var html = '';
  for(var i in myGames) {
    var g = myGames[i];
    if((phase == 'all' || g.phases.includes(phase)) && g.round == roundNo) {
      var linkId = 'R' + roundNo + '-' + g.team1.replace(/\W/g, '') + '-' +
        g.team2.replace(/\W/g, '');
      if(g.forfeit) {
        html += '<br><span id=' + linkId + '><h3>' + g.team1 +
        ' defeats ' + g.team2 + ' by forfeit' + '</h3></span><br>';
      }
      else {
        // game title
        html += '<div id=' + linkId + ' style="margin:-1.5em;position:absolute"></div>'
        html += '<h3>' + '\n';
        if(phase == 'all') {
          html += '<span' + getRoundStyle(g.phases, phaseColors) + '>' +
            '&nbsp;&nbsp;&nbsp;&nbsp;</span>' + '\n';
        }
        if(toNum(g.score1) >= toNum(g.score2)) {
          html += g.team1 + ' ' + g.score1 + ', ' + g.team2 + ' ' + g.score2;
        }
        else {
          html += g.team2 + ' ' + g.score2 + ', ' + g.team1 + ' ' + g.score1;
        }
        if(g.ottu > 0) {
          html += ' (OT)';
        }
        html += '</h3>' + '\n';

        // make a table for the player linescores
        html += '<table border=0 width=70%>' + '\n';
        html += '<tr>' + '\n';
        var team1Header = '<td align=left><b>' + g.team1 + '</b></td>' + '\n' +
          '<td align=right><b>TUH</b></td>' + '\n';
        var team2Header = '<td align=left><b>' + g.team2 + '</b></td>' + '\n' +
          '<td align=right><b>TUH</b></td>' + '\n';
        if(usePowers(settings)) {
          team1Header += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
          team2Header += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
        }
        team1Header += '<td align=right><b>10</b></td>' + '\n';
        team2Header += '<td align=right><b>10</b></td>' + '\n';
        if(useNegs(settings)) {
          team1Header += '<td align=right><b>-5</b></td>' + '\n';
          team2Header += '<td align=right><b>-5</b></td>' + '\n';
        }
        team1Header += '<td align=right><b>Tot</b></td>' + '\n';
        team2Header += '<td align=right><b>Tot</b></td>' + '\n';
        html += team1Header + '<td></td>' + team2Header; // add an empty column as a buffer between the two teams
        html += '</tr>' + '\n';

        var playersLeft = [];
        var playersRight = [];
        //the left side of the table
        for(var p in g.players1) {
          var playerLine = '<tr>' + '\n' +
            '<td>' + p + '</td>' + '\n';
          var [tuh, pwr, tn, ng] = playerSlashLine(g.players1[p]);
          if(tuh <= 0) { continue; }
          playerLine += '<td align=right>' + tuh + '</td>' + '\n';
          if(usePowers(settings)) {
            playerLine += '<td align=right>' + pwr + '</td>' + '\n';
          }
          playerLine += '<td align=right>' + tn + '</td>' + '\n';
          if(useNegs(settings)) {
            playerLine += '<td align=right>' + ng + '</td>' + '\n';
          }
          playerLine += '<td align=right>' +
            ((powerValue(settings)*pwr + 10*tn + negValue(settings)*ng)) + '</td>' + '\n';
          playersLeft.push(playerLine);
        }
        // the right side of the table
        for(var p in g.players2) {
          var playerLine = '<td>' + p + '</td>' + '\n';
          var [tuh, pwr, tn, ng] = playerSlashLine(g.players2[p]);
          if(tuh <= 0) { continue; }
          playerLine += '<td align=right>' + tuh + '</td>' + '\n';
          if(usePowers(settings)) {
            playerLine += '<td align=right>' + pwr + '</td>' + '\n';
          }
          playerLine += '<td align=right>' + tn + '</td>' + '\n';
          if(useNegs(settings)) {
            playerLine += '<td align=right>' + ng + '</td>' + '\n';
          }
          playerLine += '<td align=right>' +
            ((powerValue(settings)*pwr + 10*tn + negValue(settings)*ng)) + '</td>' + '\n';
          playerLine += '</tr>' + '\n';
          playersRight.push(playerLine);
        }

        //pad the short side of the table with blank lines
        var columnsPerTeam = 4 + (settings.powers != 'none') + (settings.negs == 'yes');
        while (playersLeft.length > playersRight.length) {
          playersRight.push(blankPlayerLineScore(columnsPerTeam) + '\n' + '</tr>' + '\n');
        }
        while (playersLeft.length < playersRight.length) {
          playersLeft.push('<tr>' + blankPlayerLineScore(columnsPerTeam) + '\n');
        }

        for(var i in playersLeft) {
          html += playersLeft[i] + '<td>&nbsp;</td>' + playersRight[i]; // add an empty column as a buffer between the two teams
        }
        html += '</table>' + '\n';
        html += '<br>' + '\n';

        // bonus conversion
        if(useBonus(settings)) {
          var bHeard = bonusesHeard(g, 1), bPts = bonusPoints(g, 1, settings);
          var ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += 'Bonuses: ' + g.team1 + ' ' + bHeard + ' heard, ' + bPts + ' pts, ' + ppb.toFixed(2) + ' PPB; ';
          bHeard = bonusesHeard(g, 2), bPts = bonusPoints(g, 2, settings);
          ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += g.team2 + ' ' + bHeard + ' heard, ' + bPts + ' pts, ' + ppb.toFixed(2) + ' PPB <br>' + '\n';
        }
        // bounceback conversion
        if(useBb(settings)) {
          var bbHrd = bbHeard(g, 1, settings);
          var ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts1 / bbHrdToFloat(bbHrd);
          html += 'Bouncebacks: ' + g.team1 + ' ' +
            bbHrdDisplay(bbHrd) + ' heard, ' + toNum(g.bbPts1) + ' pts, ' + ppbb.toFixed(2) + ' PPBB; ';
          bbHrd = bbHeard(g, 2, settings);
          ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts2 / bbHrdToFloat(bbHrd);
          html += g.team2 + ' ' + bbHrdDisplay(bbHrd) + ' heard, ' + toNum(g.bbPts2) + ' pts, ' +
            ppbb.toFixed(2)  + ' PPBB<br>' + '\n';
        }
        html += '<br><br>' + '\n'; // + '</p>' + '\n';
      }//else not a forfeit
    }//if we want to show this game
  }//loop over all games
  return html + '<hr>' + '\n';
}//scoreboardGameSummaries

/*---------------------------------------------------------
Header row for the table containing a team's games on the
team detail page.
---------------------------------------------------------*/
function teamDetailGameTableHeader(packetsExist,settings) {
  var html = '<tr>' + '\n' +
    '<td align=center><b>Rd.</b></td>' + '\n' +
    '<td align=left><b>Opponent</b></td>' + '\n' +
    '<td align=left><b>Result</b></td>' + '\n' +
    '<td align=right><b>PF</b></td>' + '\n' +
    '<td align=right><b>PA</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
  }
  html += '<td align=right><b>10</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>-5</b></td>' + '\n';
  }
  html += '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>PPTUH</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>Pwr/N</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>G/N</b></td>' + '\n';
  }
  if(useBonus(settings)) {
    html += '<td align=right><b>BHrd</b></td>' + '\n' +
      '<td align=right><b>BPts</b></td>' + '\n' +
      '<td align=right><b>PPB</b></td>' + '\n';
  }
  if(useBb(settings)) {
    html += '<td align=right><b>BBHrd</b></td>' + '\n' +
    '<td align=right><b>BBPts</b></td>' + '\n' +
    '<td align=right><b>PPBB</b></td>' + '\n';
  }
  if(packetsExist) {
    html += '<td align=left><b>Packet</b></td>' + '\n';
  }
  html += '</tr>'  + '\n';
  return html;
}

/*---------------------------------------------------------
A mostly-blank row in a team detail table for a forfeit.
---------------------------------------------------------*/
function forfeitRow(opponent, round, result, roundStyle) {
  return '<tr>' + '\n' +
    '<td align=center' + roundStyle + '>' + round + '</td>' + '\n' +
    '<td align=left>' + opponent + '</td>' + '\n' +
    '<td align=right>' + result + '</td>' + '\n' +
    '<td align=right>Forfeit</td>' + '\n' +
    '</tr>' + '\n';
}

/*---------------------------------------------------------
Get the background inline CSS for the round column.
Color-coded to match phase colors in the application
---------------------------------------------------------*/
function getRoundStyle(gamePhases, phaseColors) {
  if(gamePhases.length == 1) {
    return ' style="background-color: ' + phaseColors[gamePhases[0]] + '"';
  }
  else if(gamePhases.length > 1) {
    return ' style="background-image: linear-gradient(to bottom right, ' +
      phaseColors[gamePhases[0]] + ' 50%, ' + phaseColors[gamePhases[1]] + ' 51%)"';
  }
  return '';
}

/*---------------------------------------------------------
Floating table to explain what the colors mean
Some of the style here will be redundant on the team and
player detail pages, but it's needed for the scoreboard
page since it doesn't use tableStyle()
---------------------------------------------------------*/
function phaseLegend(phaseColors) {
  var phaseCnt = 0;
  var html = '<table border=0' +
    ' style="bottom:20px;right:35px;position:fixed;box-shadow: 4px 4px 7px #999999;border-spacing:0;border-collapse:separate;">' + '\n';
  for(var p in phaseColors) {
    html += '<tr>' + '\n';
    html += '<td style="background-color:' + phaseColors[p] + ';padding:5px">&nbsp;&nbsp;&nbsp;&nbsp;</td>' + '\n';
    html += '<td style="background-color:white;padding:5px">' + p + '</td>' + '\n';
    html += '</tr>' + '\n';
  }
  html += '</table>' + '\n';
  return html;
}

/*---------------------------------------------------------
Row for a single game for a single team on the team detail
page.
---------------------------------------------------------*/
function teamDetailGameRow(game, whichTeam, packetsExist, packets, settings, phaseColors, formatRdCol, fileStart) {
  var opponent, opponentScore, result, score, players;
  var roundStyle = formatRdCol ? getRoundStyle(game.phases, phaseColors) : '';

  if(whichTeam == 1) {
    opponent = game.team2;
    if(game.forfeit) { //team1 is arbitrarily the winner of a forfeit
      return forfeitRow(opponent, game.round, 'W', roundStyle);
    }
    if(+game.score1 > +game.score2) { result = 'W'; }
    else if(+game.score1 < +game.score2) { result = 'L'; }
    else { result = 'T'; }
    score = game.score1;
    opponentScore = game.score2;
    players = game.players1;
  }
  else {
    opponent = game.team1;
    if(game.forfeit) { //team2 is arbitrarily the loser of a forfeit
      return forfeitRow(opponent, game.round, 'L', roundStyle);
    }
    if(+game.score2 > +game.score1) { result = 'W'; }
    else if(+game.score2 < +game.score1) { result = 'L'; }
    else { result = 'T'; }
    score = game.score2;
    opponentScore = game.score1;
    players = game.players2;
  }
  if(game.ottu > 0) { result += ' (OT)'; }
  var powers = teamPowers(game, whichTeam);
  var tens = teamTens(game, whichTeam);
  var negs = teamNegs(game, whichTeam);
  var ppth = (score - otPoints(game, whichTeam, settings)) / (game.tuhtot - game.ottu);
  var pPerN = negs == 0 ? 'inf' : powers / negs;
  var gPerN = negs == 0 ? 'inf' : (powers + tens) / negs;
  var bHeard = bonusesHeard(game, whichTeam);
  var bPts = bonusPoints(game, whichTeam, settings);
  var ppb = bHeard == 0 ? 'inf' : bPts / bHeard;
  var bbHrd = bbHeard(game, whichTeam, settings);
  var bbPts = whichTeam == 1 ? +game.bbPts1 : +game.bbPts2;
  var ppbb = bbPts / bbHrdToFloat(bbHrd);

  var linkId = scoreboardLinkID(game);
  var html = '<tr>' + '\n';
  html += '<td align=center' + roundStyle + '>' + game.round + '</td>' + '\n';
  html += '<td align=left>' + opponent + '</td>' + '\n';
  html += '<td align=left><a HREF=' + fileStart + 'games.html#' + linkId + '>' +
    result + '</a></td>' + '\n';
  html += '<td align=right>' + score + '</td>' + '\n';
  html += '<td align=right>' + opponentScore + '</td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right>' + powers + '</td>' + '\n';
  }
  html += '<td align=right>' + tens + '</td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right>' + negs + '</td>' + '\n';
  }
  html += '<td align=right>' + game.tuhtot + '</td>' + '\n';
  html += '<td align=right>' + formatRate(ppth, 2) + '</td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right>' + formatRate(pPerN, 2) + '</td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right>' + formatRate(gPerN, 2) + '</td>' + '\n';
  }
  if(useBonus(settings)) {
    html += '<td align=right>' + bHeard + '</td>' + '\n';
    html += '<td align=right>' + bPts + '</td>' + '\n';
    html += '<td align=right>' + formatRate(ppb, 2) + '</td>' + '\n';
  }
  if(useBb(settings)) {
    html += '<td align=right>' + bbHrdDisplay(bbHrd) + '</td>' + '\n';
    html += '<td align=right>' + bbPts + '</td>' + '\n';
    html += '<td align=right>' + formatRate(ppbb, 2) + '</td>' + '\n';
  }
  if(packetsExist) {
    var packetName = packets[game.round] == undefined ? '' : packets[game.round];
    html += '<td align=left>' + packetName + '</td>' + '\n';
  }
  html += '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
The totals row of a games table on the team detail page.
---------------------------------------------------------*/
function teamDetailTeamSummaryRow(teamSummary, packetsExist, settings) {
  var html = '<tfoot>' + '\n' + '<tr>' + '\n';
  html += '<td style="border-top:1px solid white"></td>' + '\n';
  html += '<td align=left><b>Total</b></td>' + '\n';
  html += '<td></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.points + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.ptsAgainst + '</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + teamSummary.powers + '</b></td>' + '\n';
  }
  html += '<td align=right><b>' + teamSummary.tens + '</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>' + teamSummary.negs + '</b></td>' + '\n';
  }
  html += '<td align=right><b>' + teamSummary.tuh + '</b></td>' + '\n';
  html += '<td align=right><b>' + teamSummary.ppth + '</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>' + teamSummary.pPerN + '</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>' + teamSummary.gPerN + '</b></td>' + '\n';
  }
  if(useBonus(settings)) {
    html += '<td align=right><b>' + teamSummary.bHeard + '</b></td>' + '\n';
    html += '<td align=right><b>' + teamSummary.bPts + '</b></td>' + '\n';
    html += '<td align=right><b>' + teamSummary.ppb + '</b></td>' + '\n';
  }
  if(useBb(settings)) {
    html += '<td align=right><b>' + bbHrdDisplay(teamSummary.bbHeard) + '</b></td>' + '\n';
    html += '<td align=right><b>' + teamSummary.bbPts + '</b></td>' + '\n';
    html += '<td align=right><b>' + teamSummary.ppbb + '</b></td>' + '\n';
  }
  if(packetsExist) {
    html += '<td></td>' + '\n';
  }
  html += '</tr>' + '\n' + '</tfoot>' + '\n';

  return html;
}

/*---------------------------------------------------------
Header row for the table of a teams's players on the team
detail page.
---------------------------------------------------------*/
function teamDetailPlayerTableHeader(settings) {
  var html = '<tr>' + '\n' +
    '<td align=left><b>Player</b></td>' + '\n' +
    '<td align=left><b>Team</b></td>' + '\n' +
    '<td align=right><b>GP</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
  }
  html += '<td align=right><b>10</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>-5</b></td>' + '\n';
  }
  html += '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>PPTUH</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>Pwr/N</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>G/N</b></td>' + '\n';
  }
  html += '<td align=right><b>Pts</b></td>' + '\n' +
    '<td align=right><b>PPG</b></td>' + '\n' +
    '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
Row for a single player on the team detail page.
---------------------------------------------------------*/
function teamDetailPlayerRow(player, fileStart, settings) {
  var linkId = player.teamName.replace(/\W/g, '') + '-' +
    player.playerName.replace(/\W/g, '');
  var html = '<tr>' + '\n';
  html += '<td align=left><a HREF=' + fileStart + 'playerdetail.html#' + linkId + '>' +
    player.playerName + '</a></td>' + '\n';
  html += '<td align=left>' + player.teamName + '</td>' + '\n';
  html += '<td align=right>' + player.gamesPlayed + '</td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right>' + player.powers + '</td>' + '\n';
  }
  html += '<td align=right>' + player.tens + '</td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right>' + player.negs + '</td>' + '\n';
  }
  html += '<td align=right>' + player.tuh + '</td>' + '\n';
  html += '<td align=right>' + player.pptu + '</td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right>' + player.pPerN + '</td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right>' + player.gPerN + '</td>' + '\n';
  }
  html += '<td align=right>' + player.points + '</td>' + '\n';
  html += '<td align=right>' + player.ppg + '</td>' + '\n';
  html += '</tr>' + '\n';

  return html;
}

/*---------------------------------------------------------
Header row for a table on the player detail page.
---------------------------------------------------------*/
function playerDetailTableHeader(settings) {
  var html = '<tr>' + '\n' +
    '<td align=center><b>Rd.</b></td>' + '\n' +
    '<td align=left><b>Opponent</b></td>' + '\n' +
    '<td align=left><b>Result</b></td>' + '\n' +
    '<td align=right><b>GP</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + powerValue(settings) + '</b></td>' + '\n';
  }
  html += '<td align=right><b>10</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>-5</b></td>' + '\n';
  }
  html += '<td align=right><b>TUH</b></td>' + '\n' +
    '<td align=right><b>PPTUH</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>Pwr/N</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>G/N</b></td>' + '\n';
  }
  html += '<td align=right><b>Pts</b></td>' + '\n' +
    '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
Generate a link, showing the outcome of the game, to the
specified game on the scoreboard page
---------------------------------------------------------*/
function playerDetailGameLink(game, whichTeam, fileStart) {
  var result;
  if(whichTeam == 1) {
    if(+game.score1 > +game.score2) { result = 'W'; }
    else if(+game.score1 < +game.score2) { result = 'L'; }
    else { result = 'T'; }
    result += ' ' + game.score1 + '-' + game.score2;
  }
  else {
    if(+game.score2 > +game.score1) { result = 'W'; }
    else if(+game.score2 < +game.score1) { result = 'L'; }
    else { result = 'T'; }
    result += ' ' + game.score2 + '-' + game.score1;
  }
  if(game.ottu > 0) { result += ' (OT)'; }
  var linkId = scoreboardLinkID(game);
  return '<a HREF=' + fileStart + 'games.html#' + linkId + '>' +
    result + '</a>';
}

/*---------------------------------------------------------
Row for one game for one player on the player detail page.
---------------------------------------------------------*/
function playerDetailGameRow(player, tuhtot, opponent, round, link, settings, gamePhases, phaseColors, formatRdCol) {
  var [tuh, powers, tens, negs] = playerSlashLine(player);
  if(tuh <= 0) {
    return '';
  }
  var gp = tuh / tuhtot;
  var points = powerValue(settings)*powers + 10*tens - 5*negs;
  var pptu = points / tuh;
  var pPerN = negs == 0 ? 'inf' : powers / negs;
  var gPerN = negs == 0 ? 'inf' : (powers + tens) / negs;

  var roundStyle = formatRdCol ? getRoundStyle(gamePhases, phaseColors) : '';

  var html = '<tr>' + '\n';
  html += '<td align=center' + roundStyle + '>' + round + '</td>' + '\n';
  html += '<td align=left>' + opponent + '</td>' + '\n';
  html += '<td align=left>' + link + '</td>' + '\n';
  html += '<td align=right>' + formatRate(gp, 1) + '</td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right>' + powers + '</td>' + '\n';
  }
  html += '<td align=right>' + tens + '</td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right>' + negs + '</td>' + '\n';
  }
  html += '<td align=right>' + tuh + '</td>' + '\n';
  html += '<td align=right>' + formatRate(pptu, 2) + '</td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right>' + formatRate(pPerN, 2) + '</td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right>' + formatRate(gPerN, 2) + '</td>' + '\n';
  }
  html += '<td align=right>' + points + '</td>' + '\n';
  html += '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
Total row for a table on the player detail page. Reuse
results of compileIndividuals
---------------------------------------------------------*/
function playerDetailTotalRow(player, settings) {
  var html = '<tfoot>' + '\n' + '<tr>' + '\n';
  html += '<td style="border-top:1px solid white"></td>' + '\n';
  html += '<td align=left><b>Total</b></td>' + '\n';
  html += '<td></td>' + '\n';
  html += '<td align=right><b>' + player.gamesPlayed + '</b></td>' + '\n';
  if(usePowers(settings)) {
    html += '<td align=right><b>' + player.powers + '</b></td>' + '\n';
  }
  html += '<td align=right><b>' + player.tens + '</b></td>' + '\n';
  if(useNegs(settings)) {
    html += '<td align=right><b>' + player.negs + '</b></td>' + '\n';
  }
  html += '<td align=right><b>' + player.tuh + '</b></td>' + '\n';
  html += '<td align=right><b>' + player.pptu + '</b></td>' + '\n';
  if(usePPerN(settings)) {
    html += '<td align=right><b>' + player.pPerN + '</b></td>' + '\n';
  }
  if(useGPerN(settings)) {
    html += '<td align=right><b>' + player.gPerN + '</b></td>' + '\n';
  }
  html += '<td align=right><b>' + player.points + '</b></td>' + '\n';
  html += '</tr>' + '\n' + '</tfoot>' + '\n';
  return html;
}

/*---------------------------------------------------------
Aggregate round data for the round report.
---------------------------------------------------------*/
function compileRoundSummaries(games, phase, settings) {
  var summaries = [];
  for(var i in games) {
    var game = games[i];
    var round = game.round;
    if((phase == 'all' || game.phases.includes(phase)) && !game.forfeit) {
      if(summaries[round] == undefined) {
        summaries[round] = {
          numberOfGames: 0,
          totalPoints: 0,
          tuPts: 0,
          tuh: 0,
          bPts: 0,
          bHeard: 0,
          bbPts: 0,
          bbHeard: [0,0],
          ppg: 0,
          tuPtsPTu: 0,
          ppb: 0,
          ppbb: 0,
        }
      }
      var smry = summaries[round];
      smry.numberOfGames += 1;
      smry.totalPoints += (+game.score1) +
        (+game.score2) - otPoints(game, 1, settings) - otPoints(game, 2, settings);
      smry.tuPts += powerValue(settings)*teamPowers(game, 1) +
        powerValue(settings)*teamPowers(game, 2) +
        10*teamTens(game, 1) + 10*teamTens(game, 2) +
        negValue(settings)*teamNegs(game, 1) + negValue(settings)*teamNegs(game, 2);
      smry.tuh += +game.tuhtot;
      smry.bPts += bonusPoints(game, 1, settings) + bonusPoints(game, 2, settings);
      smry.bHeard += bonusesHeard(game, 1) + bonusesHeard(game, 2);
      smry.bbPts += (+game.bbPts1) + (+game.bbPts2);
      smry.bbHeard = bbHrdAdd(smry.bbHeard, bbHrdAdd(bbHeard(game, 1 ,settings), bbHeard(game, 2, settings)));
    }
  }
  for(var i in summaries) {
    var smry = summaries[i];
    smry.ppg = smry.totalPoints / (2 * smry.numberOfGames);
    smry.tuPtsPTu = smry.tuPts / smry.tuh;
    smry.ppb = smry.bHeard == 0 ? 0 : smry.bPts / smry.bHeard;
    smry.ppbb = smry.bbPts / bbHrdToFloat(smry.bbHeard);
  }
  return summaries;
}

/*---------------------------------------------------------
Header row for the table in the round report.
---------------------------------------------------------*/
function roundReportTableHeader(packetsExist, settings) {
  var html = '<tr>' + '\n' +
    '<td><b>Round</b></td>' + '\n';
  if(packetsExist) {
    html += '<td><b>Packet</b></td>' + '\n';
  }
  html += '<td><b>Number of Games</b></td>' + '\n' +
    '<td><b>PPG/Team</b></td>' + '\n';
  if(useBonus(settings)) {
    html += '<td><b>TUPts/TUH</b></td>' + '\n' +
      '<td><b>PPB</b></td>' + '\n';
  }
  else { html += '<td><b>Pts/TUH</b></td>' + '\n'; }
  if(useBb(settings)) {
    html += '<td><b>PPBB</b></td>' + '\n';
  }
  html += '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
A row of data in the round report.
---------------------------------------------------------*/
function roundReportRow(smry, roundNo, packetsExist, packets, settings) {
  var html = '<tr>' + '\n' +
    '<td>' + roundNo + '</td>' + '\n';
  if(packetsExist) {
    var packetName = packets[roundNo] == undefined ? '' : packets[roundNo];
    html += '<td>' + packetName + '</td>' + '\n';
  }
  html += '<td>' + smry.numberOfGames + '</td>' + '\n' +
    '<td>' + smry.ppg.toFixed(1) + '</td>' + '\n' +
    '<td>' + smry.tuPtsPTu.toFixed(2) + '</td>' + '\n';
  if(useBonus(settings)) {
    html += '<td>' + smry.ppb.toFixed(2) + '</td>' + '\n';
  }
  if(useBb(settings)) {
    html += '<td>' + smry.ppbb.toFixed(2) + '</td>' + '\n';
  }
  html += '</tr>' + '\n';
  return html;
}

/*---------------------------------------------------------
The links at the top of every page of the report.
---------------------------------------------------------*/
function getStatReportTop(statKeySection, fileStart, pageTitle) {
  // some tags need to be in all caps in order for HSQuizbowl to recognize the
  // file as a valid stat report.
  return '<HTML>' + '\n' +
    '<HEAD>' + '\n' +
    '<link rel="stylesheet" HREF="hsqb-style.css">' + '\n' +
    '<title>' + pageTitle + '</title>' + '\n' +
    '</HEAD>' + '\n' +
    '<BODY>' + '\n' +
    '<table border=0 width=100%>' + '\n' +
    '<tr>' + '\n' +
      '<td><a HREF=' + fileStart + 'standings.html>Standings</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'individuals.html>Individuals</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'games.html>Scoreboard</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'teamdetail.html>Team Detail</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'playerdetail.html>Individual Detail</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'rounds.html>Round Report</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'statkey.html#' + statKeySection + '>Stat Key</a></td>' + '\n' +
    '</tr>' + '\n' +
    '</table>' + '\n';
}

/*---------------------------------------------------------
Closing tags at the end of the page.
---------------------------------------------------------*/
function getStatReportBottom() {
  return '<h5>Made with YellowFruit &#x1F34C;</h5>' + '\n' + // banana emoji
    '</BODY>' + '\n' +
    '</HTML>';
}

/*---------------------------------------------------------
Stylesheet for table formatting. HTML5 supports putting
this in the body.
---------------------------------------------------------*/
function tableStyle() {
  return '<style>\n' +
    'td {\n  padding: 5px;\n}\n' +
    'tfoot {\n  border-top: 1px solid #909090;\n}\n' +
    'tr:nth-child(even) {\n  background-color: #f2f2f2;\n}\n' +
    'table {\n  border-spacing: 0;\n  border-collapse: collapse;\n}\n' +
    '</style>'
}

/*---------------------------------------------------------
Generate the team standings page.
---------------------------------------------------------*/
function getStandingsHtml(teams, games, fileStart, phase, groupingPhase, divsInPhase, settings) {
  var standings = compileStandings(teams, games, phase, groupingPhase, settings);
  var html = getStatReportTop('TeamStandings', fileStart, 'Team Standings') +
    '<h1> Team Standings</h1>' + '\n';
  html += tableStyle();
  if(divsInPhase != undefined && divsInPhase.length > 0) {
    for(var i in divsInPhase) {
      html += '<h2>' + divsInPhase[i] + '</h2>' + '\n';
      html += '<table width=100%>' + '\n' + standingsHeader(settings);
      var teamsInDiv = _.filter(standings, (t) => { return t.division == divsInPhase[i] });
      for(var j in teamsInDiv) {
        html += standingsRow(teamsInDiv[j], parseFloat(j)+1, fileStart, settings);
      }
      html += '</table>' + '\n';
    }
  }
  else { //not using divisions
    html += '<table width=100%>' + '\n' + standingsHeader(settings);
    for(var i in standings) {
      html += standingsRow(standings[i], parseFloat(i)+1, fileStart, settings);
    }
    html += '\n' + '</table>' + '\n';
  }
  return html + getStatReportBottom();
}//getStandingsHtml

/*---------------------------------------------------------
Generate the individual standings page.
---------------------------------------------------------*/
function getIndividualsHtml(teams, games, fileStart, phase, groupingPhase, usingDivisions, settings) {
  var individuals = compileIndividuals(teams, games, phase, groupingPhase, settings);
  var html = getStatReportTop('IndividualStandings', fileStart, 'Individual Standings') +
    '<h1> Individual Statistics</h1>' + '\n';
  html += tableStyle();
  html += '<table width=100%>' + individualsHeader(usingDivisions, settings);
  for(var i in individuals) {
    html += individualsRow(individuals[i], parseFloat(i)+1, fileStart, usingDivisions, settings);
  }
  return html + '\n' + '</table>' + '\n' +  getStatReportBottom();
}

/*---------------------------------------------------------
Generate the scoreboard page.
---------------------------------------------------------*/
function getScoreboardHtml(teams, games, fileStart, phase, settings, packets, phaseColors) {
  var roundList = getRoundsForScoreboard(games, phase);
  var html = getStatReportTop('Scoreboard', fileStart, 'Scoreboard') + '\n';
  html += scoreboardRoundLinks(roundList, fileStart) + '<br>' + '\n';
  html += '<h1> Scoreboard</h1>' + '\n';
  if(phase == 'all') {
    html += phaseLegend(phaseColors, true) + '\n';
  }
  var roundNo;
  for(var r in roundList) {
    roundNo = roundList[r];
    html += scoreboardRoundHeader(roundNo, packets[roundNo]);
    html += scoreboardGameSummaries(games, roundNo, phase, settings, phaseColors);
  }
  return html + '\n' + getStatReportBottom();
}

/*---------------------------------------------------------
Generate the team detail page.
---------------------------------------------------------*/
function getTeamDetailHtml(teams, games, fileStart, phase, packets, settings, phaseColors) {
  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return toNum(item.round); }, 'asc');
  var standings = compileStandings(teams, games, phase, null, settings);
  var individuals = compileIndividuals(teams, games, phase, null, settings);
  var packetsExist = packetNamesExist(packets);

  var html = getStatReportTop('TeamDetail', fileStart, 'Team Detail') + '\n' +
    '<h1> Team Detail</h1>' + '\n';
  if(phase == 'all') { html += phaseLegend(phaseColors) + '\n'; }
  html += tableStyle();

  for(var i in teams) {
    var teamName = teams[i].teamName;
    var linkId = teamName.replace(/\W/g, '');
    html += '<h2 id=' + linkId + '>' + teamName + '</h2>' + '\n';
    html += '<table width=100%>' + '\n';
    html += teamDetailGameTableHeader(packetsExist, settings) + '\n';
    for(var j in games) {
      let gameInPhase = phase == 'all' || games[j].phases.includes(phase);
      if(gameInPhase && games[j].team1 == teamName) {
        html += teamDetailGameRow(games[j], 1, packetsExist, packets, settings, phaseColors, phase=='all', fileStart);
      }
      else if(gameInPhase && games[j].team2 == teamName) {
        html += teamDetailGameRow(games[j], 2, packetsExist, packets, settings, phaseColors, phase=='all', fileStart);
      }
    }
    var teamSummary = _.find(standings, (o) => { return o.teamName == teamName; });
    html += teamDetailTeamSummaryRow(teamSummary, packetsExist, settings);
    html += '</table>' + '<br>' + '\n';
    html += '<table width=100%>' + '\n';
    html += teamDetailPlayerTableHeader(settings) + '\n';
    for(var i in individuals) {
      if(individuals[i].teamName == teamName) {
        html += teamDetailPlayerRow(individuals[i], fileStart, settings);
      }
    }
    html += '</table>' + '<br>' + '\n';
  }
  return html + getStatReportBottom();
}//getTeamDetailHtml

/*---------------------------------------------------------
Generate the player detail page.
---------------------------------------------------------*/
function getPlayerDetailHtml(teams, games, fileStart, phase, settings, phaseColors) {
  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return parseFloat(item.round); }, 'asc');
  var playerTotals = compileIndividuals(teams, games, phase, null, settings);
  playerTotals = _.orderBy(playerTotals,
    [function(item) { return item.teamName.toLowerCase(); },
    function(item) { return item.playerName.toLowerCase(); }],
    ['asc', 'asc']);

  var html = getStatReportTop('IndividualDetail', fileStart, 'Individual Detail') +
    '<h1> Individual Detail</h1>' + '\n';
  if(phase == 'all') { html += phaseLegend(phaseColors) + '\n'; }
  html += tableStyle();

  for(var i in playerTotals) {
    var indvTot = playerTotals[i];
    var linkId = indvTot.teamName.replace(/\W/g, '') + '-' +
      indvTot.playerName.replace(/\W/g, '');
    html += '<h2 id=' + linkId + '>' +
      indvTot.playerName + ', ' + indvTot.teamName + '</h2>' + '\n';
    html += '<table width=100%>' + '\n';
    html += playerDetailTableHeader(settings);
    for(var j in games) {
      var game = games[j];
      let gameInPhase = phase == 'all' || game.phases.includes(phase);
      if (gameInPhase && game.team1 == indvTot.teamName) {
        for(var p in game.players1) {
          if(p == indvTot.playerName) {
            var link = playerDetailGameLink(game, 1, fileStart);
            html += playerDetailGameRow(game.players1[p], game.tuhtot, game.team2,
              game.round, link, settings, game.phases, phaseColors, phase == 'all');
          }
        }
      }
      else if (gameInPhase && game.team2 == indvTot.teamName) {
        var link = playerDetailGameLink(game, 2, fileStart);
        for(var p in game.players2) {
          if(p == indvTot.playerName) {
            html += playerDetailGameRow(game.players2[p], game.tuhtot, game.team1,
              game.round, link, settings, game.phases, phaseColors, phase == 'all');
          }
        }
      }
    }
    html += playerDetailTotalRow(indvTot, settings);
    html += '</table>' + '<br>' + '\n';
  }//loop over all players in the tournament

  return html + getStatReportBottom();
}//getPlayerDetailHtml

/*---------------------------------------------------------
Generate the team round report page.
---------------------------------------------------------*/
function getRoundReportHtml(teams, games, fileStart, phase, packets, settings) {
  games = _.orderBy(games, function(item) { return parseFloat(item.round); }, 'asc');
  var roundSummaries = compileRoundSummaries(games, phase, settings);
  var packetsExist = packetNamesExist(packets);
  var html = getStatReportTop('RoundReport', fileStart, 'Round Report') +
    '<h1> Round Report</h1>' + '\n';
  html += tableStyle();
  html += '<table width=100%>' + '\n';
  html += roundReportTableHeader(packetsExist, settings);
  for(var i in roundSummaries) {
    html += roundReportRow(roundSummaries[i], i, packetsExist, packets, settings);
  }
  html += '</table>' + '\n';
  return html + getStatReportBottom();
}

/*---------------------------------------------------------
Generate the stat key page.
---------------------------------------------------------*/
function getStatKeyHtml(fileStart) {
  var html = getStatReportTop('', fileStart, 'Stat Key');
  var statKeyBodyLocation = Path.resolve(__dirname, 'statKeyBody.html');
  html += fs.readFileSync(statKeyBodyLocation, 'utf8');
  return html + getStatReportBottom();
}
