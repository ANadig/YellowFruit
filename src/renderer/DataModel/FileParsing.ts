// Parse objects from a JSON file into internal YellowFruit objects

import { versionLt } from '../Utils/GeneralUtils';
import AnswerType, { IQbjAnswerType, sortAnswerTypes } from './AnswerType';
import { IIndeterminateQbj, IRefTargetDict } from './Interfaces';
import { IQbjPhase, IYftFilePhase, Phase, PhaseTypes } from './Phase';
import { IQbjPool, IYftFilePool, Pool } from './Pool';
import { getBaseQbjObject } from './QbjUtils';
import { IQbjRound, IYftFileRound, Round, sortRounds } from './Round';
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

  const { phases } = obj;
  if (phases) tourn.phases = parsePhaseList(phases as IIndeterminateQbj[], refTargets);

  // TODO: registrations

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
    throw new Error('Scoring Rules: There are no tossup point values (Answer Types) defined for this tournament.');
  }

  if (qbjScoringRules.teamsPerMatch && qbjScoringRules.teamsPerMatch !== 2) {
    throw new Error(`YellowFruit doesn't support formates with ${qbjScoringRules.teamsPerMatch} teams per match.`);
  }

  const yftScoringRules = new ScoringRules();

  yftScoringRules.name = qbjScoringRules.name || '';
  parseScoringRulesGameLength(qbjScoringRules, yftScoringRules);
  parseScoringRulesAnswerTypes(qbjScoringRules, yftScoringRules, refTargets);
  parseScoringRulesBonusSettings(qbjScoringRules, yftScoringRules);
  parseScoringRulesMaxPlayers(qbjScoringRules, yftScoringRules);
  parseScoringRulesOvertime(qbjScoringRules, yftScoringRules);
  parseScoringRulesLightning(qbjScoringRules, yftScoringRules);

  return yftScoringRules;
}

function parseScoringRulesGameLength(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const yfExtraData = (sourceQbj as IYftFileScoringRules).YfData;

  const regTuCnt = sourceQbj.regulationTossupCount ?? 20;
  const maxRegTuCnt = sourceQbj.maximumRegulationTossupCount ?? 20;
  if (!ScoringRules.validateMaxRegTuCount(maxRegTuCnt)) {
    throw new Error('Scoring Rules: Unsupported value for maximum regulation toss-up count.');
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
    throw new Error('Scoring Rules: This tournament contains no positive toss-up point values.');
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
    throw new Error(`Scoring Rules: Invalid maximum bonus score: ${maximumBonusScore}`);
  }
  yftScoringRules.maximumBonusScore = maximumBonusScore;

  const minimumPartsPerBonus = sourceQbj.minimumPartsPerBonus ?? 3;
  if (badInteger(minimumPartsPerBonus, 1, 1000)) {
    throw new Error(`Scoring Rules: Invalid minimum parts per bonus: ${minimumPartsPerBonus}`);
  }
  yftScoringRules.minimumPartsPerBonus = minimumPartsPerBonus;

  const maximumPartsPerBonus = sourceQbj.maximumPartsPerBonus ?? 3;
  if (badInteger(maximumPartsPerBonus, 1, 1000)) {
    throw new Error(`Scoring Rules: Invalid maximum parts per bonus: ${maximumPartsPerBonus}`);
  }
  if (maximumPartsPerBonus < yftScoringRules.minimumPartsPerBonus) {
    throw new Error('Scoring Rules: Maximum parts per bonus is less than minimum parts per bonus.');
  }
  yftScoringRules.maximumPartsPerBonus = maximumPartsPerBonus;

  const { pointsPerBonusPart } = sourceQbj;
  if (pointsPerBonusPart !== undefined) {
    if (badInteger(pointsPerBonusPart, 1, 1000)) {
      throw new Error(`Scoring Rules: Invalid points per bonus part setting: ${pointsPerBonusPart}`);
    }
    if (pointsPerBonusPart * yftScoringRules.maximumPartsPerBonus !== yftScoringRules.maximumBonusScore) {
      throw new Error(
        `Scoring Rules: Maximum bonus score, maximum parts per bonus, and points per bonus part settings must be consistent.`,
      );
    }
  }
  yftScoringRules.pointsPerBonusPart = pointsPerBonusPart;

  let bonusDivisor = sourceQbj.bonusDivisor ?? 10;
  if (badInteger(bonusDivisor, 1, 1000)) {
    throw new Error(`Scoring Rules: Invalid bonus divisor setting: ${bonusDivisor}`);
  }
  if (yftScoringRules.maximumBonusScore % bonusDivisor) {
    bonusDivisor = 1;
  } else if (yftScoringRules.pointsPerBonusPart && yftScoringRules.pointsPerBonusPart % bonusDivisor) {
    throw new Error(
      `Scoring Rules: Points per bonus (${yftScoringRules.pointsPerBonusPart}) and bonus divisor (${bonusDivisor}) settings are incompatible.`,
    );
  }
  yftScoringRules.bonusDivisor = bonusDivisor;
}

