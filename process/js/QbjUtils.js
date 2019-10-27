/***********************************************************
QbjUtils.js
Andrew Nadig

Functions for parsing QBJ files
***********************************************************/

module.exports = {};
const MAX_PLAYERS_PER_TEAM = 50;
const MAX_ALLOWED_TEAMS = 200;


/*---------------------------------------------------------
Parse the scoring_rules object from a qbj file. Returns
the rules in YF format, plus any errors
---------------------------------------------------------*/
module.exports.parseQbjRules = function(rules) {
  var yfRules = {
    powers: 'none',
    negs: 'no',
    bonuses: 'none',
    playersPerTeam: 4,
  }
  yfRules.playersPerTeam = rules.maximum_players_per_team;
  var errors = [];
  // miscellaneous weird things that we don't support
  if(rules.teams_per_match != 2) {
    errors.push(rules.teams_per_match + ' teams per match');
  }
  if(rules.maximum_players_per_team > MAX_PLAYERS_PER_TEAM) {
    errors.push('Maximum of ' + rules.maximum_players_per_team + ' players per team');
  }
  if(rules.maximum_bonus_score != 30) {
    errors.push('Maximum bonus score of ' + rules.maximum_bonus_score);
  }
  if(rules.bonus_divisor != 10) {
    errors.push('Bonus divisor of ' + rules.bonus_divisor);
  }
  // tournament must have 10 points tossups, plus at most one of 15- or 20-point powers,
  // optional -5 negs, and no other point values
  var answerTypes = rules.answer_types;
  var tensExist = false, tensBonus = false, powersBonus = false;
  for(var i in answerTypes) {
    let a = answerTypes[i];
    switch (a.value) {
      case 10:
        tensExist = true;
        if(a.awards_bonus) { tensBonus = true; }
        break;
      case 15:
        if(yfRules.powers != 'none') {
          errors.push('Multiple point values greater than 10 are not supported');
        }
        else {
          yfRules.powers = '15pts';
          if(a.awards_bonus) { powersBonus = true; }
        }
        break;
      case 20:
        if(yfRules.powers != 'none') {
          errors.push('Multiple point values greater than 10 are not supported');
        }
        else {
          yfRules.powers = '20pts';
          if(a.awards_bonus) { powersBonus = true; }
        }
        break;
      case -5:
        if(a.awards_bonus) { errors.push('Negs with bonuses are not supported'); }
        yfRules.negs = 'yes';
        break;
      default:
        errors.push(a.value + ' point questions are not supported');
    }
  }
  if(!tensExist) { errors.push('10-point tossups are required'); }
  if(yfRules.powers != 'none' && (tensBonus ^ powersBonus)) {
    errors.push('Both or neither of tens and powers must have bonuses');
  }
  if(tensBonus) { yfRules.bonuses = 'noBb'; }
  if(yfRules.bonuses == 'noBb' && rules.bonuses_bounce_back) { yfRules.bonuses = 'yesBb'; }
  return [yfRules, errors];
}

/*---------------------------------------------------------
Load teams from a QBJ file
---------------------------------------------------------*/
module.exports.parseQbjTeams = function(tournament, registrations) {
  var yfTeams = [], yfTeamIds = {}, errors = [];
  var teamCount = 0;
  for(var i in tournament.registrations) {
    let regObj = registrations.find((r) => { return refCheck(tournament.registrations[i], r); });
    if(regObj == undefined) { continue; }
    for(var j in regObj.teams) {
      if(teamCount++ > MAX_ALLOWED_TEAMS) {
        errors.push('You may not load more than ' + MAX_ALLOWED_TEAMS + ' teams');
        break;
      }
      let teamObj = regObj.teams[j];
      let roster = {}, rosterWithIds = {};
      for(var k in teamObj.players) {
        let p = teamObj.players[k];
        if(k > MAX_PLAYERS_PER_TEAM) {
          errors.push(teamObj.name + ' has more than' + MAX_PLAYERS_PER_TEAM + 'players');
          break;
        }
        roster[p.name] = { year: '', div2: false, undergrad: false };
        rosterWithIds[p.id] = p.name;
      }
      yfTeams.push({
        teamName: teamObj.name,
        roster: roster,
        divisions: {},
        teamUGStatus: false,
        teamD2Status: false,
        smallSchool: false,
        jrVarsity: false
      });
      yfTeamIds[teamObj.id] = { teamName: teamObj.name, roster: rosterWithIds };
    }
  }
  return [yfTeams, yfTeamIds, errors];
}

