import { FormGroup, FormControlLabel, Switch } from '@mui/material';
import { ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';

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
    <YfCard title="Lightning Round">
      <FormGroup>
        <FormControlLabel
          label="Use Lightning Round"
          control={<Switch checked={useLightning} disabled={readOnly} onChange={handleUseLightningChange} />}
        />
      </FormGroup>
    </YfCard>
  );
}

export default LightningRoundSettingsCard;
