import Grid from '@mui/material/Unstable_Grid2';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Delete, Restore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { NullDate } from '../Utils/UtilTypes';
import { CollapsibleArea } from '../Utils/GeneralReactUtils';
import { Round } from '../DataModel/Round';

function GeneralPage() {
  return (
    <Grid container spacing={2}>
      <BackupRecoveryNotice />
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
  const initialStartDateVal = NullDate.isNullDate(thisTournament.startDate) ? null : dayjs(thisTournament.startDate);
  const initialEndDateVal = NullDate.isNullDate(thisTournament.endDate) ? null : dayjs(thisTournament.endDate);
  const [startDate, setStartDate] = useSubscription(initialStartDateVal);
  const [endDate, setEndDate] = useSubscription(initialEndDateVal);

  return (
    <YfCard title="General">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField
          label="Tournament Name"
          spellCheck={false}
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
          spellCheck={false}
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
            sx={{ marginRight: 2 }}
            label="Date"
            value={startDate}
            onChange={(newValue) => {
              setStartDate(newValue);
              tournManager.setTournamentStartDate(newValue);
            }}
          />
          <DatePicker
            label="End Date (if multi-day)"
            value={endDate}
            onChange={(newValue) => {
              setEndDate(newValue);
              tournManager.setTournamentEndDate(newValue);
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
      <Box sx={{ '& .MuiTextField-root': { my: 1 }, paddingBottom: 2 }}>
        <TextField
          label="Question Set"
          spellCheck={false}
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
      <CollapsibleArea title={<Typography variant="subtitle1">Packet Names</Typography>} secondaryTitle={null}>
        <PacketNameFields />
      </CollapsibleArea>
    </YfCard>
  );
}

function PacketNameFields() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;

  return thisTournament.phases.map((ph) => (
    <div key={ph.name}>
      <Typography variant="subtitle2" sx={{ paddingTop: 2 }}>
        <div>{ph.name}</div>
      </Typography>
      <Box sx={{ marginLeft: 2 }}>
        {ph.rounds.map((round) => (
          <PacketNameField key={round.name} round={round} />
        ))}
      </Box>
    </div>
  ));
}

interface IPacketNameFieldProps {
  round: Round;
}

function PacketNameField(props: IPacketNameFieldProps) {
  const { round } = props;
  const tournManager = useContext(TournamentContext);
  const { packet } = round;
  const [packetName, setPacketName] = useSubscription(packet.name);

  return (
    <Grid container sx={{ p: 1 }}>
      <Grid xs={3}>{round.displayName()}</Grid>
      <Grid xs={9}>
        <TextField
          variant="standard"
          size="small"
          fullWidth
          value={packetName}
          onChange={(e) => setPacketName(e.target.value)}
          onBlur={() => tournManager.setPacketName(round, packetName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setPacketName(round, packetName);
          }}
        />
      </Grid>
    </Grid>
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

function BackupRecoveryNotice() {
  const tournManager = useContext(TournamentContext);
  const [recoveredBackup] = useSubscription(tournManager.recoveredBackup);

  if (!recoveredBackup) return null;

  const firstLine = "YellowFruit didn't shut down correctly. The following file is available to recover:"; // IDE gets mad about the unescaped apostrophe if I put this in raw
  return (
    <Grid xs={12}>
      <Alert
        variant="filled"
        severity="info"
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Delete />}
            onClick={() => tournManager.discardRecoveredBackup()}
          >
            Discard
          </Button>
        }
      >
        {firstLine}
        <List>
          <ListItem>{recoveredBackup.filePath || '(New file)'}</ListItem>
          <ListItem>{`Saved at ${recoveredBackup.savedAtTime}`}</ListItem>
        </List>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Restore />}
          onClick={() => tournManager.useRecoveredBackup()}
        >
          Restore file
        </Button>
      </Alert>
    </Grid>
  );
}

export default GeneralPage;
