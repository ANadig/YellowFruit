/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-concat */
import { StatReportPages, StatReportPageOrder, StatReportFileNames } from '../Enums';
import { LeftOrRight } from '../Utils/UtilTypes';
import { Match } from './Match';
import { MatchPlayer } from './MatchPlayer';
import { MatchTeam } from './MatchTeam';
import { Phase, PhaseTypes } from './Phase';
import { Pool } from './Pool';
import { Round } from './Round';
import { PhaseStandings, PlayerStats, PoolStats, PoolTeamStats } from './StatSummaries';
// eslint-disable-next-line import/no-cycle
import Tournament from './Tournament';

export default class HtmlReportGenerator {
  tournament: Tournament;

  constructor(tourn: Tournament) {
    this.tournament = tourn;
  }

  /**
   * The entire contents of one html document
   * @param title Title of the top header of the page
   * @param data  html contents of the page's data
   */
  private generateHtmlPage(title: string, data: string) {
    const htmlHeader = getHtmlHeader(title);
    const topLinks = getTopLinks();
    const mainHeader = genericTag('h1', title);
    const style = getPageStyle();

    const body = genericTag('BODY', topLinks, mainHeader, style, data, madeWithYellowFruit());
    return genericTag('HTML', htmlHeader, body);
  }

  /** The entire contents of the standings html document */
  generateStandingsPage() {
    return this.generateHtmlPage('Team Standings', this.getStandingsHtml());
  }

  generateIndividualsPage() {
    return this.generateHtmlPage('Individuals', this.getIndividualsHtml());
  }

  generateScoreboardPage() {
    return this.generateHtmlPage('Scoreboard', this.getScoreboardHtml());
  }

  /** The actual data of the Standings page */
  private getStandingsHtml() {
    const sections: string[] = [];
    const prelims = this.tournament.stats[0];
    if (!prelims) return '';

    if (this.tournament.finalRankingsReady) {
      const header = headerWithDivider('Final Rankings');
      sections.push(`${header}\n${this.cumulativeStandingsTable()}`);
    }

    sections.push(this.finalsList().join('\n'));

    let printedPhaseCount = 0;
    for (let i = this.tournament.stats.length - 1; i >= 0; i--) {
      const phaseStats = this.tournament.stats[i];
      if (!phaseStats.phase.anyTeamsAssigned()) continue;

      printedPhaseCount++;
      const header = headerWithDivider(phaseStats.phase.name);
      sections.push(`${header}\n${this.standingsForOnePhase(phaseStats)}`);
    }

    if (printedPhaseCount > 1 && !this.tournament.finalRankingsReady) {
      const header = headerWithDivider('Cumulative');
      sections.push(`${header}\n${this.cumulativeStandingsTable(true)}`);
    }
    return sections.join('\n');
  }

  private standingsForOnePhase(phaseStandings: PhaseStandings) {
    const tables: string[] = [];
    const nextPhase = this.tournament.getNextFullPhase(phaseStandings.phase);
    const tbPhase = this.tournament.getTiebreakerPhaseFor(phaseStandings.phase);

    for (const onePool of phaseStandings.pools) {
      const header = phaseStandings.pools.length > 1 ? genericTag('h3', onePool.pool.name) : '';
      tables.push(`${header}\n${this.oneStandingsTable(onePool, phaseStandings.anyTiesExist, tbPhase, nextPhase)}`);
    }
    return tables.join('\n') + lineBreak;
  }

  private oneStandingsTable(poolStats: PoolStats, anyTiesExist: boolean, tbPhase?: Phase, nextPhase?: Phase) {
    const rows = [this.standingsHeader(anyTiesExist, nextPhase)];
    for (const teamStats of poolStats.poolTeams) {
      rows.push(this.standingsRow(teamStats, anyTiesExist, nextPhase));
    }
    return `${tableTag(rows, undefined, '100%')}\n${this.tiebreakerList(tbPhase, poolStats.pool)}`;
  }

