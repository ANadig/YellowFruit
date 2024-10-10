// eslint-disable-next-line import/no-cycle
import { IQbjRound, Round } from './Round';
import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
// eslint-disable-next-line import/no-cycle
import { IQbjPool, Pool, setAutoAdvanceRules } from './Pool';
import { QbjTypeNames } from './QbjEnums';
// eslint-disable-next-line import/no-cycle
import { Team } from './Team';
import { makeQbjRefPointer } from './QbjUtils';
import { Match } from './Match';
import { Player } from './Player';
import { sumReduce } from '../Utils/GeneralUtils';

export enum PhaseTypes {
  /** The first phase of a tournament */
  Prelim = 'Prelim',
  /** Subsequent main phases after the prelim phase  */
  Playoff = 'Playoff',
  /** Used for determining the top several ranks */
  Finals = 'Finals',
  /** For breaking ties for advancing from one phase to another */
  Tiebreaker = 'Tiebreaker',
}

function defaultPhaseName(type: PhaseTypes) {
  switch (type) {
    case PhaseTypes.Prelim:
      return 'Prelims';
    case PhaseTypes.Playoff:
      return 'Playoffs';
    case PhaseTypes.Finals:
      return 'Finals';
    case PhaseTypes.Tiebreaker:
      return 'Tiebreaker';
    default:
      return '';
  }
}

/** When a phase uses wild card advancement (as opposed to set numbers of teams advancing from each pool),
 *  How do rank wild card teams?
 */
export enum WildCardRankingMethod {
  /** Rank within the team's pool, then PPB. e.g. prioritize all 3rd place teams over all 4th place teams. */
  RankThenPPB = 'RankThenPPB',
  /** Record in the pool, then PPB. e.g. prioritize all 3-2 teams over all 2-3 teams regardless of what rank they are in the pool */
  RecordThanPPB = 'RecordThanPPB',
}

interface IWildCardAdvancementRule {
  /** Which tier (pool position) in the next phase do we move teams to? */
  tier: number;
  /** How many teams (across all pools) advance to this tier via wild card? */
  numberOfTeams: number;
}

export interface IQbjPhase extends IQbjObject {
  /** The name of the phase, such as "Preliminary Rounds" or "Playoffs" */
  name: string;
  /** A description of the phase. Might contain information like how teams are split into pools, etc */
  description?: string;
  /** Rounds this phase encompasses */
  rounds?: IQbjRound[];
  /** Pools teams are grouped into for this phase */
  pools?: IQbjPool[];
  /** Whether teams may trade cards during this phase */
  cardsTraded?: boolean;
}

/** Pool object as written to a .yft file */
export interface IYftFilePhase extends IQbjPhase, IYftFileObject {
  YfData: IPhaseExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IPhaseExtraData {
  phaseType: PhaseTypes;
  code: string;
  wildCardAdvancementRules?: IWildCardAdvancementRule[];
  wildCardRankingMethod?: WildCardRankingMethod;
  topWildCardSeed?: number;
  forceNumericRounds?: boolean;
}

export class Phase implements IQbjPhase, IYftDataModelObject {
  name: string = '';

  description: string = '';

  /** Is this phase prelims, playoffs, etc */
  phaseType: PhaseTypes;

  /** Code to help users understand the order of phases: 1, 2, 2A, etc. */
  code: string = '';

  /** The number of tiers. Should be consistent with the position property of the pools in this phase */
  // tiers: number = 1;

  rounds: Round[];

  pools: Pool[] = [];

  /** If this is a tiebreaker or final, give its rounds numeric names. For a tournament where Prelims are 1-5,
   *  tiebreaker is 6, and playoffs start in round 7, this property would be true for the tiebreaker phase. If instead
   *  playoffs started round 6, this property would be false and the tiebreaker round would be non-numeric.
   */
  forceNumericRounds?: boolean;

  /** How do we use wild cards to populate different tiers in the next phase? Empty array means no wildcards. */
  wildCardAdvancementRules: IWildCardAdvancementRule[] = [];

  /** How do we rank wild card teams to determine who has priority? */
  wildCardRankingMethod: WildCardRankingMethod = WildCardRankingMethod.RankThenPPB;

  get id(): string {
    return `Phase_${this.name}`;
  }

