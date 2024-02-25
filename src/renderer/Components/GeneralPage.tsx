import Grid from '@mui/material/Unstable_Grid2';
import { Box, TextField } from '@mui/material';
import { useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { NullDate } from '../Utils/UtilTypes';

function GeneralPage() {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} sm={6}>
        <GeneralInfoCard />
      </Grid>
      <Grid xs={12} sm={6}>
        <QuestionSetCard />
      </Grid>
    </Grid>
  );
}

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

function QuestionSetCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [qsetName, setQsetName] = useSubscription<string>(thisTournament.questionSet);

  return (
    <YfCard title="Question Set">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField
          label="Question Set"
          fullWidth
          variant="outlined"
          size="small"
          value={qsetName}
          onChange={(e) => setQsetName(e.target.value)}
          onBlur={() => tournManager.setQuestionSetname(qsetName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setQuestionSetname(qsetName);
          }}
        />
      </Box>
    </YfCard>
  );
}

export default GeneralPage;
