/* eslint-disable class-methods-use-this */
// Parse objects from a JSON file into internal YellowFruit objects

import stringSimilarity from 'string-similarity-js';
import { versionLt } from '../Utils/GeneralUtils';
import AnswerType, { IQbjAnswerType, sortAnswerTypes } from './AnswerType';
import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IRefTargetDict, IYftDataModelObject } from './Interfaces';
import { IQbjMatch, IYftFileMatch, Match } from './Match';
import { MatchPlayer, IQbjMatchPlayer } from './MatchPlayer';
import { MatchTeam, IQbjMatchTeam, IYftFileMatchTeam } from './MatchTeam';
import { MatchValidationCollection } from './MatchValidationMessage';
import { IQbjPhase, IYftFilePhase, Phase, PhaseTypes } from './Phase';
import { IQbjPlayer, IYftFilePlayer, Player } from './Player';
import { IQbjPlayerAnswerCount, PlayerAnswerCount } from './PlayerAnswerCount';
import { IQbjPool, IYftFilePool, Pool } from './Pool';
import { IQbjPoolTeam, IYftFilePoolTeam, PoolTeam } from './PoolTeam';
import { getBaseQbjObject, isQbjRefPointer } from './QbjUtils';
import { IQbjRank } from './Rank';
import { IQbjRanking, OverallRanking, Ranking } from './Ranking';
import Registration, { IQbjRegistration, IYftFileRegistration } from './Registration';
import { IQbjRound, IYftFileRound, Round, sortRounds } from './Round';
import { IQbjScoringRules, IYftFileScoringRules, ScoringRules } from './ScoringRules';
import { IQbjTeam, IYftFileTeam, Team } from './Team';
import Tournament, { IQbjTournament, IYftFileTournament } from './Tournament';
import { IQbjTournamentSite, TournamentSite } from './TournamentSite';
import { QbjTypeNames } from './QbjEnums';
import { findTournamentObject } from './QbjUtils2';

/** Threshold (0 to 1 scale) for string matching of team and player names when importing data. Similarity must be at leaset this high for us to use the match. */
const stringSimConfThreshold = 0.8;

interface IYftObjectDict<T extends IYftDataModelObject> {
  [id: string]: T;
}

export default class FileParser {
  tourn: Tournament;

  refTargets: IRefTargetDict;

  teamsById: IYftObjectDict<Team> = {};

  phasesById: IYftObjectDict<Phase> = {};

  playersById: IYftObjectDict<Player> = {};

  answerTypesById: IYftObjectDict<AnswerType> = {};

  /** The pool object currently being parsed, if any */
  currentPool?: IQbjPool;

  /** The phase that we're importing games into, if we aren't opening the whole file */
  importPhase?: Phase;

  /**
   * @param refTargs dictionary of $refs that the file contains
   * @param tournament Existing tournament that we are importing more object into. Don't pass anything here if opening a whole tournament file.
   */
  constructor(refTargs: IRefTargetDict, tournament?: Tournament, phase?: Phase) {
    this.refTargets = refTargs;
    if (tournament) {
      this.tourn = tournament;
      this.importPhase = phase;
    } else {
      this.tourn = new Tournament();
    }
  }

  static findMatches(objectsFromFile: IQbjObject[]) {
    const matches: IQbjMatch[] = [];
    for (const obj of objectsFromFile) {
      if (obj.type === QbjTypeNames.Match) matches.push(obj as IQbjMatch);
    }
    const tourn = findTournamentObject(objectsFromFile);
    if (tourn === null) return matches;
    for (const ph of tourn.phases || []) {
      for (const rd of ph.rounds || []) {
        for (const m of rd.matches || []) {
          matches.push(m);
        }
      }
    }
    return matches;
  }

  parseYftTournament(obj: IYftFileTournament, curYfVersion?: string): Tournament | null {
    const version = obj.YfData?.YfVersion;
    if (!version) {
      throw new Error('Failed to determine the YellowFruit version of this file.');
    }
    if (curYfVersion && versionLt(curYfVersion, version)) {
      throw new Error(
        `This file was made with YellowFruit version ${version}. You must upgrade to that version (or later) to open this file.`,
      );
    }

    return this.parseTournament(obj);
  }

