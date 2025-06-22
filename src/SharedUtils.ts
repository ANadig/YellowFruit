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
  ImportQbjTournament,
}

export const FileSwitchActionNames = {
  [FileSwitchActions.NewFile]: 'New File',
  [FileSwitchActions.OpenYftFile]: 'Open File',
  [FileSwitchActions.CloseApp]: 'Exit YellowFruit',
};

export interface IYftBackupFile {
  filePath: string;
  /** When the backup was last saved - stringify to ISO 8601 format */
  savedAtTime: Date;
  fileContents: object;
}

export interface IMatchImportFileRequest {
  filePath: string;
  fileContents: string;
}
