/** Things that both the main and renderer processes refer to */

export const statReportProtocol = 'yf-stat-report';

export interface StatReportHtmlPage {
  fileName: string;
  contents: string;
}

/** Actions initiated by the Main process that involve switching away from the current file */
export enum FileSwitchActions {
  NewFile,
  OpenYftFile,
  CloseApp,
}

export const FileSwitchActionNames = {
  [FileSwitchActions.NewFile]: 'New File',
  [FileSwitchActions.OpenYftFile]: 'Open File',
  [FileSwitchActions.CloseApp]: 'Exit YellowFruit',
};
