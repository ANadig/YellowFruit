import Grid from '@mui/material/Grid';
import { Alert, AlertTitle, Box, Button, Divider, Stack, Switch, TextField, Typography } from '@mui/material';
import { useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Delete, Restore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { NullDate } from '../Utils/UtilTypes';
import { CollapsibleArea, SettingRow, SettingsList, YfPageHeader } from '../Utils/GeneralReactUtils';
import { Round } from '../DataModel/Round';

function GeneralPage() {
  return (
    <>
      <YfPageHeader title="General" description="What, where and when this tournament is, and what you track." />
      <BackupRecoveryNotice />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={2}>
            <TournamentInfoPanel />
            <QuestionSetPanel />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TrackingPanel />
        </Grid>
      </Grid>
    </>
  );
}

/** Miscellaneous what/where/when info about the tournament */
function TournamentInfoPanel() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [tournName, setTournName] = useSubscription(thisTournament.name);
  const [location, setLocation] = useSubscription(thisTournament.tournamentSite.name);
  const initialStartDateVal = NullDate.isNullDate(thisTournament.startDate) ? null : dayjs(thisTournament.startDate);
  const initialEndDateVal = NullDate.isNullDate(thisTournament.endDate) ? null : dayjs(thisTournament.endDate);
  const [startDate, setStartDate] = useSubscription(initialStartDateVal);
  const [endDate, setEndDate] = useSubscription(initialEndDateVal);

  return (
    <YfCard title="Tournament">
      <Stack spacing={2}>
        <TextField
          label="Tournament name"
          spellCheck={false}
          fullWidth
          value={tournName}
          onChange={(e) => setTournName(e.target.value)}
          onBlur={() => tournManager.setTournamentName(tournName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setTournamentName(tournName);
          }}
        />
        <TextField
          label="Location"
          spellCheck={false}
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => tournManager.setTournamentSiteName(location)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tournManager.setTournamentSiteName(location);
          }}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Start date"
              value={startDate}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              onChange={(newValue) => {
                setStartDate(newValue);
                tournManager.setTournamentStartDate(newValue);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="End date (if multi-day)"
              value={endDate}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              onChange={(newValue) => {
                setEndDate(newValue);
                tournManager.setTournamentEndDate(newValue);
              }}
            />
          </Grid>
        </Grid>
      </Stack>
    </YfCard>
  );
}

function QuestionSetPanel() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [qsetName, setQsetName] = useSubscription<string>(thisTournament.questionSet);

  return (
    <YfCard title="Question set">
      <TextField
        label="Question set"
        spellCheck={false}
        fullWidth
        value={qsetName}
        onChange={(e) => setQsetName(e.target.value)}
        onBlur={() => tournManager.setQuestionSetname(qsetName)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') tournManager.setQuestionSetname(qsetName);
        }}
      />
      <Divider sx={{ mt: 1.5 }} />
      <CollapsibleArea title={<Typography variant="subtitle2">Packet names</Typography>} secondaryTitle={null}>
        <PacketNameFields />
      </CollapsibleArea>
    </YfCard>
  );
}

function PacketNameFields() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;

  if (thisTournament.phases.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>
        Pick a schedule first and its rounds will show up here.
      </Typography>
    );
  }

  return thisTournament.phases.map((ph) => (
    <Box key={ph.name} sx={{ pb: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', pt: 1 }}>
        {ph.name}
      </Typography>
      <SettingsList>
        {ph.rounds.map((round) => (
          <PacketNameField key={round.name} round={round} />
        ))}
      </SettingsList>
    </Box>
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
    <SettingRow label={round.displayName()}>
      <TextField
        hiddenLabel
        sx={{ width: 220 }}
        value={packetName}
        onChange={(e) => setPacketName(e.target.value)}
        onBlur={() => tournManager.setPacketName(round, packetName)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') tournManager.setPacketName(round, packetName);
        }}
      />
    </SettingRow>
  );
}

function TrackingPanel() {
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
    <YfCard title="Tracking" description="Extra attributes to record for teams and players.">
      <SettingsList>
        <SettingRow
          label="Track player year/grade"
          description="Adds a year field to each player and to the stat report."
        >
          <Switch checked={trackPlayerYear} onChange={(e) => handleTrackYearChange(e.target.checked)} />
        </SettingRow>
        <SettingRow label="Track small school">
          <Switch checked={trackSS} onChange={(e) => handleTrackSS(e.target.checked)} />
        </SettingRow>
        <SettingRow label="Track junior varsity">
          <Switch checked={trackJV} onChange={(e) => handleTrackJV(e.target.checked)} />
        </SettingRow>
        <SettingRow label="Track undergrad">
          <Switch checked={trackUG} onChange={(e) => handleTrackUG(e.target.checked)} />
        </SettingRow>
        <SettingRow label="Track division 2">
          <Switch checked={trackD2} onChange={(e) => handleTrackD2(e.target.checked)} />
        </SettingRow>
      </SettingsList>
    </YfCard>
  );
}

function BackupRecoveryNotice() {
  const tournManager = useContext(TournamentContext);
  const [recoveredBackup] = useSubscription(tournManager.recoveredBackup);

  if (!recoveredBackup) return null;

  const firstLine = "YellowFruit didn't shut down correctly. The following file is available to recover:"; // IDE gets mad about the unescaped apostrophe if I put this in raw
  return (
    <Alert
      severity="info"
      sx={{ mb: 2, alignItems: 'flex-start' }}
      action={
        <Stack direction="row" sx={{ gap: 1, pt: 0.5 }}>
          <Button size="small" startIcon={<Restore />} onClick={() => tournManager.useRecoveredBackup()}>
            Restore file
          </Button>
          <Button
            size="small"
            color="inherit"
            startIcon={<Delete />}
            onClick={() => tournManager.discardRecoveredBackup()}
          >
            Discard
          </Button>
        </Stack>
      }
    >
      <AlertTitle>Unsaved work recovered</AlertTitle>
      <Typography variant="body2" color="text.secondary">
        {firstLine}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
        {recoveredBackup.filePath || '(New file)'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {`Saved at ${recoveredBackup.savedAtTime}`}
      </Typography>
    </Alert>
  );
}

export default GeneralPage;
