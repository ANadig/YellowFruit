import { IQbjObject, IRefTargetDict } from './Interfaces';
import { IQbjMatch } from './Match';
import { IQbjMatchPlayer } from './MatchPlayer';
import { IQbjMatchTeam } from './MatchTeam';
import { IQbjPhase } from './Phase';
import { IQbjPool } from './Pool';
import { QbjTypeNames } from './QbjEnums';
import { IQbjRank } from './Rank';
import { IQbjRanking } from './Ranking';
import { IQbjRegistration } from './Registration';
import { IQbjRound } from './Round';
import { IQbjScoringRules } from './ScoringRules';
import { IQbjTeam } from './Team';
import { IQbjTournament } from './Tournament';

export function findTournamentObject(objects: IQbjObject[]): IQbjTournament | null {
  for (const obj of objects) {
    if (obj.type === QbjTypeNames.Tournament) return obj as IQbjTournament;
  }
  return null;
}

/** Parse a file and collect all the objects that have an 'id' property */
export function collectRefTargets(objectList: IQbjObject[]): IRefTargetDict {
  const dict: IRefTargetDict = {};

  for (const obj of objectList) {
    if (obj.id) dict[obj.id] = obj;
    // everything in the top-level array of objects should have a 'type' property
    if (obj.type === QbjTypeNames.Tournament) collectRefTargetsTournament(obj as IQbjTournament, dict);

    if (obj.type === QbjTypeNames.ScoringRules) collectRefTargetsScoringRules(obj as IQbjScoringRules, dict);

    if (obj.type === QbjTypeNames.Registration) collectRefTargetsRegistration(obj as IQbjRegistration, dict);

    if (obj.type === QbjTypeNames.Team) collectRefTargetsTeam(obj as IQbjTeam, dict);

    if (obj.type === QbjTypeNames.Rank) collectRefTargetsRank(obj as IQbjRank, dict);

    if (obj.type === QbjTypeNames.Phase) collectRefTargetsPhase(obj as IQbjPhase, dict);

    if (obj.type === QbjTypeNames.Round) collectRefTargetsRound(obj as IQbjRound, dict);

    if (obj.type === QbjTypeNames.Pool) collectRefTargetsPool(obj as IQbjPool, dict);

    if (obj.type === QbjTypeNames.Match) collectRefTargetsMatch(obj as IQbjMatch, dict);

    if (obj.type === QbjTypeNames.MatchTeam) collectRefTargetsMatchTeam(obj as IQbjMatchTeam, dict);

    if (obj.type === QbjTypeNames.MatchPlayer) collectRefTargetsMatchPlayer(obj as IQbjMatchPlayer, dict);

    // TODO: other types of object that could theoretically be at the top level, if we support them in the future

    // TODO: eventually we should log an error if the type is unrecognized or missing
  }

  return dict;
}

export function collectRefTargetsTournament(tournament: IQbjTournament, dict: IRefTargetDict) {
  const site = tournament.tournamentSite;
  if (site?.id) dict[site.id] = site;

  const rules = tournament.scoringRules;
  if (rules) collectRefTargetsScoringRules(rules, dict);
  if (rules?.id) dict[rules.id] = rules;

  for (const reg of tournament.registrations || []) {
    if (reg.id) dict[reg.id] = reg;
    collectRefTargetsRegistration(reg, dict);
  }

  for (const phase of tournament.phases || []) {
    if (phase.id) dict[phase.id] = phase;
    collectRefTargetsPhase(phase, dict);
  }

  for (const ranking of tournament.rankings || []) {
    if (ranking.id) dict[ranking.id] = ranking;
  }
}

export function collectRefTargetsScoringRules(rules: IQbjScoringRules, dict: IRefTargetDict) {
  if (!rules.answerTypes) return;

  for (const atype of rules.answerTypes) {
    if (atype.id) dict[atype.id] = atype;
  }
}

export function collectRefTargetsRegistration(reg: IQbjRegistration, dict: IRefTargetDict) {
  if (!reg.teams) return;

  for (const team of reg.teams) {
    if (team.id) dict[team.id] = team;
    collectRefTargetsTeam(team, dict);
  }
}

export function collectRefTargetsTeam(team: IQbjTeam, dict: IRefTargetDict) {
  for (const player of team.players || []) {
    if (player.id) dict[player.id] = player;
  }
  for (const rank of team.ranks || []) {
    if (rank.id) dict[rank.id] = rank;
    collectRefTargetsRank(rank, dict);
  }
}

export function collectRefTargetsRank(rank: IQbjRank, dict: IRefTargetDict) {
  if (!rank.ranking) return;
  let { ranking } = rank;
  ranking = ranking as IQbjRanking;
  if (ranking.id) dict[ranking.id] = ranking;
}

export function collectRefTargetsPhase(phase: IQbjPhase, dict: IRefTargetDict) {
  for (const round of phase.rounds || []) {
    if (round.id) dict[round.id] = round;
    collectRefTargetsRound(round, dict);
  }
  for (const pool of phase.pools || []) {
    if (pool.id) dict[pool.id] = pool;
    collectRefTargetsPool(pool, dict);
  }
}

export function collectRefTargetsRound(round: IQbjRound, dict: IRefTargetDict) {
  for (const match of round.matches || []) {
    if (match.id) dict[match.id] = match;
    collectRefTargetsMatch(match, dict);
  }
  // Parse packets here, if we ever use them for something
}

export function collectRefTargetsPool(pool: IQbjPool, dict: IRefTargetDict) {
  for (const pt of pool.poolTeams || []) {
    if (pt.id) dict[pt.id] = pt;
    // Assume we aren't defining new teams in the PoolTeam object
  }
}

export function collectRefTargetsMatch(match: IQbjMatch, dict: IRefTargetDict) {
  for (const matchTeam of match.matchTeams || []) {
    if (matchTeam.id) dict[matchTeam.id] = matchTeam;
    collectRefTargetsMatchTeam(matchTeam, dict);
  }
  // Assume that new phases aren't being defined in carryoverPhases
  // Parse matchquestions here, if we ever use them
}

export function collectRefTargetsMatchTeam(matchTeam: IQbjMatchTeam, dict: IRefTargetDict) {
  for (const matchPlayer of matchTeam.matchPlayers || []) {
    if (matchPlayer.id) dict[matchPlayer.id] = matchPlayer;
    collectRefTargetsMatchPlayer(matchPlayer, dict);
  }
  // Assume that new teams aren't being defined in the team attribute
  // Parse lineups here if we ever use them
}

export function collectRefTargetsMatchPlayer(matchPlayer: IQbjMatchPlayer, dict: IRefTargetDict) {
  for (const ac of matchPlayer.answerCounts) {
    if (ac.id) dict[ac.id] = ac;
    // assume new AnswerTypes aren't being defined within PlayerAnswerCount objects
  }
}