  parseTournament(obj: IQbjTournament): Tournament {
    const yfExtraData = (obj as IYftFileTournament).YfData;

    if (obj.name && obj.name !== Tournament.placeholderName) this.tourn.name = obj.name;
    if (obj.startDate) this.tourn.startDate = obj.startDate;
    if (obj.endDate) this.tourn.endDate = obj.endDate;
    if (obj.questionSet) this.tourn.questionSet = obj.questionSet;

    const site = obj.tournamentSite;
    if (site) this.tourn.tournamentSite = this.parseTournamentSite(site as IIndeterminateQbj);
    else this.tourn.tournamentSite = new TournamentSite();

    const rules = obj.scoringRules;
    if (rules) this.tourn.scoringRules = this.parseScoringRules(rules as IIndeterminateQbj);

    const { phases, registrations } = obj;
    if (registrations) this.tourn.registrations = this.parseRegistrationList(registrations as IIndeterminateQbj[]);
    if (phases) this.tourn.phases = this.parsePhaseList(phases as IIndeterminateQbj[]);

    if (yfExtraData) {
      this.tourn.standardRuleSet = yfExtraData.standardRuleSet;
      this.tourn.seeds = this.parseSeedList(yfExtraData.seeds);
      this.tourn.trackPlayerYear = yfExtraData.trackPlayerYear ?? true;
      this.tourn.trackSmallSchool = yfExtraData.trackSmallSchool || false;
      this.tourn.trackJV = yfExtraData.trackJV || false;
      this.tourn.trackUG = yfExtraData.trackUG || false;
      this.tourn.trackDiv2 = yfExtraData.trackDiv2 || false;
      this.tourn.finalRankingsReady = yfExtraData.finalRankingsReady || false;
      this.tourn.usingScheduleTemplate = yfExtraData.usingScheduleTemplate || false;
      this.tourn.appVersion = yfExtraData.YfVersion || '';
    } else {
      this.tourn.inferCarryoverStatus();
    }

    this.tourn.calcHasMatchData();
    return this.tourn;
  }

  parseTournamentSite(obj: IIndeterminateQbj): TournamentSite {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return new TournamentSite();

    const qbjTSite = baseObj as IQbjTournamentSite;
    return new TournamentSite(qbjTSite.name);
  }

  parseScoringRules(obj: IIndeterminateQbj): ScoringRules {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
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
    this.parseScoringRulesGameLength(qbjScoringRules, yftScoringRules);
    this.parseScoringRulesAnswerTypes(qbjScoringRules, yftScoringRules);
    this.parseScoringRulesBonusSettings(qbjScoringRules, yftScoringRules);
    this.parseScoringRulesMaxPlayers(qbjScoringRules, yftScoringRules);
    this.parseScoringRulesOvertime(qbjScoringRules, yftScoringRules);
    this.parseScoringRulesLightning(qbjScoringRules, yftScoringRules);

    return yftScoringRules;
  }

  parseScoringRulesGameLength(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
    const yfExtraData = (sourceQbj as IYftFileScoringRules).YfData;

    const regTuCnt = sourceQbj.regulationTossupCount ?? 20;
    const maxRegTuCnt = sourceQbj.maximumRegulationTossupCount ?? 20;
    if (!ScoringRules.validateMaxRegTuCount(maxRegTuCnt)) {
      throw new Error('Scoring Rules: Unsupported value for maximum regulation toss-up count.');
    }

    yftScoringRules.maximumRegulationTossupCount = ScoringRules.validateMaxRegTuCount(maxRegTuCnt) ? maxRegTuCnt : 20;
    yftScoringRules.timed = yfExtraData ? !!yfExtraData.timed : maxRegTuCnt !== regTuCnt; // non-standard round lengths implies timed
  }

  parseScoringRulesAnswerTypes(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
    const yftAnswerTypes: AnswerType[] = [];
    for (const aType of sourceQbj.answerTypes) {
      const oneYftAType = this.parseAnswerType(aType as IIndeterminateQbj);
      if (oneYftAType !== null) yftAnswerTypes.push(oneYftAType);
    }

    if (!yftAnswerTypes.find((aType) => aType.value > 0)) {
      throw new Error('Scoring Rules: This tournament contains no positive toss-up point values.');
    }

    sortAnswerTypes(yftAnswerTypes);
    yftScoringRules.answerTypes = yftAnswerTypes;
  }

  parseScoringRulesBonusSettings(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
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

    yftScoringRules.bonusesBounceBack = sourceQbj.bonusesBounceBack || false;
  }

  parseScoringRulesMaxPlayers(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
    const maxPlayers = sourceQbj.maximumPlayersPerTeam ?? 4;
    if (badInteger(maxPlayers, 1, ScoringRules.maximumAllowedRosterSize)) {
      throw new Error(`Scoring Rules: Invalid maximum players per team setting: ${maxPlayers}`);
    }
    yftScoringRules.maximumPlayersPerTeam = maxPlayers;
  }

  parseScoringRulesOvertime(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
    const minTossups = sourceQbj.minimumOvertimeQuestionCount ?? 1;
    if (badInteger(minTossups, 1, 100)) {
      throw new Error(`Scoring Rules: Invalid mimimum overtime question setting: ${minTossups}`);
    }
    yftScoringRules.minimumOvertimeQuestionCount = minTossups;

    yftScoringRules.overtimeIncludesBonuses = !!sourceQbj.overtimeIncludesBonuses;
  }

