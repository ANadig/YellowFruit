import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material';
import { QuestionMark } from '@mui/icons-material';
import { useHotkeys } from 'react-hotkeys-hook';
import { ApplicationPages } from '../Enums';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import getAppPageHelpText from './PageLevelHelpText';

// Display names for the buttons
const pageNames = {
  [ApplicationPages.General]: 'General',
  [ApplicationPages.Rules]: 'Rules',
  [ApplicationPages.Schedule]: 'Schedule',
  [ApplicationPages.Teams]: 'Teams',
  [ApplicationPages.Games]: 'Games',
  [ApplicationPages.StatReport]: 'Stat Report',
};
// Which order the pages should be in
export const applicationPageOrder = [
  ApplicationPages.General,
  ApplicationPages.Rules,
  ApplicationPages.Schedule,
  ApplicationPages.Teams,
  ApplicationPages.Games,
  ApplicationPages.StatReport,
];

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
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', sm: 'none' } }}>
              <IconButton
                size="large"
                aria-label="navigation menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {applicationPageOrder.map((page) => (
                  <MenuItem key={page} onClick={() => handlePageButtonClick(page)}>
                    <Typography textAlign="center">{pageNames[page]}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
              {applicationPageOrder.map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageButtonClick(page)}
                  sx={{
                    my: 0,
                    py: 2.5,
                    color: 'white',
                    display: 'block',
                    backgroundColor: page === activePage ? '#ffffff30' : 'transparent',
                    borderRadius: 0,
                    '&:hover': { backgroundColor: '#ffffff30' },
                  }}
                >
                  {pageNames[page]}
                </Button>
              ))}
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Show help for this form">
                <IconButton onClick={() => setTipsDialogOpen(true)} color="inherit" sx={{ p: 0 }}>
                  <QuestionMark fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <HelpTipsDialog page={activePage} isOpen={tipsDialogOpen} onClose={() => setTipsDialogOpen(false)} />
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
      <DialogTitle>Help - {pageNames[page]}</DialogTitle>
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
    <div key={idx}>
      {sec.header && <Typography variant="subtitle2">{sec.header}</Typography>}
      {sec.content.map((par, pidx) => (
        // eslint-disable-next-line react/no-array-index-key
        <Typography key={pidx} variant="body2" sx={{ marginBottom: 2 }}>
          {par}
        </Typography>
      ))}
    </div>
  ));
}

export default NavBar;
