export interface IIpcCommandResult {
  successful: boolean;
  message?: string;
}

/** The html contents of the different stat report pages */
export interface IStatReportContents {
  standings: string;
  individuals?: string;
  scoreboard?: string;
  teamDetails?: string;
  playerDetailsS?: string;
  roundReport?: string;
}

export const StatReportFileNames = {
  standings: 'standings.html',
  individuals: 'individuals.html',
  scoreboard: 'games.html',
  teamDetail: 'teamdetail.html',
  playerDetail: 'playerdetail.html',
  roundReport: 'rounds.html',
};
