import { FormControlLabel, FormGroup, Switch, TextField, Tooltip } from '@mui/material';
import { useState, ChangeEvent, useContext } from 'react';
import { HelpOutline } from '@mui/icons-material';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import { ScoringRules } from '../DataModel/ScoringRules';
import useSubscription from '../Utils/CustomHooks';

const standardTusLabel = 'Toss-Ups';
const standardTusHelpText = 'The number of toss-ups read per round (not including overtime)';
const timedTusLabel = 'Max Toss-Ups';
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
  const [numTusLabel, setNumTusLabel] = useState(getTuFieldLabel(thisTournamentRules.timed));
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
    <YfCard title="Round Length">
      <FormGroup>
        <FormControlLabel
          label="Timed Rounds"
          control={<Switch disabled={readOnly} checked={timedRoundsChecked} onChange={handleTimedRoundsChange} />}
        />
      </FormGroup>
      <TextField
        sx={{ marginTop: 1, width: '13ch' }}
        size="small"
        type="number"
        inputProps={{ min: 1, disabled: readOnly }}
        label={numTusLabel}
        value={numTus}
        error={!tuNumberIsValid()}
        onChange={(e) => setNumTus(e.target.value)}
        onBlur={saveNumTusSetting}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveNumTusSetting();
        }}
      />
      <Tooltip sx={{ marginTop: 2, mx: 1 }} title={numTusHelpText} placement="right">
        <HelpOutline fontSize="small" />
      </Tooltip>
    </YfCard>
  );
}

export default RoundLengthSettingsCard;