  private cumulativeStandingsTable(omitRank: boolean = false) {
    const stats = this.tournament.cumulativeStats;
    if (!stats) return '';
    const rows = [this.standingsHeader(stats.anyTiesExist, undefined, true, omitRank)];
    for (const teamStats of stats.teamStats) {
      rows.push(this.standingsRow(teamStats, stats.anyTiesExist, undefined, true, omitRank));
    }
    return tableTag(rows, undefined, '75%');
  }

  private standingsHeader(
    anyTiesExist: boolean,
    nextPhase?: Phase,
    cumulative: boolean = false,
    omitRank: boolean = false,
  ) {
    const cells: string[] = [];
    if (!omitRank) cells.push(tdTag({ bold: true, width: '3%' }, 'Rank'));
    cells.push(tdTag({ bold: true, width: cumulative ? '' : '20%' }, 'Team'));
    if (this.tournament.trackSmallSchool) cells.push(tdTag({ bold: true }, 'SS'));
    if (this.tournament.trackJV) cells.push(tdTag({ bold: true }, 'JV'));
    if (this.tournament.trackUG) cells.push(tdTag({ bold: true }, 'UG'));
    if (this.tournament.trackDiv2) cells.push(tdTag({ bold: true }, 'D2'));
    cells.push(tdTag({ bold: true, align: 'right', width: '3%' }, 'W'));
    cells.push(tdTag({ bold: true, align: 'right', width: '3%' }, 'L'));
    if (anyTiesExist) cells.push(tdTag({ bold: true, align: 'right', width: '3%' }, 'T'));
    if (!cumulative) cells.push(tdTag({ bold: true, align: 'right' }, 'Pct'));
    cells.push(
      tdTag({ bold: true, align: 'right', width: '8%' }, `PP${this.tournament.scoringRules.regulationTossupCount}TUH`),
    );
    this.tournament.scoringRules.answerTypes.forEach((ansType) =>
      cells.push(tdTag({ bold: true, align: 'right' }, ansType.value.toString())),
    );
    cells.push(tdTag({ bold: true, align: 'right' }, 'TUH'));
    cells.push(tdTag({ bold: true, align: 'right' }, 'PPB'));
    if (this.tournament.scoringRules.bonusesBounceBack) {
      cells.push(tdTag({ bold: true, align: 'right' }, 'BB%'));
    }
    if (nextPhase?.anyTeamsAssigned()) {
      cells.push(tdTag({ bold: true }, 'Advanced To'));
    } else if (nextPhase) {
      cells.push(tdTag({ bold: true }, 'Would Advance'));
    }

    return trTag(cells);
  }

  private standingsRow(
    teamStats: PoolTeamStats,
    anyTiesExist: boolean,
    nextPhase?: Phase,
    cumulative: boolean = false,
    omitRank: boolean = false,
  ) {
    const cells: string[] = [];
    if (!omitRank && cumulative) cells.push(tdTag({}, teamStats.team.getOverallRankString()));
    else if (!omitRank && !cumulative) cells.push(tdTag({}, teamStats.rank));

    cells.push(tdTag({}, teamStats.team.name));
    if (this.tournament.trackSmallSchool) {
      const isSS = this.tournament.findRegistrationByTeam(teamStats.team)?.isSmallSchool;
      cells.push(tdTag({}, isSS ? 'SS' : ''));
    }
    if (this.tournament.trackJV) cells.push(tdTag({}, teamStats.team.isJV ? 'JV' : ''));
    if (this.tournament.trackUG) cells.push(tdTag({}, teamStats.team.isUG ? 'UG' : ''));
    if (this.tournament.trackDiv2) cells.push(tdTag({}, teamStats.team.isD2 ? 'D2' : ''));
    cells.push(tdTag({ align: 'right' }, teamStats.wins.toString()));
    cells.push(tdTag({ align: 'right' }, teamStats.losses.toString()));
    if (anyTiesExist) cells.push(tdTag({ align: 'right' }, teamStats.ties.toString()));

    if (!cumulative) {
      const pct = teamStats.getWinPct();
      const pctStr = Number.isNaN(pct) ? mDashHtml : pct.toFixed(3).toString();
      cells.push(tdTag({ align: 'right' }, pctStr));
    }

    const ppgStr =
      teamStats.totalPointsForPPG === 0
        ? mDashHtml
        : (teamStats.getPtsPerRegTuh() * this.tournament.scoringRules.regulationTossupCount).toFixed(1);
    cells.push(tdTag({ align: 'right' }, ppgStr));

    this.tournament.scoringRules.answerTypes.forEach((at) => {
      const answerCount = teamStats.tossupCounts.find((ac) => ac.answerType.value === at.value);
      cells.push(tdTag({ align: 'right' }, answerCount?.number?.toString() || '0'));
    });
    cells.push(tdTag({ align: 'right' }, teamStats.tuhRegulation.toString()));

    const ppb = teamStats.getPtsPerBonus();
    const ppbStr = Number.isNaN(ppb) ? mDashHtml : ppb.toFixed(2);
    cells.push(tdTag({ align: 'right' }, ppbStr));

    if (this.tournament.scoringRules.bonusesBounceBack) {
      const bbConv = teamStats.getBouncebackConvPctString();
      const bbConvStr = bbConv === '-' ? mDashHtml : bbConv;
      cells.push(tdTag({ align: 'right' }, bbConvStr));
    }

    if (nextPhase?.anyTeamsAssigned()) {
      cells.push(tdTag({}, this.definiteAdvancementTierDisplay(teamStats, nextPhase)));
    } else if (nextPhase) {
      cells.push(tdTag({}, this.provisionalAdvancementTierDisplay(teamStats)));
    }

    return trTag(cells);
  }

