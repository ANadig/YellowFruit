import Grid from '@mui/material/Unstable_Grid2';
import { FormGroup, FormControlLabel, Switch, Typography, Stack, Box } from '@mui/material';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { parseAndValidateStringToInt, invalidInteger } from '../Utils/GeneralUtils';
import { CollapsibleArea, YfNumericField } from '../Utils/GeneralReactUtils';

function BonusSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [useBonuses, setUseBonuses] = useSubscription(thisTournamentRules.useBonuses);
  const [bonusesBounce, setBonusesBounce] = useSubscription(thisTournamentRules.bonusesBounceBack);
  const readOnly = tournManager.tournament.hasMatchData;

  const handleUseBonusesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUseBonuses(e.target.checked);
    tournManager.setUseBonuses(e.target.checked);
  };

  const handleBonusesBounceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBonusesBounce(e.target.checked);
    tournManager.setBonusesBounceBack(e.target.checked);
  };

  return (
    <YfCard title="Bonuses">
      <FormGroup sx={{ paddingBottom: useBonuses ? 2 : 0 }}>
        <FormControlLabel
          label="Bonuses"
          control={<Switch disabled={readOnly} checked={useBonuses} onChange={handleUseBonusesChange} />}
        />
        <FormControlLabel
          label="Bouncebacks"
          control={
            <Switch disabled={readOnly || !useBonuses} checked={bonusesBounce} onChange={handleBonusesBounceChange} />
          }
        />
      </FormGroup>
      {useBonuses && (
        <CollapsibleArea title={<Typography variant="subtitle2">Advanced</Typography>} secondaryTitle={null}>
          <AdvancedBonusSection />
        </CollapsibleArea>
      )}
    </YfCard>
  );
}

