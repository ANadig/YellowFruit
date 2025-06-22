import { teamGetNameAndLetter, versionLt } from '../Utils/GeneralUtils';
import AnswerType from './AnswerType';
import { ValidationStatuses } from './Interfaces';
import { Match, StatsValidity } from './Match';
import { Phase, PhaseTypes } from './Phase';
import { Player } from './Player';
import { Pool } from './Pool';
import Registration from './Registration';
import { ScoringRules } from './ScoringRules';
import { Team } from './Team';
import Tournament from './Tournament';

/**
 * How powers are scored
 */
enum PowerRule {
  Twenty = '20pts',
  Fifteen = '15pts',
  None = 'none',
}

interface IOldYfMetaData {
  version: string;
}

interface IOldYfTournamentSettings {
  powers: PowerRule; // powers setting
  negs: boolean; // whether to user negs
  bonuses: boolean; // whether there are bonuses
  bonusesBounce: boolean; // whether bonuses have bouncebacks
  lightning: boolean; // whether there are lightning rounds
  playersPerTeam: number; // how many players per team play at one time
  defaultPhases: string[]; // Used to group teams when viewing all games
  rptConfig: string; // report configuration to use for the stat report
  /** Deprecated */
  defaultPhase?: string;
}

/**
 * A list of packets indexed by round number
 */
interface IOldYfPackets {
  [round: number]: string;
}

/**
 * The phase/divisions structure of a tournament
 */
interface IOldYfPhases {
  [phaseName: string]: string[]; // index the list of divisions in a phase by that phase's name
}

/**
 * Information for a single team
 */
interface IOldYfTeam {
  teamName: string;
  teamUGStatus: boolean;
  teamD2Status: boolean;
  smallSchool: boolean;
  jrVarsity: boolean;
  rank: number; // the overall rank manually specified by the user
  roster: TeamRoster;
  divisions: { [phase: string]: string }; // the divisions the team belongs to, indexed by phase
}

/**
 * Demographic information about a single player
 */
interface PlayerDemogs {
  year: string;
  undergrad: boolean;
  div2: boolean;
}

/**
 * The list of players on one team, indexed by player name
 */
interface TeamRoster {
  [playerName: string]: PlayerDemogs;
}

/**
 * Information for a single match.
 */
interface IOldYfGame {
  invalid?: boolean; // whether the game has valid data and can be fully used for statistics
  validationMsg?: string; // warning or error message about this game's data
  round?: number; // the round number
  phases: string[]; // list of phases this match belongs to
  tuhtot: number; // total number of tossups read, including overtime
  ottu: number; // total number of tossups read in overtime
  forfeit?: boolean; // if true, team1 defeats teawm2 by forfeit
  team1: string; // name of team
  team2: string; // name of team
  score1: number; // team1's total points
  score2: number; // team2's total points
  otPwr1: number; // team1's powers in overtime
  otPwr2: number; // team2's powers in overtime
  otTen1: number; // team1's tens in overtime
  otTen2: number; // team2's tens in overtime
  otNeg1: number; // team1's negs in overtime
  otNeg2: number; // team2's negs in overtime
  bbPts1: number; // team1's bounceback points
  bbPts2: number; // team2's bounceback points
  notes?: string; // free-text notes about the game
  tiebreaker: boolean; // whether the game was a tiebreaker
  lightningPts1: number; // lightning round points for team1
  lightningPts2: number; // lightning round points for team2
  players1: TeamGameLine; // team1's players' stats
  players2: TeamGameLine; // team2's players' stats
}

/**
 * One team's tossup stats for one game, indexed by player name
 */
interface TeamGameLine {
  [playerName: string]: PlayerLine; // index each player's stats by their name
}

/**
 * One player's stats for one game
 */
interface PlayerLine {
  tuh: number; // tossups heard
  powers: number;
  tens: number;
  negs: number;
}