  private provisionalAdvancementTierDisplay(teamStats: PoolTeamStats) {
    if (teamStats.recordTieForAdvancement) return unicodeHTML('2754');
    if (teamStats.advanceToTier === undefined) return mDashHtml;
    return `Tier ${teamStats.advanceToTier}`;
  }

  private definiteAdvancementTierDisplay(teamStats: PoolTeamStats, nextPhase: Phase) {
    if (teamStats.poolTeam.didNotAdvance) return 'None';
    return nextPhase.findPoolWithTeam(teamStats.team)?.name || '';
  }

  private finalsList() {
    return this.tournament.getFinalsPhases().map((ph) => {
      const matchList = this.tiebreakerList(ph);
      if (matchList === '') return '';
      return `${headerWithDivider(ph.name)}\n${matchList}`;
    });
  }

  private tiebreakerList(tbOrFinalsPhase: Phase | undefined, pool?: Pool) {
    if (!tbOrFinalsPhase) return '';
    const matches = tbOrFinalsPhase.getMatchesForPool(pool);
    if (matches.length === 0) return '';
    const title = tbOrFinalsPhase.phaseType === PhaseTypes.Tiebreaker ? genericTag('span', 'Tiebreakers:') : '';
    const list = unorderedList(matches.map((m) => m.getWinnerLoserString()));
    return genericTagWithAttributes('div', [classAttribute(cssClasses.smallText)], title, list);
  }

  /** The actual data of the individuals page */
  private getIndividualsHtml() {
    const sections: string[] = [];
    const prelims = this.tournament.stats[0];
    if (!prelims) return '';

    const prelimsHeader = headerWithDivider(prelims.phase.name);
    sections.push(`${prelimsHeader}\n${this.individualsTable(prelims.players)}`);

    if (this.tournament.stats.length > 1 && this.tournament.cumulativeStats) {
      const aggregateHeader = headerWithDivider('All Games');
      sections.push(`${aggregateHeader}\n${this.individualsTable(this.tournament.cumulativeStats.players, true)}`);
    }

    return sections.join('\n');
  }

  private individualsTable(players: PlayerStats[], skipRankCol: boolean = false) {
    const rows = [this.individualsHeader(skipRankCol)];
    for (const playerStats of players) {
      if (playerStats.tossupsHeard === 0) continue;
      rows.push(this.individualsRow(playerStats, skipRankCol));
    }
    return tableTag(rows, undefined, '80%');
  }

