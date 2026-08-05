import { Switch } from '@mui/material';
import { ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { ScoringRules } from '../DataModel/ScoringRules';
import { SettingRow, SettingsList, YfNumericField } from '../Utils/GeneralReactUtils';

function OvertimeSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [suddenDeath, setSuddenDeath] = useSubscription(thisTournamentRules.minimumOvertimeQuestionCount === 1);
  const [minTossups, setMinTossups] = useSubscription(thisTournamentRules.minimumOvertimeQuestionCount.toString());
  const [tournUseBonuses] = useSubscription(thisTournamentRules.useBonuses);
  const [otUseBonuses, setOtUseBonuses] = useSubscription(thisTournamentRules.overtimeIncludesBonuses);
  const [minTossupsVisible, setMinTossupsVisible] = useSubscription(!suddenDeath);
  const readOnly = tournManager.tournament.hasMatchData;

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
      <SettingsList>
        <SettingRow label="Sudden death" description="Overtime ends as soon as one team converts a toss-up.">
          <Switch checked={suddenDeath} disabled={readOnly} onChange={handleSuddenDeathChange} />
        </SettingRow>
        {minTossupsVisible && (
          <SettingRow label="Min toss-ups">
            <YfNumericField
              hiddenLabel
              sx={{ width: '9ch' }}
              slotProps={{ htmlInput: { min: 1, disabled: readOnly } }}
              value={minTossups}
              error={!numPlayersIsValid()}
              onChange={(e) => setMinTossups(e.target.value)}
              onBlur={saveMinTossupsSetting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveMinTossupsSetting();
              }}
            />
          </SettingRow>
        )}
        <SettingRow label="Use bonuses">
          <Switch checked={otUseBonuses} disabled={readOnly || !tournUseBonuses} onChange={handleUseBonusChange} />
        </SettingRow>
      </SettingsList>
    </YfCard>
  );
}

export default OvertimeSettingsCard;
