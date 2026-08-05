import { Switch } from '@mui/material';
import { useState, ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import { ScoringRules } from '../DataModel/ScoringRules';
import useSubscription from '../Utils/CustomHooks';
import { SettingRow, SettingsList, YfNumericField } from '../Utils/GeneralReactUtils';

const standardTusLabel = 'Toss-ups per round';
const standardTusHelpText = 'The number of toss-ups read per round (not including overtime)';
const timedTusLabel = 'Max toss-ups per round';
const timedTusHelpText = 'The maximum number of toss-ups that could be read per round (not including overtime)';

function getTuFieldLabel(timed: boolean) {
  return timed ? timedTusLabel : standardTusLabel;
}

function getTuFieldHelpText(timed: boolean) {
  return timed ? timedTusHelpText : standardTusHelpText;
}

function RoundLengthSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [timedRoundsChecked, setTimedRoundsChecked] = useSubscription(thisTournamentRules.timed);
  const [numTus, setNumTus] = useSubscription(thisTournamentRules.maximumRegulationTossupCount.toString());
  const [numTusLabel, setNumTusLabel] = useSubscription(getTuFieldLabel(thisTournamentRules.timed));
  const [numTusHelpText, setNumTusHelpText] = useState(getTuFieldHelpText(thisTournamentRules.timed));
  const readOnly = tournManager.tournament.hasMatchData;

  const handleTimedRoundsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTimedRoundsChecked(e.target.checked);
    setNumTusLabel(getTuFieldLabel(e.target.checked));
    setNumTusHelpText(getTuFieldHelpText(e.target.checked));
    tournManager.setTimedRoundSetting(e.target.checked);
  };

  const saveNumTusSetting = () => {
    let valueToSave: number;
    const parsed = parseFloat(numTus);
    if (numTus === '' || Number.isNaN(parsed) || !ScoringRules.validateMaxRegTuCount(parsed)) {
      valueToSave = ScoringRules.defaultRegulationTossupCount;
    } else {
      valueToSave = parseInt(numTus, 10);
    }
    setNumTus(valueToSave.toString());
    tournManager.setNumTusPerRound(valueToSave);
  };

  const tuNumberIsValid = () => {
    if (numTus === '') return false;
    const parsed = parseFloat(numTus);
    return ScoringRules.validateMaxRegTuCount(parsed);
  };

  return (
    <YfCard title="Regulation">
      <SettingsList>
        <SettingRow label="Timed rounds" description="Rounds end on the clock rather than after a fixed count.">
          <Switch disabled={readOnly} checked={timedRoundsChecked} onChange={handleTimedRoundsChange} />
        </SettingRow>
        <SettingRow label={numTusLabel} description={numTusHelpText}>
          <YfNumericField
            hiddenLabel
            sx={{ width: '9ch' }}
            slotProps={{ htmlInput: { min: 1, disabled: readOnly } }}
            value={numTus}
            error={!tuNumberIsValid()}
            onChange={(e) => setNumTus(e.target.value)}
            onBlur={saveNumTusSetting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveNumTusSetting();
            }}
          />
        </SettingRow>
      </SettingsList>
    </YfCard>
  );
}

export default RoundLengthSettingsCard;
