/***********************************************************
QbjUtils2.js
Andrew Nadig

Functions for writing QBJ 2.0 files
***********************************************************/

const StatUtils = require('./StatUtils');
module.exports = {};

/*---------------------------------------------------------
Generate an object conforming to the tournament schemo
---------------------------------------------------------*/
module.exports.getQbjFile = function(settings, divisions, teams, games, packets, tbsExist) {
  var  topLevel = {
    version: '2.0',
    objects: []
  };
  var objList = [];

  var answerTypesQbj = getAnswerTypes(settings);
  var rankingsQbj = getRankings();
  var [teamsQbj, playersQbj] = getTeamsAndPlayers(teams);
  var roundPhases = assignRoundsToPhases(divisions, games);
  var [matchesQbj, matchIdsByRound] = getMatches(divisions, games, roundPhases, settings);
  var roundsQbj = getRounds(roundPhases, packets, matchIdsByRound);
  var phasesQbj = getPhases(divisions, roundPhases, teams, tbsExist);
  objList = objList.concat(answerTypesQbj);
  objList = objList.concat(rankingsQbj);
  objList = objList.concat(phasesQbj);
  objList = objList.concat(teamsQbj);
  objList = objList.concat(playersQbj);
  objList = objList.concat(roundsQbj);
  objList = objList.concat(matchesQbj);
  topLevel.objects = objList;
  return topLevel;
}

/*---------------------------------------------------------
Assemble AnswerType objects.
---------------------------------------------------------*/
function getAnswerTypes(settings) {
  var types = [];
  if(settings.powers != 'none') {
    let power = {
      type: 'AnswerType',
      id: 'AnswerType_power',
      value: settings.powers == '20pts' ? 20 : 15
    };
    types.push(power);
  }
  let ten = {
    type: 'AnswerType',
    id: 'AnswerType_ten',
    value: 10
  };
  types.push(ten);
  if(settings.negs) {
    let neg = {
      type: 'AnswerType',
      id: 'AnswerType_neg',
      value: -5
    };
    types.push(neg);
  }
  return types;
}

/*---------------------------------------------------------
Assemble Ranking objects. currently there is only one
ranking "All games" which can hold the manual rank override
---------------------------------------------------------*/
function getRankings() {
  var overall = {
    type: 'Ranking',
    id: 'Ranking_AllGames',
    description: 'Overall placement in the tournament, if specified by the user'
  };
  return [overall];
}

/*---------------------------------------------------------
Assemble Team and Player objects
---------------------------------------------------------*/
function getTeamsAndPlayers(teams) {
  var teamObjs = [];
  var playerObjs = [];
  for(var i in teams) {
    let t = teams[i];
    let teamName = t.teamName;
    let team = {
      type: 'Team',
      id: 'Team_' + teamName,
      name: teamName,
      players: []
    };
    if(t.rank) {
      team.ranks = [{
        ranking: {$ref: 'Ranking_AllGames'},
        position: t.rank
      }];
    }
    for(var p in t.roster) {
      let playerId = 'Player_' + teamName + '_' + p;
      let player = {
        type: 'Player',
        id: playerId,
        name: p
      };
      team.players.push({$ref: playerId});
      // if a number from 0 to 18 appears in the Year field, use it.
      let numAry = t.roster[p].year.match(/\d{1,2}/);
      if(numAry != null) {
        gradeNo = numAry[0];
        if(0 <= gradeNo && gradeNo <= 18) {
          player.year = gradeNo;
        }
      }
      playerObjs.push(player);
    }
    teamObjs.push(team);
  } //loop over teams
  return [teamObjs, playerObjs];
}

/*---------------------------------------------------------
Figure out which rounds are in which phases
---------------------------------------------------------*/
function assignRoundsToPhases(divisions, games) {
  var roundGameCounts = {};
  var roundPhaseAssmnts = {};
  for(var i in games) {
    let g = games[i];
    let round = g.round;
    if(roundGameCounts[round] == undefined) { roundGameCounts[round] = {}; }
    for(var j in g.phases) {
      let phase = g.phases[j];
      if(roundGameCounts[round][phase] == undefined) {
        roundGameCounts[round][phase] = 1;
      }
      else { roundGameCounts[round][phase] += 1; }
    }
    //treat 'tiebreakers' as a normal phase here
    if(g.tiebreaker) {
      if(roundGameCounts[round]['Tiebreakers'] == undefined) {
        roundGameCounts[round]['Tiebreakers'] = 1;
      }
      else { roundGameCounts[round]['Tiebreakers'] +=1; }
    }
  }
  for(var r in roundGameCounts) {
    let max = 0, maxPhase = 'All Games';
    for(var p in roundGameCounts[r]) {
      let cnt = roundGameCounts[r][p];
      if(cnt > max) {
        max = cnt;
        maxPhase = p;
      }
    }
    roundPhaseAssmnts[r] = maxPhase;
  }
  return roundPhaseAssmnts;
}

