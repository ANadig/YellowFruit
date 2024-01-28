import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import YfCard from './YfCard';
import { CommonRuleSets, ScoringRules } from '../DataModel/ScoringRules';

// Defines the order the buttons should be in
const ruleSets = [CommonRuleSets.NaqtUntimed, CommonRuleSets.NaqtTimed, CommonRuleSets.Acf, CommonRuleSets.Pace];

function StandardRuleSetCard() {
  const [ruleSet, setRuleSet] = useState('');

  return (
    <YfCard title="Standard Rule Sets">
      <ToggleButtonGroup
        size="small"
        color="primary"
        exclusive
        value={ruleSet}
        onChange={(e, newValue) => {
          if (newValue === null) return;
          setRuleSet(newValue);
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
