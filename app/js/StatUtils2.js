



// generate the old SQBS-style game summaries. Not currently used.
function oldScoreboardGameSummaries(myGames, roundNo, phase, settings) {
  var html = '';
  for(var i in myGames) {
    var g = myGames[i];
    if((phase == 'all' || g.phases.includes(phase)) && g.round == roundNo) {
      var linkId = 'R' + roundNo + '-' + g.team1.replace(/\W/g, '') + '-' +
        g.team2.replace(/\W/g, '');
      if(g.forfeit) {
        html += '<br><span id=\"' + linkId + '\"><font size=+1>' + g.team1 +
        ' defeats ' + g.team2 + ' by forfeit' + '</font></span><br>';
      }
      else {
        html += '<p>' + '\n';
        html += '<span id=\"' + linkId + '\"><font size=+1>';
        if(toNum(g.score1) >= toNum(g.score2)) {
          html += g.team1 + ' ' + g.score1 + ', ' + g.team2 + ' ' + g.score2;
        }
        else {
          html += g.team2 + ' ' + g.score2 + ', ' + g.team1 + ' ' + g.score1;
        }
        if(g.ottu > 0) {
          html += ' (OT)';
        }
        html += '</font></span><br>' + '\n' +
          '<font size=-1>' + '\n';
        html += g.team1 + ': ';
        for(var p in g.players1) {
          var [tuh, pwr, tn, ng] = playerSlashLine(g.players1[p]);
          html += p + ' ';
          if(settings.powers != 'none') {
            html += pwr + ' ';
          }
          html += tn + ' ';
          if(settings.negs == 'yes') {
            html += ng + ' ';
          }
          html += (powerValue(settings)*pwr + 10*tn + negValue(settings)*ng) + ', ';
        }
        html = html.substr(0, html.length - 2); //remove the last comma+space
        html += '<br>' + '\n';
        html += g.team2 + ': ';
        for(var p in g.players2) {
          var [tuh, pwr, tn, ng] = playerSlashLine(g.players2[p]);
          html += p + ' ';
          if(settings.powers != 'none') {
            html += pwr + ' ';
          }
          html += tn + ' ';
          if(settings.negs == 'yes') {
            html += ng + ' ';
          }
          html += (powerValue(settings)*pwr + 10*tn + negValue(settings)*ng) + ', ';
        }
        html = html.substr(0, html.length - 2); //remove the last comma+space
        html += '<br>' + '\n';
        if(settings.bonuses != 'none') {
          var bHeard = bonusesHeard(g, 1), bPts = bonusPoints(g, 1, settings);
          var ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += 'Bonuses: ' + g.team1 + ' ' + bHeard + ' ' + bPts + ' ' + ppb.toFixed(2) + ', ';
          bHeard = bonusesHeard(g, 2), bPts = bonusPoints(g, 2, settings);
          ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += g.team2 + ' ' + bHeard + ' ' + bPts + ' ' + ppb.toFixed(2) + '<br>' + '\n';
        }
        if(settings.bonuses == 'yesBb') {
          var bbHrd = bbHeard(g, 1, settings);
          var ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts1 / bbHrdToFloat(bbHrd);
          html += 'Bonus Bouncebacks: ' + g.team1 + ' ' +
            bbHrdDisplay(bbHrd) + ' ' + toNum(g.bbPts1) + ' ' + ppbb.toFixed(2) + ', ';
          bbHrd = bbHeard(g, 2, settings);
          ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts2 / bbHrdToFloat(bbHrd);
          html += g.team2 + ' ' + bbHrdDisplay(bbHrd) + ' ' + toNum(g.bbPts2) + ' ' +
            ppbb.toFixed(2)  + '<br>' + '\n';
        }
      }//else not a forfeit
    }//if we want to show this game
  }//loop over all games
  return html + '</font>' + '\n' + '</p>' + '\n';
}//scoreboardGameSummaries
