import Grid from '@mui/material/Unstable_Grid2';
import {
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  TextField,
  Stack,
  Box,
  Collapse,
  IconButton,
  styled,
  IconButtonProps,
} from '@mui/material';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { invalidInteger } from '../Utils/GeneralUtils';

interface ExpandButtonProps extends IconButtonProps {
  expand: boolean;
}

// from https://mui.com/material-ui/react-card/
const ExpandButton = styled((props: ExpandButtonProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { expand, ...other } = props;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

function BonusSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [useBonuses, setUseBonuses] = useSubscription(thisTournamentRules.useBonuses);
  const [bonusesBounce, setBonusesBounce] = useSubscription(thisTournamentRules.bonusesBounceBack);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const handleUseBonusesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUseBonuses(e.target.checked);
    if (!e.target.checked) {
      setBonusesBounce(false);
      setAdvancedExpanded(false);
    }
  };

  const handleBonusesBounceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBonusesBounce(e.target.checked);
  };

  return (
    <YfCard title="Bonuses">
      <FormGroup>
        <FormControlLabel label="Bonuses" control={<Switch checked={useBonuses} onChange={handleUseBonusesChange} />} />
        <FormControlLabel
          label="Bouncebacks"
          control={<Switch disabled={!useBonuses} checked={bonusesBounce} onChange={handleBonusesBounceChange} />}
        />
      </FormGroup>
      {useBonuses && (
        <>
          <Grid container>
            <Grid xs>
              <Typography sx={{ marginTop: 1.3 }} variant="subtitle2">
                Advanced
              </Typography>
            </Grid>
            <Grid xs="auto">
              <ExpandButton expand={advancedExpanded} onClick={() => setAdvancedExpanded(!advancedExpanded)}>
                <ExpandMore />
              </ExpandButton>
            </Grid>
          </Grid>
          <Collapse in={advancedExpanded}>
            <AdvancedBonusSection />
          </Collapse>
        </>
      )}
    </YfCard>
  );
}

function AdvancedBonusSection() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [maxBonusScore, setMaxBonusScore] = useSubscription(thisTournamentRules.maximumBonusScore.toString());
  const [minBonusParts, setMinBonusParts] = useSubscription(thisTournamentRules.mimimumPartsPerBonus.toString());
  const [maxBonusParts, setMaxBonusParts] = useSubscription(thisTournamentRules.maximumPartsPerBonus.toString());
  const [ptsPerPart, setPtsPerPart] = useSubscription(thisTournamentRules.pointsPerBonusPart.toString());
  const [divisor, setDivisor] = useSubscription(thisTournamentRules.bonusDivisor.toString());

  const handleMaxBonusScoreChange = (value: string) => {
    const deflt = ptsPerPart !== '' ? parseInt(ptsPerPart, 10) * parseInt(maxBonusParts, 10) : 30;
    const valueToSave = intValueToUse(value, deflt, 1, 1000);
    setMaxBonusScore(valueToSave.toString());
  };

  const handleMinBonusPartsChange = (value: string) => {
    const valueToSave = intValueToUse(value, parseInt(maxBonusParts, 10), 1, parseInt(maxBonusParts, 10));
    setMinBonusParts(valueToSave.toString());
  };

  const handleMaxBonusPartsChange = (value: string) => {
    const valueToSave = intValueToUse(value, parseInt(minBonusParts, 10), parseInt(minBonusParts, 10), 1000);
    setMaxBonusParts(valueToSave.toString());

    if (ptsPerPart !== '') {
      const newMaxScore = valueToSave * parseInt(ptsPerPart, 10);
      setMaxBonusScore(newMaxScore.toString());
    }
  };

  const handlePtsPerPartChange = (value: string) => {
    if (value === '') return;
    const valueToSave = intValueToUse(value, 10, 1, 1000);
    setPtsPerPart(valueToSave.toString());

    const newMaxScore = valueToSave * parseInt(maxBonusParts, 10);
    setMaxBonusScore(newMaxScore.toString());
  };

  const handleDivisorChange = (value: string) => {
    const valueToSave = intValueToUse(value, 1, 1, parseInt(maxBonusScore, 10));
    setDivisor(valueToSave.toString());
  };

  return (
    <Box sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
      <Stack>
        <AdvancedBonusField
          label="Max bonus score"
          required
          value={maxBonusScore}
          disabled={ptsPerPart !== ''}
          minValue={1}
          maxValue={1000}
          onChange={(val) => setMaxBonusScore(val)}
          onBlur={() => handleMaxBonusScoreChange(maxBonusScore)}
        />
        <AdvancedBonusField
          label="Min parts per bonus"
          required
          value={minBonusParts}
          disabled={false}
          minValue={1}
          maxValue={parseInt(maxBonusParts, 10)}
          onChange={(val) => setMinBonusParts(val)}
          onBlur={() => handleMinBonusPartsChange(minBonusParts)}
        />
        <AdvancedBonusField
          label="Max parts per bonus"
          required
          value={maxBonusParts}
          disabled={false}
          minValue={parseInt(minBonusParts, 10)}
          maxValue={1000}
          onChange={(val) => setMaxBonusParts(val)}
          onBlur={() => handleMaxBonusPartsChange(maxBonusParts)}
        />
        <AdvancedBonusField
          label="Pts per bonus part"
          required={false}
          value={ptsPerPart}
          disabled={false}
          minValue={1}
          maxValue={1000}
          onChange={(val) => setPtsPerPart(val)}
          onBlur={() => handlePtsPerPartChange(ptsPerPart)}
        />
        <AdvancedBonusField
          label="Divisor"
          required
          value={divisor}
          disabled={ptsPerPart !== ''}
          minValue={1}
          maxValue={parseInt(maxBonusScore, 10)}
          onChange={(val) => setDivisor(val)}
          onBlur={() => handleDivisorChange(divisor)}
        />
      </Stack>
    </Box>
  );
}

interface IAdvancedBonusFieldProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (val: string) => void;
  onBlur: (val: string) => void;
  disabled: boolean;
  minValue: number;
  maxValue: number;
}

function AdvancedBonusField(props: IAdvancedBonusFieldProps) {
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
        <TextField
          sx={{ marginTop: 1, width: '8ch' }}
          size="small"
          type="number"
          disabled={disabled}
          error={error}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => onBlur(value)}
        />
      </Grid>
    </Grid>
  );
}

function InlineLabel(props: { text: string }) {
  const { text } = props;
  return (
    <div style={{ marginTop: '1.2rem' }}>
      <Typography variant="body2">{text}</Typography>
    </div>
  );
}

function intValueToUse(str: string, deflt: number, lowerBound?: number, upperBound?: number) {
  if (str === '') return deflt;
  if (invalidInteger(str, lowerBound, upperBound)) return deflt;
  return parseInt(str, 10);
}

export default BonusSettingsCard;
