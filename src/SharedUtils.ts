/** Things that both the main and renderer processes refer to */

export const statReportProtocol = 'yf-stat-report';

export interface StatReportHtmlPage {
  fileName: string;
  contents: string;
}
