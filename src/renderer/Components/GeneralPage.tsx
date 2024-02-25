import Grid from '@mui/material/Unstable_Grid2';
import { Box, Checkbox, FormControlLabel, FormGroup, Stack, TextField } from '@mui/material';
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
        <Stack spacing={2}>
          <QuestionSetCard />
          <AttributeSettingsCard />
        </Stack>
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

function AttributeSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [trackPlayerYear, setTrackPlayerYear] = useSubscription(thisTournament.trackPlayerYear);
  const [trackSS, setTrackSS] = useSubscription(thisTournament.trackSmallSchool);
  const [trackJV, setTrackJV] = useSubscription(thisTournament.trackJV);
  const [trackUG, setTrackUG] = useSubscription(thisTournament.trackUG);
  const [trackD2, setTrackD2] = useSubscription(thisTournament.trackDiv2);

  const handleTrackYearChange = (checked: boolean) => {
    setTrackPlayerYear(checked);
    tournManager.setTrackPlayerYear(checked);
  };

  const handleTrackSS = (checked: boolean) => {
    setTrackSS(checked);
    tournManager.setTrackSmallSchool(checked);
  };

  const handleTrackJV = (checked: boolean) => {
    setTrackJV(checked);
    tournManager.setTrackJV(checked);
  };

  const handleTrackUG = (checked: boolean) => {
    setTrackUG(checked);
    tournManager.setTrackUG(checked);
  };

  const handleTrackD2 = (checked: boolean) => {
    setTrackD2(checked);
    tournManager.setTrackDiv2(checked);
  };

  return (
    <YfCard title="Team/Player Attributes">
      <FormGroup>
        <FormControlLabel
          label="Track Player Year/Grade"
          control={<Checkbox checked={trackPlayerYear} onChange={(e) => handleTrackYearChange(e.target.checked)} />}
        />
        <FormControlLabel
          label="Track Small School"
          control={<Checkbox checked={trackSS} onChange={(e) => handleTrackSS(e.target.checked)} />}
        />
        <FormControlLabel
          label="Track Junior Varsity"
          control={<Checkbox checked={trackJV} onChange={(e) => handleTrackJV(e.target.checked)} />}
        />
        <FormControlLabel
          label="Track Undergrad"
          control={<Checkbox checked={trackUG} onChange={(e) => handleTrackUG(e.target.checked)} />}
        />
        <FormControlLabel
          label="Track Division 2"
          control={<Checkbox checked={trackD2} onChange={(e) => handleTrackD2(e.target.checked)} />}
        />
      </FormGroup>
    </YfCard>
  );
}

export default GeneralPage;