  private individualsHeader(skipRankCol: boolean = false) {
    const cells: string[] = [];
    if (!skipRankCol) cells.push(tdTag({ bold: true, width: '3%' }, 'Rank'));
    cells.push(tdTag({ bold: true }, 'Player'));
    if (this.tournament.trackPlayerYear) cells.push(tdTag({ bold: true }, 'Year/Grade'));
    if (this.tournament.trackUG) cells.push(tdTag({ bold: true }, 'UG'));
    if (this.tournament.trackDiv2) cells.push(tdTag({ bold: true }, 'D2'));
    cells.push(tdTag({ bold: true }, 'Team'));
    cells.push(tdTag({ bold: true, align: 'right' }, 'GP'));
    this.tournament.scoringRules.answerTypes.forEach((ansType) =>
      cells.push(tdTag({ bold: true, align: 'right' }, ansType.value.toString())),
    );
    cells.push(tdTag({ bold: true, align: 'right' }, 'TUH'));
    cells.push(tdTag({ bold: true, align: 'right' }, `PP${this.tournament.scoringRules.regulationTossupCount}TUH`));

    return trTag(cells);
  }

  private individualsRow(playerStats: PlayerStats, skipRankCol: boolean = false) {
    const cells: string[] = [];
    if (!skipRankCol) cells.push(tdTag({}, playerStats.rank + (playerStats.rankTie ? '=' : '')));
    cells.push(tdTag({}, playerStats.player.name));
    if (this.tournament.trackPlayerYear) cells.push(tdTag({}, playerStats.player.yearString));
    if (this.tournament.trackUG) cells.push(tdTag({}, playerStats.player.isUG ? 'UG' : ''));
    if (this.tournament.trackDiv2) cells.push(tdTag({}, playerStats.player.isD2 ? 'D2' : ''));
    cells.push(tdTag({}, playerStats.team.name));
    cells.push(tdTag({ align: 'right' }, playerStats.gamesPlayed.toFixed(1)));
    this.tournament.scoringRules.answerTypes.forEach((at) => {
      const answerCount = playerStats.tossupCounts.find((ac) => ac.answerType.value === at.value);
      cells.push(tdTag({ align: 'right' }, answerCount?.number?.toString() || '0'));
    });
    cells.push(tdTag({ align: 'right' }, playerStats.tossupsHeard.toString()));

    const pptuh = playerStats.getPptuh();
    cells.push(
      tdTag(
        { align: 'right' },
        pptuh !== undefined ? (pptuh * this.tournament.scoringRules.regulationTossupCount).toFixed(2) : mDashHtml,
      ),
    );

    return trTag(cells);
  }

  getScoreboardHtml() {
    const rounds: string[] = [];
    for (const phase of this.tournament.phases) {
      for (const round of phase.rounds) {
        if (round.matches.length > 0) rounds.push(this.oneRoundOfBoxScores(round, phase));
      }
    }
    return rounds.join('\n');
  }

  private oneRoundOfBoxScores(round: Round, phase: Phase) {
    const segments: string[] = [];
    if (round.number !== 1) segments.push('<br /><br />');
    let title = round.displayName(false);
    if (phase.isFullPhase()) title += ` - ${phase.name}`;
    segments.push(headerWithDivider(title));
    for (const match of round.matches) {
      segments.push(this.boxScore(match));
    }
    return segments.join('\n');
  }

  private boxScore(match: Match) {
    const segments: string[] = [];
    segments.push(genericTag('h3', match.getScoreString()));
    if (match.isForfeit()) return segments.join('\n');

    if (match.carryoverPhases.length > 0) {
      segments.push(
        genericTagWithAttributes(
          'p',
          [classAttribute(cssClasses.smallText)],
          `Carries over to: ${match.carryoverPhases.map((ph) => ph.name).join(', ')}`,
        ),
      );
    }
    let tuReadStr = `Tossups read: ${match.tossupsRead ?? 'unknown'}`;
    if (match.overtimeTossupsRead) tuReadStr += ` (${match.overtimeTossupsRead} in OT)`;
    segments.push(genericTagWithAttributes('p', [classAttribute(cssClasses.smallText)], tuReadStr));

    const leftTable = this.boxScoreTableOneTeam(match.leftTeam);
    const rightTable = this.boxScoreTableOneTeam(match.rightTeam);
    segments.push(
      genericTagWithAttributes('div', [classAttribute(cssClasses.boxScoreTableContainer)], leftTable, rightTable),
    );

    if (this.tournament.scoringRules.useBonuses) {
      segments.push('<br />');
      segments.push(this.boxScoreBonusTable(match));
    }
    if (this.tournament.scoringRules.bonusesBounceBack) segments.push(this.boxScoreBouncebackTable(match));
    return segments.join('\n');
  }

