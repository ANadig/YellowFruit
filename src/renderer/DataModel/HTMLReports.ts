/* eslint-disable no-useless-concat */
import { StatReportPages, StatReportPageOrder, StatReportFileNames } from '../Enums';
import { PoolStats, PoolTeamStats } from './StatSummaries';
import Tournament from './Tournament';

export function generateStandingsPage(tournament: Tournament) {
  const title = 'Team Standings';
  const htmlHeader = getHtmlHeader(title);
  const topLinks = getTopLinks();
  const mainHeader = h1Tag(title);
  const style = getPageStyle();
  const content = getStandingsHtml(tournament);

  const body = genericTag('BODY', topLinks, mainHeader, style, content, madeWithYellowFruit());
  return genericTag('HTML', htmlHeader, body);
}

export function generateIndividualsPage() {
  return '';
}

/** The actual data of the Standings page */
function getStandingsHtml(tournament: Tournament) {
  const tables: string[] = [];
  const prelims = tournament.stats[0];
  if (!prelims) return '';

  for (const onePool of prelims.pools) {
    const header = genericTag('h2', onePool.pool.name);
    tables.push(`${header}\n${oneStandingsTable(onePool, tournament, prelims.anyTiesExist)}`);
  }
  return tables.join('\n');
}

function oneStandingsTable(poolStats: PoolStats, tournament: Tournament, anyTiesExist: boolean) {
  const rows = [standingsHeader(tournament, anyTiesExist)];
  for (const teamStats of poolStats.poolTeams) {
    rows.push(standingsRow(teamStats, tournament, anyTiesExist));
  }
  return tableTag(rows, undefined, '100%');
}

function standingsHeader(tournament: Tournament, anyTiesExist: boolean) {
  const cells: string[] = [];
  cells.push(tdTag({ bold: true }, 'Rank'));
  cells.push(tdTag({ bold: true }, 'Team'));
  if (tournament.trackSmallSchool) cells.push(tdTag({ bold: true }, 'SS'));
  if (tournament.trackJV) cells.push(tdTag({ bold: true }, 'JV'));
  if (tournament.trackUG) cells.push(tdTag({ bold: true }, 'UG'));
  if (tournament.trackDiv2) cells.push(tdTag({ bold: true }, 'D2'));
  cells.push(tdTag({ bold: true, align: 'right' }, 'W'));
  cells.push(tdTag({ bold: true, align: 'right' }, 'L'));
  if (anyTiesExist) cells.push(tdTag({ bold: true, align: 'right' }, 'T'));
  cells.push(tdTag({ bold: true, align: 'right' }, 'Pct'));
  cells.push(tdTag({ bold: true, align: 'right' }, `PP${tournament.scoringRules.regulationTossupCount}TUH`));
  tournament.scoringRules.answerTypes.forEach((ansType) =>
    cells.push(tdTag({ bold: true, align: 'right' }, ansType.value.toString())),
  );
  cells.push(tdTag({ bold: true, align: 'right' }, 'TUH'));
  cells.push(tdTag({ bold: true, align: 'right' }, 'PPB'));

  return trTag(cells);
}

function standingsRow(teamStats: PoolTeamStats, tournament: Tournament, anyTiesExist: boolean) {
  const cells: string[] = [];
  cells.push(tdTag({}, teamStats.rank));
  cells.push(tdTag({}, teamStats.team.name));
  if (tournament.trackSmallSchool) {
    const isSS = tournament.findRegistrationByTeam(teamStats.team)?.isSmallSchool;
    cells.push(tdTag({}, isSS ? 'SS' : ''));
  }
  if (tournament.trackJV) cells.push(tdTag({}, teamStats.team.isJV ? 'JV' : ''));
  if (tournament.trackUG) cells.push(tdTag({}, teamStats.team.isUG ? 'UG' : ''));
  if (tournament.trackDiv2) cells.push(tdTag({}, teamStats.team.isD2 ? 'D2' : ''));
  cells.push(tdTag({ align: 'right' }, teamStats.wins.toString()));
  cells.push(tdTag({ align: 'right' }, teamStats.losses.toString()));
  if (anyTiesExist) cells.push(tdTag({ align: 'right' }, teamStats.ties.toString()));

  const pct = teamStats.getWinPct();
  const pctStr = Number.isNaN(pct) ? '&mdash;' : pct.toFixed(3).toString();
  cells.push(tdTag({ align: 'right' }, pctStr));

  const ppgStr =
    teamStats.totalPoints === 0
      ? '&mdash;'
      : (teamStats.getPtsPerRegTuh() * tournament.scoringRules.regulationTossupCount).toFixed(1);
  cells.push(tdTag({ align: 'right' }, ppgStr));

  tournament.scoringRules.answerTypes.forEach((at) => {
    const answerCount = teamStats.tossupCounts.find((ac) => ac.answerType.value === at.value);
    cells.push(tdTag({ align: 'right' }, answerCount?.number?.toString() || '0'));
  });
  cells.push(tdTag({ align: 'right' }, teamStats.tuhRegulation.toString()));

  const ppb = teamStats.getPtsPerBonus();
  const ppbStr = Number.isNaN(ppb) ? '&mdash;' : ppb.toFixed(2);
  cells.push(tdTag({ align: 'right' }, ppbStr));

  return trTag(cells);
}

const StatReportPageTitles = {
  [StatReportPages.Standings]: 'Standings',
  [StatReportPages.Individuals]: 'Individuals',
  [StatReportPages.Scoreboard]: 'Scoreboard',
  [StatReportPages.TeamDetails]: 'Team Detail',
  [StatReportPages.PlayerDetails]: 'Player Detail',
  [StatReportPages.RoundReport]: 'Round Report',
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
  return genericTag('style', body, table, td, zebra);
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

type tdAttributes = { align?: string; bold?: boolean; title?: string; style?: string };

/** <td> tag (table cell) */
function tdTag(attributes: tdAttributes, contents: string) {
  const align = makeAttribute(attributes, 'align');
  const title = makeAttribute(attributes, 'title');
  const style = makeAttribute(attributes, 'style');
  const innerText = attributes.bold ? genericTag('b', contents) : contents;
  return `<td ${align} ${title} ${style}>${innerText}</td>`;
}

function h1Tag(contents: string) {
  return `<h1>${contents}</h1>`;
}

/** Put contents inside a tag of the given type */
function genericTag(tag: string, ...contents: string[]) {
  return `<${tag}>\n${contents.join('\n')}\n</${tag}>`;
}

function makeAttribute(obj: any, attrName: string) {
  const val = obj[attrName];
  if (val === undefined) return '';
  return `${attrName}="${val}"`;
}

function madeWithYellowFruit(yfVersion?: string) {
  let html = '<span style="font-size:x-small">Made with YellowFruit &#x1F34C;</span>' + '\n'; // banana emoji
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
