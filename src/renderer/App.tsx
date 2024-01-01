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

import { useEffect, useState } from 'react';
import NavBar from './Components/NavBar';
import GeneralPage from './Components/GeneralPage';
import { TournamentManager, TournamentContext } from './TournamentManager';
import ApplicationPages from './Components/Enums';

window.electron.ipcRenderer.removeAllListeners();
const tournManager = new TournamentManager();

interface IActivePageProps {
  whichPage: ApplicationPages;
}

/** A switch statement for which page to show */
function ActivePage(props: IActivePageProps) {
  const { whichPage } = props;
  switch (whichPage) {
    case ApplicationPages.General:
      return <GeneralPage />;
    default:
      return null;
  }
}

/** The actual UI of the application */
function TournamentEditor() {
  const [activePage, setactivePage] = useState(ApplicationPages.General);

  return (
    <>
      <NavBar activePage={activePage} setActivePage={setactivePage} />
      <Box sx={{ p: 3 }}>
        <ActivePage whichPage={activePage} />
      </Box>
    </>
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<YellowFruit />} />
      </Routes>
    </Router>
  );
}