  private boxScoreTableOneTeam(matchTeam: MatchTeam) {
    const rows = [this.boxScoreTableHeader(matchTeam.team?.name ?? '')];
    for (const mp of matchTeam.getActiveMatchPlayers()) {
      rows.push(this.boxScoreOneMatchPlayer(mp));
    }
    rows.push(this.boxScoreTotalRow(matchTeam));
    return tableTag(rows, undefined, '35%');
  }

  private boxScoreTableHeader(teamName: string) {
    const cells: string[] = [];
    cells.push(tdTag({ bold: true }, teamName));
    cells.push(tdTag({ bold: true, align: 'right' }, 'TUH'));
    this.tournament.scoringRules.answerTypes.forEach((at) => {
      cells.push(tdTag({ bold: true, align: 'right' }, at.value.toString() || '??'));
    });
    cells.push(tdTag({ bold: true, align: 'right' }, 'Tot'));
    return trTag(cells);
  }

  private boxScoreOneMatchPlayer(matchPlayer: MatchPlayer) {
    const cells: string[] = [];
    cells.push(tdTag({}, matchPlayer.player.name));
    cells.push(tdTag({ align: 'right' }, matchPlayer.tossupsHeard?.toString() ?? '0'));
    this.tournament.scoringRules.answerTypes.forEach((at) => {
      const answerCount = matchPlayer.answerCounts.find((ac) => ac.answerType.value === at.value);
      cells.push(tdTag({ align: 'right' }, answerCount?.number?.toString() ?? '0'));
    });
    cells.push(tdTag({ align: 'right' }, matchPlayer.points.toString()));
    return trTag(cells);
  }

  private boxScoreTotalRow(matchTeam: MatchTeam) {
    const cells = [tdTag({ bold: true }, 'Total')];
    cells.push(tdTag({}, ''));
    const answerCounts = matchTeam.getAnswerCounts();
    this.tournament.scoringRules.answerTypes.forEach((at) => {
      const answerCount = answerCounts.find((ac) => ac.answerType.value === at.value);
      cells.push(tdTag({ bold: true, align: 'right' }, answerCount?.number?.toString() ?? '0'));
    });
    cells.push(tdTag({ bold: true, align: 'right' }, matchTeam.getTossupPoints().toString()));
    return tableFooter(cells);
  }

  private boxScoreBonusTable(match: Match) {
    const rows: string[] = [];
    rows.push(this.boxScoreBonusTableHeader());
    rows.push(this.boxScoreBonusTableRow(match.leftTeam));
    rows.push(this.boxScoreBonusTableRow(match.rightTeam));
    return tableTag(rows, undefined, '50%');
  }

  private boxScoreBonusTableHeader() {
    const cells: string[] = [];
    cells.push(tdTag({ bold: true, width: '40%' }, 'Bonuses'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'Heard'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'Pts'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'PPB'));
    return trTag(cells);
  }

  private boxScoreBonusTableRow(matchTeam: MatchTeam) {
    const cells: string[] = [];
    const [pts, heard, ppb] = matchTeam.getBonusStats(this.tournament.scoringRules);
    cells.push(tdTag({}, matchTeam.team?.name ?? ''));
    cells.push(tdTag({ align: 'right' }, heard));
    cells.push(tdTag({ align: 'right' }, pts));
    cells.push(tdTag({ align: 'right' }, ppb));
    return trTag(cells);
  }

