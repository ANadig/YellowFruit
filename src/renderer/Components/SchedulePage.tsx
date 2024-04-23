import Grid from '@mui/material/Unstable_Grid2';
import SchedulePickerCard from './SchedulePickerCard';
import ScheduleDetailCard from './ScheduleDetailCard';

export default function SchedulePage() {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} md={4}>
        <SchedulePickerCard />
      </Grid>
      <Grid xs={12} md={8}>
        <ScheduleDetailCard />
      </Grid>
    </Grid>
  );
}
