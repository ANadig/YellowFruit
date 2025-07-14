/** Things that both the main and renderer processes refer to */

export const statReportProtocol = 'yf-stat-report';

export interface StatReportHtmlPage {
  /** last part of the file name (e.g. "standings.html") */
  fileName: string;
  contents: string;
}

export interface SqbsExportFile {
  /** suffix to add to the user-selected file path, if exporting multiple files */
  fileSuffix?: string;
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
