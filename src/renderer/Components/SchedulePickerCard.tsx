import { useContext, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import YfCard from './YfCard';
import { getTemplateList, sizesWithTemplates, getStdSchedule } from '../DataModel/ScheduleUtils';
import StandardSchedule from '../DataModel/StandardSchedule';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

const sizeSelectLabel = 'Tournament Size';
const templateSelectLabel = 'Template';

export default function SchedulePickerCard() {
  const tournManager = useContext(TournamentContext);
  const [size, setSize] = useState<number | string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [previewedSchedule, setPreviewedSchedule] = useState<StandardSchedule | null>(null);
  const [numTeamsRegistered] = useSubscription(tournManager.tournament.getNumberOfTeams());
  const readOnly = tournManager.tournament.hasMatchData;

  const handleSizeChange = (val: number | string) => {
    setSize(val);
    setSelectedTemplateName('');
    setPreviewedSchedule(null);
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplateName(val);
    let newSched: StandardSchedule | null = null;
    if (val === '') {
      newSched = null;
    } else {
      newSched = getStdSchedule(val, size);
    }
    setPreviewedSchedule(newSched);
  };

  const applySchedule = () => {
    if (previewedSchedule !== null) tournManager.setStandardSchedule(previewedSchedule);
  };

  return (
    <YfCard title="Browse Templates">
      <Stack sx={{ marginTop: 2 }} spacing={2}>
        <FormControl sx={{ maxWidth: 300 }} size="small">
          <InputLabel>{sizeSelectLabel}</InputLabel>
          <Select
            label={sizeSelectLabel}
            disabled={readOnly}
            value={size}
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            {sizesWithTemplates.map((val) => (
              <MenuItem key={val} value={val} disabled={val < numTeamsRegistered}>{`${val} Teams`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ maxWidth: 300 }} size="small">
          <InputLabel>{templateSelectLabel}</InputLabel>
          <Select
            label={templateSelectLabel}
            value={selectedTemplateName}
            disabled={size === ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {getTemplateList(size).map((tmpl) => (
              <MenuItem key={tmpl.shortName} value={tmpl.shortName}>
                {tmpl.shortName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {previewedSchedule && (
        <>
          <Typography variant="subtitle2" sx={{ marginTop: 3 }}>
            {previewedSchedule.fullName}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText>Rounds: {previewedSchedule.rounds}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>Minimum games: {previewedSchedule.minGames}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>Rooms: {previewedSchedule.rooms}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>Rebracket after: {rebracketRoundList(previewedSchedule)}</ListItemText>
            </ListItem>
          </List>
          <Button variant="outlined" endIcon={<AutoAwesome />} onClick={applySchedule}>
            Use this template!
          </Button>
        </>
      )}
    </YfCard>
  );
}

function rebracketRoundList(sched: StandardSchedule) {
  if (sched.rebracketAfter.length === 0) return 'None';
  return sched.rebracketAfter.map((round) => `Round ${round}`).join(', ');
}
