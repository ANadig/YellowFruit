/**
 * Design tokens for the YellowFruit UI.
 *
 * These are the raw values; `yfTheme.ts` assembles them into the MUI theme. Nothing here
 * should reference MUI so that the tokens stay readable as a single source of truth.
 */

/** Neutral ramp. Slightly cool so surfaces read as paper rather than beige. */
export const grey = {
  50: '#f8f9fb',
  100: '#f1f3f6',
  200: '#e4e8ee',
  300: '#d3d9e2',
  400: '#aeb7c4',
  500: '#8a93a2',
  600: '#646d7c',
  700: '#464e5b',
  800: '#2b3138',
  900: '#191d22',
  950: '#101316',
};

/** The accent. Strong enough to carry selected/active state, calm enough to use on text. */
export const blue = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#8fc4fb',
  400: '#5aa7f7',
  500: '#2f88ec',
  600: '#0f6fdb',
  700: '#0059b2',
  800: '#00458c',
  900: '#0b3a6f',
};

export const semantic = {
  successLight: '#1d7a4c',
  successDark: '#4ec27f',
  warningLight: '#8a5a12',
  warningDark: '#e0a95c',
  errorLight: '#c0342b',
  errorDark: '#f27a72',
  infoLight: '#0f6fdb',
  infoDark: '#5aa7f7',
};

/**
 * System UI stack. Deliberately not Roboto: the app should look native on the desktop it
 * happens to be running on.
 */
export const systemFontStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'system-ui',
  'Inter',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(', ');

export const monoFontStack = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Corner radii. Small for controls, slightly larger for panels and dialogs. */
export const radius = {
  control: 8,
  panel: 10,
  dialog: 12,
  pill: 6,
};

/** Control heights, in px. Compact desktop sizing. */
export const controlHeight = {
  small: 32,
  medium: 36,
};

/** Height of the top navigation strip, in px. */
export const headerHeight = 44;

/** Extra top padding needed on macOS so content clears the native traffic lights. */
export const macTitlebarInset = {
  paddingTop: 24,
  paddingLeft: 84,
};
