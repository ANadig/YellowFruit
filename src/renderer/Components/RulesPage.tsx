import Grid from '@mui/material/Unstable_Grid2';
import StandardRuleSetCard from './StandardRuleSetCard';
import TossupSettingsCard from './TossupSettingsCard';
import BonusSettingsCard from './BonusSettingsCard';
import MaxPlayersSettingsCard from './MaxPlayerSettingsCard';
import OvertimeSettingsCard from './OvertimeSettingsCard';

function RulesPage() {
  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <StandardRuleSetCard />
      </Grid>
      <Grid xs={12} sm={4}>
        <TossupSettingsCard />
      </Grid>
      <Grid xs={12} sm={4}>
        <BonusSettingsCard />
      </Grid>
      <Grid container xs={12} sm={4}>
        <Grid xs={12}>
          <MaxPlayersSettingsCard />
        </Grid>
        <Grid xs={12}>
          <OvertimeSettingsCard />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default RulesPage;
