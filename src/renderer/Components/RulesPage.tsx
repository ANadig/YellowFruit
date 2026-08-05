import Grid from '@mui/material/Grid';
import { Alert, Stack } from '@mui/material';
import { useContext } from 'react';
import { Lock } from '@mui/icons-material';
import StandardRuleSetCard from './StandardRuleSetCard';
import TossupSettingsCard from './TossupSettingsCard';
import BonusSettingsCard from './BonusSettingsCard';
import MaxPlayersSettingsCard from './MaxPlayerSettingsCard';
import OvertimeSettingsCard from './OvertimeSettingsCard';
import RoundLengthSettingsCard from './RoundLengthSettingsCard';
import LightningRoundSettingsCard from './LightningRoundSettingsCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

function RulesPage() {
  const tournManager = useContext(TournamentContext);
  const [readOnly] = useSubscription(tournManager.tournament.hasMatchData);

  return (
    <Grid container spacing={2}>
      {readOnly && (
        <Grid size={{ xs: 12 }}>
          <Alert variant="filled" severity="info" icon={<Lock fontSize="small" />}>
            Settings are read-only
          </Alert>
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <StandardRuleSetCard />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Stack spacing={2}>
          <RoundLengthSettingsCard />
          <TossupSettingsCard />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Stack spacing={2}>
          <BonusSettingsCard />
          <LightningRoundSettingsCard />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Stack spacing={2}>
          <MaxPlayersSettingsCard />
          <OvertimeSettingsCard />
        </Stack>
      </Grid>
    </Grid>
  );
}

export default RulesPage;