export function isOldYftFile(fileContents: string) {
  if (fileContents.search(/^\{"version":"\d+\.\d+\.\d+"\}/) === 0) return true; // matches {"version":"1.2.3"} at the beginning of the file
  if (fileContents.search(/^\{.*"powers":.*\}/) === 0) return true; // very old files start with the settings object
  return false;
}

export function parseOldYfFile(fileContents: string) {
  const filePieces = getOldYfFilePieces(fileContents);

  const oldYfMetaData = JSON.parse(filePieces[0]) as IOldYfMetaData;
  const oldYfPackets = JSON.parse(filePieces[1]) as IOldYfPackets;
  const oldYfSettings = JSON.parse(filePieces[2]) as IOldYfTournamentSettings;
  const oldYfPhases = JSON.parse(filePieces[3]) as IOldYfPhases;
  const oldYfTeams = JSON.parse(filePieces[4]) as IOldYfTeam[];
  const oldYfGames = JSON.parse(filePieces[5]) as IOldYfGame[];

  if (!oldYfMetaData?.version) {
    throw new Error('Unrecognized file format.');
  }

  if (versionLt('3.0.2', oldYfMetaData.version)) {
    throw new Error('This file has an unsupported version number.');
  }

  oldYfConversions(oldYfMetaData.version, oldYfSettings, oldYfTeams, oldYfGames);

  const yfTourn = new Tournament();
  yfTourn.scoringRules = parseSettings(oldYfSettings);
  parseTeams(yfTourn, oldYfTeams);
  yfTourn.phases = parsePhaseStructure(yfTourn, oldYfPhases, oldYfGames, oldYfTeams);
  parsePackets(yfTourn, oldYfPackets);
  parseGames(yfTourn, oldYfGames);

  getAttributesToTrack(yfTourn, oldYfTeams);
  return yfTourn;
}

function getOldYfFilePieces(fileContents: string) {
  // compatibility with oldest file format. Who knows why I thought this was necessary
  let fullFileString = fileContents;
  for (let i = 1; i <= 3; i++) {
    fullFileString = fullFileString.replace('divider_between_sections\n', '');
  }
  const jsonAry = fullFileString.split('\n', 6);
  if (jsonAry.length < 5) {
    // versions prior to 2.0.0 don't have metadata or packet names
    return [JSON.stringify({ version: '1.9.9' }), '{}'].concat(jsonAry);
  }
  return jsonAry;
}

function parseSettings(oldYfSettings: IOldYfTournamentSettings) {
  const scoringRules = new ScoringRules();
  scoringRules.answerTypes = [];
  if (oldYfSettings.powers === PowerRule.Twenty) scoringRules.answerTypes.push(new AnswerType(20));
  if (oldYfSettings.powers === PowerRule.Fifteen) scoringRules.answerTypes.push(new AnswerType(15));
  scoringRules.answerTypes.push(new AnswerType(10));
  if (oldYfSettings.negs) scoringRules.answerTypes.push(new AnswerType(-5));

  scoringRules.setUseBonuses(oldYfSettings.bonuses);
  scoringRules.bonusesBounceBack = oldYfSettings.bonuses && oldYfSettings.bonusesBounce;
  scoringRules.lightningCountPerTeam = oldYfSettings.lightning ? 1 : 0;
  scoringRules.maximumPlayersPerTeam = oldYfSettings.playersPerTeam;

  return scoringRules;
}

function parseTeams(tourn: Tournament, oldYfTeams: IOldYfTeam[]) {
  for (const team of oldYfTeams) {
    const [regName, letter] = teamGetNameAndLetter(team.teamName);
    const existingRegistration = tourn.findRegistration(regName);
    const newTeam = new Team(team.teamName);
    newTeam.letter = letter;
    newTeam.isJV = team.jrVarsity;
    newTeam.isUG = team.teamUGStatus;
    newTeam.isD2 = team.teamD2Status;
    // eslint-disable-next-line guard-for-in
    for (const playerName in team.roster) {
      const newPlayer = new Player(playerName);
      const demogs = team.roster[playerName];
      newPlayer.yearString = demogs.year;
      newPlayer.isUG = demogs.undergrad;
      newPlayer.isD2 = demogs.div2;

      newTeam.players.push(newPlayer);
    }

    if (existingRegistration) {
      existingRegistration.addTeam(newTeam);
    } else {
      const newReg = new Registration(regName, newTeam);
      newReg.isSmallSchool = team.smallSchool;
      tourn.addRegistration(newReg);
    }
  }
}

