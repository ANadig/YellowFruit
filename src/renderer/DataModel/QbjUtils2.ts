import { IQbjObject, IRefTargetDict } from './Interfaces';
import { IQbjPhase } from './Phase';
import { IQbjPool } from './Pool';
import { QbjTypeNames } from './QbjEnums';
import { IQbjRank } from './Rank';
import { IQbjRanking } from './Ranking';
import { IQbjRegistration } from './Registration';
import { IQbjScoringRules } from './ScoringRules';
import { IQbjTeam } from './Team';
import { IQbjTournament } from './Tournament';

/** Parse a file and collect all the objects that have an 'id' property */
export function collectRefTargets(objectList: IQbjObject[]): IRefTargetDict {
  let dict: IRefTargetDict = {};

  for (const obj of objectList) {
    if (obj.id) dict[obj.id] = obj;
    // everything in the top-level array of objects should have a 'type' property
    if (obj.type === QbjTypeNames.Tournament) dict = { ...dict, ...collectRefTargetsTournament(obj as IQbjTournament) };

    if (obj.type === QbjTypeNames.ScoringRules)
      dict = { ...dict, ...collectRefTargetsScoringRules(obj as IQbjScoringRules) };

    if (obj.type === QbjTypeNames.Registration)
      dict = { ...dict, ...collectRefTargetsRegistration(obj as IQbjRegistration) };

    if (obj.type === QbjTypeNames.Team) dict = { ...dict, ...collectRefTargetsTeam(obj as IQbjTeam) };

    if (obj.type === QbjTypeNames.Rank) dict = { ...dict, ...collectRefTargetsRank(obj as IQbjRank) };

    if (obj.type === QbjTypeNames.Phase) dict = { ...dict, ...collectRefTargetsPhase(obj as IQbjPhase) };

    if (obj.type === QbjTypeNames.Pool) dict = { ...dict, ...collectRefTargetsPool(obj as IQbjPool) };

    // TODO: every other type of object that could theoretically be at the top level

    // TODO: eventually we should log an error if the type is unrecognized or missing
  }

  return dict;
}

export function collectRefTargetsTournament(tournament: IQbjTournament) {
  let dict: IRefTargetDict = {};
  const site = tournament.tournamentSite;
  if (site?.id) dict[site.id] = site;

  const rules = tournament.scoringRules;
  if (rules) dict = { ...dict, ...collectRefTargetsScoringRules(rules) };
  if (rules?.id) dict[rules.id] = rules;

  for (const reg of tournament.registrations || []) {
    if (reg.id) dict[reg.id] = reg;
    dict = { ...dict, ...collectRefTargetsRegistration(reg) };
  }

  for (const phase of tournament.phases || []) {
    if (phase.id) dict[phase.id] = phase;
    dict = { ...dict, ...collectRefTargetsPhase(phase) };
  }

  for (const ranking of tournament.rankings || []) {
    if (ranking.id) dict[ranking.id] = ranking;
  }

  return dict;
}

export function collectRefTargetsScoringRules(rules: IQbjScoringRules) {
  const dict: IRefTargetDict = {};
  if (!rules.answerTypes) return dict;

  for (const atype of rules.answerTypes) {
    if (atype.id) dict[atype.id] = atype;
  }
  return dict;
}

export function collectRefTargetsRegistration(reg: IQbjRegistration) {
  let dict: IRefTargetDict = {};
  if (!reg.teams) return dict;

  for (const team of reg.teams) {
    if (team.id) dict[team.id] = team;
    dict = { ...dict, ...collectRefTargetsTeam(team) };
  }

  return dict;
}

export function collectRefTargetsTeam(team: IQbjTeam) {
  let dict: IRefTargetDict = {};
  for (const player of team.players || []) {
    if (player.id) dict[player.id] = player;
  }
  for (const rank of team.ranks || []) {
    if (rank.id) dict[rank.id] = rank;
    dict = { ...dict, ...collectRefTargetsRank(rank) };
  }
  return dict;
}

export function collectRefTargetsRank(rank: IQbjRank) {
  const dict: IRefTargetDict = {};
  if (!rank.ranking) return dict;
  let { ranking } = rank;
  ranking = ranking as IQbjRanking;
  if (ranking.id) dict[ranking.id] = ranking;
  return dict;
}

export function collectRefTargetsPhase(phase: IQbjPhase) {
  let dict: IRefTargetDict = {};
  for (const round of phase.rounds || []) {
    if (round.id) dict[round.id] = round;
    // TODO: packet, match
  }
  for (const pool of phase.pools || []) {
    if (pool.id) dict[pool.id] = pool;
    dict = { ...dict, ...collectRefTargetsPool(pool) };
  }
  return dict;
}

export function collectRefTargetsPool(pool: IQbjPool) {
  const dict: IRefTargetDict = {};
  if (!pool.poolTeams) return dict;
  for (const pt of pool.poolTeams) {
    if (pt.id) dict[pt.id] = pt;
  }
  return dict;
}
