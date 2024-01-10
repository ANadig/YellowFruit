import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { NullDate } from '../Utils/UtilTypes';

/** Miscellaneous what/where/when info about the tournament */
function GeneralInfoCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [tournName, setTournName] = useSubscription(thisTournament.name);
  const [location, setLocation] = useSubscription(thisTournament.tournamentSite.name);
  const initialDateVal = NullDate.isNullDate(thisTournament.startDate) ? null : dayjs(thisTournament.startDate);
  const [date, setDate] = useSubscription(initialDateVal);

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
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setTournamentName(tournName);
          }}
        />
        <TextField
          label="Tournament Location"
          fullWidth
          variant="outlined"
          size="small"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => tournManager.setTournamentSiteName(location)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setTournamentSiteName(location);
          }}
        />
        <Box sx={{ '& .MuiInputBase-root': { height: '40px' }, '& .MuiFormLabel-root': { marginTop: '-7px' } }}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(newValue) => {
              setDate(newValue);
              tournManager.setTournamentStartDate(newValue);
            }}
          />
        </Box>
      </Box>
    </YfCard>
  );
}

export default GeneralInfoCard;
