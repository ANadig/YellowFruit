import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

import { useEffect, useState } from 'react';
import NavBar from './Components/NavBar';
import GeneralPage from './Components/GeneralPage';
import { TournamentManager, TournamentContext } from './TournamentManager';

/** Holds the entire UI */
function YellowFruit() {
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a rerender
  const [tournManager] = useState(new TournamentManager());
  useEffect(() => {
    tournManager.dataChangedCallback = () => {
      setUpdateNeeded({});
    };
  }, [tournManager]);

  return (
    <>
      <CssBaseline />
      <TournamentContext.Provider value={tournManager}>
        <NavBar />
        <Box sx={{ p: 3 }}>
          <GeneralPage />
        </Box>
      </TournamentContext.Provider>
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
