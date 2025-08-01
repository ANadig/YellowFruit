import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useContext } from 'react';
import YfCard from './YfCard';
import { CommonRuleSets, ScoringRules } from '../DataModel/ScoringRules';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

// Defines the order the buttons should be in
const ruleSets = [CommonRuleSets.AcfPowers, CommonRuleSets.Acf, CommonRuleSets.NaqtUntimed, CommonRuleSets.NaqtTimed];

function StandardRuleSetCard() {
  const tournManager = useContext(TournamentContext);
  const [ruleSet, setRuleSet] = useSubscription(tournManager.tournament.standardRuleSet ?? '');
  const readOnly = tournManager.tournament.hasMatchData;

  return (
    <YfCard title="Standard Rule Sets">
      <ToggleButtonGroup
        size="small"
        color="primary"
        exclusive
        disabled={readOnly}
        value={ruleSet}
        onChange={(e, newValue) => {
          if (newValue === null) return;
          setRuleSet(newValue);
          tournManager.applStdRuleSet(newValue);
        }}
      >
        {ruleSets.map((val) => (
          <ToggleButton key={val} value={val}>
            {ScoringRules.getRuleSetName(val)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </YfCard>
  );
}

export default StandardRuleSetCard;
