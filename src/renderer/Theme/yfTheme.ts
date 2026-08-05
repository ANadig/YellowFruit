import { alpha, createTheme } from '@mui/material/styles';
import { blue, controlHeight, grey, headerHeight, monoFontStack, radius, semantic, systemFontStack } from './tokens';

/**
 * The single YellowFruit theme. Both color schemes live in one theme object and are driven by
 * CSS variables, so switching between light/dark/system never re-renders the tree.
 *
 * Everything visual that isn't page-specific belongs here rather than in per-component `sx`.
 */
const yfTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: blue[600], light: blue[400], dark: blue[700], contrastText: '#ffffff' },
        secondary: { main: grey[700], light: grey[600], dark: grey[800] },
        success: { main: semantic.successLight },
        warning: { main: semantic.warningLight },
        error: { main: semantic.errorLight },
        info: { main: semantic.infoLight },
        grey,
        divider: grey[200],
        background: { default: grey[50], paper: '#ffffff' },
        text: { primary: grey[900], secondary: grey[600], disabled: grey[400] },
        action: {
          hover: alpha(grey[600], 0.06),
          selected: alpha(blue[600], 0.08),
          disabledBackground: grey[100],
        },
      },
    },
    dark: {
      palette: {
        primary: { main: blue[400], light: blue[300], dark: blue[600], contrastText: '#04121f' },
        secondary: { main: grey[400], light: grey[300], dark: grey[500] },
        success: { main: semantic.successDark },
        warning: { main: semantic.warningDark },
        error: { main: semantic.errorDark },
        info: { main: semantic.infoDark },
        grey,
        divider: '#2c3238',
        background: { default: grey[950], paper: '#171b1f' },
        text: { primary: '#e6e9ed', secondary: '#9aa3ae', disabled: '#5c6570' },
        action: {
          hover: alpha('#ffffff', 0.07),
          selected: alpha(blue[400], 0.16),
          disabledBackground: alpha('#ffffff', 0.08),
        },
      },
    },
  },
  shape: { borderRadius: radius.control },
  // Elevation is not part of the visual language here; keep one whisper-light shadow for
  // things that genuinely float (menus, dialogs, tooltips) and flatten everything else.
  shadows: [
    'none',
    '0 1px 2px rgba(16, 19, 22, 0.06)',
    '0 1px 2px rgba(16, 19, 22, 0.06)',
    '0 2px 6px rgba(16, 19, 22, 0.08)',
    '0 2px 6px rgba(16, 19, 22, 0.08)',
    '0 4px 12px rgba(16, 19, 22, 0.10)',
    '0 4px 12px rgba(16, 19, 22, 0.10)',
    '0 4px 12px rgba(16, 19, 22, 0.10)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 8px 24px rgba(16, 19, 22, 0.12)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 12px 32px rgba(16, 19, 22, 0.14)',
    '0 16px 40px rgba(16, 19, 22, 0.16)',
  ],
  typography: {
    fontFamily: systemFontStack,
    // 14px base: desktop-dense, still comfortable for long statkeeping sessions.
    fontSize: 14,
    htmlFontSize: 16,
    h1: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h2: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h3: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.45 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: 0 },
    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.4 },
  },
  components: {
    // Ripples are the single loudest "old Material" tell. Off everywhere.
    MuiButtonBase: { defaultProps: { disableRipple: true } },

    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        body: { fontVariantNumeric: 'tabular-nums' },
        // Slim, unobtrusive scrollbars to match the flatter surfaces.
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--mui-palette-grey-400)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: 'var(--mui-palette-grey-500)' },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
          borderRadius: radius.panel,
        }),
      },
    },

    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: radius.panel },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.control, paddingLeft: 12, paddingRight: 12 },
        sizeSmall: { minHeight: 28, paddingTop: 3, paddingBottom: 3, fontSize: '0.8125rem' },
        sizeMedium: { minHeight: controlHeight.medium, paddingTop: 6, paddingBottom: 6 },
        sizeLarge: { minHeight: 40, fontSize: '0.875rem' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        outlined: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
          '&:hover': { borderColor: theme.vars.palette.text.disabled },
        }),
        text: { paddingLeft: 8, paddingRight: 8 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: radius.control },
        sizeSmall: { padding: 5 },
      },
    },

    MuiToggleButtonGroup: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.control,
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 500,
          minHeight: controlHeight.small,
          paddingTop: 4,
          paddingBottom: 4,
          borderColor: theme.vars.palette.divider,
          '&.Mui-selected': {
            color: theme.vars.palette.primary.main,
            backgroundColor: theme.vars.palette.action.selected,
          },
        }),
      },
    },

    MuiTextField: { defaultProps: { size: 'small' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.control,
          backgroundColor: theme.vars.palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.divider },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.text.disabled },
          '& .MuiInputBase-inputSizeSmall': { paddingTop: 7.5, paddingBottom: 7.5 },
        }),
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, marginRight: 2, fontSize: '0.75rem' } } },
    MuiFormLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiFormControlLabel: {
      styleOverrides: {
        label: { fontSize: '0.875rem' },
      },
    },

    MuiCheckbox: { defaultProps: { size: 'small' } },
    MuiRadio: { defaultProps: { size: 'small' } },
    MuiSwitch: { defaultProps: { size: 'small' } },

    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { borderRadius: radius.pill, fontWeight: 500 },
        sizeSmall: { height: 22, fontSize: '0.75rem' },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: radius.dialog,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: theme.shadows[8],
          backgroundImage: 'none',
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: '14px 20px', fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: '16px 20px',
          borderTop: `1px solid ${theme.vars.palette.divider}`,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '12px 20px', gap: 8, '& > :not(style) ~ :not(style)': { marginLeft: 0 } },
      },
    },
    MuiDialogContentText: { styleOverrides: { root: { fontSize: '0.875rem' } } },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, minHeight: 40, padding: '8px 14px' },
      },
    },

    MuiTable: { defaultProps: { size: 'small' } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: '8px 12px',
          borderColor: theme.vars.palette.divider,
          fontSize: '0.8125rem',
        }),
        head: ({ theme }) => ({
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: theme.vars.palette.text.secondary,
          whiteSpace: 'nowrap',
        }),
      },
    },
    MuiTableContainer: { styleOverrides: { root: { borderRadius: radius.panel } } },

    MuiAlert: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: radius.control, paddingTop: 4, paddingBottom: 4, alignItems: 'center' },
        message: { fontSize: '0.8125rem', paddingTop: 6, paddingBottom: 6 },
        icon: { paddingTop: 8, paddingBottom: 4, marginRight: 10 },
      },
    },
    MuiAlertTitle: { styleOverrides: { root: { fontSize: '0.8125rem', fontWeight: 600, marginBottom: 2 } } },

    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0, square: false },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: radius.panel,
          '&::before': { display: 'none' },
          '& + &': { marginTop: 8 },
        }),
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 40, padding: '0 12px', '&.Mui-expanded': { minHeight: 40 } },
        content: { margin: '8px 0', '&.Mui-expanded': { margin: '8px 0' } },
      },
    },
    MuiAccordionDetails: { styleOverrides: { root: { padding: '0 12px 12px' } } },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: radius.control,
          boxShadow: theme.shadows[5],
        }),
        list: { paddingTop: 4, paddingBottom: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.875rem', minHeight: 32, borderRadius: 6, margin: '0 4px', paddingLeft: 8 },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: radius.control,
          boxShadow: theme.shadows[5],
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          fontSize: '0.75rem',
          fontWeight: 400,
          borderRadius: 6,
          padding: '5px 8px',
          backgroundColor: theme.vars.palette.grey[800],
        }),
        arrow: ({ theme }) => ({ color: theme.vars.palette.grey[800] }),
      },
    },

    MuiList: { defaultProps: { dense: true } },
    MuiListItem: { styleOverrides: { root: { paddingTop: 2, paddingBottom: 2 } } },
    MuiListItemText: {
      styleOverrides: { primary: { fontSize: '0.875rem' }, secondary: { fontSize: '0.8125rem' } },
    },

    MuiDivider: { styleOverrides: { root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) } },

    MuiLink: { defaultProps: { underline: 'hover' } },

    MuiSnackbarContent: { styleOverrides: { root: { borderRadius: radius.control } } },

    MuiSkeleton: { styleOverrides: { root: { borderRadius: 6 } } },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: 'none',
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: headerHeight, '@media (min-width: 600px)': { minHeight: headerHeight } },
      },
    },

    MuiAutocomplete: { defaultProps: { size: 'small' } },
  },
});

export { monoFontStack };
export default yfTheme;
