// Parse objects from a JSON file into internal YellowFruit objects

import { sortAnswerTypes, versionLt } from '../Utils/GeneralUtils';
import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IIndeterminateQbj, IRefTargetDict } from './Interfaces';
import { getBaseQbjObject } from './QbjUtils';
import { IQbjScoringRules, ScoringRules } from './ScoringRules';
import Tournament, { IQbjTournament, IYftFileTournament } from './Tournament';
import { IQbjTournamentSite, TournamentSite } from './TournamentSite';

export function parseYftTournament(obj: IYftFileTournament, refTargets: IRefTargetDict): Tournament | null {
  const version = obj.YfData?.YfVersion;
  if (!version) return null;
  if (versionLt('4.0.0', version)) return null;

  return parseTournament(obj, refTargets);
}

export function parseTournament(obj: IQbjTournament, refTargets: IRefTargetDict): Tournament {
  const tourn = new Tournament();

  if (obj.name && obj.name !== Tournament.placeholderName) tourn.name = obj.name;
  if (obj.startDate) tourn.startDate = obj.startDate;
  if (obj.questionSet) tourn.questionSet = obj.questionSet;

  const site = obj.tournamentSite;
  if (site) tourn.tournamentSite = parseTournamentSite(site as IIndeterminateQbj, refTargets);
  else tourn.tournamentSite = new TournamentSite();

  // TODO: scoring rules

  return tourn;
}

export function parseTournamentSite(obj: IIndeterminateQbj, refTargets: IRefTargetDict): TournamentSite {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return new TournamentSite();

  const qbjTSite = baseObj as IQbjTournamentSite;
  return new TournamentSite(qbjTSite.name);
}

export function parseScoringRules(obj: IIndeterminateQbj, refTargets: IRefTargetDict): ScoringRules {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return new ScoringRules();

  const qbjScoringRules = baseObj as IQbjScoringRules;
  if (!qbjScoringRules.answerTypes) return new ScoringRules();

  const yftScoringRules = new ScoringRules();
  yftScoringRules.name = qbjScoringRules.name || '';

  const yftAnswerTypes: AnswerType[] = [];
  for (const aType of qbjScoringRules.answerTypes) {
    const oneYftAType = parseAnswerType(aType as IIndeterminateQbj, refTargets);
    if (oneYftAType !== null) yftAnswerTypes.push(oneYftAType);
  }
  sortAnswerTypes(yftAnswerTypes);
  yftScoringRules.answerTypes = yftAnswerTypes;

  return yftScoringRules;
}

export function parseAnswerType(obj: IIndeterminateQbj, refTargets: IRefTargetDict): AnswerType | null {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return null;

  const qbjAType = baseObj as IQbjAnswerType;
  if (qbjAType.value === undefined) return null;
  // unsupported formats
  if (qbjAType.value > 0 && !qbjAType.awardsBonus) return null;
  if (qbjAType.value <= 0 && qbjAType.awardsBonus) return null;

  const yftAType = new AnswerType(qbjAType.value);
  if (qbjAType.label) yftAType.label = qbjAType.label;
  if (qbjAType.shortLabel) yftAType.shortLabel = qbjAType.shortLabel;

  return yftAType;
}
