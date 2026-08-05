import Grid from '@mui/material/Grid';
import SchedulePickerCard from './SchedulePickerCard';
import ScheduleDetailCard from './ScheduleDetailCard';
import { YfPageHeader } from '../Utils/GeneralReactUtils';

export default function SchedulePage() {
  return (
    <>
      <YfPageHeader title="Schedule" description="Phases, pools and rounds. Start from a template or build your own." />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SchedulePickerCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ScheduleDetailCard />
        </Grid>
      </Grid>
    </>
  );
}
