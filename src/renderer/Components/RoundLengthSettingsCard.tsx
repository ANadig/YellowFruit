import { FormControlLabel, FormGroup, Switch, TextField, Tooltip } from '@mui/material';
import { useState, ChangeEvent, useContext } from 'react';
import { HelpOutline } from '@mui/icons-material';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import { ScoringRules } from '../DataModel/ScoringRules';

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

function tuNumberInValidRange(num: number) {
  return 1 <= num && num <= 100;
}

function RoundLengthSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [timedRoundsChecked, setTimedRoundsChecked] = useState(thisTournamentRules.timed);
  const [numTusLabel, setNumTusLabel] = useState(getTuFieldLabel(thisTournamentRules.timed));
  const [numTusHelpText, setNumTusHelpText] = useState(getTuFieldHelpText(thisTournamentRules.timed));
  const [numTus, setNumTus] = useState(thisTournamentRules.maximumRegulationTossupCount.toString());

  const handleTimedRoundsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTimedRoundsChecked(e.target.checked);
    setNumTusLabel(getTuFieldLabel(e.target.checked));
    setNumTusHelpText(getTuFieldHelpText(e.target.checked));
    tournManager.setTimedRoundSetting(e.target.checked);
  };

  const saveNumTusSetting = () => {
    let valueToSave: number;
    const parsed = parseFloat(numTus);
    if (numTus === '' || Number.isNaN(parsed) || !tuNumberInValidRange(parsed)) {
      valueToSave = ScoringRules.defaultRegulationTossupCount;
    } else {
      valueToSave = parseInt(numTus, 10);
    }
    setNumTus(valueToSave.toString());
    tournManager.setNumTusPerRound(valueToSave);
  };

  const tuNumberIsValid = () => {
    if (numTus === '') return true;
    const parsed = parseFloat(numTus);
    return tuNumberInValidRange(parsed);
  };

  return (
    <YfCard title="Round Length">
      <FormGroup>
        <FormControlLabel
          label="Timed Rounds"
          control={<Switch checked={timedRoundsChecked} onChange={handleTimedRoundsChange} />}
        />
      </FormGroup>
      <TextField
        sx={{ marginTop: 1, width: '15ch' }}
        size="small"
        type="number"
        label={numTusLabel}
        value={numTus}
        error={!tuNumberIsValid()}
        onChange={(e) => setNumTus(e.target.value)}
        onBlur={saveNumTusSetting}
      />
      <Tooltip sx={{ marginTop: 2, mx: 1 }} title={numTusHelpText} placement="right">
        <HelpOutline fontSize="small" />
      </Tooltip>
    </YfCard>
  );
}

export default RoundLengthSettingsCard;