  private boxScoreBouncebackTable(match: Match) {
    const rows: string[] = [];
    rows.push(this.boxScoreBouncebackTableHeader());
    rows.push(this.boxScoreBouncebackTableRow(match, 'left'));
    rows.push(this.boxScoreBouncebackTableRow(match, 'right'));
    return tableTag(rows, undefined, '50%');
  }

  private boxScoreBouncebackTableHeader() {
    const cells: string[] = [];
    cells.push(tdTag({ bold: true, width: '40%' }, 'Bouncebacks'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'Parts Heard'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'Pts'));
    cells.push(tdTag({ bold: true, align: 'right', width: '20%' }, 'Success%'));
    return trTag(cells);
  }

  private boxScoreBouncebackTableRow(match: Match, whichTeam: LeftOrRight) {
    const cells: string[] = [];
    const [heard, rate] = match.getBouncebackStatsString(whichTeam, this.tournament.scoringRules);
    const matchTeam = match.getMatchTeam(whichTeam);
    cells.push(tdTag({}, matchTeam.team?.name ?? ''));
    cells.push(tdTag({ align: 'right' }, heard));
    cells.push(tdTag({ align: 'right' }, matchTeam.bonusBouncebackPoints?.toString() ?? '0'));
    cells.push(tdTag({ align: 'right' }, `${rate}%`));
    return trTag(cells);
  }
}

const lineBreak = '<br/>';
const mDashHtml = '&mdash;';
const nbsp = '&nbsp;';

const StatReportPageTitles = {
  [StatReportPages.Standings]: 'Standings',
  [StatReportPages.Individuals]: 'Individuals',
  [StatReportPages.Scoreboard]: 'Scoreboard',
  [StatReportPages.TeamDetails]: 'Team Detail',
  [StatReportPages.PlayerDetails]: 'Player Detail',
  [StatReportPages.RoundReport]: 'Round Report',
};

const cssClasses = {
  headerAndDivider: 'headerAndDivider',
  inlineDivider: 'inlineDivider',
  smallText: 'smallText',
  boxScoreTableContainer: 'boxScoreTable',
  pseudoTFoot: 'pseudoTFoot',
};

/** Header at the top of the html document */
function getHtmlHeader(pageTitle: string) {
  return genericTag('HEAD', genericTag('title', pageTitle));
}

function getPageStyle() {
  const body = cssSelector('BODY', { attr: 'font-family', val: 'Roboto, sans-serif' });
  const table = cssSelector(
    'table',
    { attr: 'font-size', val: '11pt' },
    { attr: 'border-spacing', val: '0' },
    { attr: 'border-collapse', val: 'collapse' },
  );
  const td = cssSelector('td', { attr: 'padding', val: '5px' });
  const zebra = cssSelector('tr:nth-child(even)', { attr: 'background-color', val: '#f2f2f2' });
  const headerAndDivider = cssSelector(
    `.${cssClasses.headerAndDivider}`,
    { attr: 'display', val: 'flex' },
    { attr: 'flex-direction', val: 'row' },
    { attr: 'margin', val: '18 0' },
  );
  const phaseH2 = cssSelector(`.${cssClasses.headerAndDivider} h2`, { attr: 'margin', val: '0' });
  const inlineDivider = cssSelector(
    `.${cssClasses.inlineDivider}`,
    { attr: 'flex-grow', val: '1' },
    { attr: 'height', val: '1px' },
    { attr: 'background-color', val: '#9f9f9f' },
    { attr: 'align-self', val: 'center' },
  );
  const smallText = cssSelector(`.${cssClasses.smallText}`, { attr: 'font-size', val: '10pt' });
  const ul = cssSelector('ul', { attr: 'margin', val: '0' });
  const boxScoreTableContainer = cssSelector(
    `.${cssClasses.boxScoreTableContainer}`,
    { attr: 'display', val: 'flex' },
    { attr: 'gap', val: '15px' },
    { attr: 'align-items', val: 'flex-start' },
  );
  const pseudoFooter = cssSelector(
    `.${cssClasses.pseudoTFoot}`,
    { attr: 'border-top', val: '1px solid #909090' },
    { attr: 'background-color', val: '#ffffff !important' },
  );
  return genericTag(
    'style',
    body,
    table,
    td,
    zebra,
    headerAndDivider,
    inlineDivider,
    ul,
    smallText,
    phaseH2,
    boxScoreTableContainer,
    pseudoFooter,
  );
}