/** Figure out which phases exist and what rounds they encompass */
function parsePhaseStructure(
  tourn: Tournament,
  oldYfPhases: IOldYfPhases,
  oldYfGames: IOldYfGame[],
  oldYfTeams: IOldYfTeam[],
) {
  const maxRoundNumber = findMaxRoundNumber(oldYfGames);
  let prelimPhaseName = findPrelimPhase(oldYfGames);
  const newPhaseList: Phase[] = [];
  let phaseCode = 0;
  // eslint-disable-next-line guard-for-in
  for (const phaseName in oldYfPhases) {
    if (!prelimPhaseName) prelimPhaseName = phaseName;

    const phaseType = phaseName === prelimPhaseName ? PhaseTypes.Prelim : PhaseTypes.Playoff;
    phaseCode++;
    const [firstRound, lastRound] = findPhaseRoundRange(phaseName, oldYfGames, maxRoundNumber);
    if (firstRound === -1) continue;

    const newPhase = new Phase(phaseType, firstRound, lastRound, phaseCode.toString(), phaseName);
    for (const divisionName of oldYfPhases[phaseName]) {
      const teamsInPool = getTeamsInDivision(phaseName, divisionName, oldYfTeams);
      const newPool = new Pool(teamsInPool.length, 1, divisionName, true); // just let everything allow carryover... I don't think we can reliably figure that out
      for (const team of teamsInPool) {
        const yfTeam = tourn.findTeamByName(team.teamName);
        if (yfTeam) newPool.addTeam(yfTeam);
      }
      newPhase.pools.push(newPool);
    }
    if (newPhase.pools.length === 0) {
      newPhase.pools.push(new Pool(99, 1, 'New Pool', true));
    }
    newPhaseList.push(newPhase);
  }
  return newPhaseList;
}

/** Guess at what the prelim phase is based on what phase round 1 games are in */
function findPrelimPhase(oldYfGames: IOldYfGame[]) {
  for (const g of oldYfGames) {
    if (g.round === 1 && g.phases.length === 1) {
      return g.phases[0];
    }
  }
  return undefined;
}

function findPhaseRoundRange(phaseName: string, oldYfGames: IOldYfGame[], maxRound: number) {
  let firstRound = 9999;
  let lastRound = 0;
  for (let round = 0; round <= maxRound; round++) {
    const gamesInThisRound = oldYfGames.filter((g) => g.round === round);
    const gamesInPhase = gamesInThisRound.filter((g) => g.phases.includes(phaseName));
    if (gamesInPhase.length > gamesInThisRound.length / 2) {
      if (round < firstRound) firstRound = round;
      if (round > lastRound) lastRound = round;
    }
  }
  if (lastRound === 0) return [-1, -1];

  return [firstRound, lastRound];
}

function getTeamsInDivision(phaseName: string, divName: string, oldYfTeams: IOldYfTeam[]) {
  return oldYfTeams.filter((tm) => tm.divisions[phaseName] === divName);
}

function findMaxRoundNumber(oldYfGames: IOldYfGame[]) {
  let maxRound = 1;
  for (const g of oldYfGames) {
    if (g.round && g.round > maxRound) maxRound = g.round;
  }
  return maxRound;
}

function parsePackets(tourn: Tournament, oldYfPackets: IOldYfPackets) {
  // eslint-disable-next-line guard-for-in
  for (const roundNo in oldYfPackets) {
    const yfRound = tourn.getRoundObjByNumber(parseInt(roundNo, 10));
    if (yfRound) yfRound.packet.name = oldYfPackets[roundNo];
  }
}

