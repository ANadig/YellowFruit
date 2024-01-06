import Grid from '@mui/material/Unstable_Grid2';
import { Stack } from '@mui/material';
import StandardRuleSetCard from './StandardRuleSetCard';
import TossupSettingsCard from './TossupSettingsCard';
import BonusSettingsCard from './BonusSettingsCard';
import MaxPlayersSettingsCard from './MaxPlayerSettingsCard';
import OvertimeSettingsCard from './OvertimeSettingsCard';
import RoundLengthSettingsCard from './RoundLengthSettingsCard';

function RulesPage() {
  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <StandardRuleSetCard />
      </Grid>
      <Grid xs={12} sm={4}>
        <Stack spacing={2}>
          <RoundLengthSettingsCard />
          <TossupSettingsCard />
        </Stack>
      </Grid>
      <Grid xs={12} sm={4}>
        <BonusSettingsCard />
      </Grid>
      <Grid xs={12} sm={4}>
        <Stack spacing={2}>
          <MaxPlayersSettingsCard />
          <OvertimeSettingsCard />
        </Stack>
      </Grid>
    </Grid>
  );
}

export default RulesPage;
