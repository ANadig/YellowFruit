  /***********************************************************
StatUtils.ts
Andrew Nadig

code for generating the HTML stats report.
***********************************************************/
import * as _ from 'lodash';
import { YfGame, RptConfig, TournamentSettings, PowerRule, YfTeam, WhichTeam, PlayerLine, PacketList } from './YfTypes';
const TOOLTIPS = {
  smallSchool: 'Small School',
  jrVarsity: 'Junior Varsity',
  teamUG: 'Undergraduate status',
  teamD2: 'Division 2 status',
  ppg: 'Points per game',
  papg: 'Points against per game',
  mrg: 'Average margin of victory',
  pp20: 'Points per 20 tossups heard',
  pap20: 'Points against per 20 tossups heard',
  mrg20: 'Point differential per 20 tossups heard',
  tuh: 'Tossups heard',
  pptuh: 'Points per tossup heard',
  pPerN: 'Powers per neg',
  gPerN: 'Gets (powers + tens) per neg',
  lightning: 'Lightning round points',
  bHeard: 'Bonuses heard',
  bPts: 'Bonus points',
  ppb: 'Points per bonus',
  bbHeard: 'Bouncebacks heard (in 3-part bonus equivalents)',
  bbPts: 'Points scored on bouncebacks',
  ppbb: 'Points per three bounceback parts',
  playerUG: 'Undergraduate status',
  playerD2: 'Division 2 status',
  gamesPlayed: 'Games played',
  round: 'Round No.',
  ppgPerTeam: 'Points per game, per team',
  pp20PerTeam: 'Points per 20 tossups heard, per team',
  tuPtsPTu: 'Average number of points scored on each tossup heard',
  ppLtng: 'Points per lightning round per team',
  phaseRecord: ['Record in the ', ' stage of the tournament. Teams are ranked by this record.']
}

interface TeamStandingsLine {
  teamName:string; rank: number;
  smallSchool: boolean; jrVarsity: boolean;
  teamUGStatus: boolean; teamD2Status: boolean;
  division: string; groupingPhase: string;
  wins: number; losses: number; ties: number; winPct: string;
  phaseWins: number; phaseLosses: number; phaseTies: number;
  phaseWinPct: number; phaseRecord: string;
  ppg: number | string; papg: number | string; margin: number | string;
  pp20: number | string; pap20: number | string; mrg20: number | string;
  powers: number; tens: number; negs: number;
  tuh: number; ppth: number | string;
  pPerN: number | string; gPerN: number | string;
  bHeard: number; bPts: number; ppb: number | string;
  bbHeard: [number, number], bbPts: number; ppbb: number | string;
  lightning: number;
  points: number; ptsAgainst: number;
  forfeits: number;
  otPts: number; otPtsAgainst: number; ottuh: number;
}

interface PlayerStandingsLine {
  playerName: string;
  year: string;
  undergrad: boolean;
  div2: boolean;
  teamName: string;
  division: string;
  gamesPlayed: number | string;
  powers: number;
  tens: number;
  negs: number;
  tuh: number;
  pptu: number | string;
  pPerN: number | string;
  gPerN: number | string;
  points: number;
  ppg: number | string;
  pp20:number | string;
}

interface RoundSummary {
  numberOfGames: number; totalPoints: number;
  tuPts: number; tuh: number;
  bPts: number; bHeard: number;
  bbPts: number; bbHeard: [number, number];
  ppg: number; pp20: number;
  tuPtsPTu: number;
  ppb: number; ppbb: number;
  ltngPts: number; ppLtng: number;
}

/*---------------------------------------------------------
Convert string to number, but using 0 instead of NaN
---------------------------------------------------------*/
/**
 * Convert string to number, but using 0 instead of NaN
 * @param  str [description]
 * @return     [description]
 */
export function toNum(str) {
  return isNaN(+str) ? 0 : +str;
}

/**
 * Format numbers to the specified precision, and divide-by-zero calculations to an em-dash
 * @param  r         something to attempt to show as a number
 * @param  precision number of decimal places
 * @return           fomrmatted number, or string
 */
function formatRate(r: any, precision: number): number | string {
  return isNaN(+r) || !isFinite(+r) ? '&mdash;&ensp;' : r.toFixed(precision);
}

/**
 * Determine whether we care about the game based on the phase we're showing
 * @param  game    game object
 * @param  phase   name of phase
 * @param  showTbs whether to also show tiebreakers
 * @return         whether to show the game in the stat report
 */
export function matchFilterPhase(game: YfGame, phase: string, showTbs: boolean): boolean {
  if(game.tiebreaker) {
    return phase == 'Tiebreakers' || (phase == 'all' && showTbs);
  }
  return phase == 'all' || game.phases.includes(phase);
}

/**
 * include column for small school status?
 * @param  rptConfig report configuration object
 * @return           true if we should show the small school column
 */
function showSS(rptConfig: RptConfig): boolean {
  return rptConfig.smallSchool !== null && rptConfig.smallSchool
}

/**
 * include column for JV status?
 * @param  rptConfig report configuration object
 * @return           true if we should show the JV column
 */
function showJV(rptConfig: RptConfig): boolean {
  return rptConfig.jrVarsity !== null && rptConfig.jrVarsity
}

/**
 * include column for team undergrad status?
 * @param  rptConfig report configuration object
 * @return           true if we should show the team UG column
 */
function showTeamUG(rptConfig: RptConfig): boolean { return rptConfig.teamUG; }

/**
 * include column for team div. 2 status?
 * @param  rptConfig report configuration obejct
 * @return           true if we should show the team D2 column
 */
function showTeamD2(rptConfig: RptConfig): boolean { return rptConfig.teamD2; }

/**
 * include the combined UG/D2 column?
 * @param  rptConfig report configuration object
 * @return           true if we should show the team combined column
 */
function showTeamCombined(rptConfig: RptConfig): boolean {
  return rptConfig.teamCombinedStatus;
}

/**
 * include the column for W-L record in the grouping phase?
 * @param  rptConfig      report configuration object
 * @param  phase          name of the phase the report is showing
 * @param  groupingPhases names of the phases by whose divisions the teams are being grouped
 * @return                true if we should show the phase record column
 */
function showPhaseRecord(rptConfig: RptConfig, phase: string, groupingPhases: string[]): boolean {
  return rptConfig.phaseRecord && phase == 'all' &&
    groupingPhases.length > 0 && groupingPhases[0] != 'noPhase';
}

/**
 * track ppg (rather than pp20TUH)?
 * @param  rptConfig report configuration object
 * @return           true if using ppg, false if using pp20
 */
function showPpg(rptConfig: RptConfig): boolean { return rptConfig.ppgOrPp20 == 'ppg'; }

/**
 * track pp20tuh?
 * @param  rptConfig report configuration object
 * @return           true if using pp20, false if using ppg
 */
function showPp20(rptConfig: RptConfig): boolean { return rptConfig.ppgOrPp20 == 'pp20'; }

/**
 * include column for pts against?
 * @param  rptConfig report configuration object
 * @return           true if we should show the PAPG column
 */
function showPapg(rptConfig: RptConfig): boolean { return rptConfig.papg; }

/**
 * include column for average margin?
 * @param  rptConfig report configuration object
 * @return           true if we should show the margin column
 */
function showMargin(rptConfig: RptConfig): boolean { return rptConfig.margin; }

/**
 * include column for powers?
 * @param  settings tournament settings object
 * @return          true if we should show powers
 */
function showPowers(settings: TournamentSettings): boolean {
  return settings.powers != PowerRule.None;
}

/**
 * include column for negs?
 * @param  settings tournament settings object
 * @return          true if we should show negs
 */
function showNegs(settings: TournamentSettings): boolean { return settings.negs; }

/**
 * include column pts per tuh?
 * @param  rptConfig report configuration object
 * @return           true if we should show the pptuh colummn
 */
function showPptuh(rptConfig: RptConfig): boolean { return rptConfig.pptuh; }

/**
 * include column for powers per neg?
 * @param  settings  settings object
 * @param  rptConfig report configuration object
 * @return           true if we should show the Pwr/N column
 */
function showPPerN(settings: TournamentSettings, rptConfig: RptConfig): boolean {
  return showPowers(settings) && showNegs(settings) && rptConfig.pPerN;
}

/**
 * include column for gets per neg?
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @return           true if we should show the G/N column
 */
function showGPerN(settings: TournamentSettings, rptConfig: RptConfig): boolean {
  return showNegs(settings) && rptConfig.gPerN;
}

/**
 * include column for lightning round points?
 * @param  settings Tournament settings object
 * @return          true if we should show the lightning points column
 */
function showLtng(settings: TournamentSettings): boolean { return settings.lightning; }

/**
 * include columns for bonus points and PPB?
 * @param  settings tournament settings object
 * @return          true if we should show bonus-related columns
 */
function showBonus(settings: TournamentSettings): boolean { return settings.bonuses; }

/**
 * include columns for bounceback points and PPBB?
 * @param  settings tournamenet settings object
 * @return          true if we should show bounceback-related columns
 */
function showBb(settings: TournamentSettings): boolean { return settings.bonusesBounce; }

/**
 * show players' year/grade?
 * @param  rptConfig report configuration object
 * @return           true if we should show the Year column
 */
function showPlayerYear(rptConfig: RptConfig): boolean { return rptConfig.playerYear; }

/**
 * show players' UG status?
 * @param  rptConfig report configuration object
 * @return           true if we should show the UG column for players
 */
function showPlayerUG(rptConfig: RptConfig): boolean { return rptConfig.playerUG; }

/**
 * show player D2 status?
 * @param  rptConfig report configuration object
 * @return           true if we should show the D2 column for players
 */
function showPlayerD2(rptConfig: RptConfig): boolean { return rptConfig.playerD2; }

/**
 * include the combined UG/D2 column?
 * @param  rptConfig report configuration object
 * @return           true if we should show the combined UG/D2 column for players
 */
function showPlayerCombined(rptConfig: RptConfig): boolean {
  return rptConfig.playerCombinedStatus;
}

/**
 * Number of games played, including forfeits.
 * @param  team  team object
 * @param  games list of games
 * @return       how many games involved this team
 */
export function gamesPlayed(team: YfTeam, games: YfGame[]): number {
  let count = 0;
  for(let g of games) {
    if(g.team1 == team.teamName || g.team2 == team.teamName) {
      count += 1;
    }
  }
  return count;
}

/**
 * Point value of a power
 * @param  settings tournament settings object
 * @return          number of points that a power is worth (0 is powers aren't used)
 */
export function powerValue(settings: TournamentSettings): number {
  if(settings.powers == PowerRule.Fifteen) { return 15; }
  if(settings.powers == PowerRule.Twenty) { return 20; }
  return 0;
}

/**
 * Point value of a neg
 * @param  settings tournament settings object
 * @return          number of points a neg is worth (0 if negs are not used)
 */
export function negValue(settings: TournamentSettings): number {
  return settings.negs ? -5 : 0;
}

/**
 * Bonuses heard for a single game.
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @return           how many bonuses the team heard
 */
export function bonusesHeard (game: YfGame, whichTeam: WhichTeam): number {
  let tot = 0;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  const otPwr = whichTeam == 1 ? game.otPwr1 : game.otPwr2;
  const otTen = whichTeam == 1 ? game.otTen1 : game.otTen2;
  for(let p in players) {
    tot += players[p].powers + players[p].tens;
  }
  tot -= otPwr; //subtract TUs converted in overtime
  tot -= otTen;
  return tot;
}

/**
 * Bonus points for a single game.
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @param  settings  tournament settings object
 * @return           how many bonus points the team scored
 */
export function bonusPoints(game: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): number {
  let tuPts = 0;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  const totalPoints = whichTeam == 1 ? game.score1 : game.score2;
  const bbPts = whichTeam == 1 ? game.bbPts1 : game.bbPts2;
  const lghtPts = whichTeam == 1 ? game.lightningPts1 : game.lightningPts2;
  for(let p in players) {
    tuPts += powerValue(settings)*players[p].powers + 10*players[p].tens +
      negValue(settings)*players[p].negs;
  }
  return totalPoints - tuPts - bbPts - lghtPts;
}

/**
 * How many (30-point bonuses' worth of) bouncebacks a team heard
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @param  settings  tournament settings object
 * @return           tuple: [interger part, number of additional thirds].
 *                   e.g. 3 and 2/3 is [3,2]
 */
export function bbHeard(game: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): [number, number] {
  const otherTeam: WhichTeam = whichTeam == 1 ? 2 : 1;
  const raw = (bonusesHeard(game, otherTeam)*30 - bonusPoints(game, otherTeam, settings)) / 30;
  const integer = Math.trunc(raw);
  const remainder = (raw*3) % 3;
  return [integer, remainder];
}

/**
 * Add two bounceback heard amounts together in the tuple format
 * @param  x value
 * @param  y value
 * @return   sum of x and y
 */
function bbHrdAdd(x: [number, number], y: [number, number]): [number, number] {
  const carry = x[1]+y[1]>=3 ? 1 : 0;
  return [x[0]+y[0] + carry, (x[1]+y[1]) % 3];
}

/**
 * Convert the internal representation of bouncebacks heard to a decimal
 * @param  x bouncebacks heard tuple
 * @return   a number
 */