function parseGames(tourn: Tournament, oldYfGames: IOldYfGame[]) {
  for (const g of oldYfGames) {
    const roundNo = g.round;
    if (!roundNo) continue;

    const yfRound = tourn.getRoundObjByNumber(roundNo);
    if (!yfRound) continue;

    const mainPhase = tourn.findPhaseByRound(yfRound);
    if (!mainPhase) continue;

    const carryOverPhases = g.phases
      .filter((phName) => phName !== mainPhase?.name)
      .map((phName) => tourn.findPhaseByName(phName))
      .filter((ph) => ph !== undefined);
    const leftTeam = tourn.findTeamByName(g.team1);
    const rightTeam = tourn.findTeamByName(g.team2);
    if (!leftTeam || !rightTeam) continue;

    if (!tourn.findPoolWithTeam(leftTeam, yfRound)) {
      addTeamToAbritraryPool(leftTeam, tourn, mainPhase);
    }
    if (!tourn.findPoolWithTeam(rightTeam, yfRound)) {
      addTeamToAbritraryPool(rightTeam, tourn, mainPhase);
    }

    const newMatch = new Match(leftTeam, rightTeam, tourn.scoringRules.answerTypes);
    newMatch.carryoverPhases = carryOverPhases;
    newMatch.tossupsRead = g.tuhtot;
    newMatch.overtimeTossupsRead = g.ottu;
    newMatch.tiebreaker = g.tiebreaker;
    newMatch.notes = g.notes;

    const leftMatchTeam = newMatch.getMatchTeam('left');
    const rightMatchTeam = newMatch.getMatchTeam('right');

    if (g.forfeit) rightMatchTeam.forfeitLoss = true;
    leftMatchTeam.points = g.score1;
    rightMatchTeam.points = g.score2;
    leftMatchTeam.bonusBouncebackPoints = g.bbPts1;
    rightMatchTeam.bonusBouncebackPoints = g.bbPts2;
    leftMatchTeam.lightningPoints = g.lightningPts1;
    rightMatchTeam.lightningPoints = g.lightningPts2;

    // eslint-disable-next-line guard-for-in
    for (const playerName in g.players1) {
      const yfPlayer = leftTeam.findPlayerByName(playerName);
      if (!yfPlayer) continue;

      const playerLine = g.players1[playerName];
      const yfMP = leftMatchTeam.matchPlayers.find((mp) => mp.player === yfPlayer);
      if (!yfMP) continue;

      yfMP.tossupsHeard = playerLine.tuh;
      yfMP.answerCounts.find((pac) => pac.answerType.value > 10)?.addToCount(playerLine.powers);
      yfMP.answerCounts.find((pac) => pac.answerType.value === 10)?.addToCount(playerLine.tens);
      yfMP.answerCounts.find((pac) => pac.answerType.value === -5)?.addToCount(playerLine.negs);
    }
    // eslint-disable-next-line guard-for-in
    for (const playerName in g.players2) {
      const yfPlayer = rightTeam.findPlayerByName(playerName);
      if (!yfPlayer) continue;

      const playerLine = g.players2[playerName];
      const yfMP = rightMatchTeam.matchPlayers.find((mp) => mp.player === yfPlayer);
      if (!yfMP) continue;

      yfMP.tossupsHeard = playerLine.tuh;
      yfMP.answerCounts.find((pac) => pac.answerType.value > 10)?.addToCount(playerLine.powers);
      yfMP.answerCounts.find((pac) => pac.answerType.value === 10)?.addToCount(playerLine.tens);
      yfMP.answerCounts.find((pac) => pac.answerType.value === -5)?.addToCount(playerLine.negs);
    }

    const leftOtBuzzes = leftMatchTeam.overTimeBuzzes;
    leftOtBuzzes.find((pac) => pac.answerType.value > 10)?.addToCount(g.otPwr1);
    leftOtBuzzes.find((pac) => pac.answerType.value === 10)?.addToCount(g.otTen1);
    leftOtBuzzes.find((pac) => pac.answerType.value === -5)?.addToCount(g.otNeg1);
    const rightOtBuzzes = leftMatchTeam.overTimeBuzzes;
    rightOtBuzzes.find((pac) => pac.answerType.value > 10)?.addToCount(g.otPwr2);
    rightOtBuzzes.find((pac) => pac.answerType.value === 10)?.addToCount(g.otTen2);
    rightOtBuzzes.find((pac) => pac.answerType.value === -5)?.addToCount(g.otNeg2);

    yfRound.addMatch(newMatch);
    newMatch.validateAll(tourn.scoringRules);
    if (newMatch.getOverallValidationStatus() === ValidationStatuses.Error) {
      newMatch.statsValidity = StatsValidity.omit;
    }
  }
}

