import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useContext, useState } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';

/** Miscellaneous what/where/when info about the tournament */
function GeneralInfoCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [tournName, setTournName] = useState(thisTournament.name);
  const [location, setLocation] = useState(thisTournament.tournamentSite.name);

  return (
    <YfCard title="General">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField
          label="Tournament Name"
          fullWidth
          variant="outlined"
          size="small"
          value={tournName}
          onChange={(e) => setTournName(e.target.value)}
          onBlur={() => tournManager.setTournamentName(tournName)}
        />
        <TextField
          label="Tournament Location"
          fullWidth
          variant="outlined"
          size="small"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => tournManager.setTournamentSiteName(location)}
        />
      </Box>
    </YfCard>
  );
}

export default GeneralInfoCard;
