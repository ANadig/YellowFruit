/***********************************************************
QbjUtils2.ts
Andrew Nadig

Functions for writing QBJ 2.0 files
***********************************************************/

import * as StatUtils from './StatUtils';
import { TournamentSettings, PhaseList, YfTeam, YfGame, PacketList, PowerRule, WhichTeam, PlayerLine } from './YfTypes';

/**
 * Generate an object conforming to the tournament schemo
 * @param  settings  tournament setting
 * @param  divisions lists of divisions indexed by phase
 * @param  teams     list of all teams
 * @param  games     list of alll games
 * @param  packets   packets indexed by round
 * @param  tbsExist  whether there are any tiebreakers in this tournament
 * @param  fileName  name of the yft file. Used as the tournament name
 * @return           the tournament as a JS object in qb schema format
 */
export function getQbjFile(settings: TournamentSettings, divisions: PhaseList,
  teams: YfTeam[], games: YfGame[], packets: PacketList, tbsExist: boolean,
  fileName: string): QbjFile {

  let topLevel: QbjFile = {
    version: '2.1',
    objects: []
  };
  let objList = [];

  const scoringRulesQbj = getScoringRules(settings);
  const answerTypesQbj = getAnswerTypes(settings);
  const rankingsQbj = getRankings();
  const [teamsQbj, playersQbj] = getTeamsAndPlayers(teams);
  const registrationsQbj = getRegistrations(teamsQbj);
  const roundPhases = assignRoundsToPhases(games);
  const [matchesQbj, matchIdsByRound] = getMatches(games, roundPhases, settings);
  const roundsQbj = getRounds(roundPhases, packets, matchIdsByRound);
  const phasesQbj = getPhases(divisions, roundPhases, teams, tbsExist);
  const tournamentQbj = getTournament(fileName, phasesQbj, registrationsQbj);
  objList.push(tournamentQbj);
  objList.push(scoringRulesQbj);
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

/**
 * Assemble Tournament object.
 * @param  fileName         name of the yft file, used as the tournament name
 * @param  phasesQbj        list of Phase objects
 * @param  registrationsQbj list of Registration objects
 * @return                  Tournament object
 */
function getTournament(fileName: string, phasesQbj: QbjPhase[],
  registrationsQbj: QbjRegistration[]) {

  let tournament: QbjTournament = {
    type: 'Tournament',
    name: fileName,
    scoring_rules: {$ref: 'ScoringRules'},
    rankings: [{$ref: 'Ranking_AllGames'}],
    phases: [],
    registrations: registrationsQbj
  };
  for(let phase of phasesQbj) {
    tournament.phases.push({$ref: phase.id});
  }
  return tournament;
}

/**
 * Assemble ScoringRules object.
 * @param  settings YF tournment settings object
 * @return          ScoringRules object
 */
function getScoringRules(settings: TournamentSettings): QbjScoringRules {
  let scoringRules: QbjScoringRules = {
    type: 'ScoringRules',
    id: 'ScoringRules',
    name: 'Scoring Rules', // this isn't helpful, but the attribute is required by the schema
    teams_per_match: 2,
    maximum_players_per_team: +settings.playersPerTeam,
    overtime_includes_bonuses: false,
    total_divisor: settings.negs || settings.powers == PowerRule.Fifteen ? 5 : 10,
    maximum_bonus_score: 30,
    bonuses_bounce_back: settings.bonusesBounce,
    lightning_count_per_team: settings.lightning ? 1 : 0, // don't support multiple discrete ltng rounds
    lightnings_bounce_back: false, // don't support lightning bouncebacks yet
    answer_types: []
  }
  if(settings.powers != PowerRule.None) {
    scoringRules.answer_types.push({$ref: 'AnswerType_power'});
  }
  scoringRules.answer_types.push({$ref: 'AnswerType_ten'});
  if(settings.negs) {
    scoringRules.answer_types.push({$ref: 'AnswerType_neg'});
  }
  return scoringRules;
}

/**
 * Assemble AnswerType objects.
 * @param  settings YF tournament settings object
 * @return          array of AnswerType objects
 */
function getAnswerTypes(settings: TournamentSettings): QbjAnswerType[] {
  let types = [];
  if(settings.powers != PowerRule.None) {
    let power = {
      type: 'AnswerType',
      id: 'AnswerType_power',
      value: settings.powers == PowerRule.Twenty ? 20 : 15
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

/**
 * Assemble Ranking objects. currently there is only one ranking "All games" which can
 * hold the manual rank override
 * @return array with a single ranking object
 */
function getRankings(): QbjRanking[] {
  let overall: QbjRanking = {
    type: 'Ranking',
    id: 'Ranking_AllGames',
    description: 'Overall placement in the tournament, if specified by the user'
  };
  return [overall];
}

/**
 * Assemble Team and Player objects
 * @param  teams list of all teams
 * @return       tuple: list of Team objects and list of Player objects
 */
function getTeamsAndPlayers(teams: YfTeam[]): [QbjTeam[], QbjPlayer[]] {
  let teamObjs = [];
  let playerObjs = [];
  for(let t of teams) {
    const teamName = t.teamName;
    let team: QbjTeam = {
      type: 'Team',
      id: 'Team_' + teamName,
      name: teamName,
      players: []
    };
    if(t.rank) {
      team.ranks = [{
        type: 'Rank',
        ranking: {$ref: 'Ranking_AllGames'},
        position: +t.rank
      }];
    }
    for(var p in t.roster) {
      const playerId = `Player_${teamName}_${p}`;
      let player: QbjPlayer = {
        type: 'Player',
        id: playerId,
        name: p
      };
      team.players.push({$ref: playerId});
      // if a number from 0 to 18 appears in the Year field, use it.
      let numAry = t.roster[p].year.match(/\d{1,2}/);
      if(numAry != null) {
        const gradeNo = +(numAry[0]);
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

/**
 * Create registration objects. YF doesn't actually support the 'registration'
 * concept, so each team gest its own registration
 * @param  teamsQbj list of team objects
 * @return          list of registration objects
 */
function getRegistrations(teamsQbj: QbjTeam[]): QbjRegistration[] {
  var regs = [];
  for(var i in teamsQbj) {
    const oneTeam = teamsQbj[i];
    let oneReg: QbjRegistration = {
      type: 'Registration',
      name: oneTeam.name,
      teams: [{$ref: oneTeam.id}]
    }
    regs.push(oneReg);
  }
  return regs;
}

/**
 * Figure out which rounds are in which phases. We take the phase that is assigned to the
 * largest number of games in a given round.
 * @param  games     list of games in YF format
 * @return           The phase to assign each round, indexed by round
 */
function assignRoundsToPhases(games: YfGame[]): { [round: number]: string } {
  let roundGameCounts = {};
  let roundPhaseAssmnts = {};
  for(let g of games) {
    const round = g.round;
    if(roundGameCounts[round] == undefined) { roundGameCounts[round] = {}; }
    for(let phase of g.phases) {
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
  for(let round in roundGameCounts) {
    let max = 0, maxPhase = 'All Games';
    for(var phase in roundGameCounts[round]) {
      const cnt = roundGameCounts[round][phase];
      if(cnt > max) {
        max = cnt;
        maxPhase = phase;
      }
    }
    roundPhaseAssmnts[+round] = maxPhase;
  }
  return roundPhaseAssmnts;
}

/**
 * Assemble match objects. Returns the list of matches, and an index of match IDs by
 * round number
 * @param  games       list of games in YF format
 * @param  roundPhases list of rounds and the phases each is in from assignRoundsToPhases
 * @param  settings    YF settings object
 * @return             tuple: list of match objects, and match IDs indexed by round
 */
function getMatches(games: YfGame[], roundPhases: { [round: number]: string },
  settings: TournamentSettings): [QbjMatch[], {[round: number]: QbjRef[]}] {

  let matchObjs = [];
  let idsByRound = {};
  for(let g of games) {
    const round = g.round, team1 = g.team1, team2 = g.team2;
    const id = `Match_${round}_${team1}_${team2}`;
    if(idsByRound[round] == undefined) {
      idsByRound[round] = [{ $ref: id }];
    }
    else { idsByRound[round].push({ $ref: id }); }
    let match: QbjMatch = {
      id: id,
      type: 'Match',
      tossups_read: +g.tuhtot,
      overtime_tossups_read: +g.ottu,
      tiebreaker: g.tiebreaker,
      notes: g.notes,
      match_teams: [],
      carryover_phases: []
    }
    match.match_teams.push(getMatchTeam(g, 1, settings));
    match.match_teams.push(getMatchTeam(g, 2, settings));
    //carryover phases are those are aren't the round's calculated phase
    for(let p of g.phases) {
      if(p != roundPhases[round]) {
        match.carryover_phases.push({ $ref: 'Phase_' + p });
      }
    }
    matchObjs.push(match);
  }
  return [matchObjs, idsByRound];
}

/**
 * Generate a MatchTeam object for the given game
 * @param  game      YF game object
 * @param  whichTeam team 1 or 2
 * @param  settings  YF settings object
 * @return           a MatchTeam object
 */
function getMatchTeam(game: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): QbjMatchTeam {
  const teamName = whichTeam == 1 ? game.team1 : game.team2;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  const otPwr = whichTeam == 1 ? +game.otPwr1 : +game.otPwr2;
  const otTen = whichTeam == 1 ? +game.otTen1 : +game.otTen2;
  let matchTeam: QbjMatchTeam = {
    type: 'MatchTeam',
    team: {$ref: 'Team_' + teamName},
    forfeit_loss: whichTeam == 2 && game.forfeit,
    correct_tossups_without_bonuses: otPwr + otTen,
    lightning_points: whichTeam == 1 ? +game.lightningPts1 : +game.lightningPts2,
    match_players: []
  };
  if(settings.bonuses) {
    matchTeam.bonus_points = StatUtils.bonusPoints(game, whichTeam, settings);
  }
  if(settings.bonusesBounce) {
    matchTeam.bonus_bounceback_points = whichTeam == 1 ? +game.bbPts1 : +game.bbPts2;
  }
  for(var p in players) {
    const ref = `Player_${teamName}_${p}`;
    matchTeam.match_players.push(getMatchPlayer(ref, players[p], settings));
  }
  return matchTeam;
}

/**
 * Generate a MatchPlayer object for the given game
 * @param  ref      Player object ID to refer to
 * @param  player   Player's stats for the game
 * @param  settings YF settings object
 * @return          a MatchPlayer object
 */
function getMatchPlayer(ref: string, player: PlayerLine, settings: TournamentSettings): QbjMatchPlayer {
  let matchPlayer: QbjMatchPlayer = {
    type: 'MatchPlayer',
    player: {$ref: ref},
    tossups_heard: +player.tuh,
    answer_counts: []
  };
  //make PlayerAnswerCount objects
  const tens: QbjPlayerAnswerCount = {
    type: 'PlayerAnswerCount',
    number: +player.tens,
    answer_type: {$ref: 'AnswerType_ten'}
  };
  matchPlayer.answer_counts.push(tens);
  if(settings.powers != 'none') {
    const powers: QbjPlayerAnswerCount = {
      type: 'PlayerAnswerCount',
      number: +player.powers,
      answer_type: {$ref: 'AnswerType_power'}
    };
    matchPlayer.answer_counts.push(powers);
  }
  if(settings.negs) {
    const negs: QbjPlayerAnswerCount = {
      type: 'PlayerAnswerCount',
      number: +player.negs,
      answer_type: {$ref: 'AnswerType_neg'}
    };
    matchPlayer.answer_counts.push(negs);
  }

  return matchPlayer;
}

/**
 * Assemble Round objects
 * @param  roundPhases     list of rounds from assignRoundsToPhases (just using as a list of rounds)
 * @param  packets         YF packets object
 * @param  matchIdsByRound matches indexed by round, from getMatches
 * @return                 list of Round objects
 */
function getRounds(roundPhases: { [round: number]: string }, packets: PacketList,
  matchIdsByRound: { [round: number]: QbjRef[] }): QbjRound[] {

  let roundObjs = [];
  for(var r in roundPhases) {
    let packetName = packets[r];
    let round: QbjRound = {
      type: 'Round',
      id: 'Round_' + r,
      name: r,
      matches: matchIdsByRound[r]
    };
    if(packetName != undefined) {
      round.packets = [{ type: 'Packet', name: packetName }];
    }
    roundObjs.push(round);
  }
  return roundObjs
}

/**
 * Assemble Phase objects
 * @param  divisions   YF phase/division object
 * @param  roundPhases list of rounds with their phases from assignRoundsToPhases
 * @param  teams       list of YF team objects
 * @param  tbsExist    whether to create a "tiebreakers" phase
 * @return             list of Phase objects
 */
function getPhases(divisions: PhaseList, roundPhases: { [round: number]: string },
  teams: YfTeam[], tbsExist: boolean): QbjPhase[] {

  let phaseObjs = [];
  for(var p in divisions) {
    if(p == 'noPhase') { continue; }
    let phase = {
      type: 'Phase',
      id: 'Phase_' + p,
      name: p,
      pools: [],
      rounds: []
    };
    let divList = divisions[p];
    for(let div of divList) {
      phase.pools.push(getPool(p, div, teams));
    }
    for(var r in roundPhases) {
      if(roundPhases[r] == p) {
        phase.rounds.push({ $ref: 'Round_' + r });
      }
    }
    phaseObjs.push(phase);
  }
  //create a dummy 'all games' phase if there are no phases or if there are rounds that
  // contain only games that weren't assigned a phase
  let allGames = {
    type: 'Phase',
    id: 'Phase_All Games',
    name: 'All Games',
    pools: [],
    rounds: []
  };
  if(!phaseObjs.length) {
    for(var r in roundPhases) {
      if(roundPhases[r] != 'Tiebreakers') {
        allGames.rounds.push({ $ref: 'Round_' + r });
      }
    }
    phaseObjs.push(allGames);
  }
  else {
    let allGamesRounds = [];
    for(var r in roundPhases) {
      if(roundPhases[r] == 'All Games') {
        allGamesRounds.push({ $ref: 'Round_' + r });
      }
    }
    if(allGamesRounds.length) {
      allGames.rounds = allGamesRounds;
      phaseObjs.push(allGames);
    }
  }
  // add the Tiebreaker phase if necessary
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
        tbPhase.rounds.push({ $ref: 'Round_' + r });
      }
    }
    phaseObjs.push(tbPhase);
  }
  return phaseObjs;
}

/**
 * Assemble Pool objects
 * @param  phase    name of this pool's phase
 * @param  division pool name (YF divisions are qbj pools)
 * @param  teams    list of YF team objects
 * @return          a Pool object
 */
function getPool(phase: string, division: string, teams: YfTeam[]): QbjPool {
  let pool: QbjPool = {
    type: 'Pool',
    name: division,
    pool_teams: []
  }
  for(let t of teams) {
    if(t.divisions[phase] == division) {
      pool.pool_teams.push(getPoolTeam(t.teamName));
    }
  }
  return pool;
}

/**
 * Assemble PoolTeam object
 * @param  teamName team name, used to reference a Team object
 * @return          PoolTeam object
 */
function getPoolTeam(teamName: string): QbjPoolTeam {
  return {
    type: 'PoolTeam',
    team: {$ref: 'Team_' + teamName}
  };
}
