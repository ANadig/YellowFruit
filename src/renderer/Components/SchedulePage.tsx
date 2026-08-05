import Grid from '@mui/material/Grid';
import SchedulePickerCard from './SchedulePickerCard';
import ScheduleDetailCard from './ScheduleDetailCard';

export default function SchedulePage() {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <SchedulePickerCard />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <ScheduleDetailCard />
      </Grid>
    </Grid>
  );
}
