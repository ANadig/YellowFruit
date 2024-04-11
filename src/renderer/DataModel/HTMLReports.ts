/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-concat */
import { StatReportPages, StatReportPageOrder, StatReportFileNames } from '../Enums';
import { Phase, PhaseTypes } from './Phase';
import { Pool } from './Pool';
import { PhaseStandings, PoolStats, PoolTeamStats } from './StatSummaries';
// eslint-disable-next-line import/no-cycle
import Tournament from './Tournament';

export default class HtmlReportGenerator {
  tournament: Tournament;

  constructor(tourn: Tournament) {
    this.tournament = tourn;
  }

  generateStandingsPage() {
    const title = 'Team Standings';
    const htmlHeader = getHtmlHeader(title);
    const topLinks = getTopLinks();
    const mainHeader = genericTag('h1', title);
    const style = getPageStyle();
    const content = this.getStandingsHtml();

    const body = genericTag('BODY', topLinks, mainHeader, style, content, madeWithYellowFruit());
    return genericTag('HTML', htmlHeader, body);
  }

  // generateIndividualsPage() {
  //   return '';
  // }

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
      const header = genericTag('h3', onePool.pool.name);
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
  return genericTag('style', body, table, td, zebra, headerAndDivider, inlineDivider, ul, smallText, phaseH2);
}

// 'table {\n  border-spacing: 0;\n  border-collapse: collapse;\n}\n'

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