function AdvancedBonusSection() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [maxBonusScore, setMaxBonusScore] = useSubscription(thisTournamentRules.maximumBonusScore.toString());
  const [minBonusParts, setMinBonusParts] = useSubscription(thisTournamentRules.minimumPartsPerBonus.toString());
  const [maxBonusParts, setMaxBonusParts] = useSubscription(thisTournamentRules.maximumPartsPerBonus.toString());
  const [ptsPerPart, setPtsPerPart] = useSubscription(thisTournamentRules.pointsPerBonusPart?.toString() || '');
  const [divisor, setDivisor] = useSubscription(thisTournamentRules.bonusDivisor.toString());
  const readOnly = tournManager.tournament.hasMatchData;

  const handleMaxBonusScoreChange = (value: string) => {
    const deflt = ptsPerPart !== '' ? parseInt(ptsPerPart, 10) * parseInt(maxBonusParts, 10) : 30;
    const valueToSave = parseAndValidateStringToInt(value, deflt, 1, 1000);
    setMaxBonusScore(valueToSave.toString());
    tournManager.setMaxBonusScore(valueToSave);

    if (valueToSave % parseInt(divisor, 10)) {
      setDivisor('1');
      tournManager.setBonusDivisor(1);
    }
  };

  const handleMinBonusPartsChange = (value: string) => {
    const valueToSave = parseAndValidateStringToInt(value, parseInt(maxBonusParts, 10), 1, parseInt(maxBonusParts, 10));
    setMinBonusParts(valueToSave.toString());
    tournManager.setMinPartsPerBonus(valueToSave);
  };

  const handleMaxBonusPartsChange = (value: string) => {
    const valueToSave = parseAndValidateStringToInt(
      value,
      parseInt(minBonusParts, 10),
      parseInt(minBonusParts, 10),
      1000,
    );
    setMaxBonusParts(valueToSave.toString());
    tournManager.setMaxPartsPerBonus(valueToSave);

    if (ptsPerPart !== '') {
      const newMaxScore = valueToSave * parseInt(ptsPerPart, 10);
      setMaxBonusScore(newMaxScore.toString());
      tournManager.setMaxBonusScore(newMaxScore);
    }
  };

  const handlePtsPerPartChange = (value: string) => {
    if (value === '') {
      tournManager.setPtsPerBonusPart(undefined);
      return;
    }
    const valueToSave = parseAndValidateStringToInt(value, thisTournamentRules.pointsPerBonusPart || 10, 1, 1000);
    setPtsPerPart(valueToSave.toString());
    tournManager.setPtsPerBonusPart(valueToSave);

    const newMaxScore = valueToSave * parseInt(maxBonusParts, 10);
    setMaxBonusScore(newMaxScore.toString());
    tournManager.setMaxBonusScore(newMaxScore);

    setDivisor(valueToSave.toString());
    tournManager.setBonusDivisor(valueToSave);
  };

  const handleDivisorChange = (value: string) => {
    const maxBonusScoreInt = parseInt(maxBonusScore, 10);
    let valueToSave = parseAndValidateStringToInt(value, thisTournamentRules.bonusDivisor, 1, maxBonusScoreInt);
    if (maxBonusScoreInt % valueToSave) valueToSave = thisTournamentRules.bonusDivisor;
    setDivisor(valueToSave.toString());
    tournManager.setBonusDivisor(valueToSave);
  };

  return (
    <Box sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
      <Stack>
        <AdvancedNumericRuleField
          label="Max bonus score"
          required
          value={maxBonusScore}
          disabled={readOnly || ptsPerPart !== ''}
          minValue={1}
          maxValue={1000}
          onChange={setMaxBonusScore}
          onBlur={() => handleMaxBonusScoreChange(maxBonusScore)}
        />
        <AdvancedNumericRuleField
          label="Min parts per bonus"
          required
          value={minBonusParts}
          disabled={readOnly}
          minValue={1}
          maxValue={parseInt(maxBonusParts, 10)}
          onChange={setMinBonusParts}
          onBlur={() => handleMinBonusPartsChange(minBonusParts)}
        />
        <AdvancedNumericRuleField
          label="Max parts per bonus"
          required
          value={maxBonusParts}
          disabled={readOnly}
          minValue={parseInt(minBonusParts, 10)}
          maxValue={1000}
          onChange={setMaxBonusParts}
          onBlur={() => handleMaxBonusPartsChange(maxBonusParts)}
        />
        <AdvancedNumericRuleField
          label="Pts per bonus part"
          required={false}
          value={ptsPerPart}
          disabled={readOnly}
          minValue={1}
          maxValue={1000}
          onChange={setPtsPerPart}
          onBlur={() => handlePtsPerPartChange(ptsPerPart)}
        />
        <AdvancedNumericRuleField
          label="Divisor"
          required
          value={divisor}
          disabled={readOnly || ptsPerPart !== ''}
          minValue={1}
          maxValue={parseInt(maxBonusScore, 10)}
          onChange={setDivisor}
          onBlur={() => handleDivisorChange(divisor)}
        />
      </Stack>
    </Box>
  );
}

interface IAdvancedNumericRuleFieldProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (val: string) => void;
  onBlur: (val: string) => void;
  disabled: boolean;
  minValue: number;
  maxValue: number;
}

/** small numeric field used for advanced settings like divisors */
export function AdvancedNumericRuleField(props: IAdvancedNumericRuleFieldProps) {
  const { label, required, value, onChange, onBlur, disabled, minValue, maxValue } = props;
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!invalidInteger(value, minValue, maxValue)) setError(false);
  }, [value, minValue, maxValue]);

  const handleChange = (str: string) => {
    if (required && str === '') {
      setError(true);
    } else if (invalidInteger(str, minValue, maxValue)) {
      setError(true);
    } else {
      setError(false);
    }
    onChange(str);
  };

  return (
    <Grid container>
      <Grid xs>
        <InlineLabel text={label} />
      </Grid>
      <Grid xs="auto">
        <YfNumericField
          sx={{ marginTop: 1, width: '8ch' }}
          size="small"
          inputProps={{ min: 0 }}
          disabled={disabled}
          error={error}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => onBlur(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onBlur(value);
          }}
        />
      </Grid>
    </Grid>
  );
}

function InlineLabel(props: { text: string }) {
  const { text } = props;
  return (
    <div style={{ marginTop: '1rem' }}>
      <Typography variant="body2">{text}</Typography>
    </div>
  );
}

export default BonusSettingsCard;
