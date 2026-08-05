import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { Dialog, DialogActions, DialogContent, DialogTitle, Divider, ListItemIcon, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { Check, DarkMode, HelpOutlined, LightMode, SettingsBrightness } from '@mui/icons-material';
import { useHotkeys } from 'react-hotkeys-hook';
import { ApplicationPages } from '../Enums';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import getAppPageHelpText from './PageLevelHelpText';
import { headerHeight, macTitlebarInset } from '../Theme/tokens';

// Display names for the buttons
const pageNames = {
  [ApplicationPages.General]: 'General',
  [ApplicationPages.Rules]: 'Rules',
  [ApplicationPages.Schedule]: 'Schedule',
  [ApplicationPages.Teams]: 'Teams',
  [ApplicationPages.Games]: 'Games',
  [ApplicationPages.Rooms]: 'Rooms',
  [ApplicationPages.StatReport]: 'Stat Report',
};
// Which order the pages should be in
export const applicationPageOrder = [
  ApplicationPages.General,
  ApplicationPages.Rules,
  ApplicationPages.Schedule,
  ApplicationPages.Teams,
  ApplicationPages.Games,
  ApplicationPages.Rooms,
  ApplicationPages.StatReport,
];

const isMac = window.electron.getPlatform() === 'darwin';

/**
 * Below this width the seven page links plus the branding and actions stop fitting, so the nav
 * folds into a menu. It's a measured value rather than a theme breakpoint because what matters is
 * the nav's own content width, not a generic device size.
 */
const navExpandQuery = '@media (min-width: 800px)';

/** Let the user drag the window by the empty parts of the header (macOS uses an inset titlebar). */
const dragRegionSx = isMac ? ({ WebkitAppRegion: 'drag' } as const) : undefined;
const noDragSx = isMac ? ({ WebkitAppRegion: 'no-drag' } as const) : undefined;

interface INavBarProps {
  activePage: ApplicationPages;
  setActivePage: (page: ApplicationPages) => void;
}

function NavBar(props: INavBarProps) {
  const { activePage, setActivePage } = props;
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [tipsDialogOpen, setTipsDialogOpen] = React.useState(false);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handlePageButtonClick = (whichPage: ApplicationPages) => {
    handleCloseNavMenu();
    setActivePage(whichPage);
  };

  return (
    <>
      <AppBar position="sticky">
        <Box
          sx={{
            ...dragRegionSx,
            display: 'grid',
            // 1fr / auto / 1fr keeps the nav centered in the window itself rather than in
            // whatever space the left and right clusters happen to leave over.
            gridTemplateColumns: '1fr auto 1fr',
            // Stretch, not center: the nav owns the full height of the row so the active-page
            // underline can sit flush on the header's bottom border instead of floating above it.
            alignItems: 'stretch',
            columnGap: 2,
            minHeight: `${headerHeight}px`,
            px: 1.5,
            // On macOS the traffic lights live inside the window, so shift the whole row down and
            // keep the left cluster clear of them.
            ...(isMac
              ? { pt: `${macTitlebarInset.paddingTop}px`, pl: `${macTitlebarInset.paddingLeft}px` }
              : undefined),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <IconButton
              size="small"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ ...noDragSx, alignSelf: 'center', [navExpandQuery]: { display: 'none' } }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            <Typography
              noWrap
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'text.primary',
                userSelect: 'none',
              }}
            >
              YellowFruit
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label="Application pages"
            sx={{
              ...noDragSx,
              display: 'none',
              alignItems: 'stretch',
              [navExpandQuery]: { display: 'flex' },
            }}
          >
            {applicationPageOrder.map((page) => (
              <NavTab
                key={page}
                label={pageNames[page]}
                selected={page === activePage}
                onClick={() => handlePageButtonClick(page)}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            <ColorModeButton />
            <Tooltip title="Show help for this form">
              <IconButton size="small" onClick={() => setTipsDialogOpen(true)} sx={noDragSx}>
                <HelpOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Menu
          id="menu-appbar"
          anchorEl={anchorElNav}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          keepMounted
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{ [navExpandQuery]: { display: 'none' } }}
        >
          {applicationPageOrder.map((page) => (
            <MenuItem key={page} selected={page === activePage} onClick={() => handlePageButtonClick(page)}>
              {pageNames[page]}
            </MenuItem>
          ))}
        </Menu>
      </AppBar>
      <HelpTipsDialog page={activePage} isOpen={tipsDialogOpen} onClose={() => setTipsDialogOpen(false)} />
    </>
  );
}

interface INavTabProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/** One page link in the centered header nav. Underline + blue text marks the active page. */
function NavTab(props: INavTabProps) {
  const { label, selected, onClick } = props;

  return (
    <Button
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      sx={{
        position: 'relative',
        alignSelf: 'stretch',
        px: 1.5,
        py: 0,
        borderRadius: 0,
        fontSize: '0.8125rem',
        fontWeight: selected ? 600 : 500,
        color: selected ? 'primary.main' : 'text.secondary',
        '&:hover': { backgroundColor: 'action.hover', color: selected ? 'primary.main' : 'text.primary' },
        // The indicator overlaps the header's 1px bottom border rather than clearing it.
        '&::after': selected
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -1,
              height: '2px',
              backgroundColor: 'primary.main',
            }
          : undefined,
      }}
    >
      {label}
    </Button>
  );
}

const colorModeOptions = [
  { value: 'system', label: 'System', icon: <SettingsBrightness fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightMode fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkMode fontSize="small" /> },
] as const;

/** System / Light / Dark picker. */
function ColorModeButton() {
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  if (!mode) return null;

  const current = colorModeOptions.find((opt) => opt.value === mode) ?? colorModeOptions[0];

  return (
    <>
      <Tooltip title={`Appearance: ${current.label}`}>
        <IconButton
          size="small"
          aria-label="appearance"
          aria-haspopup="true"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={noDragSx}
        >
          {current.icon}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {colorModeOptions.map((opt) => (
          <MenuItem
            key={opt.value}
            selected={opt.value === mode}
            onClick={() => {
              setMode(opt.value);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>{opt.value === mode ? <Check fontSize="small" /> : null}</ListItemIcon>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface IHelpTipsDialogProps {
  page: ApplicationPages;
  isOpen: boolean;
  onClose: () => void;
}

function HelpTipsDialog(props: IHelpTipsDialogProps) {
  const { page, isOpen, onClose } = props;

  useHotkeys('alt+c', onClose, { enabled: isOpen });

  return (
    <Dialog fullWidth maxWidth="sm" open={isOpen} onClose={onClose}>
      <DialogTitle>Help &mdash; {pageNames[page]}</DialogTitle>
      <DialogContent>
        <HelpTextDialogContent page={page} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>{hotkeyFormat('&Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

interface IHelpTextDialogContentProps {
  page: ApplicationPages;
}

function HelpTextDialogContent(props: IHelpTextDialogContentProps) {
  const { page } = props;
  const contents = getAppPageHelpText(page);
  if (!contents) return 'No help text';

  return contents.map((sec, idx) => (
    // eslint-disable-next-line react/no-array-index-key
    <Box key={idx} sx={{ '& + &': { mt: 2 } }}>
      {sec.header && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {sec.header}
          </Typography>
          <Divider sx={{ mb: 1 }} />
        </>
      )}
      {sec.content.map((par, pidx) => (
        // eslint-disable-next-line react/no-array-index-key
        <Typography key={pidx} variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {par}
        </Typography>
      ))}
    </Box>
  ));
}

export default NavBar;