/** Figure out whether we should actually show SS, JV status, etc. */
function getAttributesToTrack(tourn: Tournament, oldYfTeams: IOldYfTeam[]) {
  tourn.trackPlayerYear = false;
  for (const t of oldYfTeams) {
    if (t.smallSchool) tourn.trackSmallSchool = true;
    if (t.jrVarsity) tourn.trackJV = true;
    if (t.teamUGStatus) tourn.trackUG = true;
    if (t.teamD2Status) tourn.trackDiv2 = true;

    if (!tourn.trackPlayerYear) {
      for (const p in t.roster) {
        if (t.roster[p].year !== '') tourn.trackPlayerYear = true;
      }
    }
  }
}

/** Find or make a pool to put this team in. Necessary because old versions don't actually require that you make pools */
function addTeamToAbritraryPool(team: Team, tourn: Tournament, phase: Phase) {
  for (const pool of phase.pools) {
    if (pool.poolTeams.length < pool.size) {
      pool.addTeam(team);
      return;
    }
  }
  const newPool = new Pool(99, 1, 'New Pool', true);
  newPool.addTeam(team);
  phase.pools.push(newPool);
}

/** Get the file to the YF 3.0.2 format from even older versions */
function oldYfConversions(
  version: string,
  oldYfSettings: IOldYfTournamentSettings,
  oldYfTeams: IOldYfTeam[],
  oldYfGames: IOldYfGame[],
) {
  // if coming from 2.0.4 or earlier, there's no default phase
  if (oldYfSettings.defaultPhase === undefined) {
    oldYfSettings.defaultPhases = [];
  } else {
    if (versionLt(version, '2.4.0')) {
      settingsConversion2x4x0(oldYfSettings);
    }
    if (versionLt(version, '2.5.0')) {
      settingsConversion2x5x0(oldYfSettings);
    }
  }

  // convert teams and games to new data structures
  if (versionLt(version, '2.1.0')) {
    teamConversion2x1x0(oldYfTeams);
  }
  if (versionLt(version, '2.2.0')) {
    teamConversion2x2x0(oldYfTeams);
  }
  if (versionLt(version, '2.3.0')) {
    teamConversion2x3x0(oldYfTeams);
  }
  if (versionLt(version, '2.4.0')) {
    gameConversion2x4x0(oldYfGames);
  }
  if (versionLt(version, '2.5.0')) {
    gameConversion2x5x0(oldYfGames);
  }
  if (versionLt(version, '2.5.2')) {
    gameConversion2x5x2(oldYfGames);
  }
  if (versionLt(version, '3.0.0')) {
    gameConversion3x0x0(oldYfGames);
  }
}

/**
 * conversion on team data structure (version 2.1.0). Changes rosters from arrays of
 * strings to arrays of objects with the year property
 * @param  loadTeams list of teams
 */
function teamConversion2x1x0(loadTeams: any) {
  // eslint-disable-next-line guard-for-in
  for (const i in loadTeams) {
    const curTeam = loadTeams[i];
    const rosterObj: any = {};
    // eslint-disable-next-line guard-for-in
    for (const j in curTeam.roster) {
      rosterObj[curTeam.roster[j]] = { year: '' };
    }
    curTeam.roster = rosterObj;
  }
}

/**
 * conversion on team data structure (version 2.2.0). Adds the team-level UG and D2
 * properties, and adds the division 2 property to each player
 * @param  loadTeams list of teams
 */
