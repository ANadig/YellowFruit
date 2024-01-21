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
import { ScheduleTemplates, getTemplateList, getTemplateShortName, makeSchedule } from '../DataModel/ScheduleUtils';
import StandardSchedule from '../DataModel/StandardSchedule';
import { TournamentContext } from '../TournamentManager';

const sizeSelectLabel = 'Tournament Size';
const templateSelectLabel = 'Template';
const sizesWithTemplates = [4, 24];

export default function SchedulePickerCard() {
  const tournManager = useContext(TournamentContext);
  const [size, setSize] = useState<number | string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplates | string>('');
  const [previewedSchedule, setPreviewedSchedule] = useState<StandardSchedule | null>(null);

  const handleSizeChange = (val: number | string) => {
    setSize(val);
    setSelectedTemplate('');
    setPreviewedSchedule(null);
  };

  const handleTemplateChange = (val: ScheduleTemplates | string) => {
    setSelectedTemplate(val);
    let newSched: StandardSchedule | null = null;
    if (typeof val === 'string') {
      newSched = null;
    } else {
      newSched = makeSchedule(val);
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
          <Select label={sizeSelectLabel} value={size} onChange={(e) => handleSizeChange(e.target.value)}>
            {sizesWithTemplates.map((val) => (
              <MenuItem key={val} value={val}>{`${val} Teams`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ maxWidth: 300 }} size="small">
          <InputLabel>{templateSelectLabel}</InputLabel>
          <Select
            label={templateSelectLabel}
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {getTemplateList(size).map((tmpl) => (
              <MenuItem key={tmpl} value={tmpl}>
                {getTemplateShortName(tmpl)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {previewedSchedule && (
        <>
          <Typography variant="subtitle2" sx={{ marginTop: 3 }}>
            About this schedule:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText>Rounds: {previewedSchedule.rounds}</ListItemText>
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
