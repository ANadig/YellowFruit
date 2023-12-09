import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

import NavBar from './Components/NavBar';
import GeneralPage from './Components/GeneralPage';

/** Holds the entire UI */
function YellowFruit() {
  return (
    <>
      <CssBaseline />
      <NavBar />
      <Box sx={{ p: 3 }}>
        <GeneralPage />
      </Box>
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
