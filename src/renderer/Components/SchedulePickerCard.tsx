import { useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import YfCard from './YfCard';
import { getTemplateList, sizesWithTemplates, getStdSchedule } from '../DataModel/ScheduleUtils';
import StandardSchedule from '../DataModel/StandardSchedule';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { SettingRow, SettingsList } from '../Utils/GeneralReactUtils';

const sizeSelectLabel = 'Tournament size';
const templateSelectLabel = 'Template';

export default function SchedulePickerCard() {
  const tournManager = useContext(TournamentContext);
  const [size, setSize] = useState<number | string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [previewedSchedule, setPreviewedSchedule] = useState<StandardSchedule | null>(null);
  const [numTeamsRegistered] = useSubscription(tournManager.tournament.getNumberOfTeams());
  const readOnly = tournManager.tournament.hasMatchData;

  useEffect(() => {
    setSize('');
    setSelectedTemplateName('');
    setPreviewedSchedule(null);
  }, [tournManager.tournament]);

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
    <YfCard title="Browse templates" description="Prebuilt schedules for common tournament sizes.">
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>{sizeSelectLabel}</InputLabel>
          <Select
            label={sizeSelectLabel}
            disabled={readOnly}
            value={size}
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            {sizesWithTemplates.map((val) => (
              <MenuItem key={val} value={val} disabled={val < numTeamsRegistered}>{`${val} teams`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
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
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2">{previewedSchedule.fullName}</Typography>
          {!tournManager.tournament.scoringRules.useBonuses && previewedSchedule.usesWC && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              This schedule should only be used for tournaments that use bonuses because it requires re-seeding teams
              based on points per bonus
            </Alert>
          )}
          <SettingsList>
            <SettingRow label="Rounds" control={<SummaryValue text={String(previewedSchedule.rounds)} />} />
            <SettingRow label="Minimum games" control={<SummaryValue text={String(previewedSchedule.minGames)} />} />
            <SettingRow label="Rooms" control={<SummaryValue text={String(previewedSchedule.rooms)} />} />
            <SettingRow
              label="Rebracket after"
              control={<SummaryValue text={rebracketRoundList(previewedSchedule)} />}
            />
          </SettingsList>
          <Button fullWidth variant="contained" endIcon={<AutoAwesome />} sx={{ mt: 2 }} onClick={applySchedule}>
            Use this template
          </Button>
        </Box>
      )}
    </YfCard>
  );
}

function SummaryValue(props: { text: string }) {
  const { text } = props;
  return (
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {text}
    </Typography>
  );
}

function rebracketRoundList(sched: StandardSchedule) {
  if (sched.rebracketAfter.length === 0) return 'None';
  return sched.rebracketAfter.map((round) => `Round ${round}`).join(', ');
}
