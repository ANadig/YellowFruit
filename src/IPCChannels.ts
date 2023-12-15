/** Channels for renderer sending messages to main */
export enum IpcRendToMain {
  ipcExample = 'ipc-example',
  /** Save arbitrary file contents */
  saveFile = 'saveFile',
}

/** Channels for main sending messages to renderer */
export enum IpcMainToRend {
  ipcExample = 'ipc-example',
  openYftFile = 'openYftFile',
  /** Request the renderer to save the currently open tournament to yft */
  saveCurrentTournament = 'saveCurrentTournament',
  /** Tell the renderer that the .yft file was saved */
  tournamentSavedSuccessfully = 'tournamentSavedSuccessfully',
  /** "Save as" menu option */
  saveAsCommand = 'saveAsYft',
  newTournament = 'newTournament',
}

/** Channels for both directions renderer<-->main */
export enum IpcBidirectional {
  ipcExample = 'ipc-example',
}

export type IpcChannels = IpcRendToMain | IpcMainToRend | IpcBidirectional;

export const rendererListenableEvents = [
  IpcMainToRend.openYftFile,
  IpcMainToRend.saveCurrentTournament,
  IpcMainToRend.tournamentSavedSuccessfully,
  IpcMainToRend.saveAsCommand,
  IpcMainToRend.newTournament,
];
