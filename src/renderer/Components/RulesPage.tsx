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
import { YfPageHeader } from '../Utils/GeneralReactUtils';

function RulesPage() {
  const tournManager = useContext(TournamentContext);
  const [readOnly] = useSubscription(tournManager.tournament.hasMatchData);

  return (
    <>
      <YfPageHeader title="Rules" description="How games are scored. Start from a standard rule set, then adjust." />
      {readOnly && (
        <Alert severity="info" icon={<Lock fontSize="small" />} sx={{ mb: 2 }}>
          Games have already been entered, so scoring rules are read-only.
        </Alert>
      )}
      <Stack spacing={2}>
        <StandardRuleSetCard />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6, xl: 4 }}>
            <Stack spacing={2}>
              <RoundLengthSettingsCard />
              <TossupSettingsCard />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6, xl: 4 }}>
            <Stack spacing={2}>
              <BonusSettingsCard />
              <LightningRoundSettingsCard />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6, xl: 4 }}>
            <Stack spacing={2}>
              <OvertimeSettingsCard />
              <MaxPlayersSettingsCard />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}

export default RulesPage;
