import Grid from '@mui/material/Unstable_Grid2';
import GeneralInfoCard from './GeneralInfoCard';
import QuestionSetCard from './QuestionSetCard';

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

export default GeneralPage;