  constructor(type: PhaseTypes, firstRound: number, lastRound: number, code: string, name?: string) {
    this.phaseType = type;
    this.name = name || defaultPhaseName(type);
    this.rounds = [];
    this.code = code;
    for (let i = firstRound; i <= lastRound; i++) {
      let roundName: string | undefined;
      if (type === PhaseTypes.Tiebreaker || type === PhaseTypes.Finals) roundName = this.name;
      this.rounds.push(new Round(i, roundName));
    }
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPhase {
    const qbjObject: IQbjPhase = {
      name: this.name,
      description: this.description || undefined,
      rounds: this.rounds.map((rd) => rd.toFileObject(qbjOnly)),
      pools: this.pools.map((pool) => pool.toFileObject(qbjOnly)),
    };

    if (isTopLevel) qbjObject.type = QbjTypeNames.Phase;
    if (isReferenced) qbjObject.id = this.id;

    if (qbjOnly) return qbjObject;

    const yfData: IPhaseExtraData = {
      phaseType: this.phaseType,
      code: this.code,
      wildCardAdvancementRules: this.wildCardAdvancementRules,
      wildCardRankingMethod: this.wildCardRankingMethod,
      forceNumericRounds: this.forceNumericRounds,
    };
    const yftFileObj = { YfData: yfData, ...qbjObject };

    return yftFileObj;
  }

  toRefPointer() {
    return makeQbjRefPointer(this.id);
  }

  /** Is this a normal prelim/playoff phase? */
  isFullPhase() {
    return this.phaseType === PhaseTypes.Prelim || this.phaseType === PhaseTypes.Playoff;
  }

  usesNumericRounds() {
    return this.isFullPhase() || this.forceNumericRounds;
  }

  /** The lowest round number contained in this phase, or 0 if it contains no rounds */
  firstRoundNumber() {
    return this.rounds[0]?.number || 0;
  }

  /** The highest round number contained in this phase, or 0 if it contains no rounds */
  lastRoundNumber(): number {
    return this.rounds[this.rounds.length - 1]?.number || 0;
  }

  firstRoundNumberWithGames() {
    if (this.rounds.length === 0) return undefined;

    for (let i = 0; i < this.rounds.length; i++) {
      if (this.rounds[i].anyMatchesExist()) return this.rounds[i].number;
    }
    return undefined;
  }

  lastRoundNumberWithGames() {
    if (this.rounds.length === 0) return undefined;

    for (let i = this.rounds.length - 1; i >= 0; i--) {
      if (this.rounds[i].anyMatchesExist()) return this.rounds[i].number;
    }
    return undefined;
  }

  /** Adjust round numbers so that they start at the given number and go up from there */
  reassignRoundNumbers(startingRound: number) {
    let curRoundNo = startingRound;
    for (const rd of this.rounds) {
      rd.number = curRoundNo;
      curRoundNo++;
    }
  }

  /** Set this phase's rounds to be from firstRound to lastRound. Existing rounds within this range are preserved; others are discarded.
   *  Caller is responsible for determining that this is safe to do.
   */
  setRoundRange(firstRound: number, lastRound: number) {
    const newRoundArray: Round[] = [];
    let curRequestedRound = firstRound;
    for (const rd of this.rounds) {
      if (rd.number > lastRound) break;

      if (rd.number > curRequestedRound) {
        for (let i = curRequestedRound; i < rd.number; i++) {
          newRoundArray.push(new Round(i));
        }
      }
      newRoundArray.push(rd);
      curRequestedRound = rd.number + 1;
    }
    for (let i = curRequestedRound; i <= lastRound; i++) {
      newRoundArray.push(new Round(i));
    }
    this.rounds = newRoundArray;
  }

  /** Do any pools have errors that need to be corrected right now? */
  anyPoolErrors() {
    for (const p of this.pools) {
      if (p.sizeValidationError) return true;
    }
    return false;
  }

  /** Add a pool with default info, to be customized by the user */
  addBlankPool() {
    const size = this.defaultSizeForBlankPool();
    const tier = this.lowestPoolTier() + 1;
    if (!this.findPoolByName('New Pool')) {
      this.pools.push(new Pool(size, tier, 'New Pool'));
      return;
    }
    for (let i = 2; i < 100; i++) {
      const defaultName = `New Pool ${i}`;
      if (!this.findPoolByName(defaultName)) {
        this.pools.push(new Pool(size, tier, defaultName));
        return;
      }
    }
    this.pools.push(new Pool(size, tier, 'New Pool'));
  }

  /** Find a resonable size to use as the default for the next new pool the user adds */
  private defaultSizeForBlankPool() {
    if (this.pools.length === 0) return 4;

    const existingPoolsSize = this.pools[0].size;
    for (let i = 1; i < this.pools.length; i++) {
      if (this.pools[i].size !== existingPoolsSize) return 4;
    }
    return existingPoolsSize;
  }

  private lowestPoolTier() {
    return this.pools.map((p) => p.position).reduce((maxSoFar, currVal) => Math.max(maxSoFar, currVal), 0);
  }

  /**
   * Remove a pool. Caller is responsible for determining whether that's safe
   * @param pool pool to delete
   * @param resetTiers whether to reassign tier/position numbers. Ignored if this isn't a playoff phase.
   */
  deletePool(pool: Pool, resetTiers: boolean = false) {
    this.pools = this.pools.filter((p) => p !== pool);
    if (resetTiers && this.phaseType === PhaseTypes.Playoff) {
      this.resetTiers();
    }
  }

  /** Delete all teams from this phase's pools */
  resetPools() {
    for (const pool of this.pools) {
      pool.clearTeams();
    }
  }

  addSeededTeam(team: Team, seed: number) {
    const poolWithSeed = this.findPoolWithSeed(seed);
    if (poolWithSeed) {
      poolWithSeed.addTeam(team);
    }
  }

  /** If not using seeds, put a time in the first available pool */
  addUnseededTeam(team: Team) {
    for (const pool of this.pools) {
      if (pool.poolTeams.length < pool.size) {
        pool.addTeam(team);
        return;
      }
    }
  }

  setTeamList(seededTeams: Team[]) {
    this.resetPools();
    let curSeed = 1;
    for (const team of seededTeams) {
      this.addSeededTeam(team, curSeed++);
    }
  }

  findPoolWithSeed(seed: number): Pool | undefined {
    for (const pool of this.pools) {
      if (pool.seeds.includes(seed)) return pool;
    }
    return undefined;
  }

  findPoolWithTeam(team: Team): Pool | undefined {
    for (const pool of this.pools) {
      if (pool.includesTeam(team)) return pool;
    }
    return undefined;
  }

  findPoolByName(name: string) {
    return this.pools.find((p) => p.name === name);
  }

  hasWildCards() {
    return this.wildCardAdvancementRules.length > 0;
  }

  getTierThatWCSeedAdvancesTo(seed: number) {
    if (!this.hasWildCards()) return undefined;
    const wcRank = seed - this.getTopWildCardSeed() + 1;
    let count = 0;
    for (const oneRule of this.wildCardAdvancementRules) {
      count += oneRule.numberOfTeams;
      if (count >= wcRank) return oneRule.tier;
    }
    return undefined;
  }

  /** Starting with this seed, seeding for the next phase is determined cross-pool rather than ranks in a specific
   *  pool guaranteeing advancement to a specific place.
   */
  getTopWildCardSeed() {
    if (!this.hasWildCards()) return 0;
    let numAutoAdv = 0;
    for (const pool of this.pools) {
      numAutoAdv += sumReduce(pool.autoAdvanceRules.map((r) => r.ranksThatAdvance.length));
    }
    return numAutoAdv + 1;
  }

  teamsAreInSamePool(team1: Team, team2: Team) {
    return !!this.getSharedPool(team1, team2);
  }

  /** Have any teams been assigned to any pool in this phase yet? */
  anyTeamsAssigned() {
    for (const pool of this.pools) {
      if (pool.hasAnyTeams()) return true;
    }
    return false;
  }

  /** Do we potentially need to carry over matches from previous phases between these teams? */
  shouldLookForCarryover(team1: Team, team2: Team) {
    const sharedPool = this.getSharedPool(team1, team2);
    if (!sharedPool) return false;
    return sharedPool.hasCarryover;
  }

  /** if the two teams are in the same pool, return that pool */
  private getSharedPool(team1: Team, team2: Team) {
    const pool1 = this.findPoolWithTeam(team1);
    const pool2 = this.findPoolWithTeam(team2);
    if (!pool1 || !pool2) return undefined;
    if (pool1 === pool2) return pool1;
    return undefined;
  }

  /** Do any pools in this phase carry over matches from the previous one? */
  hasAnyCarryover() {
    return !!this.pools.find((pool) => pool.hasCarryover);
  }

  getAllMatches(): Match[] {
    return this.rounds.map((rd) => rd.matches).flat();
  }

  /** Get the matches carried over from this phase to the given playoff phase */
  getCarryoverMatches(playoffPhase: Phase) {
    return this.rounds.map((rd) => rd.getCarryoverMatches(playoffPhase)).flat();
  }

  /** Find the matches that involve at least one team in the given pool. If no pool is passed, all matches are returned */
  getMatchesForPool(pool?: Pool) {
    const allMatches = this.getAllMatches();
    if (!pool) return allMatches;
    return allMatches.filter((match) => pool.matchIsRelevant(match));
  }

  teamHasPlayedAnyMatches(team: Team) {
    for (const rd of this.rounds) {
      if (rd.teamHasPlayedIn(team)) return true;
    }
    return false;
  }

  anyMatchesExist() {
    for (const rd of this.rounds) {
      if (rd.anyMatchesExist()) return true;
    }
    return false;
  }

  getPlayersWithData(team: Team) {
    const players: Player[] = [];
    for (const rd of this.rounds) {
      const inThisRound = rd.getPlayersWithData(team);
      inThisRound.forEach((player) => {
        if (!players.includes(player)) players.push(player);
      });
    }
    return players;
  }

  removeTeam(team: Team) {
    const poolWithTeam = this.findPoolWithTeam(team);
    if (poolWithTeam) {
      poolWithTeam.removeTeam(team);
    }
  }

  includesRound(round: Round): boolean {
    return this.rounds.includes(round);
  }

  includesRoundNumber(roundNo: number): boolean {
    return this.getRound(roundNo) !== undefined;
  }

  getRound(roundNo: number): Round | undefined {
    return this.rounds.find((rd) => rd.number === roundNo);
  }

  /**
   * Find a match between teams in this phase. Does NOT look at carryvoer -- use findMatchBetweenTeamsWithCarryOver
   * @param team1 One team
   * @param team2 The other team
   * @param nthMatch Pass 2 to find the 2nd match between these teams, etc.
   */
  findMatchBetweenTeams(team1: Team, team2: Team, nthMatch: number = 1) {
    let numFound = 0;
    for (const round of this.rounds) {
      let exitRound = false;
      let matchesThisRound = 0;
      let matchFound;
      while (!exitRound && numFound < nthMatch) {
        matchFound = round.findMatchBetweenTeams(team1, team2, matchesThisRound + 1);
        if (!matchFound) {
          exitRound = true;
        } else {
          numFound++;
          matchesThisRound++;
        }
      }
      if (numFound >= nthMatch) return matchFound;
    }
    return undefined;
  }

  /** Find a match in this phase that carries over to the given subsequent phase */
  findMatchBetweenTeamsWithCarryOver(team1: Team, team2: Team, carryoverPhase: Phase) {
    for (const round of this.rounds) {
      const match = round.findMatchBetweenTeams(team1, team2);
      if (match && match.carryoverPhases.includes(carryoverPhase)) {
        return match;
      }
    }
    return undefined;
  }

  getRoundOfMatch(match: Match) {
    for (const round of this.rounds) {
      if (round.matches.includes(match)) return round;
    }
    return undefined;
  }

  deleteMatch(match: Match, roundNo: number) {
    const round = this.getRound(roundNo);
    if (!round) return;
    round.matches = round.matches.filter((m) => m !== match);
  }

  clearCarryoverPhase(team: Team, playoffPhase: Phase) {
    for (const rd of this.rounds) {
      for (const match of rd.findMatchesWithTeam(team)) {
        match.removeCarryoverPhase(playoffPhase);
      }
    }
  }

  /** Explicitly not that this team doesn't move to the next phase */
  markTeamDidNotAdvance(team: Team, val: boolean) {
    for (const pool of this.pools) {
      const pt = pool.getPoolTeam(team);
      if (pt) {
        pt.didNotAdvance = val;
        return;
      }
    }
  }

  reorderPools(positionDragged: number, positionDroppedOn: number) {
    if (
      positionDragged === positionDroppedOn ||
      positionDragged < 0 ||
      positionDragged >= this.pools.length ||
      positionDroppedOn < 0 ||
      positionDroppedOn > this.pools.length
    ) {
      return;
    }

    const [poolToMove] = this.pools.splice(positionDragged, 1);
    this.pools.splice(positionDroppedOn, 0, poolToMove);
  }

  /** Discard information that we only want to track if we're using a schedule template */
  unlockCustomSchedule() {
    this.wildCardAdvancementRules = [];
    for (const p of this.pools) {
      p.unlockCustomSchedule();
    }
    if (this.phaseType === PhaseTypes.Playoff) {
      this.resetTiers();
    }
  }

  private resetTiers() {
    let tier = 1;
    for (const p of this.pools) {
      p.position = tier++;
    }
  }
}

/**
 * A round-robin phase for a tournament where it's just one big round robin pool
 */
export function simpleRoundRobinPrelims(numTeams: number, numRRs: number, autoQualChunks?: number[]) {
  const rrPool = new Pool(numTeams, 1, 'Round Robin', false, 1, numTeams);
  rrPool.roundRobins = numRRs;
  if (autoQualChunks) setAutoAdvanceRules(rrPool, autoQualChunks);

  const numRounds = numRRs * (numTeams - (1 - (numTeams % 2)));
  const roundRobin = new Phase(PhaseTypes.Prelim, 1, numRounds, '1', 'Round Robin');
  roundRobin.pools = [rrPool];
  return roundRobin;
}