function teamConversion2x2x0(loadTeams: IOldYfTeam[]) {
  // eslint-disable-next-line guard-for-in
  for (const i in loadTeams) {
    const curTeam = loadTeams[i];
    curTeam.teamUGStatus = false;
    curTeam.teamD2Status = false;
    // eslint-disable-next-line guard-for-in
    for (const player in curTeam.roster) {
      curTeam.roster[player].div2 = false;
      curTeam.roster[player].undergrad = false;
    }
  }
}

/**
 * conversion on team data structure (version 2.3.0). Adds the team-level small school
 * and JV properties
 * @param  loadTeams list of teams
 */
function teamConversion2x3x0(loadTeams: IOldYfTeam[]) {
  // eslint-disable-next-line guard-for-in
  for (const i in loadTeams) {
    const curTeam = loadTeams[i];
    curTeam.smallSchool = false;
    curTeam.jrVarsity = false;
  }
}

/**
 * conversion on settings data structure (version 2.4.0). convert default phase to
 * an array of phases
 * @param  settings (old) tournament settings object
 */
function settingsConversion2x4x0(settings: any) {
  if (settings.defaultPhase === 'noPhase') {
    settings.defaultPhases = [];
  } else {
    settings.defaultPhases = [settings.defaultPhase];
  }
  delete settings.defaultPhase;
}

/**
 * conversion on games data structure (version 2.4.0). Add tiebreaker property
 * @param  games list of games
 */
function gameConversion2x4x0(games: IOldYfGame[]) {
  // eslint-disable-next-line guard-for-in
  for (const i in games) {
    games[i].tiebreaker = false;
  }
}

/**
 * conversion on settings data structure (version 2.5.0). Split bonus setting into two
 * booleans, converg negs setting from string to boolean, and set lightning round setting.
 * @param  settings settings object
 */
function settingsConversion2x5x0(settings: any) {
  settings.bonusesBounce = settings.bonuses === 'yesBb';
  settings.bonuses = settings.bonuses !== 'none';
  settings.negs = settings.negs === 'yes';
  settings.lightning = false;
}

/**
 * conversion on games data structure (version 2.5.0). Add lightning round properties
 * @param  games list of games
 */
function gameConversion2x5x0(games: any) {
  // eslint-disable-next-line guard-for-in
  for (const i in games) {
    games[i].lightningPts1 = '';
    games[i].lightningPts2 = '';
  }
}

/**
 * Change numeric fields to be numbers
 * @param  games list of games
 */
function gameConversion2x5x2(games: any) {
  for (const g of games) {
    g.round = +g.round;
    g.tuhtot = +g.tuhtot;
    g.ottu = +g.ottu;
    g.score1 = +g.score1;
    g.score2 = +g.score2;
    g.otPwr1 = +g.otPwr1;
    g.otPwr2 = +g.otPwr2;
    g.otTen1 = +g.otTen1;
    g.otTen2 = +g.otTen2;
    g.otNeg1 = +g.otNeg1;
    g.otNeg2 = +g.otNeg2;
    g.bbPts1 = +g.bbPts1;
    g.bbPts2 = +g.bbPts2;
    g.lightningPts1 = +g.lightningPts1;
    g.lightningPts2 = +g.lightningPts2;

    // eslint-disable-next-line guard-for-in
    for (const p in g.players1) {
      const line = g.players1[p];
      line.tuh = +line.tuh;
      line.powers = +line.powers;
      line.tens = +line.tens;
      line.negs = +line.negs;
    }
    // eslint-disable-next-line guard-for-in
    for (const p in g.players2) {
      const line = g.players2[p];
      line.tuh = +line.tuh;
      line.powers = +line.powers;
      line.tens = +line.tens;
      line.negs = +line.negs;
    }
  }
}

/**
 * Add a new game property
 * @param  games list of games
 */
function gameConversion3x0x0(games: any) {
  for (const g of games) {
    g.validationMsg = '';
  }
}
