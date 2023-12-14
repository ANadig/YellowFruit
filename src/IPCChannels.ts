/** Channels used for inter-process communication */
enum IpcChannels {
  ipcExample = 'ipc-example',
  openYftFile = 'openYftFile',
  /** Renderer telling main to save arbitrary file contents */
  saveFile = 'saveFile',
  /** Request the renderer to save the currently open tournament to yft */
  saveCurrentTournament = 'saveCurrentTournament',
  /** Tell the renderer that the .yft file was saved */
  tournamentSavedSuccessfully = 'tournamentSavedSuccessfully',
  /** "Save as" menu option */
  saveAsCommand = 'saveAsYft',
  newTournament = 'newTournament',
}

export const rendererListenableEvents = [
  IpcChannels.openYftFile,
  IpcChannels.saveCurrentTournament,
  IpcChannels.tournamentSavedSuccessfully,
];

export default IpcChannels;
