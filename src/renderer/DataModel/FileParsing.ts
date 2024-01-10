// Parse objects from a JSON file into internal YellowFruit objects

import { sortAnswerTypes, versionLt } from '../Utils/GeneralUtils';
import AnswerType, { IQbjAnswerType } from './AnswerType';
import { IIndeterminateQbj, IRefTargetDict } from './Interfaces';
import { getBaseQbjObject } from './QbjUtils';
import { IQbjScoringRules, IYftFileScoringRules, ScoringRules } from './ScoringRules';
import Tournament, { IQbjTournament, IYftFileTournament } from './Tournament';
import { IQbjTournamentSite, TournamentSite } from './TournamentSite';

export function parseYftTournament(obj: IYftFileTournament, refTargets: IRefTargetDict): Tournament | null {
  const version = obj.YfData?.YfVersion;
  if (!version) return null;
  if (versionLt(version, '4.0.0')) return null;

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

  const rules = obj.scoringRules;
  if (rules) tourn.scoringRules = parseScoringRules(rules as IIndeterminateQbj, refTargets);

  // TODO: registrations, phases

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
  if (!qbjScoringRules.answerTypes) {
    throw new Error('There are no tossup point values (Answer Types) defined for this tournament.');
  }

  // TODO: validate teamspermatch

  const yftScoringRules = new ScoringRules();

  yftScoringRules.name = qbjScoringRules.name || '';
  parseScoringRulesGameLength(qbjScoringRules, yftScoringRules);
  parseScoringRulesAnswerTypes(qbjScoringRules, yftScoringRules, refTargets);
  parseScoringRulesBonusSettings(qbjScoringRules, yftScoringRules);
  parseScoringRulesMaxPlayers(qbjScoringRules, yftScoringRules);
  // TODO: lots more properties

  return yftScoringRules;
}

function parseScoringRulesGameLength(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const yfExtraData = (sourceQbj as IYftFileScoringRules).YfData;

  const regTuCnt = sourceQbj.regulationTossupCount ?? 20;
  const maxRegTuCnt = sourceQbj.maximumRegulationTossupCount ?? 20;
  if (!ScoringRules.validateMaxRegTuCount(maxRegTuCnt)) {
    throw new Error('Unsupported value for maximum regulation toss-up count.');
  }

  yftScoringRules.maximumRegulationTossupCount = ScoringRules.validateMaxRegTuCount(maxRegTuCnt) ? maxRegTuCnt : 20;
  yftScoringRules.timed = yfExtraData ? !!yfExtraData.timed : maxRegTuCnt !== regTuCnt; // non-standard round lengths implies timed
}

function parseScoringRulesAnswerTypes(
  sourceQbj: IQbjScoringRules,
  yftScoringRules: ScoringRules,
  refTargets: IRefTargetDict,
) {
  const yftAnswerTypes: AnswerType[] = [];
  for (const aType of sourceQbj.answerTypes) {
    const oneYftAType = parseAnswerType(aType as IIndeterminateQbj, refTargets);
    if (oneYftAType !== null) yftAnswerTypes.push(oneYftAType);
  }

  if (!yftAnswerTypes.find((aType) => aType.value > 0)) {
    throw new Error('This tournament contains no positive toss-up point values.');
  }

  sortAnswerTypes(yftAnswerTypes);
  yftScoringRules.answerTypes = yftAnswerTypes;
}