/*---------------------------------------------------------
Load games from a QBJ file
---------------------------------------------------------*/
module.exports.parseQbjMatches = function(rounds, matches, teamIds) {
  var yfGames = [], errors = [];
  for(var i in rounds) {
    let roundNo = rounds[i].name.replace('Round ', '');
    let oneRoundsMatches = rounds[i].matches;
    for(var j in oneRoundsMatches) {
      let matchObj = matches.find((m) => { return refCheck(oneRoundsMatches[j], m); });
      if(matchObj == undefined) { continue; }
      let team1Obj = matchObj.match_teams[0], team2Obj = matchObj.match_teams[1];
      let team1Id = team1Obj.team.$ref, team2Id = team2Obj.team.$ref;
      let players1Obj = team1Obj.match_players, players2Obj = team2Obj.match_players;
      let yfPlayers1 = {}, yfPlayers2 = {};
      for(var k in players1Obj) {
        let p = players1Obj[k];
        let answers = p.answer_counts;
        let powers = '', tens = '', negs = '';
        for(var m in answers) {
          let a = answers[m];
          if(a.answer_type == undefined) { continue; }
          if(a.answer_type.value == 15 && a.number != undefined) { powers = a.number; }
          else if(a.answer_type.value == 10 && a.number != undefined) { tens = a.number; }
          else if(a.answer_type.value == -5 && a.number != undefined) { negs = a.number; }
          else { errors.push('Unsupported answer type'); }
        }
        yfPlayers1[teamIds[team1Id].roster[p.player.$ref]] = {
          tuh: p.tossups_heard != undefined ? p.tossups_heard : '',
          powers: powers,
          tens: tens,
          negs: negs
        };
      }
      for(var k in players2Obj) {
        let p = players2Obj[k];
        let answers = p.answer_counts;
        let powers = '', tens = '', negs = '';
        for(var m in answers) {
          let a = answers[m];
          if(a.answer_type == undefined) { continue; }
          if(a.answer_type.value == 15 && a.number != undefined) { powers = a.number; }
          else if(a.answer_type.value == 10 && a.number != undefined) { tens = a.number; }
          else if(a.answer_type.value == -5 && a.number != undefined) { negs = a.number; }
          else { errors.push('Unsupported answer type'); }
        }
        yfPlayers2[teamIds[team2Id].roster[p.player.$ref]] = {
          tuh: p.tossups_heard != undefined ? p.tossups_heard : '',
          powers: powers,
          tens: tens,
          negs: negs
        };
      }

      yfGames.push({
        round: roundNo,
        phases: [],
        tuhtot: matchObj.tossups_read,
        ottu: matchObj.overtime_tossups_read != undefined ? matchObj.overtime_tossups_read : '' ,
        forfeit: false, // apparently you can't enter forfeits in Neg5?
        team1: teamIds[team1Id].teamName,
        team2: teamIds[team2Id].teamName,
        score1: team1Obj.points,
        score2: team2Obj.points,
        players1: yfPlayers1,
        players2: yfPlayers2,
        otPwr1: '',
        otTen1: '', // Neg5 doesn't seem to export info about which team go OT tossups
        otNeg1: '',
        otPwr2: '',
        otTen2: '',
        otNeg2: '',
        bbPts1: team1Obj.bonus_bounceback_points != undefined ? team1Obj.bonus_bounceback_points : '',
        bbPts2: team2Obj.bonus_bounceback_points != undefined ? team2Obj.bonus_bounceback_points : '',
        notes: matchObj.notes != undefined ? matchObj.notes : ''
      });
    }
  }
  return [yfGames, errors];
}

/*---------------------------------------------------------
Check whether the $ref pointer in ref points to obj
---------------------------------------------------------*/
function refCheck(ref, obj) {
  return ref.$ref == obj.id;
}