export function bbHrdToFloat(x: [number, number]): number {
  return x[0] + x[1]/3;
}

/**
 * HTML code for printing bouncebacks heard.
 * @param  x bouncebacks heard tuple
 * @return   html for interger + fracional part
 */
function bbHrdDisplay(x: [number, number]): string {
  let fraction = '';
  if(x[1] == 1) { fraction = '&#8531;' } // '1/3'
  if(x[1] == 2) { fraction = '&#8532;' } // '2/3'
  return x[0] + fraction;
}

/**
 * Total points from overtime tossups for a game.
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @param  settings  tournament settings object
 * @return           how many points the team scored in overtime
 */
export function otPoints(game: YfGame, whichTeam: WhichTeam, settings: TournamentSettings): number {
  const otPwr = whichTeam == 1 ? game.otPwr1 : game.otPwr2;
  const otTen = whichTeam == 1 ? game.otTen1 : game.otTen2;
  const otNeg = whichTeam == 1 ? game.otNeg1 : game.otNeg2;
  return powerValue(settings)*otPwr + 10*otTen + negValue(settings)*otNeg;
}

/**
 * Number of powers for a single team in a single game
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @return           how many power the team got
 */
export function teamPowers(game: YfGame, whichTeam: WhichTeam): number {
  let totPowers = 0;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  for(let p in players) {
    totPowers += players[p].powers;
  }
  return totPowers;
}

/**
 * Number of tens for a single team in a single game
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @return           how many tens the team scored
 */
export function teamTens(game: YfGame, whichTeam: WhichTeam): number {
  let totTens = 0;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  for(let p in players) {
    totTens += players[p].tens;
  }
  return totTens;
}

/**
 * Number of negs for a single team in a single game
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @return           how many negs the team got
 */
export function teamNegs(game: YfGame, whichTeam: WhichTeam): number {
  let totNegs = 0;
  const players = whichTeam == 1 ? game.players1 : game.players2;
  for(let p in players) {
    totNegs += players[p].negs;
  }
  return totNegs;
}

/**
 * [TUH, powers, tens, negs] for a player, as numbers.
 * @param  player Player line object
 * @return        4-element array
 */
export function playerSlashLine(player: PlayerLine): [number, number, number, number] {
  return [player.tuh, player.powers, player.tens, player.negs];
}

/**
 * Does at least one round have a packet name?
 * @param  packets packet names indexed by round
 * @return         true if at least one round's packet has a name
 */
export function packetNamesExist(packets: PacketList): boolean {
  for(let r in packets) {
    if(packets[r] != '') { return true; }
  }
  return false;
}

/**
 * Is there at least one team with at least one tie?
 * @param  standings list of team standings objects
 * @return           true if there is at least one tie
 */
function anyTiesExist(standings: TeamStandingsLine[]) {
  for(let i in standings) {
    if(standings[i].ties > 0) { return true; }
  }
  return false;
}

/**
 * Generate table cell <td> tags (with newline at the end)
 * @param  text  inner text
 * @param  align value for the align attribute
 * @param  bold  whether the text is bold
 * @param  title hover text content
 * @param  style inline CSS, without quotes around it
 * @return       a <td> element with the specified style and content
 */
function tdTag(text: string | number, align?: string, bold?: boolean, title?: string, style?: string): string {
  let html = '<td';
  if(align) { html += ' align=' + align; }
  if(style) { html += ' style="' + style + '"'; }
  if(title) { html += ' title="' + title + '"'; }
  html += '>';
  if(bold) { html += '<b>'; }
  html += text;
  if(bold) { html += '</b>'; }
  return html + '</td>\n';
}

/**
 * Header row for the team standings.
 * @param  settings    tournament settings object
 * @param  tiesExist   whether we need a Ties column
 * @param  rptConfig   report configuration object
 * @param  filterPhase which phase's games we're showing
 * @param  curGrpPhase which phases's divisions we're currently grouping teams by
 * @return             <tr> element
 */