function parseScoringRulesMaxPlayers(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const maxPlayers = sourceQbj.maximumPlayersPerTeam ?? 4;
  if (badInteger(maxPlayers, 1, ScoringRules.maximumAllowedRosterSize)) {
    throw new Error(`Scoring Rules: Invalid maximum players per team setting: ${maxPlayers}`);
  }
  yftScoringRules.maximumPlayersPerTeam = maxPlayers;
}

function parseScoringRulesOvertime(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const minTossups = sourceQbj.minimumOvertimeQuestionCount ?? 1;
  if (badInteger(minTossups, 1, 100)) {
    throw new Error(`Scoring Rules: Invalid mimimum overtime question setting: ${minTossups}`);
  }
  yftScoringRules.minimumOvertimeQuestionCount = minTossups;

  yftScoringRules.overtimeIncludesBonuses = !!sourceQbj.overtimeIncludesBonuses;
}

function parseScoringRulesLightning(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
  const lightningCount = sourceQbj.lightningCountPerTeam ?? 0;
  if (badInteger(lightningCount, 0, 10)) {
    throw new Error(`Scoring Rules: Invalid lightning rounds per team setting: ${lightningCount}`);
  }
  yftScoringRules.lightningCountPerTeam = lightningCount > 0 ? 1 : 0;
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

function parsePhaseList(ary: IIndeterminateQbj[], refTargets: IRefTargetDict): Phase[] {
  const phases: Phase[] = [];
  let phaseCount = 1;
  let lastUsedRound = 0;
  let curCodeNo = 1;
  for (const obj of ary) {
    const fallbackPhaseType = phaseCount === 1 ? PhaseTypes.Prelim : PhaseTypes.Playoff;
    const onePhase = parsePhase(obj, refTargets, fallbackPhaseType, lastUsedRound + 1, curCodeNo.toString());
    if (onePhase === null) continue;

    phases.push(onePhase);
    phaseCount++;
    lastUsedRound = onePhase.rounds[onePhase.rounds.length - 1].number;
    curCodeNo++;
  }
  return phases;
}

function parsePhase(
  obj: IIndeterminateQbj,
  refTargets: IRefTargetDict,
  assumedPhaseType: PhaseTypes,
  fallbackRoundStart: number,
  fallbackCode: string,
): Phase | null {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return null;

  const qbjPhase = baseObj as IQbjPhase;
  const yfExtraData = (baseObj as IYftFilePhase).YfData;

  const { name, description } = qbjPhase;
  if (!name) {
    throw new Error('This file contains a Phase object with no name.');
  }

  const phaseType = yfExtraData ? yfExtraData.phaseType : assumedPhaseType;
  const rounds = parsePhaseRounds(qbjPhase, refTargets, fallbackRoundStart);
  const tiers = yfExtraData ? yfExtraData.tiers : 1;
  const code = yfExtraData ? yfExtraData.code : fallbackCode;
  const firstRound = rounds[0].number;
  const lastRound = rounds[rounds.length - 1].number;

  const yftPhase = new Phase(phaseType, firstRound, lastRound, tiers, code, name);
  yftPhase.description = description || '';
  addRoundsFromFile(yftPhase, rounds, firstRound, lastRound);
  yftPhase.pools = parsePhasePools(qbjPhase, refTargets);
  // TODO: wildcard stuff

  return yftPhase;
}

/** Returns the list of rounds in ascending order of round number */
function parsePhaseRounds(sourceQbj: IQbjPhase, refTargets: IRefTargetDict, fallbackRoundStart: number): Round[] {
  if (!sourceQbj.rounds) return [];

  const yftRounds: Round[] = [];
  let fallbackRound = fallbackRoundStart;
  for (const oneRound of sourceQbj.rounds) {
    const oneYftRound = parseRound(oneRound as IIndeterminateQbj, refTargets, fallbackRound);
    if (oneYftRound !== null) {
      yftRounds.push(oneYftRound);
      fallbackRound++;
    }
  }
  sortRounds(yftRounds);
  return yftRounds;
}

function addRoundsFromFile(yftPhase: Phase, roundsFromFile: Round[], firstRound: number, lastRound: number) {
  if (firstRound > lastRound) {
    throw new Error('addRoundsFromFile: first round was greater than last round');
  }

  for (let i = firstRound; i <= lastRound; i++) {
    const rdFromFile = roundsFromFile.find((val) => val.number === i);
    if (!rdFromFile) continue;

    const idx = yftPhase.rounds.findIndex((val) => val.number === i);
    if (idx !== -1) yftPhase.rounds[idx] = rdFromFile;
  }
}

function parsePhasePools(sourceQbj: IQbjPhase, refTargets: IRefTargetDict): Pool[] {
  if (!sourceQbj.pools) return [];

  const yftPools: Pool[] = [];
  for (const onePool of sourceQbj.pools) {
    const oneYftPool = parsePool(onePool as IIndeterminateQbj, refTargets);
    if (oneYftPool !== null) {
      yftPools.push(oneYftPool);
    }
  }
  return yftPools;
}

function parsePool(obj: IIndeterminateQbj, refTargets: IRefTargetDict): Pool | null {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return null;

  const qbjPool = baseObj as IQbjPool;
  const yfExtraData = (baseObj as IYftFilePool).YfData;

  const { name, description } = qbjPool;
  if (!name) {
    throw new Error('This file contains a Pool object with no name.');
  }

  let position = qbjPool.position ?? 1;
  if (badInteger(position, 1, 100)) position = 1;

  if (!yfExtraData && !qbjPool.poolTeams?.length) {
    throw new Error(`Pool ${name} has no defined size.`);
  }
  const size = yfExtraData ? yfExtraData.size : qbjPool.poolTeams?.length || 99;

  const yftPool = new Pool(size, position);
  yftPool.name = name;
  if (description) yftPool.description = description;
  if (!yfExtraData) return yftPool;

  yftPool.roundRobins = yfExtraData.roundRobins;
  yftPool.seeds = yfExtraData.seeds;
  yftPool.hasCarryover = yfExtraData.hasCarryover;
  yftPool.autoAdvanceRules = yfExtraData.autoAdvanceRules;
  // TODO: feeder pools, poolteams

  return yftPool;
}

function parseRound(obj: IIndeterminateQbj, refTargets: IRefTargetDict, fallbackRoundNo: number): Round | null {
  const baseObj = getBaseQbjObject(obj, refTargets);
  if (baseObj === null) return null;

  const qbjRound = baseObj as IQbjRound;
  const yfExtraData = (baseObj as IYftFileRound).YfData;

  const roundNumber = yfExtraData ? yfExtraData.number : parseFloat(qbjRound.name);
  if (Number.isNaN(roundNumber)) {
    const yftRound = new Round(fallbackRoundNo);
    yftRound.name = qbjRound.name;
    return yftRound;
  }
  const yftRound = new Round(roundNumber);
  return yftRound;
}

/** Returns true if suppliedValue isn't an integer between the given bounds */
function badInteger(suppliedValue: number, lowerBound: number, upperBound: number) {
  if (suppliedValue < lowerBound || suppliedValue > upperBound) return true;
  return suppliedValue % 1 > 0;
}
