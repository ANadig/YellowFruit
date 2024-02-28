import { FormGroup, FormControlLabel, Switch, TextField } from '@mui/material';
import { ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { ScoringRules } from '../DataModel/ScoringRules';

function OvertimeSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [suddenDeath, setSuddenDeath] = useSubscription(thisTournamentRules.minimumOvertimeQuestionCount === 1);
  const [minTossups, setMinTossups] = useSubscription(thisTournamentRules.minimumOvertimeQuestionCount.toString());
  const [otUseBonuses, setOtUseBonuses] = useSubscription(thisTournamentRules.overtimeIncludesBonuses);
  const [minTossupsVisible, setMinTossupsVisible] = useSubscription(!suddenDeath);

  const handleSuddenDeathChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSuddenDeath(e.target.checked);
    setMinTossupsVisible(!e.target.checked);

    if (e.target.checked) {
      setMinTossups('1');
      tournManager.setMinOverTimeTossupCount(1);
    } else {
      setMinTossups(ScoringRules.defaultNonSuddenDeathTuCount.toString());
      tournManager.setMinOverTimeTossupCount(ScoringRules.defaultNonSuddenDeathTuCount);
    }
  };

  const handleUseBonusChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOtUseBonuses(e.target.checked);
    tournManager.setOvertimeUsesBonuses(e.target.checked);
  };

  const numPlayersIsValid = () => {
    if (minTossups === '') return false;
    const parsed = parseFloat(minTossups);
    return ScoringRules.validateMaxPlayerCount(parsed);
  };

  const saveMinTossupsSetting = () => {
    let valueToSave: number;
    if (!numPlayersIsValid()) {
      valueToSave = thisTournamentRules.minimumOvertimeQuestionCount;
    } else {
      valueToSave = parseInt(minTossups, 10);
    }
    setMinTossups(valueToSave.toString());
    tournManager.setMinOverTimeTossupCount(valueToSave);
    if (valueToSave !== 1) return;

    setSuddenDeath(true);
    setMinTossupsVisible(false);
  };

  return (
    <YfCard title="Overtime">
      <FormGroup>
        <FormControlLabel
          label="Sudden Death"
          control={<Switch checked={suddenDeath} onChange={handleSuddenDeathChange} />}
        />
      </FormGroup>
      {minTossupsVisible && (
        <TextField
          sx={{ marginTop: 1, marginLeft: 6, width: '13ch' }}
          size="small"
          type="number"
          inputProps={{ min: 1 }}
          label="Min Toss-Ups"
          value={minTossups}
          error={!numPlayersIsValid()}
          onChange={(e) => setMinTossups(e.target.value)}
          onBlur={saveMinTossupsSetting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveMinTossupsSetting();
          }}
        />
      )}
      <FormGroup>
        <FormControlLabel
          label="Use Bonuses"
          control={<Switch checked={otUseBonuses} onChange={handleUseBonusChange} />}
        />
      </FormGroup>
    </YfCard>
  );
}

export default OvertimeSettingsCard;