function parseScoringRulesBonusSettings(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const useBonuses = sourceQbj.maximumBonusScore !== undefined;
  yftScoringRules.useBonuses = useBonuses;
  if (!useBonuses) return;

  const maximumBonusScore = sourceQbj.maximumBonusScore ?? 30;
  if (badInteger(maximumBonusScore, 1, 1000)) {
    throw new Error(`Invalid maximum bonus score: ${maximumBonusScore}`);
  }
  yftScoringRules.maximumBonusScore = maximumBonusScore;

  const minimumPartsPerBonus = sourceQbj.minimumPartsPerBonus ?? 3;
  if (badInteger(minimumPartsPerBonus, 1, 1000)) {
    throw new Error(`Invalid minimum parts per bonus: ${minimumPartsPerBonus}`);
  }
  yftScoringRules.minimumPartsPerBonus = minimumPartsPerBonus;

  const maximumPartsPerBonus = sourceQbj.maximumPartsPerBonus ?? 3;
  if (badInteger(maximumPartsPerBonus, 1, 1000)) {
    throw new Error(`Invalid maximum parts per bonus: ${maximumPartsPerBonus}`);
  }
  if (maximumPartsPerBonus < yftScoringRules.minimumPartsPerBonus) {
    throw new Error('Maximum parts per bonus is less than minimum parts per bonus.');
  }
  yftScoringRules.maximumPartsPerBonus = maximumPartsPerBonus;

  const { pointsPerBonusPart } = sourceQbj;
  if (pointsPerBonusPart !== undefined) {
    if (badInteger(pointsPerBonusPart, 1, 1000)) {
      throw new Error(`Invalid points per bonus part setting: ${pointsPerBonusPart}`);
    }
    if (pointsPerBonusPart * yftScoringRules.maximumPartsPerBonus !== yftScoringRules.maximumBonusScore) {
      throw new Error(
        `Maximum bonus score, maximum parts per bonus, and points per bonus part settings must be consistent.`,
      );
    }
  }
  yftScoringRules.pointsPerBonusPart = pointsPerBonusPart;

  let bonusDivisor = sourceQbj.bonusDivisor ?? 10;
  if (badInteger(bonusDivisor, 1, 1000)) {
    throw new Error(`Invalid bonus divisor setting: ${bonusDivisor}`);
  }
  if (yftScoringRules.maximumBonusScore % bonusDivisor) {
    bonusDivisor = 1;
  } else if (yftScoringRules.pointsPerBonusPart && yftScoringRules.pointsPerBonusPart % bonusDivisor) {
    throw new Error(
      `Points per bonus (${yftScoringRules.pointsPerBonusPart}) and bonus divisor (${bonusDivisor}) settings are incompatible.`,
    );
  }
  yftScoringRules.bonusDivisor = bonusDivisor;
}

function parseScoringRulesMaxPlayers(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const maxPlayers = sourceQbj.maximumPlayersPerTeam ?? 4;
  if (badInteger(maxPlayers, 1, ScoringRules.maximumAllowedRosterSize)) {
    throw new Error(`Invalid maximum players per team setting: ${maxPlayers}`);
  }
  yftScoringRules.maximumPlayersPerTeam = maxPlayers;
}

function parseAnswerType(obj: IIndeterminateQbj, refTargets: IRefTargetDict): AnswerType | null {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return null;

  const qbjAType = baseObj as IQbjAnswerType;
  const ptValue = qbjAType.value;
  if (ptValue === undefined) {
    throw new Error('Scoring Rules contain an Answer Type with no point value.');
  }
  if (badInteger(ptValue, -1000, 1000)) {
    throw new Error(`Scoring Rules contain an Answer Type with an invalid point value: ${ptValue}`);
  }
  // unsupported formats
  if (ptValue <= 0 && qbjAType.awardsBonus) {
    throw new Error(`Answer Types with non-positive point values may not award bonuses.`);
  }

  const yftAType = new AnswerType(ptValue);
  if (qbjAType.label) yftAType.label = qbjAType.label;
  if (qbjAType.shortLabel) yftAType.shortLabel = qbjAType.shortLabel;

  return yftAType;
}

/** Returns true if suppliedValue isn't an integer between the given bounds */
function badInteger(suppliedValue: number, lowerBound: number, upperBound: number) {
  if (suppliedValue < lowerBound || suppliedValue > upperBound) return true;
  return suppliedValue % 1 > 0;
}