// '.pseudo-tfoot {\n border-top: 1px solid #909090;\n background-color: #ffffff !important;\n}\n' +

/**
 * The links at the top of every page of the report
 */
function getTopLinks(): string {
  const linkCells = [];
  for (const page of StatReportPageOrder) {
    const oneLink = aTag(StatReportFileNames[page], StatReportPageTitles[page]);
    linkCells.push(tdTag({}, oneLink));
  }

  const tr = trTag(linkCells);
  return tableTag([tr], '0', '100%');
}

/** An <a> tag for hyperlinks */
function aTag(href: string, contents: string) {
  return `<a HREF=${href}>${contents}</a>`;
}

function tableTag(trTags: string[], border?: string, width?: string) {
  const borderAttr = border !== undefined ? `border=${border}` : '';
  const widthAttr = width !== undefined ? `width=${width}` : '';
  return `<table ${borderAttr} ${widthAttr}>\n${trTags.join('\n')}\n</table>`;
}

/** A <tr> tag: table row containing <td>s */
function trTag(tdTags: string[]) {
  return `<tr>\n${tdTags.join('\n')}\n</tr>`;
}

/** A tr tag with the special footer class */
function tableFooter(tdTags: string[]) {
  return `<tr class=${cssClasses.pseudoTFoot}>\n${tdTags.join('\n')}\n</tr>`;
}

type tdAttributes = { align?: string; bold?: boolean; title?: string; style?: string; width?: string };

/** <td> tag (table cell) */
function tdTag(attributes: tdAttributes, contents: string) {
  const align = makeAttributeFromObj(attributes, 'align');
  const title = makeAttributeFromObj(attributes, 'title');
  const style = makeAttributeFromObj(attributes, 'style');
  const width = makeAttributeFromObj(attributes, 'width');
  const innerText = attributes.bold ? genericTag('b', contents) : contents;
  return `<td ${align} ${title} ${style} ${width}>${innerText}</td>`;
}

/** Put contents inside a tag of the given type */
function genericTag(tag: string, ...contents: string[]) {
  return `<${tag}>\n${contents.join('\n')}\n</${tag}>`;
}

function genericTagWithAttributes(tag: string, attr: string[], ...contents: string[]) {
  return `<${tag} ${attr.join(' ')}>\n${contents.join('\n')}\n</${tag}>`;
}

function headerWithDivider(text: string) {
  const header = genericTag('h2', text + nbsp);
  const divider = genericTagWithAttributes('div', [classAttribute(cssClasses.inlineDivider)]);
  return genericTagWithAttributes('div', [classAttribute(cssClasses.headerAndDivider)], header, divider);
}

function unorderedList(items: string[]) {
  const liTags = items.map((itm) => genericTag('li', itm));
  return genericTag('ul', liTags.join('\n'));
}

function makeAttributeFromObj(obj: any, attrName: string) {
  const val = obj[attrName];
  if (val === undefined) return '';
  return makeAttribute(attrName, val);
}

function makeAttribute(attrName: string, val: string) {
  return `${attrName}="${val}"`;
}

function classAttribute(className: string) {
  return makeAttribute('class', className);
}

function madeWithYellowFruit(yfVersion?: string) {
  let html = `<span style="font-size:x-small">Made with YellowFruit ${unicodeHTML('1F34C')}</span>` + '\n'; // banana emoji
  if (yfVersion) {
    html += `<span style="font-size:x-small; color:white">&nbsp;${yfVersion}</span>` + `\n`;
  }
  return html;
}

type CssRule = { attr: string; val: string };

/** Make a string out of CSS rules for one selector */
function cssSelector(selector: string, ...rules: CssRule[]) {
  const ruleStrings = rules.map((r) => `${r.attr}: ${r.val};`);
  return `${selector}{\n${ruleStrings.join('\n')}\n}`;
}

function unicodeHTML(codepoint: string) {
  return `&#x${codepoint};`;
}