function standingsHeader(settings: TournamentSettings, tiesExist: boolean,
  rptConfig: RptConfig, filterPhase: string, curGrpPhase: string) {

  let html = '<tr>' + '\n' +
    tdTag('Rank', 'left', true) +
    tdTag('Team', 'left', true);
  if(showSS(rptConfig)) {
    html += tdTag('SS', 'left', true, TOOLTIPS.smallSchool);
  }
  if(showJV(rptConfig)) {
    html += tdTag('JV', 'left', true, TOOLTIPS.jrVarsity);
  }
  if(showTeamUG(rptConfig)) {
    html += tdTag('UG', 'left', true, TOOLTIPS.teamUG);
  }
  if(showTeamD2(rptConfig)) {
    html += tdTag('D2', 'left', true, TOOLTIPS.teamD2);
  }
  if(showTeamCombined(rptConfig)) {
    html += tdTag('', 'left', true);
  }
  html += tdTag('W','right',true) +
    tdTag('L','right',true);
  if(tiesExist) {
    html += tdTag('T','right',true);
  }
  html += tdTag('Pct','right',true);
  if(curGrpPhase != null && showPhaseRecord(rptConfig, filterPhase, [curGrpPhase])) {
    html += tdTag(curGrpPhase, 'right', true, TOOLTIPS.phaseRecord[0] + curGrpPhase + TOOLTIPS.phaseRecord[1]);
  }
  if(showPpg(rptConfig)) {
    html +=  tdTag('PPG','right',true, TOOLTIPS.ppg);
  }
  else { // tracking pp20TUH instead
    html +=  tdTag('PP20','right',true, TOOLTIPS.pp20);
  }
  if(showPapg(rptConfig)) {
    if(showPpg(rptConfig)) { html += tdTag('PAPG','right',true, TOOLTIPS.papg); }
    else { html += tdTag('PAP20','right',true, TOOLTIPS.pap20); }
  }
  if(showMargin(rptConfig)) {
    if(showPpg(rptConfig)) { html += tdTag('Mrg','right',true, TOOLTIPS.mrg); }
    else { html += tdTag('Mrg', 'right', true, TOOLTIPS.mrg20); }
  }
  if(showPowers(settings)) {
    html += tdTag(powerValue(settings),'right',true);
  }
  html += tdTag('10','right',true);
  if(showNegs(settings)) {
    html += tdTag('-5','right',true);
  }
  html += tdTag('TUH','right',true, TOOLTIPS.tuh);
  if(showPptuh(rptConfig)) {
    html += tdTag('PPTUH','right',true, TOOLTIPS.pptuh);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag('Pwr/N','right',true, TOOLTIPS.pPerN);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag('G/N','right',true, TOOLTIPS.gPerN);
  }
  if(showLtng(settings)) {
    html += tdTag('Ltng', 'right', true, TOOLTIPS.lightning);
  }
  if(showBonus(settings)) {
    html += tdTag('BHrd','right',true, TOOLTIPS.bHeard) +
      tdTag('BPts','right',true, TOOLTIPS.bPts) +
      tdTag('PPB','right',true, TOOLTIPS.ppb);
  }
  if(showBb(settings)) {
    html += tdTag('BBHrd','right',true, TOOLTIPS.bbHeard) +
      tdTag('BBPts','right',true, TOOLTIPS.bbPts) +
      tdTag('PPBB','right',true, TOOLTIPS.ppbb);
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * One row in the team standings
 * @param  teamEntry       stats and info for one team
 * @param  rank            rank to show for this team
 * @param  fileStart       start of the html file names to use for links
 * @param  settings        tournament settings object
 * @param  tiesExist       whether we need a Ties colulmn
 * @param  rptConfig       report configuration object
 * @param  showPhaseRecord whether we need a column for the grouping phase record
 * @return                 a <tr> element
 */
function standingsRow(teamEntry: TeamStandingsLine, rank: number, fileStart: string, settings: TournamentSettings,
  tiesExist: boolean, rptConfig: RptConfig, showPhaseRecord: boolean): string {

  const linkId = teamEntry.teamName.replace(/\W/g, '');
  let rowHtml = '<tr>';
  rowHtml += tdTag(rank,'left');
  if(teamEntry.wins + teamEntry.losses + teamEntry.ties > 0) {
    rowHtml += tdTag('<a HREF=' + fileStart + 'teamdetail.html#' + linkId + '>' + teamEntry.teamName + '</a>','left');
  }
  else { rowHtml += tdTag(teamEntry.teamName, 'left'); }
  if(showSS(rptConfig)) {
    rowHtml += tdTag(teamEntry.smallSchool ? 'SS' : '', 'left');
  }
  if(showJV(rptConfig)) {
    rowHtml += tdTag(teamEntry.jrVarsity ? 'JV' : '', 'left');
  }
  if(showTeamUG(rptConfig)) {
    rowHtml += tdTag(teamEntry.teamUGStatus ? 'UG' : '', 'left');
  }
  if(showTeamD2(rptConfig)) {
    rowHtml += tdTag(teamEntry.teamD2Status ? 'D2' : '', 'left');
  }
  if(showTeamCombined(rptConfig)) {
    var tmComb = '';
    if(teamEntry.teamD2Status) { tmComb = 'D2'; }
    else if(teamEntry.teamUGStatus) { tmComb = 'UG'; }
    rowHtml += tdTag(tmComb, 'left');
  }
  rowHtml += tdTag(teamEntry.wins,'right');
  rowHtml += tdTag(teamEntry.losses,'right');
  if(tiesExist) {
    rowHtml += tdTag(teamEntry.ties,'right');
  }
  rowHtml += tdTag(teamEntry.winPct,'right');
  if(showPhaseRecord) {
    rowHtml += tdTag(teamEntry.phaseRecord, 'right');
  }
  if(showPpg(rptConfig)) {
    rowHtml += tdTag(teamEntry.ppg,'right');
  }
  else {  //pp20TUH
    rowHtml += tdTag(teamEntry.pp20, 'right');
  }
  if(showPapg(rptConfig)) {
    if(showPpg(rptConfig)) { rowHtml += tdTag(teamEntry.papg,'right'); }
    else { rowHtml += tdTag(teamEntry.pap20, 'right'); }
  }
  if(showMargin(rptConfig)) {
    if(showPpg(rptConfig)) { rowHtml += tdTag(teamEntry.margin,'right'); }
    else { rowHtml += tdTag(teamEntry.mrg20, 'right'); }
  }
  if(showPowers(settings)) {
    rowHtml += tdTag(teamEntry.powers,'right');
  }
  rowHtml += tdTag(teamEntry.tens,'right');
  if(showNegs(settings)) {
    rowHtml += tdTag(teamEntry.negs,'right');
  }
  rowHtml += tdTag(teamEntry.tuh,'right');
  if(showPptuh(rptConfig)) {
    rowHtml += tdTag(teamEntry.ppth,'right');
  }
  if(showPPerN(settings, rptConfig)) {
    rowHtml += tdTag(teamEntry.pPerN,'right');
  }
  if(showGPerN(settings, rptConfig)) {
    rowHtml += tdTag(teamEntry.gPerN,'right');
  }
  if(showLtng(settings)) {
    rowHtml += tdTag(teamEntry.lightning, 'right');
  }
  if(showBonus(settings)) {
    rowHtml += tdTag(teamEntry.bHeard,'right');
    rowHtml += tdTag(teamEntry.bPts,'right');
    rowHtml += tdTag(teamEntry.ppb,'right');
  }
  if(showBb(settings)) {
    rowHtml += tdTag(bbHrdDisplay(teamEntry.bbHeard),'right');
    rowHtml += tdTag(teamEntry.bbPts,'right');
    rowHtml += tdTag(teamEntry.ppbb,'right');
  }
  return rowHtml + '</tr>' + '\n';
}

/**
 * Gather data for the team standings
 * @param  teams          list of team objects
 * @param  games          list of game objects
 * @param  filterPhase    which phase we're showing games for
 * @param  groupingPhases phases whose divisions we're grouping teams by
 * @param  settings       tournament settings object
 * @param  rptConfig      report configuration object
 * @param  showTbs        whether to show tiebreakers
 * @return                [description]
 */
export function compileStandings(teams: YfTeam[], games: YfGame[], filterPhase: string,
  groupingPhases: string[], settings: TournamentSettings, rptConfig: RptConfig,
  showTbs: boolean) {

  const standings = teams.map(function(item, _index) {
    let division = undefined, i = 0, teamsGrpPhase = undefined;
    while(division == undefined && i < groupingPhases.length) {
      teamsGrpPhase = groupingPhases[i++];
      division = item.divisions[teamsGrpPhase];
    }
    let obj: TeamStandingsLine =
      { teamName: item.teamName, rank: item.rank,
        smallSchool: item.smallSchool, jrVarsity: item.jrVarsity,
        teamUGStatus: item.teamUGStatus, teamD2Status: item.teamD2Status,
        division: division != undefined ? division : null,
        groupingPhase: teamsGrpPhase,
        wins: 0, losses: 0, ties: 0, winPct: '.000',
        phaseWins: 0, phaseLosses: 0, phaseTies: 0, phaseWinPct: 0, phaseRecord: '',
        ppg: 0, papg: 0, margin: 0,
        pp20: 0, pap20: 0, mrg20: 0,
        powers: 0, tens: 0, negs: 0,
        tuh: 0,
        ppth: 0,
        pPerN: 0, gPerN: 0,
        bHeard: 0, bPts: 0, ppb: 0,
        bbHeard: [0,0], bbPts: 0, ppbb: 0,
        lightning: 0,
        points: 0,
        ptsAgainst: 0,
        forfeits: 0,
        otPts: 0,
        otPtsAgainst: 0,
        ottuh: 0,
      };
    return obj;
  }); //map

  for(let g of games) {
    const team1Line = _.find(standings, (o) => { return o.teamName == g.team1; });
    const team2Line = _.find(standings, (o) => { return o.teamName == g.team2; });
    //tens digit - whether to count for team 1. ones digit - whether to count for team 2
    const inTeamOneGrpPhase = g.phases.includes(team1Line.groupingPhase);
    const inTeamTwoGrpPhase = g.phases.includes(team2Line.groupingPhase);
    if(matchFilterPhase(g, filterPhase, showTbs)) {
      if(g.forfeit) { //team1 is by default the winner of a forfeit
        team1Line.wins += 1;
        team2Line.losses += 1;
        team1Line.forfeits += 1;
        team2Line.forfeits += 1;
        if(inTeamOneGrpPhase) { team1Line.phaseWins += 1; }
        if(inTeamTwoGrpPhase) { team2Line.phaseLosses += 1; }
      }
      else { //not a forfeit
        if(+g.score1 > +g.score2) {
          team1Line.wins += 1;
          team2Line.losses += 1;
          if(inTeamOneGrpPhase) { team1Line.phaseWins += 1; }
          if(inTeamTwoGrpPhase) { team2Line.phaseLosses += 1; }
        }
        else if(+g.score2 > +g.score1) {
          team1Line.losses += 1;
          team2Line.wins += 1;
          if(inTeamOneGrpPhase) { team1Line.phaseLosses += 1; }
          if(inTeamTwoGrpPhase) { team2Line.phaseWins += 1; }
        }
        else { //it's a tie
          team1Line.ties += 1;
          team2Line.ties += 1;
          if(inTeamOneGrpPhase) { team1Line.phaseTies += 1; }
          if(inTeamTwoGrpPhase) { team2Line.phaseTies += 1; }
        }
        team1Line.points += +g.score1;
        team2Line.points += +g.score2;
        team1Line.ptsAgainst += +g.score2;
        team2Line.ptsAgainst += +g.score1;

        team1Line.tuh += +g.tuhtot;
        team2Line.tuh += +g.tuhtot;

        team1Line.powers += teamPowers(g, 1);
        team2Line.powers += teamPowers(g, 2);
        team1Line.tens += teamTens(g, 1);
        team2Line.tens += teamTens(g, 2);
        team1Line.negs += teamNegs(g, 1);
        team2Line.negs += teamNegs(g, 2);

        team1Line.bHeard += bonusesHeard(g,1);
        team2Line.bHeard += bonusesHeard(g,2);
        team1Line.bPts += bonusPoints(g,1,settings);
        team2Line.bPts += bonusPoints(g,2,settings);

        team1Line.bbHeard = bbHrdAdd(team1Line.bbHeard, bbHeard(g,1,settings));
        team2Line.bbHeard = bbHrdAdd(team2Line.bbHeard, bbHeard(g,2,settings));
        team1Line.bbPts += +g.bbPts1;
        team2Line.bbPts += +g.bbPts2;

        team1Line.lightning += +g.lightningPts1;
        team2Line.lightning += +g.lightningPts2;

        team1Line.otPts += otPoints(g, 1, settings);
        team2Line.otPts += otPoints(g, 2, settings);
        team1Line.otPtsAgainst += otPoints(g, 2, settings);
        team2Line.otPtsAgainst += otPoints(g, 1, settings);
        team1Line.ottuh += +g.ottu;
        team2Line.ottuh += +g.ottu;
      }//else not a forfeit
    }//if game is in phase
  }//loop over all games

  for(let i in standings) {
    let t = standings[i];
    const gamesPlayed = t.wins + t.losses + t.ties - t.forfeits;
    const gamesPlayedWithForfeits = t.wins + t.losses + t.ties;
    const winPct = gamesPlayedWithForfeits == 0 ?
      0 : (t.wins + t.ties/2) / gamesPlayedWithForfeits;
    const ppg = (t.points - t.otPts) / gamesPlayed;
    const papg = (t.ptsAgainst - t.otPtsAgainst) / gamesPlayed;
    const margin = ppg - papg;
    const ppth = (t.points - t.otPts) / (t.tuh - t.ottuh);
    const pp20 = 20*ppth;
    const pap20 = 20*(t.ptsAgainst - t.otPtsAgainst) / (t.tuh - t.ottuh);
    const mrg20 = pp20 - pap20;
    const pPerN = t.negs == 0 ? 'inf' : t.powers / t.negs;
    const gPerN = t.negs == 0 ? 'inf' : (t.powers + t.tens) / t.negs;
    const ppb = t.bHeard == 0 ? 'inf' : t.bPts / t.bHeard;
    const ppbb = t.bbPts / bbHrdToFloat(t.bbHeard);
    const phaseGames = t.phaseWins + t.phaseLosses + t.phaseTies;

    if(winPct == 1) { t.winPct = '1.000'; }
    else{ t.winPct = winPct.toFixed(3).substr(1); } //remove leading zero
    t.phaseWinPct = phaseGames == 0 ? 0 : (t.phaseWins + t.phaseTies/2) / phaseGames;
    t.phaseRecord = t.phaseWins + '-' + t.phaseLosses;
    if(t.phaseTies > 0) { t.phaseRecord += '-' + t.phaseTies; }
    t.ppg = formatRate(ppg, 1);
    t.papg = formatRate(papg, 1);
    t.margin = margin.toFixed(1);
    t.pp20 = formatRate(pp20, 1);
    t.pap20 = formatRate(pap20, 1);
    t.mrg20 = formatRate(mrg20, 1);
    t.ppth = formatRate(ppth, 2);
    t.pPerN = formatRate(pPerN, 2);
    t.gPerN = formatRate(gPerN, 2);
    t.ppb = formatRate(ppb, 2);
    t.ppbb = formatRate(ppbb, 2);
  }

  let ppg2Num = (t: TeamStandingsLine) => { return isNaN(+t.ppg) ? 0 : +t.ppg; };

  //if showing all games, order by rank override first.
  //if showing phase record, order by that as well
  if(showPhaseRecord(rptConfig, filterPhase, groupingPhases)) {
    if(filterPhase == 'all') {
      return _.orderBy(standings,
        [(t)=>{return !t.rank ? 99999 : t.rank;}, 'phaseWinPct', 'winPct', ppg2Num],
        ['asc', 'desc', 'desc', 'desc']);
    }
    return _.orderBy(standings, ['phaseWinPct', 'winPct', ppg2Num], ['desc', 'desc', 'desc']);
  }
  if(filterPhase == 'all') {
    return _.orderBy(standings,
      [(t)=>{return !t.rank ? 99999 : t.rank;}, 'winPct', ppg2Num],
      ['asc', 'desc', 'desc']);
  }
  return _.orderBy(standings, ['winPct', ppg2Num], ['desc', 'desc']);
} //compileStandings

/**
 * The header for the table in the individual standings.
 * @param  usingDivisions whether to show the Division column
 * @param  settings       tournament settings object
 * @param  rptConfig      report configuration object
 * @return                <tr> element
 */
function individualsHeader(usingDivisions: boolean, settings: TournamentSettings,
  rptConfig: RptConfig): string {

  let html = '<tr>' + '\n' +
    tdTag('Rank', 'left', true) +
    tdTag('Player', 'left', true);
  if(showPlayerYear(rptConfig)) {
    html += tdTag('Year', 'left', true);
  }
  if(showPlayerUG(rptConfig)) {
    html += tdTag('UG', 'left', true, TOOLTIPS.playerUG);
  }
  if(showPlayerD2(rptConfig)) {
    html += tdTag('D2', 'left', true, TOOLTIPS.playerD2);
  }
  if(showPlayerCombined(rptConfig)) {
    html += tdTag('', 'left', true);
  }
  html += tdTag('Team', 'left', true);
  if(usingDivisions) {
    html += tdTag('Division', 'left', true);
  }
  html += tdTag('GP', 'right', true, TOOLTIPS.gamesPlayed);
  if(showPowers(settings)) {
    html += tdTag(powerValue(settings), 'right', true);
  }
  html += tdTag('10', 'right', true);
  if(showNegs(settings)) {
    html += tdTag('-5', 'right', true);
  }
  html += tdTag('TUH', 'right', true, TOOLTIPS.tuh);
  if(showPptuh(rptConfig)) {
    html += tdTag('PPTUH', 'right', true, TOOLTIPS.pptuh);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag('Pwr/N', 'right', true, TOOLTIPS.pPerN);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag('G/N', 'right', true, TOOLTIPS.gPerN);
  }
  html += tdTag('Pts', 'right', true);
  if(showPpg(rptConfig)) {
    html += tdTag('PPG', 'right', true, TOOLTIPS.ppg);
  }
  else { //pts per 20tuh
    html += tdTag('PP20', 'right', true, TOOLTIPS.pp20);
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * A single row in the individual standings.
 * @param  playerEntry    info and stats for one player
 * @param  rank           players rank in the individual scoring rankings
 * @param  fileStart      file name start to use for links
 * @param  usingDivisions whether to show the Division column
 * @param  settings       tournament settings object
 * @param  rptConfig      report configuration object
 * @return                <tr> element
 */
function individualsRow(playerEntry: PlayerStandingsLine, rank: number, fileStart: string,
  usingDivisions: boolean, settings: TournamentSettings, rptConfig: RptConfig): string {

  const playerLinkId = playerEntry.teamName.replace(/\W/g, '') + '-' +
    playerEntry.playerName.replace(/\W/g, '');
  const teamLinkId = playerEntry.teamName.replace(/\W/g, '');

  let rowHtml = '<tr>' + '\n';
  rowHtml += tdTag(rank,'left');
  rowHtml += tdTag('<a HREF=' + fileStart + 'playerdetail.html#' + playerLinkId + '>' + playerEntry.playerName + '</a>', 'left');
  if(showPlayerYear(rptConfig)) {
    rowHtml += tdTag(playerEntry.year, 'left');
  }
  if(showPlayerUG(rptConfig)) {
    rowHtml += tdTag(playerEntry.undergrad ? 'UG' : '', 'left');
  }
  if(showPlayerD2(rptConfig)) {
    rowHtml += tdTag(playerEntry.div2 ? 'D2' : '', 'left');
  }
  if(showPlayerCombined(rptConfig)) {
    var plComb = '';
    if(playerEntry.div2) { plComb = 'D2'; }
    else if(playerEntry.undergrad) { plComb = 'UG'; }
    rowHtml += tdTag(plComb, 'left');
  }
  rowHtml += tdTag('<a HREF=' + fileStart + 'teamdetail.html#' + teamLinkId + '>' + playerEntry.teamName + '</a>', 'left');

  if(usingDivisions) {
    var divDisplay = playerEntry.division;
    if(divDisplay == undefined) { divDisplay = '&mdash;&ensp;'; }
    rowHtml += tdTag(divDisplay, 'left');
  }
  rowHtml += tdTag(playerEntry.gamesPlayed, 'right');
  if(showPowers(settings)) {
    rowHtml += tdTag(playerEntry.powers, 'right');
  }
  rowHtml += tdTag(playerEntry.tens, 'right');
  if(showNegs(settings)) {
    rowHtml += tdTag(playerEntry.negs, 'right');
  }
  rowHtml += tdTag(playerEntry.tuh, 'right');
  if(showPptuh(rptConfig)) {
    rowHtml += tdTag(playerEntry.pptu, 'right');
  }
  if(showPPerN(settings, rptConfig)) {
    rowHtml += tdTag(playerEntry.pPerN, 'right');
  }
  if(showGPerN(settings, rptConfig)) {
    rowHtml += tdTag(playerEntry.gPerN, 'right');
  }
  rowHtml += tdTag(playerEntry.points, 'right');
  if(showPpg(rptConfig)) {
    rowHtml += tdTag(playerEntry.ppg, 'right');
  }
  else {
    rowHtml += tdTag(playerEntry.pp20, 'right');
  }
  return rowHtml + '</tr>' + '\n';
}

/**
 * Tabulate data for the individual standings page.
 * @param  teams          list of team objects
 * @param  games          list of game objects
 * @param  phase          phase to include games for
 * @param  groupingPhases list of phases whose divisions to group teams by
 * @param  settings       tournament settings object
 * @param  showTbs        whether to include tiebreakers
 * @return                list of individual stat totals
 */
function compileIndividuals(teams: YfTeam[], games: YfGame[], phase: string,
  groupingPhases: string[], settings: TournamentSettings, showTbs: boolean) {

  let individuals: PlayerStandingsLine[] = [];
  for(let t of teams) {
    let division = undefined, i = 0;
    while(division == undefined && i < groupingPhases.length) {
      division = t.divisions[groupingPhases[i++]];
    }
    for(let p in t.roster) {
      const obj: PlayerStandingsLine = {
        playerName: p,
        year: t.roster[p].year,
        undergrad: t.roster[p].undergrad,
        div2: t.roster[p].div2,
        teamName: t.teamName,
        division: division != undefined ? division : null,
        gamesPlayed: 0,
        powers: 0,
        tens: 0,
        negs: 0,
        tuh: 0,
        pptu: 0,
        pPerN: 0,
        gPerN: 0,
        points: 0,
        ppg: 0,
        pp20: 0
      }
      individuals.push(obj);
    }
  }
  for(let g of games) {
    if(matchFilterPhase(g, phase, showTbs)) {
      const players1 = g.players1, players2 = g.players2;
      for(let p in players1) {
        let pEntry = _.find(individuals, function (o) {
          return o.teamName == g.team1 && o.playerName == p;
        });
        if(pEntry == undefined) { continue; }
        const [tuh, powers, tens, negs] = playerSlashLine(players1[p]);
        pEntry.gamesPlayed = +pEntry.gamesPlayed + tuh / g.tuhtot;
        pEntry.powers += powers;
        pEntry.tens += tens;
        pEntry.negs += negs;
        pEntry.tuh += tuh;
      }
      for(let p in players2) {
        let pEntry = _.find(individuals, function (o) {
          return o.teamName == g.team2 && o.playerName == p;
        });
        if(pEntry == undefined) { continue; }
        const [tuh, powers, tens, negs] = playerSlashLine(players2[p]);
        pEntry.gamesPlayed = +pEntry.gamesPlayed + tuh / g.tuhtot;
        pEntry.powers += powers;
        pEntry.tens += tens;
        pEntry.negs += negs;
        pEntry.tuh += tuh;
      }
    }
  } //for loop for each game

  for(let p of individuals) {
    const pPerN = p.powers / p.negs;
    const gPerN = (p.powers + p.tens) / p.negs;
    const totPoints = p.powers*powerValue(settings) + p.tens*10 + p.negs*negValue(settings);
    const pptu = totPoints / p.tuh;
    const ppg = totPoints / +p.gamesPlayed;
    const pp20 = 20*totPoints / p.tuh;

    p.gamesPlayed = (+p.gamesPlayed).toFixed(1);
    p.pptu = formatRate(pptu, 2);
    p.pPerN = formatRate(pPerN, 2);
    p.gPerN = formatRate(gPerN, 2);
    p.points = totPoints;
    p.ppg = formatRate(ppg, 2);
    p.pp20 = formatRate(pp20, 2);
  }

  return _.orderBy(individuals,
    [(item) => {
      if(isNaN(+item.pptu)) return -999;
      return +item.pptu;
    },
    (item) => {
      return +item.gamesPlayed;
    }],
    ['desc', 'desc']);//orderBy
} //compileIndividuals

/**
 * A list of the rounds for which there are games, so as to know how to organize
 * the scoreboard page
 * @param  games   list of game objects
 * @param  phase   phase to include games for
 * @param  showTbs whether to include tiebreakers
 * @return         list of rounds to include on the scoreboard page
 */
function getRoundsForScoreboard(games: YfGame[], phase: string, showTbs: boolean): number[] {
  let rounds = [];
  for(let g of games) {
    let roundNo = g.round;
    if(matchFilterPhase(g, phase, showTbs) && !rounds.includes(roundNo)) {
      rounds.push(roundNo);
    }
  }
  return rounds.sort((a,b) => { return a-b; });
}

/**
 * A "table of contents" for the scoreboard page with links to each round
 * @param  roundList list of rounds numbers to include
 * @param  fileStart start of file names to use for links
 * @return           <table> element
 */
function scoreboardRoundLinks(roundList: number[], fileStart: string): string {
  let html = '<table border=0 width=70% ' +
    'style="top:4px;position:sticky;table-layout:fixed;background-color:#cccccc;margin-top:5px;box-shadow: 4px 4px 7px #999999">' + '\n' +
    '<tr>' + '\n';
  for(let i in roundList) {
    html += tdTag('<a HREF=' + fileStart + 'games.html#round-' + roundList[i] + '>' + roundList[i] + '</a>', 'left');
  }
  html += '</tr>' + '\n' +
    '</table>' + '\n';
  return html;
}

/**
 * The title for each section of the scoreboard.
 * @param  roundNo    round number
 * @param  packetName name of the packet used in this round
 * @return            html
 */
function scoreboardRoundHeader(roundNo: number, packetName: string): string {
  let html = '<div id=round-' + roundNo + ' style="margin:-3em;position:absolute"></div>' + '\n';
  html += '<h2 style="display:inline-block">Round ' + roundNo + '</h2>';
  if(packetName != undefined && packetName != '') {
    html += '<span style=" font-style: italic; color: gray">&ensp;Packet: ' + packetName + '</span>';
  }
  return html += '\n';
}

/**
 * The specified number of empty table cells, used for padding box scores
 * @param  size number of cells
 * @return      series of empty <td> elements
 */
function blankPlayerLineScore(size: number): string {
  let output = [];
  while(output.length < size) {
    output.push(tdTag(''));
  }
  return output.join('');
}

/**
 * Identifier for a specific game on the scorboard, so other pages can link to it
 * @param  game game object
 * @return      unique ID for this game
 */
function scoreboardLinkID(game: YfGame): string {
  return 'R' + game.round + '-' + game.team1.replace(/\W/g, '') + '-' +
    game.team2.replace(/\W/g, '');
}

/**
 * HTML for all the game summaries for a single round on the scoreboard page
 * @param  games       list of all game objects
 * @param  roundNo     round number for which to show games
 * @param  phase       phase to show games for
 * @param  settings    tournament settings object
 * @param  phaseColors list of colors to use for each pahse
 * @param  showTbs     whether to include tiebreakers
 * @return             html with game box scores
 */
function scoreboardGameSummaries(games: YfGame[], roundNo: number, phase: string, settings: TournamentSettings,
  phaseColors: { [phase: string]: string }, showTbs: boolean): string {

  let html = '';
  for(let g of games) {
    if(matchFilterPhase(g, phase, showTbs) && g.round == roundNo) {
      const linkId = 'R' + roundNo + '-' + g.team1.replace(/\W/g, '') + '-' +
        g.team2.replace(/\W/g, '');
      const colorBlock = '<span style="' + getRoundStyle(g.phases, phaseColors, g.tiebreaker) +
        '">' + '&nbsp;&nbsp;&nbsp;&nbsp;</span>' + '\n';
      if(g.forfeit) {
        html += '<div id=' + linkId + ' style="margin:-2.3em;position:absolute"></div>'
        html += '<h3>' + '\n';
        if(phase == 'all' && (g.phases.length != 0 || g.tiebreaker)) {
          html += colorBlock;
        }
        html += '<span id=' + linkId + '>' + g.team1 +
        ' defeats ' + g.team2 + ' by forfeit' + '</h3></span><br>';
      }
      else {
        // game title
        html += '<div id=' + linkId + ' style="margin:-2.3em;position:absolute"></div>'
        html += '<h3>' + '\n';
        if(phase == 'all' && (g.phases.length != 0 || g.tiebreaker)) {
          html += colorBlock;
        }
        if(g.score1 >= g.score2) {
          html += g.team1 + ' ' + g.score1 + ', ' + g.team2 + ' ' + g.score2;
        }
        else {
          html += g.team2 + ' ' + g.score2 + ', ' + g.team1 + ' ' + g.score1;
        }
        if(g.ottu > 0) {
          html += ' (OT)';
        }
        html += '</h3>' + '\n';

        // make a table for the player linescores
        html += '<table border=0 width=70%>' + '\n';
        html += '<tr>' + '\n';
        let team1Header = tdTag(g.team1,'left',true) +
          tdTag('TUH','right',true);
        let team2Header = tdTag(g.team2,'left',true) +
          tdTag('TUH','right',true);
        if(showPowers(settings)) {
          team1Header += tdTag(powerValue(settings),'right',true);
          team2Header += tdTag(powerValue(settings),'right',true);
        }
        team1Header += tdTag('10','right',true);
        team2Header += tdTag('10','right',true);
        if(showNegs(settings)) {
          team1Header += tdTag('-5','right',true);
          team2Header += tdTag('-5','right',true);
        }
        team1Header += tdTag('Tot','right',true);
        team2Header += tdTag('Tot','right',true);
        html += team1Header + tdTag('') + team2Header; // add an empty column as a buffer between the two teams
        html += '</tr>' + '\n';

        let playersLeft = [], leftTeamPwrs = 0, leftTeamTens = 0,
          leftTeamNegs = 0, leftTeamPts = 0;
        let playersRight = [], rightTeamPwrs = 0, rightTeamTens = 0,
          rightTeamNegs= 0, rightTeamPts = 0;
        //the left side of the table
        for(var p in g.players1) {
          let playerLine = '<tr>' + '\n' + tdTag(p);
          let [tuh, pwr, tn, ng] = playerSlashLine(g.players1[p]);
          leftTeamPwrs += pwr;
          leftTeamTens += tn;
          leftTeamNegs += ng;
          if(tuh <= 0) { continue; }
          playerLine += tdTag(tuh,'right');
          if(showPowers(settings)) {
            playerLine += tdTag(pwr,'right');
          }
          playerLine += tdTag(tn,'right');
          if(showNegs(settings)) {
            playerLine += tdTag(ng,'right');
          }
          let totPts = powerValue(settings)*pwr + 10*tn + negValue(settings)*ng;
          leftTeamPts += totPts;
          playerLine += tdTag(totPts,'right');
          playersLeft.push(playerLine);
        }
        // the right side of the table
        for(var p in g.players2) {
          let playerLine = tdTag(p);
          let [tuh, pwr, tn, ng] = playerSlashLine(g.players2[p]);
          rightTeamPwrs += pwr;
          rightTeamTens += tn;
          rightTeamNegs += ng;
          if(tuh <= 0) { continue; }
          playerLine += tdTag(tuh,'right');
          if(showPowers(settings)) {
            playerLine += tdTag(pwr,'right');
          }
          playerLine += tdTag(tn,'right');
          if(showNegs(settings)) {
            playerLine += tdTag(ng,'right');
          }
          let totPts = powerValue(settings)*pwr + 10*tn + negValue(settings)*ng;
          rightTeamPts += totPts;
          playerLine += tdTag(totPts,'right');
          playerLine += '</tr>' + '\n';
          playersRight.push(playerLine);
        }

        // team total rows
        let leftTotalRow = '<tr>\n' + tdTag('Total', 'left', true) + '<td/>\n';
        let rightTotalRow = tdTag('Total', 'left', true) + '<td/>\n';
        if(showPowers(settings)) {
          leftTotalRow += tdTag(leftTeamPwrs, 'right', true);
          rightTotalRow += tdTag(rightTeamPwrs, 'right', true);
        }
        leftTotalRow += tdTag(leftTeamTens, 'right', true);
        rightTotalRow += tdTag(rightTeamTens, 'right', true);
        if(showNegs(settings)) {
          leftTotalRow += tdTag(leftTeamNegs, 'right', true);
          rightTotalRow += tdTag(rightTeamNegs, 'right', true);
        }
        leftTotalRow += tdTag(leftTeamPts, 'right', true);
        rightTotalRow += tdTag(rightTeamPts, 'right', true);
        rightTotalRow += '</tr>' + '\n';
        playersLeft.push(leftTotalRow);
        playersRight.push(rightTotalRow);

        //pad the short side of the table with blank lines
        let columnsPerTeam = 4 + +showPowers(settings) + +showNegs(settings);
        while (playersLeft.length > playersRight.length) {
          playersRight.push(blankPlayerLineScore(columnsPerTeam) + '\n' + '</tr>' + '\n');
        }
        while (playersLeft.length < playersRight.length) {
          playersLeft.push('<tr>' + '\n' + blankPlayerLineScore(columnsPerTeam) + '\n');
        }

        //interleave left and right rows
        for(var i in playersLeft) {
          html += playersLeft[i] + tdTag('&nbsp;') + playersRight[i]; // add an empty column as a buffer between the two teams
        }

        //end player tables
        html += '</table>' + '\n';
        html += '<br>' + '\n';

        //lightning rounds
        if(settings.lightning) {
          html += 'Lightning Rounds: ' + g.team1 + ' ' + +g.lightningPts1 +
            '; ' + g.team2 + ' ' + +g.lightningPts2 + '\n<br>\n';
        }

        // bonus conversion
        if(showBonus(settings)) {
          let bHeard = bonusesHeard(g, 1), bPts = bonusPoints(g, 1, settings);
          let ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += 'Bonuses: ' + g.team1 + ' ' + bHeard + ' heard, ' + bPts + ' pts, ' + ppb.toFixed(2) + ' PPB; ';
          bHeard = bonusesHeard(g, 2), bPts = bonusPoints(g, 2, settings);
          ppb = bHeard == 0 ? 0 : bPts / bHeard;
          html += g.team2 + ' ' + bHeard + ' heard, ' + bPts + ' pts, ' + ppb.toFixed(2) + ' PPB <br>' + '\n';
        }
        // bounceback conversion
        if(showBb(settings)) {
          let bbHrd = bbHeard(g, 1, settings);
          let ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts1 / bbHrdToFloat(bbHrd);
          html += 'Bouncebacks: ' + g.team1 + ' ' +
            bbHrdDisplay(bbHrd) + ' heard, ' + g.bbPts1 + ' pts, ' + ppbb.toFixed(2) + ' PPBB; ';
          bbHrd = bbHeard(g, 2, settings);
          ppbb = bbHrd.toString()=='0,0' ? 0 : g.bbPts2 / bbHrdToFloat(bbHrd);
          html += g.team2 + ' ' + bbHrdDisplay(bbHrd) + ' heard, ' + g.bbPts2 + ' pts, ' +
            ppbb.toFixed(2)  + ' PPBB<br>' + '\n';
        }
        html += '<br><br>' + '\n'; // + '</p>' + '\n';
      }//else not a forfeit
    }//if we want to show this game
  }//loop over all games
  return html + '<hr>' + '\n';
}//scoreboardGameSummaries

/**
 * Header row for the table containing a team's games on the team detail page
 * @param  packetsExist whether or not we need a column for packet names
 * @param  settings     tournament settings object
 * @param  rptConfig    report configuration object
 * @return              <tr> element
 */
function teamDetailGameTableHeader(packetsExist: boolean, settings: TournamentSettings,
  rptConfig: RptConfig): string {

  let html = '<tr>' + '\n' +
    tdTag('Rd.', 'center', true, TOOLTIPS.round) +
    tdTag('Opponent', 'left', true) +
    tdTag('Result', 'left', true) +
    tdTag('PF', 'right', true) +
    tdTag('PA', 'right', true);
  if(showPowers(settings)) {
    html += tdTag(powerValue(settings), 'right', true);
  }
  html += tdTag('10', 'right', true);
  if(showNegs(settings)) {
    html += tdTag('-5', 'right', true);
  }
  html += tdTag('TUH', 'right', true, TOOLTIPS.tuh);
  if(showPptuh(rptConfig)) {
    html += tdTag('PPTUH', 'right', true, TOOLTIPS.pptuh);
  }
  if(showPp20(rptConfig)) {
    html += tdTag('PP20', 'right', true, TOOLTIPS.pp20);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag('Pwr/N', 'right', true, TOOLTIPS.pPerN);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag('G/N', 'right', true, TOOLTIPS.gPerN);
  }
  if(showLtng(settings)) {
    html += tdTag('Ltng', 'right', true, TOOLTIPS.lightning);
  }
  if(showBonus(settings)) {
    html += tdTag('BHrd', 'right', true, TOOLTIPS.bHeard) +
      tdTag('BPts', 'right', true, TOOLTIPS.bPts) +
      tdTag('PPB', 'right', true, TOOLTIPS.ppb);
  }
  if(showBb(settings)) {
    html += tdTag('BBHrd', 'right', true, TOOLTIPS.bbHeard) +
      tdTag('BBPts', 'right', true, TOOLTIPS.bbPts) +
      tdTag('PPBB', 'right', true, TOOLTIPS.ppbb);
  }
  if(packetsExist) {
    html += tdTag('Packet', 'left', true);
  }
  html += '</tr>'  + '\n';
  return html;
}

/**
 * A mostly-blank row in a team detail table for a forfeit.
 * @param  opponent   name of the other team
 * @param  round      round number
 * @param  result     W or L
 * @param  roundStyle phase color for the round column
 * @param  emptyCols  number of additional columns needed to fill out the row
 * @return            <tr> element
 */
function forfeitRow(opponent: string, round: number, result: 'W' | 'L',
  roundStyle: string, emptyCols: number) {

  let html = '<tr>' + '\n' +
    tdTag(round, 'center', false, null, roundStyle) +
    tdTag(opponent, 'left') +
    tdTag(result, 'left') +
    tdTag('Forfeit', 'right');
  while(emptyCols-- > 0) {
    html += tdTag('');
  }
  return html + '</tr>' + '\n';
}

/**
 * Get the background inline CSS for the round column. Color-coded to match phase
 * colors in the application
 * @param  gamePhases  list of phases the game belongs to
 * @param  phaseColors list of colors indexed by phase name
 * @param  tiebreaker  whether the game is a tiebreaker
 * @return             css to add to the table cell
 */
function getRoundStyle(gamePhases: string[], phaseColors: { [phase: string]: string },
  tiebreaker: boolean): string {

  if(tiebreaker) {
    return 'background-color: #9e9e9e';
  }
  if(gamePhases.length == 1) {
    return 'background-color: ' + phaseColors[gamePhases[0]];
  }
  if(gamePhases.length == 2) {
    return 'background-image: linear-gradient(to bottom right, ' +
      phaseColors[gamePhases[0]] + ' 50%, ' + phaseColors[gamePhases[1]] + ' 51%)';
  }
  if(gamePhases.length > 2) {
    return 'background-image: linear-gradient(to bottom right, ' +
      phaseColors[gamePhases[0]] + ' 33%, ' + phaseColors[gamePhases[1]] + ' 34%, ' +
      phaseColors[gamePhases[1]] + ' 66%, ' + phaseColors[gamePhases[2]] + ' 67%)';
  }
  return '';
}

/**
 * Floating table to explain what the colors mean. Some of the style here will be
 * redundant on the team and player detail pages, but it's needed for the scoreboard
 * page since it doesn't use tableStyle
 * @param  phaseColors list of colors indexed by phase name
 * @return             <table> element
 */
function phaseLegend(phaseColors: { [phase: string]: string }): string {
  let html = '<table border=0 class="phaseLegend"' +
    ' style="bottom:20px;right:35px;position:fixed;box-shadow: 4px 4px 7px #999999;border-spacing:0;border-collapse:separate;">' + '\n';
  for(let p in phaseColors) {
    html += '<tr>' + '\n';
    html += tdTag('&nbsp;&nbsp;&nbsp;&nbsp;', null, false, null, 'background-color:' + phaseColors[p] + ';padding:5px');
    html += tdTag(p, null, false, null, 'background-color:white;padding:5px');
    html += '</tr>' + '\n';
  }
  html += '</table>' + '\n';
  return html;
}

/**
 * Row for a single game for a single team on the team detail page
 * @param  game         game object
 * @param  whichTeam    team 1 or 2
 * @param  packetsExist whether to add a column for the packet name
 * @param  packets      list of packet names, indexed by round
 * @param  settings     tournament settings object
 * @param  phaseColors  [description]
 * @param  formatRdCol  whether to color the background of the Round number column
 * @param  fileStart    start of file name, used to make links
 * @param  rptConfig    report configuration object
 * @return              <tr> element
 */
function teamDetailGameRow(game: YfGame, whichTeam: WhichTeam, packetsExist: boolean,
  packets: PacketList, settings: TournamentSettings, phaseColors: { [phase: string]: string },
  formatRdCol: boolean, fileStart: string, rptConfig: RptConfig): string {

  let opponent: string, opponentScore: number, result: string, score: number;
  const roundStyle = formatRdCol ? getRoundStyle(game.phases, phaseColors, game.tiebreaker) : null;

  let emptyCols = 4 + +showPowers(settings) + +showNegs(settings) + +showPPerN(settings, rptConfig) +
    +showGPerN(settings, rptConfig) + 3*(+showBonus(settings)) + 3*(+showBb(settings)) + +packetsExist;

  if(whichTeam == 1) {
    opponent = game.team2;
    if(game.forfeit) { //team1 is arbitrarily the winner of a forfeit
      return forfeitRow(opponent, game.round, 'W', roundStyle, emptyCols);
    }
    if(game.score1 > game.score2) { result = 'W'; }
    else if(game.score1 < game.score2) { result = 'L'; }
    else { result = 'T'; }
    score = game.score1;
    opponentScore = game.score2;
  }
  else {
    opponent = game.team1;
    if(game.forfeit) { //team2 is arbitrarily the loser of a forfeit
      return forfeitRow(opponent, game.round, 'L', roundStyle, emptyCols);
    }
    if(game.score2 > game.score1) { result = 'W'; }
    else if(+game.score2 < +game.score1) { result = 'L'; }
    else { result = 'T'; }
    score = game.score2;
    opponentScore = game.score1;
  }
  if(game.ottu > 0) { result += ' (OT)'; }
  const powers = teamPowers(game, whichTeam);
  const tens = teamTens(game, whichTeam);
  const negs = teamNegs(game, whichTeam);
  const ppth = (score - otPoints(game, whichTeam, settings)) / (game.tuhtot - game.ottu);
  const pp20 = 20*ppth;
  const pPerN = powers / negs;
  const gPerN = (powers + tens) / negs;
  const lightning = whichTeam == 1 ? game.lightningPts1 : game.lightningPts2;
  const bHeard = bonusesHeard(game, whichTeam);
  const bPts = bonusPoints(game, whichTeam, settings);
  const ppb = bPts / bHeard;
  const bbHrd = bbHeard(game, whichTeam, settings);
  const bbPts = whichTeam == 1 ? game.bbPts1 : game.bbPts2;
  const ppbb = bbPts / bbHrdToFloat(bbHrd);

  const linkId = scoreboardLinkID(game);
  let html = '<tr>' + '\n';
  html += tdTag(game.round, 'center', false, null, roundStyle);
  html += tdTag(opponent, 'left');
  html += tdTag('<a HREF=' + fileStart + 'games.html#' + linkId + '>' + result + '</a>', 'left');
  html += tdTag(score, 'right');
  html += tdTag(opponentScore, 'right');
  if(showPowers(settings)) {
    html += tdTag(powers, 'right');
  }
  html += tdTag(tens, 'right');
  if(showNegs(settings)) {
    html += tdTag(negs, 'right');
  }
  html += tdTag(game.tuhtot, 'right');
  if(showPptuh(rptConfig)) {
    html += tdTag(formatRate(ppth, 2), 'right');
  }
  if(showPp20(rptConfig)) {
    html += tdTag(formatRate(pp20, 1), 'right');
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag(formatRate(pPerN, 2), 'right');
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag(formatRate(gPerN, 2), 'right');
  }
  if(showLtng(settings)) {
    html += tdTag(lightning, 'right');
  }
  if(showBonus(settings)) {
    html += tdTag(bHeard, 'right');
    html += tdTag(bPts, 'right');
    html += tdTag(formatRate(ppb, 2), 'right');
  }
  if(showBb(settings)) {
    html += tdTag(bbHrdDisplay(bbHrd), 'right');
    html += tdTag(bbPts, 'right');
    html += tdTag(formatRate(ppbb, 2), 'right');
  }
  if(packetsExist) {
    var packetName = packets[game.round] == undefined ? '' : packets[game.round];
    html += tdTag(packetName, 'left');
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * The totals row of a games table on the team detail page.
 * @param  teamSummary  stats and info for one team
 * @param  packetsExist whether to make a column for packet name (empty here)
 * @param  settings     tournament settings object
 * @param  rptConfig    report configuration object
 * @return              <tr> element
 */
function teamDetailTeamSummaryRow(teamSummary: TeamStandingsLine, packetsExist: boolean,
  settings: TournamentSettings, rptConfig: RptConfig): string {

  let html = '<tr class="pseudo-tfoot">' + '\n';
  html += tdTag('', null, false);
  html += tdTag('Total', 'left', true);
  html += tdTag('');
  html += tdTag(teamSummary.points, 'right', true);
  html += tdTag(teamSummary.ptsAgainst, 'right', true);
  if(showPowers(settings)) {
    html += tdTag(teamSummary.powers, 'right', true);
  }
  html += tdTag(teamSummary.tens, 'right', true);
  if(showNegs(settings)) {
    html += tdTag(teamSummary.negs, 'right', true);
  }
  html += tdTag(teamSummary.tuh, 'right', true);
  if(showPptuh(rptConfig)) {
    html += tdTag(teamSummary.ppth, 'right', true);
  }
  if(showPp20(rptConfig)) {
    html += tdTag(teamSummary.pp20, 'right', true);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag(teamSummary.pPerN, 'right', true);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag(teamSummary.gPerN, 'right', true);
  }
  if(showLtng(settings)) {
    html += tdTag(teamSummary.lightning, 'right', true);
  }
  if(showBonus(settings)) {
    html += tdTag(teamSummary.bHeard, 'right', true);
    html += tdTag(teamSummary.bPts, 'right', true);
    html += tdTag(teamSummary.ppb, 'right', true);
  }
  if(showBb(settings)) {
    html += tdTag(bbHrdDisplay(teamSummary.bbHeard), 'right', true);
    html += tdTag(teamSummary.bbPts, 'right', true);
    html += tdTag(teamSummary.ppbb, 'right', true);
  }
  if(packetsExist) {
    html += tdTag('');
  }
  html += '</tr>' + '\n';

  return html;
}

/**
 * Header row for the table of a teams's players on the team detail page
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @return           <tr> element
 */
function teamDetailPlayerTableHeader(settings: TournamentSettings, rptConfig: RptConfig): string {
  let html = '<tr>' + '\n' +
    tdTag('Player', 'left', true);
  if(showPlayerYear(rptConfig)) {
    html += tdTag('Year', 'left', true);
  }
  if(showPlayerUG(rptConfig)) {
    html += tdTag('UG', 'left', true, TOOLTIPS.playerUG);
  }
  if(showPlayerD2(rptConfig)) {
    html += tdTag('D2', 'left', true, TOOLTIPS.playerD2);
  }
  if(showPlayerCombined(rptConfig)) {
    html += tdTag('', 'left', true);
  }
  html += tdTag('Team', 'left', true) +
    tdTag('GP', 'right', true, TOOLTIPS.gamesPlayed);
  if(showPowers(settings)) {
    html += tdTag(powerValue(settings), 'right', true);
  }
  html += tdTag('10', 'right', true);
  if(showNegs(settings)) {
    html += tdTag('-5', 'right', true);
  }
  html += tdTag('TUH', 'right', true, TOOLTIPS.tuh);
  if(showPptuh(rptConfig)) {
    html += tdTag('PPTUH', 'right', true, TOOLTIPS.pptuh);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag('Pwr/N', 'right', true, TOOLTIPS.pPerN);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag('G/N', 'right', true, TOOLTIPS.gPerN);
  }
  html += tdTag('Pts', 'right', true);
  if(showPpg(rptConfig)) {
    html += tdTag('PPG', 'right', true, TOOLTIPS.ppg);
  }
  else {
    html += tdTag('PP20', 'right', true, TOOLTIPS.pp20);
  }
  return html + '</tr>' + '\n';
}

/**
 * Row for a single player on the team detail page.
 * @param  player    stats and info for one player
 * @param  fileStart start of the file name, for making links
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @return           <tr> element
 */
function teamDetailPlayerRow(player: PlayerStandingsLine, fileStart: string,
  settings: TournamentSettings, rptConfig: RptConfig): string {

  const linkId = player.teamName.replace(/\W/g, '') + '-' +
    player.playerName.replace(/\W/g, '');
  let html = '<tr>' + '\n';
  html += tdTag('<a HREF=' + fileStart + 'playerdetail.html#' + linkId + '>' + player.playerName + '</a>', 'left');
  if(showPlayerYear(rptConfig)) {
    html += tdTag(player.year, 'left');
  }
  if(showPlayerUG(rptConfig)) {
    html += tdTag(player.undergrad ? 'UG' : '', 'left');
  }
  if(showPlayerD2(rptConfig)) {
    html += tdTag(player.div2 ? 'D2' : '', 'left');
  }
  if(showPlayerCombined(rptConfig)) {
    let plComb = '';
    if(player.div2) { plComb = 'D2'; }
    else if(player.undergrad) { plComb = 'UG'; }
    html += tdTag(plComb, 'left');
  }
  html += tdTag(player.teamName, 'left');
  html += tdTag(player.gamesPlayed, 'right');
  if(showPowers(settings)) {
    html += tdTag(player.powers, 'right');
  }
  html += tdTag(player.tens, 'right');
  if(showNegs(settings)) {
    html += tdTag(player.negs, 'right');
  }
  html += tdTag(player.tuh, 'right');
  if(showPptuh(rptConfig)) {
    html += tdTag(player.pptu, 'right');
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag(player.pPerN, 'right');
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag(player.gPerN, 'right');
  }
  html += tdTag(player.points, 'right');
  if(showPpg(rptConfig)) {
    html += tdTag(player.ppg, 'right');
  }
  else {
    html += tdTag(player.pp20, 'right');
  }
  html += '</tr>' + '\n';

  return html;
}

/**
 * Header row for a table on the player detail page.
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @return           <tr> element
 */
function playerDetailTableHeader(settings: TournamentSettings, rptConfig: RptConfig): string {
  let html = '<tr>' + '\n' +
    tdTag('Rd.', 'center', true, TOOLTIPS.round) +
    tdTag('Opponent', 'left', true) +
    tdTag('Result', 'left', true) +
    tdTag('GP', 'right', true, TOOLTIPS.gamesPlayed);
  if(showPowers(settings)) {
    html += tdTag(powerValue(settings), 'right', true);
  }
  html += tdTag('10', 'right', true);
  if(showNegs(settings)) {
    html += tdTag('-5', 'right', true);
  }
  html += tdTag('TUH', 'right', true, TOOLTIPS.tuh);
  if(showPptuh(rptConfig)) {
    html += tdTag('PPTUH', 'right', true, TOOLTIPS.pptuh);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag('Pwr/N', 'right', true, TOOLTIPS.pPerN);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag('G/N', 'right', true, TOOLTIPS.gPerN);
  }
  html += tdTag('Pts', 'right', true);
  if(showPp20(rptConfig)) {
    html += tdTag('PP20', 'right', true, TOOLTIPS.pp20)
  }
  return html;
}

/**
 * Generate a link, showing the outcome of the game, to the specified game on the
 * scoreboard page
 * @param  game      game object
 * @param  whichTeam team 1 or 2
 * @param  fileStart start of the filename, for making link
 * @return           <a> element
 */
function playerDetailGameLink(game: YfGame, whichTeam: WhichTeam, fileStart: string): string {
  let result: string;
  if(whichTeam == 1) {
    if(game.score1 > game.score2) { result = 'W'; }
    else if(game.score1 < game.score2) { result = 'L'; }
    else { result = 'T'; }
    result += ' ' + game.score1 + '-' + game.score2;
  }
  else {
    if(game.score2 > game.score1) { result = 'W'; }
    else if(game.score2 < game.score1) { result = 'L'; }
    else { result = 'T'; }
    result += ' ' + game.score2 + '-' + game.score1;
  }
  if(game.ottu > 0) { result += ' (OT)'; }
  const linkId = scoreboardLinkID(game);
  return `<a HREF=${fileStart}games.html#${linkId}>${result}</a>`;
}

/**
 * Row for one game for one player on the player detail page.
 * @param  player      player's stats for this game
 * @param  tuhtot      total tossups in the game
 * @param  opponent    other team's name
 * @param  round       round number
 * @param  link        <a> element with the outcome and score of the game
 * @param  settings    tournament settings object
 * @param  gamePhases  list of phases this game belongs to
 * @param  phaseColors list of colors indexed by phase name
 * @param  formatRdCol whether to color the background of the round number column
 * @param  rptConfig   report configuration object
 * @param  tiebreaker  whether this game is a tiebreaker
 * @return             <tr> element
 */
function playerDetailGameRow(player: PlayerLine, tuhtot: number, opponent: string, round: number,
  link: string, settings: TournamentSettings, gamePhases: string[], phaseColors: { [phase: string]: string },
  formatRdCol: boolean, rptConfig: RptConfig, tiebreaker: boolean): string {

  const [tuh, powers, tens, negs] = playerSlashLine(player);
  if(tuh <= 0) {
    return '';
  }
  const gp = tuh / tuhtot;
  const points = powerValue(settings)*powers + 10*tens - 5*negs;
  const pptu = points / tuh;
  const pp20 = 20*pptu;
  const pPerN = powers / negs;
  const gPerN = (powers + tens) / negs;

  const roundStyle = formatRdCol ? getRoundStyle(gamePhases, phaseColors, tiebreaker) : null;

  let html = '<tr>' + '\n';
  html += tdTag(round, 'center', false, null, roundStyle);
  html += tdTag(opponent, 'left');
  html += tdTag(link, 'left');
  html += tdTag(formatRate(gp, 1), 'right');
  if(showPowers(settings)) {
    html += tdTag(powers, 'right');
  }
  html += tdTag(tens, 'right');
  if(showNegs(settings)) {
    html += tdTag(negs, 'right');
  }
  html += tdTag(tuh, 'right');
  if(showPptuh(rptConfig)) {
    html += tdTag(formatRate(pptu, 2), 'right');
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag(formatRate(pPerN, 2), 'right');
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag(formatRate(gPerN, 2), 'right');
  }
  html += tdTag(points, 'right');
  if(showPp20(rptConfig)) {
    html += tdTag(formatRate(pp20, 1), 'right');
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * Total row for a table on the player detail page. Reuse results of compileIndividuals
 * @param  player    stats and info for one player
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @return           <tr> element
 */
function playerDetailTotalRow(player: PlayerStandingsLine, settings: TournamentSettings, rptConfig: RptConfig): string {
  let html = '<tr class="pseudo-tfoot">' + '\n';
  html += tdTag('', null, false);
  html += tdTag('Total', 'left', true);
  html += tdTag('');
  html += tdTag(player.gamesPlayed, 'right', true);
  if(showPowers(settings)) {
    html += tdTag(player.powers, 'right', true);
  }
  html += tdTag(player.tens, 'right', true);
  if(showNegs(settings)) {
    html += tdTag(player.negs, 'right', true);
  }
  html += tdTag(player.tuh, 'right', true);
  if(showPptuh(rptConfig)) {
    html += tdTag(player.pptu, 'right', true);
  }
  if(showPPerN(settings, rptConfig)) {
    html += tdTag(player.pPerN, 'right', true);
  }
  if(showGPerN(settings, rptConfig)) {
    html += tdTag(player.gPerN, 'right', true);
  }
  html += tdTag(player.points, 'right', true);
  if(showPp20(rptConfig)) {
    html += tdTag(player.pp20, 'right', true);
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * Aggregate round data for the round report.
 * @param  games    list of game objects
 * @param  phase    name of the phase we're showing
 * @param  settings tournament settings object
 * @param  showTbs  whether to include tiebreakers
 * @return          tuple: first element is the list of summaries for each round;
 *                  second element is the summary for the whole tournament
 */
function compileRoundSummaries(games: YfGame[], phase: string, settings: TournamentSettings,
  showTbs: boolean): [RoundSummary[], RoundSummary] {

  let summaries: RoundSummary[] = [];
  let tournTotals: RoundSummary = {
    numberOfGames: 0, totalPoints: 0,
    tuPts: 0, tuh: 0,
    bPts: 0, bHeard: 0,
    bbPts: 0, bbHeard: [0,0],
    ppg: 0, pp20: 0,
    tuPtsPTu: 0,
    ppb: 0, ppbb: 0,
    ltngPts: 0, ppLtng: 0
  };

  for(let game of games) {
    const round = game.round;
    if(matchFilterPhase(game, phase, showTbs) && !game.forfeit) {
      if(summaries[round] == undefined) {
        summaries[round] = {
          numberOfGames: 0, totalPoints: 0,
          tuPts: 0, tuh: 0,
          bPts: 0, bHeard: 0,
          bbPts: 0, bbHeard: [0,0],
          ppg: 0, pp20: 0,
          tuPtsPTu: 0,
          ppb: 0, ppbb: 0,
          ltngPts: 0, ppLtng: 0
        }
      }

      let smry = summaries[round];
      let gamePoints = (+game.score1) + (+game.score2) -
        otPoints(game, 1, settings) - otPoints(game, 2, settings);
      let gameTuPts = powerValue(settings)*teamPowers(game, 1) +
        powerValue(settings)*teamPowers(game, 2) +
        10*teamTens(game, 1) + 10*teamTens(game, 2) +
        negValue(settings)*teamNegs(game, 1) + negValue(settings)*teamNegs(game, 2);
      let gameBonusPts = bonusPoints(game, 1, settings) + bonusPoints(game, 2, settings);
      let gameBHeard = bonusesHeard(game, 1) + bonusesHeard(game, 2);
      let gameBbPts = (+game.bbPts1) + (+game.bbPts2);
      let gameBbHrd = bbHrdAdd(bbHeard(game, 1 ,settings), bbHeard(game, 2, settings));
      let gameLtngPts = +game.lightningPts1 + +game.lightningPts2;

      smry.numberOfGames += 1;
      smry.totalPoints += gamePoints;
      smry.tuPts += gameTuPts;
      smry.tuh += +game.tuhtot;
      smry.bPts += gameBonusPts;
      smry.bHeard += gameBHeard;
      smry.bbPts += gameBbPts;
      smry.bbHeard = bbHrdAdd(smry.bbHeard, gameBbHrd);
      smry.ltngPts += gameLtngPts;

      tournTotals.numberOfGames += 1;
      tournTotals.totalPoints += gamePoints;
      tournTotals.tuPts += gameTuPts;
      tournTotals.tuh += +game.tuhtot;
      tournTotals.bPts += gameBonusPts;
      tournTotals.bHeard += gameBHeard;
      tournTotals.bbPts += gameBbPts;
      tournTotals.bbHeard = bbHrdAdd(tournTotals.bbHeard, gameBbHrd);
      tournTotals.ltngPts += gameLtngPts;
    }
  }

  for(let r in summaries) {
    let smry = summaries[r];
    smry.ppg = smry.totalPoints / (2 * smry.numberOfGames);
    smry.pp20 = 20 * smry.totalPoints / (2 * smry.tuh);
    smry.tuPtsPTu = smry.tuPts / smry.tuh;
    smry.ppb = smry.bHeard == 0 ? 0 : smry.bPts / smry.bHeard;
    smry.ppbb = smry.bbPts / bbHrdToFloat(smry.bbHeard);
    smry.ppLtng = smry.ltngPts / (2 * smry.numberOfGames);
  }
  tournTotals.ppg = tournTotals.totalPoints / (2 * tournTotals.numberOfGames);
  tournTotals.pp20 = 20 * tournTotals.totalPoints / (2 * tournTotals.tuh);
  tournTotals.tuPtsPTu = tournTotals.tuPts / tournTotals.tuh;
  tournTotals.ppb = tournTotals.bHeard == 0 ? 0 : tournTotals.bPts / tournTotals.bHeard;
  tournTotals.ppbb = tournTotals.bbPts / bbHrdToFloat(tournTotals.bbHeard);
  tournTotals.ppLtng = tournTotals.ltngPts / (2 * tournTotals.numberOfGames);

  return [summaries,tournTotals];
}

/**
 * Header row for the table in the round report.
 * @param  packetsExist whether to make a column for packet names
 * @param  settings     tournament settings object
 * @param  rptConfig    report configuration object
 * @return              <tr> element
 */
function roundReportTableHeader(packetsExist: boolean, settings: TournamentSettings, rptConfig: RptConfig): string {
  let html = '<tr>' + '\n' +
    tdTag('Round', 'left', true);
  if(packetsExist) {
    html += tdTag('Packet', 'left', true);
  }
  html += tdTag('No. Games', 'right', true);
  if(showPpg(rptConfig)) {
    html += tdTag('PPG/Team', 'right', true, TOOLTIPS.ppgPerTeam);
  }
  else { //show pp20
    html += tdTag('PP20/Team', 'right', true, TOOLTIPS.pp20PerTeam);
  }
  if(showBonus(settings)) {
    html += tdTag('TUPts/TUH', 'right', true, TOOLTIPS.tuPtsPTu);
  }
  if(showLtng(settings)) {
    html += tdTag('PPLtng', 'right', true, TOOLTIPS.ppLtng)
  }
  if(showBonus(settings)) {
    html += tdTag('PPB', 'right', true, TOOLTIPS.ppb);
  }
  else { html += tdTag('Pts/TUH', 'right', true, TOOLTIPS.tuPtsPTu); }
  if(showBb(settings)) {
    html += tdTag('PPBB', 'right', true, TOOLTIPS.ppbb);
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * A row of data in the round report. If roundNo is "Total", format as the aggregate row
 * @param  smry         round summary object
 * @param  roundNo      round number
 * @param  packetsExist whether to create a column for packet name
 * @param  packets      packet names, indexed by their round numbers
 * @param  settings     tournament settings object
 * @param  rptConfig    report configuration object
 * @param  fileStart    start of file name, for making links
 * @return              <tr> element
 */
function roundReportRow(smry: RoundSummary, roundNo: number | 'Total', packetsExist: boolean,
  packets: PacketList, settings: TournamentSettings, rptConfig: RptConfig, fileStart: string): string {

  const totalRow = roundNo == 'Total';
  let rowLabel: any;
  if(totalRow) { rowLabel = roundNo; }
  else {
    rowLabel = '<a HREF=' + fileStart + 'games.html#round-' + roundNo + '>' + roundNo + '</a>';
  }
  let html = '<tr';
  if(totalRow) { html += ' class="pseudo-tfoot"'; }
  html += '>' + '\n';
  html += tdTag(rowLabel, 'left', totalRow);
  if(packetsExist) {
    let packetName = packets[roundNo] == undefined ? '' : packets[roundNo];
    html += tdTag(packetName, 'left');
  }
  html += tdTag(smry.numberOfGames, 'right', totalRow);
  if(showPpg(rptConfig)) {
    html += tdTag(smry.ppg.toFixed(1), 'right', totalRow);
  }
  else { //pp20
    html += tdTag(smry.pp20.toFixed(1), 'right', totalRow);
  }
  html += tdTag(smry.tuPtsPTu.toFixed(2), 'right', totalRow);
  if(showLtng(settings)) {
    html += tdTag(smry.ppLtng.toFixed(2), 'right', totalRow);
  }
  if(showBonus(settings)) {
    html += tdTag(smry.ppb.toFixed(2), 'right', totalRow);
  }
  if(showBb(settings)) {
    html += tdTag(smry.ppbb.toFixed(2), 'right', totalRow);
  }
  html += '</tr>' + '\n';
  return html;
}

/**
 * The links at the top of every page of the report
 * @param  fileStart directory and beginning of the file name
 * @param  pageTitle title of the page
 * @return           the beginning of the html file
 */
function getStatReportTop(fileStart: string, pageTitle: string): string {
  // some tags need to be in all caps in order for HSQuizbowl to recognize the
  // file as a valid stat report.
  return '<HTML>' + '\n' +
    '<HEAD>' + '\n' +
    '<link rel="stylesheet" HREF="hsqb-style.css">' + '\n' +
    '<title>' + pageTitle + '</title>' + '\n' +
    '</HEAD>' + '\n' +
    '<BODY>' + '\n' +
    '<table border=0 width=100%>' + '\n' +
    '<tr>' + '\n' +
      '<td><a HREF=' + fileStart + 'standings.html>Standings</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'individuals.html>Individuals</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'games.html>Scoreboard</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'teamdetail.html>Team Detail</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'playerdetail.html>Individual Detail</a></td>' + '\n' +
      '<td><a HREF=' + fileStart + 'rounds.html>Round Report</a></td>' + '\n' +
    '</tr>' + '\n' +
    '</table>' + '\n';
}

/**
 * Closing tags at the end of the page.
 * @param  yfVersion version of this software that generated the report
 * @return           html
 */
function getStatReportBottom(yfVersion?: string): string {
  let html = '<span style="font-size:x-small">Made with YellowFruit &#x1F34C;</span>' + '\n'; // banana emoji
  if(yfVersion) {
    html += '<span style="font-size:x-small; color:white">&nbsp;' + yfVersion + '</span>' + '\n';
  }
  return html +
    '</BODY>' + '\n' +
    '</HTML>';
}

/**
 * Stylesheet for table formatting. HTML5 supports putting this in the body
 * @return <style> element
 */
function tableStyle(): string {
  return '<style>\n' +
    'td {\n  padding: 5px;\n}\n' +
    'tfoot {\n  border-top: 1px solid #909090;\n}\n' + // unused currently
    'tr:nth-child(even) {\n  background-color: #f2f2f2;\n}\n' +
    // this one is needed because HSQB doesn't allow uploading files with tfoot tags >:(
    '.pseudo-tfoot {\n border-top: 1px solid #909090;\n background-color: #ffffff !important;\n}\n' +
    'table {\n  border-spacing: 0;\n  border-collapse: collapse;\n}\n' +
    '[title]:not([title=""]) {\n cursor: help;\n text-decoration: underline;\n text-decoration-style: dotted;\n}\n' +
    '.phaseLegend:hover {\n color: lightgray;\n opacity: 0.3;\n}\n' +
    '</style>\n';
}

interface StandingsPageElement {
  type: 'divLabel' | 'tableHeader' | 'row' | 'tableEnd';
  team?: TeamStandingsLine;
  rank?: number;
  isOverride?: boolean;
  curGrpPhase?: string;
  divName?: string;
}

/**
 * Generate the team standings page
 * @param  teams          list of all teams
 * @param  games          list of all games
 * @param  fileStart      directory + beginning of the filename
 * @param  phase          name of the phase we're including games from
 * @param  groupingPhases list of phases whose divisions we want to group teams by
 * @param  divsInPhase    lsit of divisions in the grouping phases
 * @param  phaseSizes     how many divisions are in each member of groupingPhases
 * @param  settings       settings object
 * @param  rptConfig      report configuration settings object
 * @param  showTbs        whether to include tiebreakers if we're showing all games
 * @param  yfVersion      version of the software that is generating this report
 * @return                the contents of the html file
 */
function getStandingsHtml(teams: YfTeam[], games: YfGame[], fileStart: string, phase: string,
  groupingPhases: string[], divsInPhase: string[], phaseSizes: { [phase: string]: number }, settings: TournamentSettings,
  rptConfig: RptConfig, showTbs: boolean, yfVersion: string): string {

  const standings = compileStandings(teams, games, phase, groupingPhases, settings, rptConfig, showTbs);
  const tiesExist = anyTiesExist(standings);
  const showPhaseRec = showPhaseRecord(rptConfig, phase, groupingPhases);

  let html = getStatReportTop(fileStart, 'Team Standings') +
    '<h1> Team Standings</h1>' + '\n';
  html += tableStyle();
  const linesToPrint = arrangeStandingsLines(standings, phase, divsInPhase, groupingPhases, phaseSizes, rptConfig);
  for(let curLine of linesToPrint) {
    switch (curLine.type) {
      case 'divLabel':
        html += '<h2>' + curLine.divName + '</h2>' + '\n';
        break;
      case 'tableHeader':
        html += '<table width=100%>' + '\n' +
          standingsHeader(settings, tiesExist, rptConfig, phase, curLine.curGrpPhase);
        break;
      case 'row':
        html += standingsRow(curLine.team, curLine.rank, fileStart, settings, tiesExist, rptConfig, showPhaseRec);
        break;
      case 'tableEnd':
        html += '</table>' + '\n';
        break;
    }
  }
  return html + getStatReportBottom(yfVersion);
}//getStandingsHtml

/**
 * Generate a list of components of the team standings
 * @param  standings      stats and info for each team
 * @param  phase          name of the phase we're showing games for
 * @param  divsInPhase    list of divisions to group teams into
 * @param  groupingPhases list of phases whose divisions we're grouping teams by
 * @param  phaseSizes     how many divisions are in each phase of groupingPhases
 * @param  rptConfig      report configuration object
 * @return                list of elements on the standings page
 */
export function arrangeStandingsLines(standings: TeamStandingsLine[], phase: string, divsInPhase: string[],
  groupingPhases: string[], phaseSizes: { [phase: string]: number }, rptConfig: RptConfig): StandingsPageElement[] {

  let linesToPrint: StandingsPageElement[] = [];
  const showPhaseRec = showPhaseRecord(rptConfig, phase, groupingPhases);
  if(divsInPhase && divsInPhase.length > 0) {
    // intitial rank from which to start incrementing. is either the number of teams in
    // divisions we've already gone through; or the most recent rank override
    let baselineRank = 0;
    let divCount = 0, phaseSizeIdx = 0, curGrpPhase = groupingPhases[0]; // track which phase to put in the phase record tooltip
    for(let curDiv of divsInPhase) {
      //if we're out of divisions in this grouping phase, move on to the next one
      divCount++;
      if(divCount > phaseSizes[curGrpPhase]) {
        curGrpPhase = groupingPhases[++phaseSizeIdx];
        divCount = 1;
      }
      // if(+i >= phaseSizes[phaseSizeIdx+1]) {
      //   curGrpPhase = groupingPhases[++phaseSizeIdx];
      // }
      linesToPrint.push({type: 'divLabel', divName: curDiv});
      linesToPrint.push({type: 'tableHeader', curGrpPhase: curGrpPhase});
      let teamsInDiv = _.filter(standings, (t) => { return t.division == curDiv });
      let curRank = 0, prevPhaseRecord = null;
      let countSinceLastOverride = 0; // number of teams we've gone through since th last rank override
      for(let curTeam of teamsInDiv) {
        let isOverride = false;
        //if rank was manually overridden, use that
        if(phase == 'all' && curTeam.rank) {
          isOverride = true;
          baselineRank = +curTeam.rank;
          curRank = +curTeam.rank;
        }
        //if not overridden, but the previous one was, always increment from the previous rank
        //...also covers the first team in a division, which is fine
        else if(phase == 'all' && countSinceLastOverride == 0) {
          curRank = baselineRank + 1;
          countSinceLastOverride++;
        }
        //increment the rank, unless we're showing phase records and
        else if(!showPhaseRec || prevPhaseRecord == null || curTeam.phaseWinPct != prevPhaseRecord) {
          curRank = baselineRank + countSinceLastOverride + 1;
          countSinceLastOverride++;
        }
        //don't change the rank if there's a tie in phase record
        else {
          countSinceLastOverride++;
        }
        linesToPrint.push({type: 'row', team: curTeam, rank: curRank, isOverride: isOverride});
        prevPhaseRecord = curTeam.phaseWinPct;
      }
      if(showPhaseRec) { baselineRank = baselineRank + countSinceLastOverride; }
      else { baselineRank = 0; } // don't carry over rank to next division - start over at 1
      linesToPrint.push({type: 'tableEnd'});
    }
  }
  else { //not using divisions
    linesToPrint.push({type: 'tableHeader', curGrpPhase: null});
    let curRank = 0;
    for(let curTeam of standings) {
      let isOverride = false;
      if(phase != 'Tiebreakers' || curTeam.wins + curTeam.losses + curTeam.ties > 0) {
        if(curTeam.rank) {
          curRank = +curTeam.rank;
          isOverride = true;
        }
        else { curRank += 1; }
        linesToPrint.push({type: 'row', team: curTeam, rank: curRank, isOverride: isOverride});
      }
    }
    linesToPrint.push({type: 'tableEnd'});
  }
  return linesToPrint;
}

/**
 * Generate the individual standings page.
 * @param  teams          list of team objects
 * @param  games          list of game objects
 * @param  fileStart      start of file name, to use for links
 * @param  phase          name of phase to show games for
 * @param  groupingPhases list of phases whose divisions we're using to group teams
 * @param  usingDivisions whether we need to group teams into divisions
 * @param  settings       tournament settings object
 * @param  rptConfig      report configuration object
 * @param  showTbs        whether to include tiebreakers
 * @return                html contents of the page
 */
function getIndividualsHtml(teams: YfTeam[], games: YfGame[], fileStart: string, phase: string,
  groupingPhases: string[], usingDivisions: boolean, settings: TournamentSettings,
  rptConfig: RptConfig, showTbs: boolean): string {

  const individuals = compileIndividuals(teams, games, phase, groupingPhases, settings, showTbs);
  let html = getStatReportTop(fileStart, 'Individual Standings') +
    '<h1> Individual Statistics</h1>' + '\n';
  html += tableStyle();
  html += '<table width=100%>' + individualsHeader(usingDivisions, settings, rptConfig);
  for(let i in individuals) {
    if(individuals[i].gamesPlayed > 0) {
      html += individualsRow(individuals[i], parseFloat(i)+1, fileStart, usingDivisions, settings, rptConfig);
    }
  }
  return html + '\n' + '</table>' + '\n' +  getStatReportBottom();
}

/**
 * Generate the scoreboard page.
 * @param  teams       list of team objects
 * @param  games       list of game objects
 * @param  fileStart   start of file name, to make links with
 * @param  phase       name of phase to show games for
 * @param  settings    tournament settings object
 * @param  packets     list of packets, indexed by round number
 * @param  phaseColors colors, indexed by phase name
 * @param  showTbs     whether to include tiebreakers
 * @return             html contents of the file
 */
function getScoreboardHtml(games: YfGame[], fileStart: string, phase: string,
  settings: TournamentSettings, packets: PacketList, phaseColors: { [phase: string]: string },
  showTbs: boolean): string {

  const roundList = getRoundsForScoreboard(games, phase, showTbs);
  let html = getStatReportTop(fileStart, 'Scoreboard') + '\n';
  html += scoreboardRoundLinks(roundList, fileStart) + '<br>' + '\n';
  html += '<h1> Scoreboard</h1>' + '\n';
  if(phase == 'all') {
    html += phaseLegend(phaseColors) + '\n';
  }
  for(let roundNo of roundList) {
    html += scoreboardRoundHeader(roundNo, packets[roundNo]);
    html += scoreboardGameSummaries(games, roundNo, phase, settings, phaseColors, showTbs);
  }
  return html + '\n' + getStatReportBottom();
}

/**
 * Generate the team detail page.
 * @param  teams       list of team objects
 * @param  games       list of game objects
 * @param  fileStart   start of file name, to use for links
 * @param  phase       name of phase to show games for
 * @param  packets     list of packet names, indexed by round number
 * @param  settings    tournament settings object
 * @param  phaseColors colors, indexed by phase name
 * @param  rptConfig   report configuration object
 * @param  showTbs     whether to include tiebreakers
 * @return             html contents of the file
 */
function getTeamDetailHtml(teams: YfTeam[], games: YfGame[], fileStart: string, phase: string,
  packets: PacketList, settings: TournamentSettings, phaseColors: { [phase: string]: string },
  rptConfig: RptConfig, showTbs: boolean): string {

  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return item.round; }, 'asc');
  const standings = compileStandings(teams, games, phase, [], settings, rptConfig, showTbs);
  const individuals = compileIndividuals(teams, games, phase, [], settings, showTbs);
  const packetsExist = packetNamesExist(packets);

  let html = getStatReportTop(fileStart, 'Team Detail') + '\n' +
    '<h1> Team Detail</h1>' + '\n';
  if(phase == 'all') { html += phaseLegend(phaseColors) + '\n'; }
  html += tableStyle();

  for(let oneTeam of teams) {
    let teamName = oneTeam.teamName;
    let teamSummary = _.find(standings, (o) => { return o.teamName == teamName; });
    if(teamSummary.wins + teamSummary.losses + teamSummary.ties == 0) { continue; }

    let linkId = teamName.replace(/\W/g, '');
    html += '<h2 style="display:inline-block" id=' + linkId + '>' + teamName + '</h2>' + '\n';
    //display UG, D2 status
    let attributes = [];
    if(showSS(rptConfig) && oneTeam.smallSchool) {
      attributes.push('SS');
    }
    if(showJV(rptConfig) && oneTeam.jrVarsity) {
      attributes.push('JV');
    }
    if((showTeamUG(rptConfig) || showTeamCombined(rptConfig)) && oneTeam.teamUGStatus) {
      attributes.push('UG');
    }
    if((showTeamD2(rptConfig) || showTeamCombined(rptConfig)) && oneTeam.teamD2Status) {
      attributes.push('D2');
    }
    let statusDisp = '';
    if(attributes.length > 0) {
      statusDisp += '<span style=" font-style: italic; color: gray">';
      statusDisp += attributes.join(', ');
      statusDisp += '</span>' + '\n';
    }
    html += statusDisp;
    // list games
    html += '<table width=100%>' + '\n';
    html += teamDetailGameTableHeader(packetsExist, settings, rptConfig) + '\n';
    for(let oneGame of games) {
      let gameInPhase = matchFilterPhase(oneGame, phase, showTbs);
      var formatRdCol = phase == 'all' && (oneGame.phases.length > 0 || oneGame.tiebreaker);
      if(gameInPhase && oneGame.team1 == teamName) {
        html += teamDetailGameRow(oneGame, 1, packetsExist, packets, settings,
          phaseColors, formatRdCol, fileStart, rptConfig);
      }
      else if(gameInPhase && oneGame.team2 == teamName) {
        html += teamDetailGameRow(oneGame, 2, packetsExist, packets, settings,
          phaseColors, formatRdCol, fileStart, rptConfig);
      }
    }
    html += teamDetailTeamSummaryRow(teamSummary, packetsExist, settings, rptConfig);
    html += '</table>' + '<br>' + '\n';
    html += '<table width=100%>' + '\n';
    html += teamDetailPlayerTableHeader(settings, rptConfig) + '\n';
    for(let player of individuals) {
      if(player.teamName == teamName && player.gamesPlayed > 0) {
        html += teamDetailPlayerRow(player, fileStart, settings, rptConfig);
      }
    }
    html += '</table>' + '<br>' + '\n';
  } // loop over teams
  return html + getStatReportBottom();
}//getTeamDetailHtml

/**
 * Generate the player detail page.
 * @param  teams       list of team objects
 * @param  games       list of game objects
 * @param  fileStart   start of file name, to use for links
 * @param  phase       name of phase to show games for
 * @param  settings    tournament settings object
 * @param  phaseColors colors, indexed by phase name
 * @param  rptConfig   report configuration object
 * @param  showTbs     whether to include tiebreakers
 * @return             html contents of the file
 */
function getPlayerDetailHtml(teams: YfTeam[], games: YfGame[], fileStart: string, phase: string,
  settings: TournamentSettings, phaseColors:  { [phase: string]: string }, rptConfig: RptConfig,
  showTbs: boolean): string {

  teams = _.orderBy(teams, function(item) { return item.teamName.toLowerCase(); }, 'asc');
  games = _.orderBy(games, function(item) { return +item.round; }, 'asc');
  let playerTotals = compileIndividuals(teams, games, phase, [], settings, showTbs);
  playerTotals = _.orderBy(playerTotals,
    [function(item) { return item.teamName.toLowerCase(); },
    function(item) { return item.playerName.toLowerCase(); }],
    ['asc', 'asc']);

  let html = getStatReportTop(fileStart, 'Individual Detail') +
    '<h1> Individual Detail</h1>' + '\n';
  if(phase == 'all') { html += phaseLegend(phaseColors) + '\n'; }
  html += tableStyle();

  for(let i in playerTotals) {
    if(playerTotals[i].gamesPlayed == 0) { continue; }
    const indvTot = playerTotals[i];
    const linkId = indvTot.teamName.replace(/\W/g, '') + '-' +
      indvTot.playerName.replace(/\W/g, '');
    html += '<h2 style="display:inline-block" id=' + linkId + '>' +
      indvTot.playerName + ', ' + indvTot.teamName + '</h2>' + '\n';
    //year, UG, and D2 status
    let demogDisp = '';
    if(showPlayerYear(rptConfig)) {
      let yearDisp = indvTot.year.split('.')[0]; //truncate decimals, if someone is being weird
      if(+yearDisp >= 4 && +yearDisp <= 12) { yearDisp += 'th grade'; }
      if(yearDisp.length > 0) {
        demogDisp = '<span style="font-style: italic; color: gray">' + yearDisp;
      }
    }
    if((showPlayerUG(rptConfig) || showPlayerCombined(rptConfig)) && indvTot.undergrad) {
      if(demogDisp.length == 0) {
        demogDisp = '<span style="font-style: italic; color: gray">' + 'UG';
      }
      else{ demogDisp += ', UG'; }
    }
    if((showPlayerD2(rptConfig) || showPlayerCombined(rptConfig)) && indvTot.div2) {
      if(demogDisp.length == 0) {
        demogDisp = '<span style="font-style: italic; color: gray">' + 'D2';
      }
      else{ demogDisp += ', D2'; }
    }
    if(demogDisp.length >= 0) {
      demogDisp += '</span>' + '\n';
    }
    html += demogDisp;

    html += '<table width=100%>' + '\n';
    html += playerDetailTableHeader(settings, rptConfig);
    for(let game of games) {
      let gameInPhase = matchFilterPhase(game, phase, showTbs);
      let formatRdCol = phase == 'all' && (game.phases.length > 0 || game.tiebreaker);
      if (gameInPhase && game.team1 == indvTot.teamName) {
        for(var p in game.players1) {
          if(p == indvTot.playerName) {
            const link = playerDetailGameLink(game, 1, fileStart);
            html += playerDetailGameRow(game.players1[p], game.tuhtot, game.team2, game.round,
              link, settings, game.phases, phaseColors, formatRdCol, rptConfig, game.tiebreaker);
          }
        }
      }
      else if (gameInPhase && game.team2 == indvTot.teamName) {
        const link = playerDetailGameLink(game, 2, fileStart);
        for(var p in game.players2) {
          if(p == indvTot.playerName) {
            html += playerDetailGameRow(game.players2[p], game.tuhtot, game.team1, game.round,
              link, settings, game.phases, phaseColors, formatRdCol, rptConfig, game.tiebreaker);
          }
        }
      }
    }
    html += playerDetailTotalRow(indvTot, settings, rptConfig);
    html += '</table>' + '<br>' + '\n';
  }//loop over all players in the tournament

  return html + getStatReportBottom();
}//getPlayerDetailHtml

/**
 * Generate the team round report page.
 * @param  teams     list of team objects
 * @param  games     list of game objects
 * @param  fileStart start of file name, to use for links
 * @param  phase     name of phase to show games for
 * @param  packets   packet names, indexed by round number
 * @param  settings  tournament settings object
 * @param  rptConfig report configuration object
 * @param  showTbs   whether to include tiebreakers
 * @return           html contents of the file
 */
function getRoundReportHtml(games: YfGame[], fileStart: string, phase: string,
  packets: PacketList, settings: TournamentSettings, rptConfig: RptConfig, showTbs: boolean): string {

  games = _.orderBy(games, function(item) { return +item.round; }, 'asc');
  const [roundSummaries, aggregate] = compileRoundSummaries(games, phase, settings, showTbs);
  const packetsExist = packetNamesExist(packets);
  let html = getStatReportTop(fileStart, 'Round Report') +
    '<h1> Round Report</h1>' + '\n';
  html += tableStyle();
  html += '<table width=100%>' + '\n';
  html += roundReportTableHeader(packetsExist, settings, rptConfig);
  for(let i in roundSummaries) {
    html += roundReportRow(roundSummaries[i], +i, packetsExist, packets, settings, rptConfig, fileStart);
  }
  html += roundReportRow(aggregate, 'Total', packetsExist, packets, settings, rptConfig, fileStart);
  html += '</table>' + '\n';
  return html + getStatReportBottom();
}

/*---------------------------------------------------------
Stat report generation APIs
---------------------------------------------------------*/
export function getStandingsPage(teams, games, fileStart, phase, groupingPhases, divsInPhase,
  phaseSizes, settings, rptConfig, showTbs, yfVersion) {
  return new Promise(function(resolve, _reject) {
    resolve(getStandingsHtml(teams, games, fileStart, phase, groupingPhases, divsInPhase,
      phaseSizes, settings, rptConfig, showTbs, yfVersion));
  });
}

export function getIndividualsPage(teams, games, fileStart, phase, groupingPhases,
  usingDivisions, settings, rptConfig, showTbs) {
  return new Promise(function(resolve, _reject) {
    resolve(getIndividualsHtml(teams, games, fileStart, phase, groupingPhases,
      usingDivisions, settings, rptConfig, showTbs));
  });
}

export function getScoreboardPage(teams, games, fileStart, phase, settings, packets, phaseColors, showTbs) {
  return new Promise(function(resolve, reject) {
    resolve(getScoreboardHtml(games, fileStart, phase, settings, packets, phaseColors, showTbs));
  });
}

export function getTeamDetailPage(teams, games, fileStart, phase, packets, settings,
  phaseColors, rptConfig, showTbs) {
  return new Promise(function(resolve, _reject) {
    resolve(getTeamDetailHtml(teams, games, fileStart, phase, packets, settings,
      phaseColors, rptConfig, showTbs));
  });
}

export function getPlayerDetailPage(teams, games, fileStart, phase, settings, phaseColors, rptConfig, showTbs) {
  return new Promise(function(resolve, _reject) {
    resolve(getPlayerDetailHtml(teams, games, fileStart, phase, settings, phaseColors, rptConfig, showTbs));
  });
}

export function getRoundReportPage(teams, games, fileStart, phase, packets, settings, rptConfig, showTbs) {
  return new Promise(function(resolve, _reject) {
    resolve(getRoundReportHtml(games, fileStart, phase, packets, settings, rptConfig, showTbs));
  });
}
