import { Divider, Switch, Typography } from '@mui/material';
import { ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { parseAndValidateStringToInt } from '../Utils/GeneralUtils';
import { AdvancedNumericRuleField } from './BonusSettingsCard';
import { CollapsibleArea, SettingRow, SettingsList } from '../Utils/GeneralReactUtils';

function LightningRoundSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [useLightning, setUseLightning] = useSubscription(thisTournamentRules.lightningCountPerTeam > 0);
  const readOnly = tournManager.tournament.hasMatchData;

  const handleUseLightningChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUseLightning(e.target.checked);
    tournManager.setUseLightning(e.target.checked);
  };

  return (
    <YfCard title="Lightning round">
      <SettingsList>
        <SettingRow label="Use lightning round">
          <Switch checked={useLightning} disabled={readOnly} onChange={handleUseLightningChange} />
        </SettingRow>
      </SettingsList>
      {useLightning && (
        <>
          <Divider sx={{ mt: 1 }} />
          <CollapsibleArea title={<Typography variant="subtitle2">Advanced</Typography>} secondaryTitle={null}>
            <AdvancedSection />
          </CollapsibleArea>
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
    const valueToSave = parseAndValidateStringToInt(value, deflt, 1, 1000);
    setDivisor(valueToSave.toString());
    tournManager.setLightningDivisor(valueToSave);
  };

  return (
    <SettingsList>
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
    </SettingsList>
  );
}

export default LightningRoundSettingsCard;
