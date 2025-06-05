import { FormGroup, FormControlLabel, Switch, Box, Typography, Collapse } from '@mui/material';
import { ChangeEvent, useContext, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { ExpandMore } from '@mui/icons-material';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { invalidInteger } from '../Utils/GeneralUtils';
import { AdvancedNumericRuleField } from './BonusSettingsCard';
import { ExpandButton } from '../Utils/GeneralReactUtils';

function LightningRoundSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [useLightning, setUseLightning] = useSubscription(thisTournamentRules.lightningCountPerTeam > 0);
  const readOnly = tournManager.tournament.hasMatchData;
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const handleUseLightningChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUseLightning(e.target.checked);
    tournManager.setUseLightning(e.target.checked);
  };

  return (
    <YfCard title="Lightning Round">
      <FormGroup>
        <FormControlLabel
          label="Use Lightning Round"
          control={<Switch checked={useLightning} disabled={readOnly} onChange={handleUseLightningChange} />}
        />
      </FormGroup>
      {useLightning && (
        <>
          <Grid container sx={{ cursor: 'pointer ' }} onClick={() => setAdvancedExpanded(!advancedExpanded)}>
            <Grid xs>
              <Typography sx={{ marginTop: 1.3 }} variant="subtitle2">
                Advanced
              </Typography>
            </Grid>
            <Grid xs="auto">
              <ExpandButton expand={advancedExpanded}>
                <ExpandMore />
              </ExpandButton>
            </Grid>
          </Grid>
          <Collapse in={advancedExpanded}>
            <AdvancedSection />
          </Collapse>
        </>
      )}
    </YfCard>
  );
}

function AdvancedSection() {
  const tournManager = useContext(TournamentContext);
  const [divisor, setDivisor] = useSubscription(tournManager.tournament.scoringRules.lightningDivisor.toString());

  const handleDivisorChange = (value: string) => {
    const deflt = tournManager.tournament.scoringRules.lightningDivisor;
    const valueToSave = intValueToUse(value, deflt, 1, 1000);
    setDivisor(valueToSave.toString());
    tournManager.setLightningDivisor(valueToSave);
  };

  return (
    <Box sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
      <AdvancedNumericRuleField
        label="Divisor"
        required
        disabled={tournManager.tournament.hasMatchData}
        value={divisor}
        minValue={1}
        maxValue={1000}
        onChange={setDivisor}
        onBlur={() => handleDivisorChange(divisor)}
      />
    </Box>
  );
}

function intValueToUse(str: string, deflt: number, lowerBound?: number, upperBound?: number) {
  if (str === '') return deflt;
  if (invalidInteger(str, lowerBound, upperBound)) return deflt;
  return parseInt(str, 10);
}

export default LightningRoundSettingsCard;