  parseScoringRulesLightning(sourceQbj: IQbjScoringRules, yftScoringRules: ScoringRules) {
    const lightningCount = sourceQbj.lightningCountPerTeam ?? 0;
    if (badInteger(lightningCount, 0, 10)) {
      throw new Error(`Scoring Rules: Invalid lightning rounds per team setting: ${lightningCount}`);
    }
    yftScoringRules.lightningCountPerTeam = lightningCount > 0 ? 1 : 0;
    if (lightningCount < 1) return;

    const { lightningDivisor } = sourceQbj;
    if (lightningDivisor === undefined) return;

    if (badInteger(lightningDivisor, 0, 1000)) {
      throw new Error(`Scoring Rules: Invalid lightning round divisor setting: ${lightningDivisor}`);
    }
    yftScoringRules.lightningDivisor = lightningDivisor;
  }

  parseAnswerType(obj: IIndeterminateQbj): AnswerType | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
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

    if (qbjAType.id) this.answerTypesById[qbjAType.id] = yftAType;

    return yftAType;
  }

  parseRegistrationList(ary: IIndeterminateQbj[]): Registration[] {
    const regs: Registration[] = [];
    for (const obj of ary) {
      const oneReg = this.parseRegistration(obj);
      if (oneReg !== null) regs.push(oneReg);
    }
    return regs;
  }

  parseRegistration(obj: IIndeterminateQbj): Registration | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjReg = baseObj as IQbjRegistration;
    const yfExtraData = (baseObj as IYftFileRegistration).YfData;

    const { name, teams } = qbjReg;
    if (!name?.trim()) {
      throw new Error('This file contains a Registration object with no name.');
    }
    const yftReg = new Registration(name.trim().substring(0, Registration.maxNameLength));
    yftReg.isSmallSchool = yfExtraData?.isSmallSchool || false;
    yftReg.teams = this.parseTeamList(teams as IIndeterminateQbj[]);

    return yftReg;
  }

  parseTeamList(ary: IIndeterminateQbj[]): Team[] {
    const teams: Team[] = [];
    for (const obj of ary) {
      const oneTeam = this.parseTeam(obj);
      if (oneTeam !== null) teams.push(oneTeam);
    }
    return teams;
  }

  parseTeam(obj: IIndeterminateQbj): Team | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjTeam = baseObj as IQbjTeam;
    const yfExtraData = (baseObj as IYftFileTeam).YfData;

    const { name, players } = qbjTeam;
    if (!name?.trim()) {
      throw new Error('This file contains a Team object with no name');
    }

    const yfTeam = new Team(name.trim().substring(0, Registration.maxNameLength + 1 + Team.maxLetterLength));
    const yfPlayers = this.parsePlayerList(players as IIndeterminateQbj[], yfTeam.name);
    if (yfPlayers.length < 1) {
      throw new Error(`Team ${name} doesn't have any players.`);
    }
    yfTeam.players = yfPlayers;
    if (yfExtraData) {
      yfTeam.letter = this.parseTeamLetter(yfExtraData.letter, name);
      yfTeam.isJV = yfExtraData.isJV || false;
      yfTeam.isUG = yfExtraData.isUG || false;
      yfTeam.isD2 = yfExtraData.isD2 || false;
    }

    const overallRankNo = this.parseTeamOverallRank((qbjTeam.ranks as IIndeterminateQbj[]) || []);
    if (overallRankNo) yfTeam.setOverallRank(overallRankNo);

    if (qbjTeam.id) this.teamsById[qbjTeam.id] = yfTeam;

    return yfTeam;
  }

  parseTeamLetter(letterFromFile: string, teamName: string): string {
    if (letterFromFile === undefined) return '';
    const trimmed = letterFromFile.trim();
    if (trimmed.includes(' ')) {
      throw new Error(`Team ${teamName} has an invalid letter/modifier: ${trimmed}`);
    }
    return trimmed.substring(0, Team.maxLetterLength);
  }

  parsePlayerList(ary: IIndeterminateQbj[], teamName: string): Player[] {
    const players: Player[] = [];
    for (const obj of ary) {
      const onePlayer = this.parsePlayer(obj, teamName);
      if (onePlayer !== null) players.push(onePlayer);
    }
    return players;
  }

  parsePlayer(obj: IIndeterminateQbj, teamName: string): Player | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjPlayer = baseObj as IQbjPlayer;
    const yfExtraData = (baseObj as IYftFilePlayer).YfData;

    const { name, year } = qbjPlayer;
    if (!name?.trim()) {
      throw new Error(`Team ${teamName} contains a player with no name.`);
    }

    const yfPlayer = new Player(name.trim().substring(0, Player.nameMaxLength));
    const yearStr = yfExtraData?.yearString?.trim().substring(0, Player.yearStringMaxLength);
    if (yearStr) {
      yfPlayer.yearString = yearStr;
    } else {
      const yearStringFromNumericYear = parsePlayerYear(year);
      if (yearStringFromNumericYear === undefined) {
        throw new Error(
          `Player ${yfPlayer.name} on team ${teamName} has an invalid Year attribute (must be between -1 and 18)`,
        );
      }
      yfPlayer.yearString = yearStringFromNumericYear;
    }
    yfPlayer.isUG = yfExtraData?.isUG || false;
    yfPlayer.isD2 = yfExtraData?.isD2 || false;

    if (qbjPlayer.id) this.playersById[qbjPlayer.id] = yfPlayer;

    return yfPlayer;
  }

  parseSeedList(seedsFromFile: IQbjRefPointer[]): Team[] {
    if (!seedsFromFile) return [];

    const seedList = [];
    for (const ptr of seedsFromFile) {
      const team = this.tourn.findTeamById(ptr.$ref);
      if (!team) {
        throw new Error(`Seed list references team ${ptr.$ref}, which doesn't exist.`);
      }
      seedList.push(team);
    }
    return seedList;
  }

  parseTeamOverallRank(ary: IIndeterminateQbj[]): number | undefined {
    for (const obj of ary) {
      const baseObj = getBaseQbjObject(obj, this.refTargets);
      if (baseObj === null) continue;

      const qbjRank = baseObj as IQbjRank;
      if ((qbjRank.ranking as IQbjRefPointer)?.$ref !== OverallRanking.id) continue;

      return qbjRank.position;
    }
    return undefined;
  }

  parsePhaseList(ary: IIndeterminateQbj[]): Phase[] {
    const phases: Phase[] = [];
    let phaseCount = 1;
    let lastUsedRound = 0;
    let curCodeNo = 1;
    for (const obj of ary) {
      const fallbackPhaseType = phaseCount === 1 ? PhaseTypes.Prelim : PhaseTypes.Playoff;
      const onePhase = this.parsePhase(obj, fallbackPhaseType, lastUsedRound + 1, curCodeNo.toString());
      if (onePhase === null) continue;

      phases.push(onePhase);
      phaseCount++;
      lastUsedRound = onePhase.rounds[onePhase.rounds.length - 1].number;
      curCodeNo++;
    }

    for (const ph of phases) {
      for (const round of ph.rounds) {
        for (const match of round.matches) {
          this.parseMatchCarryoverPhasesFinish(match);
        }
      }
    }
    return phases;
  }

  parsePhase(
    obj: IIndeterminateQbj,
    assumedPhaseType: PhaseTypes,
    fallbackRoundStart: number,
    fallbackCode: string,
  ): Phase | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjPhase = baseObj as IQbjPhase;
    const yfExtraData = (baseObj as IYftFilePhase).YfData;

    const { name, description } = qbjPhase;
    if (!name) {
      throw new Error('This file contains a Phase object with no name.');
    }

    const phaseType = yfExtraData ? yfExtraData.phaseType : assumedPhaseType;
    const rounds = this.parsePhaseRounds(qbjPhase, fallbackRoundStart);
    const code = yfExtraData ? yfExtraData.code : fallbackCode;
    const firstRound = rounds[0].number;
    const lastRound = rounds[rounds.length - 1].number;

    const yftPhase = new Phase(phaseType, firstRound, lastRound, code, name);
    yftPhase.description = description || '';
    if (yfExtraData) yftPhase.forceNumericRounds = yfExtraData.forceNumericRounds;
    if (yfExtraData?.wildCardRankingMethod) yftPhase.wildCardRankingMethod = yfExtraData.wildCardRankingMethod;
    yftPhase.wildCardAdvancementRules = yfExtraData?.wildCardAdvancementRules ?? [];

    this.addRoundsFromFile(yftPhase, rounds, firstRound, lastRound);
    yftPhase.pools = this.parsePhasePools(qbjPhase);

    if (qbjPhase.id) this.phasesById[qbjPhase.id] = yftPhase; // we need this before we parse rounds

    return yftPhase;
  }

  /** Returns the list of rounds in ascending order of round number */
  parsePhaseRounds(sourceQbj: IQbjPhase, fallbackRoundStart: number): Round[] {
    if (!sourceQbj.rounds) return [];

    const yftRounds: Round[] = [];
    let fallbackRound = fallbackRoundStart;
    for (const oneRound of sourceQbj.rounds) {
      const oneYftRound = this.parseRound(oneRound as IIndeterminateQbj, fallbackRound);
      if (oneYftRound !== null) {
        yftRounds.push(oneYftRound);
        fallbackRound++;
      }
    }
    sortRounds(yftRounds);
    return yftRounds;
  }

  addRoundsFromFile(yftPhase: Phase, roundsFromFile: Round[], firstRound: number, lastRound: number) {
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

  parsePhasePools(sourceQbj: IQbjPhase): Pool[] {
    if (!sourceQbj.pools) return [];

    const yftPools: Pool[] = [];
    for (const onePool of sourceQbj.pools) {
      const oneYftPool = this.parsePool(onePool as IIndeterminateQbj);
      if (oneYftPool !== null) {
        yftPools.push(oneYftPool);
      }
    }
    this.currentPool = undefined;
    return yftPools;
  }

  parsePool(obj: IIndeterminateQbj): Pool | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjPool = baseObj as IQbjPool;
    const yfExtraData = (baseObj as IYftFilePool).YfData;

    const { name, description } = qbjPool;
    if (!name) {
      throw new Error('This file contains a Pool object with no name.');
    }

    this.currentPool = qbjPool;

    let position = qbjPool.position ?? 1;
    if (badInteger(position, 1, 100)) position = 1;

    if (!yfExtraData && !qbjPool.poolTeams?.length) {
      throw new Error(`Pool ${name} has no defined size.`);
    }
    const size = yfExtraData ? yfExtraData.size : qbjPool.poolTeams?.length || 99;

    const yftPool = new Pool(size, position);
    yftPool.name = name;
    if (description) yftPool.description = description;
    yftPool.poolTeams = this.parsePoolPoolTeams(qbjPool);
    yftPool.validateSize();

    if (yfExtraData) {
      yftPool.roundRobins = yfExtraData.roundRobins;
      yftPool.seeds = yfExtraData.seeds;
      yftPool.hasCarryover = yfExtraData.hasCarryover;
      yftPool.autoAdvanceRules = yfExtraData.autoAdvanceRules;
    }

    return yftPool;
  }

  parsePoolPoolTeams(sourceQbj: IQbjPool): PoolTeam[] {
    if (!sourceQbj.poolTeams) return [];

    const yftPoolTeams: PoolTeam[] = [];
    for (const onePt of sourceQbj.poolTeams) {
      const yfPt = this.parsePoolTeam(onePt as IIndeterminateQbj);
      if (yfPt) yftPoolTeams.push(yfPt);
    }
    return yftPoolTeams;
  }

  parsePoolTeam(obj: IIndeterminateQbj): PoolTeam | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjPoolTeam = baseObj as IQbjPoolTeam;
    const yfExtraData = (baseObj as IYftFilePoolTeam).YfData;

    const team = this.getYfObjectFromId(qbjPoolTeam.team as IIndeterminateQbj, this.teamsById);
    if (!team) {
      throw new Error(`Pool ${this.currentPool?.name} contains a PoolTeam that doesn't refer to a valid Team.`);
    }

    const yfPoolTeam = new PoolTeam(team);
    yfPoolTeam.position = qbjPoolTeam.position;
    yfPoolTeam.didNotAdvance = yfExtraData?.didNotAdvance;

    return yfPoolTeam;
  }

  parseRound(obj: IIndeterminateQbj, fallbackRoundNo: number): Round | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
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
    if (yfExtraData?.nonNumericName) yftRound.name = yfExtraData.nonNumericName;
    yftRound.matches = this.parseRoundMatches(qbjRound);
    return yftRound;
  }

  parseRoundMatches(sourceQbj: IQbjRound): Match[] {
    if (!sourceQbj.matches) return [];

    const yftMatches: Match[] = [];
    for (const oneMatch of sourceQbj.matches) {
      const yfm = this.parseMatch(oneMatch as IIndeterminateQbj);
      if (yfm) yftMatches.push(yfm);
    }
    return yftMatches;
  }

  parseMatch(obj: IIndeterminateQbj): Match | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjMatch = baseObj as IQbjMatch;
    const yfExtraData = (baseObj as IYftFileMatch).YfData;

    const yfMatch = new Match();
    yfMatch.tossupsRead = qbjMatch.tossupsRead;
    if (yfMatch.tossupsRead === undefined && !this.tourn.scoringRules.timed) {
      yfMatch.tossupsRead = this.tourn.scoringRules.regulationTossupCount;
    }
    if (!this.importPhase) {
      yfMatch.coPhaseQbjIds = this.parseMatchCarryoverPhasesStart(qbjMatch.carryoverPhases as IIndeterminateQbj[]);
    }
    yfMatch.overtimeTossupsRead = qbjMatch.overtimeTossupsRead;

    if (this.importPhase) {
      yfMatch.tiebreaker = this.importPhase?.phaseType === PhaseTypes.Tiebreaker;
    } else {
      yfMatch.tiebreaker = qbjMatch.tiebreaker || false;
    }

    yfMatch.location = qbjMatch.location;
    yfMatch.packets = qbjMatch.packets;
    yfMatch.moderator = qbjMatch.moderator;
    yfMatch.scorekeeper = qbjMatch.scorekeeper;
    yfMatch.serial = qbjMatch.serial;
    yfMatch.notes = qbjMatch.notes;

    const [leftTeam, rightTeam] = this.parseMatchMatchTeams(qbjMatch.matchTeams as IIndeterminateQbj[]);
    yfMatch.leftTeam = leftTeam;
    yfMatch.rightTeam = rightTeam;

    if (yfMatch.isForfeit()) yfMatch.tossupsRead = undefined;

    yfMatch.modalBottomValidation = new MatchValidationCollection();
    yfMatch.modalBottomValidation.addFromFileObjects(yfExtraData?.otherValidation || []);
    yfMatch.importedFile = yfExtraData?.importedFile;

    yfMatch.validateAll(this.tourn.scoringRules);
    return yfMatch;
  }

  parseMatchMatchTeams(matchTeams: IIndeterminateQbj[]): MatchTeam[] {
    if (!matchTeams || matchTeams.length < 2) {
      throw new Error('This file contains a Match object with fewer than two teams.');
    }
    if (matchTeams.length > 2) {
      throw new Error('This file contains a Match object with more than two teams.');
    }
    const leftTeam = this.parseMatchTeam(matchTeams[0]);
    const rightTeam = this.parseMatchTeam(matchTeams[1]);
    if (!leftTeam || !rightTeam) {
      throw new Error("This file contains MatchTeam objects that couldn't be parsed");
    }
    return [leftTeam, rightTeam];
  }

  parseMatchTeam(obj: IIndeterminateQbj): MatchTeam | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjMatchTeam = baseObj as IQbjMatchTeam;
    const yfExtraData = (baseObj as IYftFileMatchTeam).YfData;

    const team = this.resolveMatchTeamIdentity(qbjMatchTeam);
    if (!team) {
      throw new Error('Failed to associate a MatchTeam object with a valid Team');
    }

    const yfMatchTeam = new MatchTeam(team, this.tourn.scoringRules.answerTypes);
    yfMatchTeam.points = qbjMatchTeam.points;
    yfMatchTeam.forfeitLoss = qbjMatchTeam.forfeitLoss || false;
    yfMatchTeam.bonusBouncebackPoints = qbjMatchTeam.bonusBouncebackPoints;
    yfMatchTeam.lightningPoints = qbjMatchTeam.lightningPoints;
    yfMatchTeam.matchPlayers = this.parseMatchTeamMatchPlayers(qbjMatchTeam.matchPlayers as IIndeterminateQbj[], team);
    for (const otAC of yfExtraData?.overTimeBuzzes || []) {
      const tempAnswerCount = this.parsePlayerAnswerCount(otAC as IIndeterminateQbj);
      if (!tempAnswerCount) continue;
      yfMatchTeam.setOvertimeAnswerCount(tempAnswerCount.answerType, tempAnswerCount.number);
    }
    yfMatchTeam.sortOvertimeBuzzes();

    if (yfMatchTeam.points === undefined) yfMatchTeam.calculateTotalPoints(qbjMatchTeam.bonusPoints || 0);

    yfMatchTeam.modalBottomValidation = new MatchValidationCollection();
    yfMatchTeam.modalBottomValidation.addFromFileObjects(yfExtraData?.validation || []);

    return yfMatchTeam;
  }

  /** Find the Team object that this MatchTeam refers to */
  resolveMatchTeamIdentity(qbjMatchTeam: IQbjMatchTeam) {
    if (!this.importPhase) {
      return this.getYfObjectFromId(qbjMatchTeam.team as IIndeterminateQbj, this.teamsById);
    }

    let nameToMatch;
    // If the team is a $ref to something else in the file, resolve the intra-file reference, then use that team's name for string matching
    if (isQbjRefPointer(qbjMatchTeam.team as IIndeterminateQbj)) {
      const importFileTeamObj = this.getYfObjectFromId(qbjMatchTeam.team as IIndeterminateQbj, this.teamsById);
      if (!importFileTeamObj) {
        throw new Error(`Couldn't resolve reference to team ${(qbjMatchTeam.team as IQbjRefPointer).$ref}`);
      }
      nameToMatch = importFileTeamObj.name;
    } else {
      nameToMatch = (qbjMatchTeam.team as IQbjTeam).name;
    }

    const importResult = getYfTeamFromName(nameToMatch, this.importPhase);
    if (importResult.confidence < stringSimConfThreshold) {
      throw new Error(
        `Couldn't find team '${nameToMatch}' within ${this.importPhase.name}. Closest team name found: ${
          importResult.matchedObj?.name || 'none'
        }.`,
      );
    }
    return importResult.matchedObj;
  }

  /**
   * @param matchPlayers MatchPlayer objects to parse
   * @param team YF Team we know they're on, if we need to do string matching to figure out what Plyer object it obj refers to
   */
  parseMatchTeamMatchPlayers(matchPlayers: IIndeterminateQbj[], team?: Team): MatchPlayer[] {
    if (!matchPlayers) return [];

    const yfMatchPlayers: MatchPlayer[] = [];
    for (const obj of matchPlayers) {
      const oneMp = this.parseMatchPlayer(obj, team);
      if (oneMp) yfMatchPlayers.push(oneMp);
    }
    return yfMatchPlayers;
  }

  /**
   * @param obj MatchPlayer to parse
   * @param team YF Team we know they're on, if we need to do string matching to figure out what Player object it obj refers to
   */
  parseMatchPlayer(obj: IIndeterminateQbj, team?: Team): MatchPlayer | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjMatchPlayer = baseObj as IQbjMatchPlayer;
    const player = this.resolveMatchPlayerIdentity(qbjMatchPlayer, team);
    if (!player) {
      throw new Error('Failed to associate a MatchPlayer object with a valid Player');
    }

    const yfMatchPlayer = new MatchPlayer(player, this.tourn.scoringRules.answerTypes);
    yfMatchPlayer.tossupsHeard = dropZero(qbjMatchPlayer.tossupsHeard);
    for (const pac of qbjMatchPlayer.answerCounts) {
      const tempAnswerCount = this.parsePlayerAnswerCount(pac as IIndeterminateQbj);
      if (!tempAnswerCount) continue;
      yfMatchPlayer.setAnswerCount(tempAnswerCount.answerType, tempAnswerCount.number);
    }

    yfMatchPlayer.sortAnswerCounts();
    return yfMatchPlayer;
  }

  /**
   * Find the Team object that this MatchTeam refers to
   * @param qbjMatchPlayer MatchPlayer being parsed
   * @param team YF Team we know they're on, if we need to do string matching
   */
  resolveMatchPlayerIdentity(qbjMatchPlayer: IQbjMatchPlayer, team?: Team) {
    if (!this.importPhase) {
      return this.getYfObjectFromId(qbjMatchPlayer.player as IIndeterminateQbj, this.playersById);
    }

    if (!team) return undefined;

    let nameToMatch;
    // If the player is a $ref to something else in the file, resolve the intra-file reference, then use that player's name for string matching
    if (isQbjRefPointer(qbjMatchPlayer.player as IIndeterminateQbj)) {
      const importFilePlayerObj = this.getYfObjectFromId(qbjMatchPlayer.player as IIndeterminateQbj, this.playersById);
      if (!importFilePlayerObj) {
        throw new Error(`Couldn't resolve reference to player ${(qbjMatchPlayer.player as IQbjRefPointer).$ref}`);
      }
      nameToMatch = importFilePlayerObj.name;
    } else {
      nameToMatch = (qbjMatchPlayer.player as IQbjPlayer).name;
    }

    const importResult = getYfPlayerFromName(nameToMatch, team);
    if (importResult.confidence < stringSimConfThreshold) {
      throw new Error(
        `Couldn't find player '${nameToMatch}' on team ${team.name}. Closest name found: ${
          importResult.matchedObj?.name || 'none'
        }.`,
      );
    }
    return importResult.matchedObj;
  }

  parsePlayerAnswerCount(obj: IIndeterminateQbj): PlayerAnswerCount | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjPlayerAnswerCount = baseObj as IQbjPlayerAnswerCount;
    fixModaqAnswerType(qbjPlayerAnswerCount);

    const answerType = this.resolveAnswerTypeIdentity(qbjPlayerAnswerCount.answerType as IIndeterminateQbj);
    if (!answerType) {
      if ((qbjPlayerAnswerCount.answerType as IQbjAnswerType).value === 0) return null; // if the data has 0-point buzzes, but the YF file can't use them, that isn't a problem
      throw new Error('Failed to associate a PlayerAnswerCount object with a valid AnswerType');
    }
    const count = dropZero(qbjPlayerAnswerCount.number);

    return new PlayerAnswerCount(answerType, count);
  }

  /** Find the existing AnswerType object that this refers or is identical to */
  resolveAnswerTypeIdentity(qbjAnswerType: IIndeterminateQbj) {
    const answerType = this.getYfObjectFromId(qbjAnswerType, this.answerTypesById);
    if (answerType) return answerType;

    return getYfAnswerTypeFromValue((qbjAnswerType as IQbjAnswerType).value, this.tourn.scoringRules.answerTypes);
  }

  /** Get the phase pointers. Later we'll hook the match object up with the real Phase objects once we have them. */
  parseMatchCarryoverPhasesStart(ary: IIndeterminateQbj[]): IQbjRefPointer[] {
    const carryoverPhasesIds: IQbjRefPointer[] = [];
    for (const obj of ary) {
      // Require phases here to be ref pointers. It's very silly to define phases within objects that are themselves contained within phases.
      // Don't give me a headache.
      if (!isQbjRefPointer(obj)) continue;
      carryoverPhasesIds.push(obj as IQbjRefPointer);
    }
    return carryoverPhasesIds;
  }

  /** Translate stored ref pointers to real objects */
  parseMatchCarryoverPhasesFinish(match: Match) {
    for (const ptr of match.coPhaseQbjIds) {
      const phaseObj = this.getYfObjectFromId(ptr, this.phasesById);
      if (phaseObj) match.carryoverPhases.push(phaseObj);
    }
  }

  /** unused right now */
  parseRanking(obj: IIndeterminateQbj): Ranking | null {
    const baseObj = getBaseQbjObject(obj, this.refTargets);
    if (baseObj === null) return null;

    const qbjRanking = baseObj as IQbjRanking;

    const yfRanking = new Ranking(qbjRanking.name || '');
    return yfRanking;
  }

  /** Assuming we've already loaded the requisite objects, find the YF object referred to by this qbj object */
  getYfObjectFromId<T extends IYftDataModelObject>(obj: IIndeterminateQbj, dict: IYftObjectDict<T>): T | undefined {
    if (!obj) return undefined;

    if (isQbjRefPointer(obj)) {
      return dict[(obj as IQbjRefPointer).$ref];
    }
    const { id } = obj as IQbjObject;
    if (!id) return undefined;

    return dict[id];
  }

  /** Match up IDs from a file we're importing, to the YF file we already have open */
  buildTypesByIdArrays(objectsFromFile: IQbjObject[]) {
    for (const obj of objectsFromFile) {
      if (obj.type === QbjTypeNames.Team) {
        this.typesByIdArraysAddTeam(obj);
      } else if (obj.type === QbjTypeNames.Player) {
        this.typesByIdArraysAddPlayer(obj);
      } else if (obj.type === QbjTypeNames.AnswerType) {
        this.typesByIdArraysAddAnswerType(obj);
      } else if (obj.type === QbjTypeNames.ScoringRules) {
        for (const atObj of (obj as IQbjScoringRules).answerTypes || []) {
          this.typesByIdArraysAddAnswerType(atObj);
        }
      } else {
        let regQbjArray: IQbjRegistration[] = [];
        if (obj.type === QbjTypeNames.Tournament) regQbjArray = (obj as IQbjTournament).registrations || [];
        else if (obj.type === QbjTypeNames.Registration) regQbjArray = [obj as IQbjRegistration];

        for (const oneReg of regQbjArray) {
          for (const qbjTeam of oneReg.teams || []) {
            this.typesByIdArraysAddTeam(qbjTeam);
          }
        }
        for (const atObj of (obj as IQbjTournament).scoringRules?.answerTypes || []) {
          this.typesByIdArraysAddAnswerType(atObj);
        }
      }
    }
  }

  typesByIdArraysAddTeam(teamObj: IQbjObject) {
    if (teamObj.id) {
      const yfTeam = this.tourn.findTeamById(teamObj.id);
      if (yfTeam) this.teamsById[teamObj.id] = yfTeam;
      for (const playerObj of (teamObj as IQbjTeam).players || []) {
        this.typesByIdArraysAddPlayer(playerObj, yfTeam);
      }
    }
  }

  typesByIdArraysAddPlayer(playerObj: IQbjObject, yfTeam?: Team) {
    if (playerObj.id) {
      const playerName = (playerObj as IQbjPlayer).name;
      const yfPlayer = yfTeam ? yfTeam.findPlayerByName(playerName) : this.tourn.findPlayerByName(playerName);
      if (yfPlayer) this.playersById[playerObj.id] = yfPlayer;
    }
  }

  typesByIdArraysAddAnswerType(atObj: IQbjObject) {
    if (atObj.id) {
      const yfAnswerType = this.tourn.scoringRules.findAnswerTypeById(atObj.id);
      if (yfAnswerType) this.answerTypesById[atObj.id] = yfAnswerType;
    }
  }
}

