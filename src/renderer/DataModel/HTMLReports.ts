/* eslint-disable no-useless-concat */
import { StatReportPages, StatReportPageOrder, StatReportFileNames } from '../Enums';
import Tournament from './Tournament';

export function generateStandingsPage(tournament: Tournament) {
  const title = 'Team Standings';
  const htmlHeader = getHtmlHeader(title);
  const topLinks = getTopLinks();
  const mainHeader = h1Tag(title);
  const style = getPageStyle();
  const content = genericTag('div', tournament.name);

  const body = genericTag('BODY', topLinks, mainHeader, style, content, madeWithYellowFruit());
  return genericTag('HTML', htmlHeader, body);
}

export function generateIndividualsPage() {
  return '';
}

const StatReportPageTitles = {
  [StatReportPages.Standings]: 'Standings',
  [StatReportPages.Individuals]: 'Individuals',
  [StatReportPages.Scoreboard]: 'Scoreboard',
  [StatReportPages.TeamDetails]: 'Team Detail',
  [StatReportPages.PlayerDetails]: 'Player Detail',
  [StatReportPages.RoundReport]: 'Round Report',
};

function getHtmlHeader(pageTitle: string) {
  return genericTag('HEAD', genericTag('title', pageTitle));
}

function getPageStyle() {
  const body = cssSelector('BODY', { attribute: 'font-family', value: 'Roboto, sans-serif' });
  const td = cssSelector('td', { attribute: 'padding', value: '5px' });
  return genericTag('style', body, td);
}

/**
 * The links at the top of every page of the report
 */
function getTopLinks(): string {
  const linkCells = [];
  for (const page of StatReportPageOrder) {
    const oneLink = aTag(StatReportFileNames[page], StatReportPageTitles[page]);
    linkCells.push(tdTag(oneLink));
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
  const widthAttr = width !== undefined ? `border=${width}` : '';
  return `<table ${borderAttr} ${widthAttr}>\n${trTags.join('\n')}\n</table>`;
}

/** A <tr> tag: table row containing <td>s */
function trTag(tdTags: string[]) {
  return `<tr>\n${tdTags.join('\n')}\n</tr>`;
}

/** <td> tag (table cell) */
function tdTag(contents: string) {
  return `<td>${contents}</td>`;
}

function h1Tag(contents: string) {
  return `<h1>${contents}</h1>`;
}

/** Put contents inside a tag of the given type */
function genericTag(tag: string, ...contents: string[]) {
  return `<${tag}>\n${contents.join('\n')}\n</${tag}>`;
}

function madeWithYellowFruit(yfVersion?: string) {
  let html = '<span style="font-size:x-small">Made with YellowFruit &#x1F34C;</span>' + '\n'; // banana emoji
  if (yfVersion) {
    html += `<span style="font-size:x-small; color:white">&nbsp;${yfVersion}</span>` + `\n`;
  }
  return html;
}

type CssRule = { attribute: string; value: string };

/** Make a string out of CSS rules for one selector */
function cssSelector(selector: string, ...rules: CssRule[]) {
  const ruleStrings = rules.map((r) => `${r.attribute}: ${r.value};`);
  return `${selector}{\n${ruleStrings.join('\n')}\n}`;
}
