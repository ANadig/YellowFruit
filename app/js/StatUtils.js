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
    var idx1 = _.findIndex(standings, function (o) {
      return o.teamName == g.team1;
    });
    var idx2 = _.findIndex(standings, function (o) {
      return o.teamName == g.team2;
    });
    if(g.score1 > g.score2) {
      standings[idx1].wins += 1;
      standings[idx2].losses += 1;
    }
    else if(g.score2 > g.score1) {
      standings[idx1].losses += 1;
      standings[idx2].wins += 1;
    }
    else { //it's a tie
      standings[idx1].ties += 1;
      standings[idx2].ties += 1;
    }
    standings[idx1].points += parseFloat(g.score1);
    standings[idx2].points += parseFloat(g.score2);
    standings[idx1].ptsAgainst += parseFloat(g.score2);
    standings[idx2].ptsAgainst += parseFloat(g.score1);

    standings[idx1].tuh += parseFloat(g.tuhtot);
    standings[idx2].tuh += parseFloat(g.tuhtot);

    standings[idx1].powers += teamPowers(g, 1);
    standings[idx2].powers += teamPowers(g, 2);
    standings[idx1].gets += teamGets(g, 1);
    standings[idx2].gets += teamGets(g, 2);
    standings[idx1].negs += teamNegs(g, 1);
    standings[idx2].negs += teamNegs(g, 2);

    standings[idx1].bHeard += bonusesHeard(g,1);
    standings[idx2].bHeard += bonusesHeard(g,2);
    standings[idx1].bPts += bonusPoints(g,1);
    standings[idx2].bPts += bonusPoints(g,2);
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
  return  getStatReportTop() +
    '<H1> Individual Statistics</H1>' + '\n' +
    getStatReportBottom();
}

function getScoreboardHtml(teams, games) {
  return  getStatReportTop() +
    '<H1> Scoreboard</H1>' + '\n' +
    getStatReportBottom();
}

function getTeamDetailHtml(teams, games) {
  return  getStatReportTop() +
    '<H1> Team Detail</H1>' + '\n' +
    getStatReportBottom();
}

function getIndvDetailHtml(teams, games) {
  return  getStatReportTop() +
    '<H1> Individual Detail</H1>' + '\n' +
    getStatReportBottom();
}

function getRoundReportHtml(teams, games) {
  return  getStatReportTop() +
    '<H1> Round Report</H1>' + '\n' +
    getStatReportBottom();
}