interface IStringMatchResult<T> {
  matchedObj?: T;
  confidence: number;
}

function getYfTeamFromName(name: string, phase?: Phase) {
  const result: IStringMatchResult<Team> = { confidence: 0 };
  if (!phase) return result;

  for (const pool of phase.pools) {
    for (const pt of pool.poolTeams) {
      const conf = stringSimilarity(name, pt.team.name);
      if (conf >= result.confidence) {
        result.confidence = conf;
        result.matchedObj = pt.team;
      }
    }
  }
  return result;
}

function getYfPlayerFromName(name: string, team: Team) {
  const result: IStringMatchResult<Player> = { confidence: 0 };
  for (const pl of team.players) {
    let conf = stringSimilarity(name, pl.name);
    if (conf >= result.confidence) {
      result.confidence = conf;
      result.matchedObj = pl;
    }
    conf = stringSimilarity(removeYearFromPlayerName(name), pl.name);
    if (conf >= result.confidence) {
      result.confidence = conf;
      result.matchedObj = pl;
    }
  }
  return result;
}

function getYfAnswerTypeFromValue(value: number, answerTypes: AnswerType[]) {
  for (const atype of answerTypes) {
    if (atype.value === value) return atype;
  }
  return undefined;
}

// only exporting so I can unit test
/** Translate Qbj numeric year to YF string representation. Returns undefined if invalid. */
export function parsePlayerYear(yearFromFile: number | undefined): string | undefined {
  if (yearFromFile === undefined) return '';
  if (yearFromFile < -1 || 18 < yearFromFile) return undefined;
  if (yearFromFile === -1) return '';
  return Player.yearAbbrevs[yearFromFile as unknown as keyof typeof Player.yearAbbrevs];
}

/** Returns true if suppliedValue isn't an integer between the given bounds */
function badInteger(suppliedValue: number, lowerBound: number, upperBound: number) {
  if (suppliedValue < lowerBound || suppliedValue > upperBound) return true;
  return suppliedValue % 1 > 0;
}

/** Change a number to undefined if it's zero */
function dropZero(num: number | undefined): number | undefined {
  if (num === 0) return undefined;
  return num;
}

function removeYearFromPlayerName(nameRaw: string) {
  return nameRaw
    .trim()
    .replace(/\(.*\)$/, '')
    .trim();
}

/** PlayerAnswerCounts in MODAQ use 'answer' when they should use 'answer_type' */
function fixModaqAnswerType(pac: IQbjPlayerAnswerCount) {
  if (!pac.answerType) {
    pac.answerType = (pac as any).answer;
  }
}