/*---------------------------------------------------------
Assemble match objects.
Returns the list of matches, and an index of match IDs by
round number
---------------------------------------------------------*/
function getMatches(divisions, games, roundPhases, settings) {
  var matchObjs = [];
  var idsByRound = {};
  for(var i in games) {
    let g = games[i];
    let round = g.round, team1 = g.team1, team2 = g.team2;
    let id = 'Match_' + round + '_' + team1 + '_' + team2;
    if(idsByRound[round] == undefined) {
      idsByRound[round] = [{$ref: id}];
    }
    else { idsByRound[round].push({$ref: id}); }
    let match = {
      id: id,
      type: 'Match',
      tossups_read: g.tuhtot,
      overtime_tossups_read: g.ottu,
      tiebreaker: g.tiebreaker,
      notes: g.notes,
      match_teams: [],
      carryover_phases: []
    }
    match.match_teams.push(getMatchTeam(g, 1, settings));
    match.match_teams.push(getMatchTeam(g, 2, settings));
    //carryover phases are those are aren't the round's calculated phase
    for(var j in g.phases) {
      let p = g.phases[j];
      if(p != roundPhases[round]) {
        match.carryover_phases.push({$ref: 'Phase_' + p});
      }
    }
    matchObjs.push(match);
  }
  return [matchObjs, idsByRound];
}

/*---------------------------------------------------------
Generate a MatchTeam object for the given game
---------------------------------------------------------*/
function getMatchTeam(game, whichTeam, settings) {
  var teamName = whichTeam == 1 ? game.team1 : game.team2;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  var otPwr = whichTeam == 1 ? +game.otPwr1 : +game.otPwr2;
  var otTen = whichTeam == 1 ? +game.otTen1 : +game.otTen2;
  var matchTeam = {
    team: {$ref: 'Team_' + teamName},
    forfeit_loss: whichTeam == 2 && game.forfeit,
    correct_tossups_without_bonuses: otPwr + otTen,
    match_players: []
  };
  if(settings.bonuses) {
    matchTeam.bonus_points = StatUtils.bonusPoints(game, whichTeam, settings);
  }
  if(settings.bonusesBounce) {
    matchTeam.bonus_bounceback_points = whichTeam == 1 ? +game.bbPts1 : +game.bbPts2;
  }
  for(var p in players) {
    let ref = 'Player_' + teamName + '_' + p;
    matchTeam.match_players.push(getMatchPlayer(ref, players[p], settings));
  }
  return matchTeam;
}

/*---------------------------------------------------------
Generate a MatchPlayer object for the given game
---------------------------------------------------------*/
function getMatchPlayer(ref, player, settings) {
  var matchPlayer = {
    player: {$ref: ref},
    tossups_heard: player.tuh,
    answer_counts: []
  };
  //make PlayerAnswerCount objects
  var tens = {
    number: player.tens,
    answer_type: {$ref: 'AnswerType_ten'}
  };
  matchPlayer.answer_counts.push(tens);
  if(settings.powers != 'none') {
    var powers = {
      number: player.powers,
      answer_type: {$ref: 'AnswerType_power'}
    };
    matchPlayer.answer_counts.push(powers);
  }
  if(settings.negs) {
    var negs = {
      number: player.negs,
      answer_type: {$ref: 'AnswerType_neg'}
    };
    matchPlayer.answer_counts.push(negs);
  }

  return matchPlayer;
}

/*---------------------------------------------------------
Assemble Round objects
roundPhases: from assignRoundsToPhases (only using as a
  list of rounds)
packets: YF internal packet object
matchIdsByRound: from getMatches
---------------------------------------------------------*/
function getRounds(roundPhases, packets, matchIdsByRound) {
  var roundObjs = [];
  for(var r in roundPhases) {
    let packetName = packets[r];
    let round = {
      type: 'Round',
      id: 'Round_' + r,
      name: r,
      matches: matchIdsByRound[r]
    };
    if(packetName != undefined) { round.packets = [{name: packetName}]; }
    roundObjs.push(round);
  }
  return roundObjs
}

/*---------------------------------------------------------
Assemble Phase objects
roundPhases: from assignRoundsToPhases
divisions: YF internal phase/division object
teams: YF internal teams list
tbsExist: whether to create a "tiebreakers" phase
---------------------------------------------------------*/
function getPhases(divisions, roundPhases, teams, tbsExist) {
  var phaseObjs = [];
  for(var p in divisions) {
    let phase = {
      type: 'Phase',
      id: 'Phase_' + p,
      name: p,
      pools: [],
      rounds: []
    };
    let divList = divisions[p];
    for(var i in divList) {
      let div = divList[i];
      phase.pools.push(getPool(p, div, teams));
    }
    for(var r in roundPhases) {
      if(roundPhases[r] == p) {
        phase.rounds.push({$ref: 'Round_' + r});
      }
    }
    phaseObjs.push(phase);
  }
  if(tbsExist) {
    let tbPhase = {
      type: 'Phase',
      id: 'Phase_Tiebreakers',
      name: 'Tiebreakers',
      pools: [],
      rounds: []
    };
    for(var r in roundPhases) {
      if(roundPhases[r] == 'Tiebreakers') {
        tbPhase.rounds.push({$ref: 'Round_' + r});
      }
    }
    phaseObjs.push(tbPhase);
  }
  return phaseObjs;
}

/*---------------------------------------------------------
Assemble Pool objects
phase: phase name
division: division (pool) name
teams: YF internal teams list
---------------------------------------------------------*/
function getPool(phase, division, teams) {
  var pool = {
    name: division,
    pool_teams: []
  }
  for(var i in teams) {
    let t = teams[i];
    if(t.divisions[phase] == division) {
      pool.pool_teams.push(getPoolTeam(division, t.teamName));
    }
  }
  return pool;
}

/*---------------------------------------------------------
Assemble PoolTeam object
---------------------------------------------------------*/
function getPoolTeam(division, teamName) {
  return {
    pool: division,
    team: {$ref: 'Team_' + teamName}
  };
}
