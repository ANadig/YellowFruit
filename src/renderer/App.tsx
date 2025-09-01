import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';

import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Box from '@mui/material/Box';
import { useContext, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Alert, AlertColor, IconButton, Snackbar, Tooltip } from '@mui/material';
import { Close, Launch } from '@mui/icons-material';
import NavBar, { applicationPageOrder } from './Components/NavBar';
import GeneralPage from './Components/GeneralPage';
import { TournamentManager, TournamentContext } from './TournamentManager';
import RulesPage from './Components/RulesPage';
import SchedulePage from './Components/SchedulePage';
import TeamsPage from './Components/TeamsPage';
import TeamEditDialog from './Components/TeamEditDialog';
import GenericDialog from './Components/GenericDialog';
import GamesPage from './Components/GamesPage';
import MatchEditDialog from './Components/MatchEditDialog';
import StatReportPage from './Components/StatReportPage';
import { ApplicationPages } from './Enums';
import PhaseEditDialog from './Components/PhaseEditDialog';
import PoolEditDialog from './Components/PoolEditDialog';
import RankEditDialog from './Components/RankEditDialog';
import { IpcRendToMain } from '../IPCChannels';
import PoolAssignmentDialog from './Components/PoolAssignmentDialog';
import MatchImportResultDialog from './Components/MatchImportResultDialog';
import SqbsExportDialog from './Components/SqbsExportDialog';
import AboutYfDialog from './Components/AboutYfDialog';

window.onerror = () => window.electron.ipcRenderer.sendMessage(IpcRendToMain.WebPageCrashed);
window.electron.ipcRenderer.removeAllListeners(); // needed in dev environemnt so that you don't end up with duplicate listers when the app reloads
const tournManager = new TournamentManager();

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<YellowFruit />} />
      </Routes>
    </Router>
  );
}

/** Set up various contexts for the application */
function YellowFruit() {
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TournamentContext.Provider value={mgr}>
          <TournamentEditor />
        </TournamentContext.Provider>
      </LocalizationProvider>
    </>
  );
}

/** The actual UI of the application */
function TournamentEditor() {
  const mgr = useContext(TournamentContext);
  const [activePage, setactivePage] = useState(ApplicationPages.General);

  useEffect(() => {
    if (activePage === ApplicationPages.StatReport) {
      mgr.generateHtmlReport();
    } else if (activePage === ApplicationPages.Teams && mgr.currentTeamsPageView === 2) {
      mgr.compileStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mgr, mgr.tournament]);

  useHotkeys('alt+shift+right', () => {
    if (!mgr.anyModalOpen()) {
      const activePageIdx = applicationPageOrder.indexOf(activePage);
      setactivePage(applicationPageOrder[(activePageIdx + 1) % applicationPageOrder.length]);
    }
  });
  useHotkeys('alt+shift+left', () => {
    if (!mgr.anyModalOpen()) {
      const activePageIdx = applicationPageOrder.indexOf(activePage);
      setactivePage(
        applicationPageOrder[(activePageIdx - 1 + applicationPageOrder.length) % applicationPageOrder.length],
      );
    }
  });

  const changePage = (page: ApplicationPages) => {
    if (page === ApplicationPages.StatReport) {
      mgr.generateHtmlReport();
    } else if (page === ApplicationPages.Teams && mgr.currentTeamsPageView === 2) {
      mgr.compileStats();
    }
    setactivePage(page);
  };

  return (
    <>
      <NavBar activePage={activePage} setActivePage={changePage} />
      <Box sx={{ p: 3 }}>
        <ActivePage whichPage={activePage} />
      </Box>
      <GenericDialog />
      <TeamEditDialog />
      <MatchEditDialog />
      <PhaseEditDialog />
      <PoolEditDialog />
      <RankEditDialog />
      <PoolAssignmentDialog />
      <MatchImportResultDialog />
      <SqbsExportDialog />
      <AboutYfDialog />
      <GenericToast />
    </>
  );
}

interface IActivePageProps {
  whichPage: ApplicationPages;
}

/** A switch statement for which page to show */
function ActivePage(props: IActivePageProps) {
  const { whichPage } = props;
  switch (whichPage) {
    case ApplicationPages.General:
      return <GeneralPage />;
    case ApplicationPages.Rules:
      return <RulesPage />;
    case ApplicationPages.Schedule:
      return <SchedulePage />;
    case ApplicationPages.Teams:
      return <TeamsPage />;
    case ApplicationPages.Games:
      return <GamesPage />;
    case ApplicationPages.StatReport:
      return <StatReportPage />;
    default:
      return null;
  }
}

/** Toast message that the TournamentManager can invoke imperatively */
function GenericToast() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');
  const [urlToLaunch, setUrlToLaunch] = useState('');
  const [mgr] = useState(tournManager);
  useEffect(() => {
    mgr.makeToast = (msg, sev = 'success', url = '') => {
      setIsOpen(true);
      setMessage(msg);
      setSeverity(sev);
      setUrlToLaunch(url);
    };
  }, [mgr]);

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleLaunchUrl = () => {
    mgr.launchWebPageInBrowserWindow(urlToLaunch);
    handleClose();
  };

  const durationMs = urlToLaunch !== '' ? 15000 : 5000;
  const action =
    urlToLaunch === '' ? null : (
      <>
        <Tooltip title="Download the lastest version from GitHub">
          <IconButton color="inherit" size="small" onClick={handleLaunchUrl}>
            <Launch fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton color="inherit" size="small" onClick={handleClose}>
          <Close fontSize="small" />
        </IconButton>
      </>
    );

  return (
    <Snackbar open={isOpen} autoHideDuration={durationMs} onClose={handleClose}>
      <Alert severity={severity} variant="filled" onClose={handleClose} action={action} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
