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
import ApplicationPages from './Enums';

// Display names for the buttons
const pageNames = {
  [ApplicationPages.General]: 'General',
  [ApplicationPages.Rules]: 'Rules',
  [ApplicationPages.Schedule]: 'Schedule',
  [ApplicationPages.Teams]: 'Teams',
  [ApplicationPages.Games]: 'Games',
};
// Which order the pages should be in
const pages = [
  ApplicationPages.General,
  ApplicationPages.Rules,
  ApplicationPages.Schedule,
  ApplicationPages.Teams,
  ApplicationPages.Games,
];

interface INavBarProps {
  activePage: ApplicationPages;
  setActivePage: (page: ApplicationPages) => void;
}

function NavBar(props: INavBarProps) {
  const { activePage, setActivePage } = props;
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

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
              {pages.map((page) => (
                <MenuItem key={page} onClick={() => handlePageButtonClick(page)}>
                  <Typography textAlign="center">{pageNames[page]}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageButtonClick(page)}
                sx={{
                  my: 0,
                  py: 2.5,
                  color: 'white',
                  display: 'block',
                  'background-color': page === activePage ? '#ffffff30' : 'transparent',
                  'border-radius': 0,
                  '&:hover': { 'background-color': '#ffffff30' },
                }}
              >
                {pageNames[page]}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default NavBar;
