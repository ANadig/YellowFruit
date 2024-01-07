import Grid from '@mui/material/Unstable_Grid2';
import { FormGroup, FormControlLabel, Switch, Typography, TextField, Stack, Box } from '@mui/material';
import { ChangeEvent, useContext } from 'react';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';

function BonusSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [useBonuses, setUseBonuses] = useSubscription(thisTournamentRules.useBonuses);
  const [bonusesBounce, setBonusesBounce] = useSubscription(thisTournamentRules.bonusesBounceBack);

  const handleUseBonusesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUseBonuses(e.target.checked);
    if (!e.target.checked) {
      setBonusesBounce(false);
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
      <AdvancedBonusSection />
    </YfCard>
  );
}

function AdvancedBonusSection() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [maxBonusScore, setMaxBonusScore] = useSubscription(thisTournamentRules.maximumBonusScore.toString());
  const [minBonusParts, setMinBonusParts] = useSubscription(thisTournamentRules.mimimumPartsPerBonus.toString());

  return (
    <>
      <Typography sx={{ marginTop: 1 }} variant="subtitle2">Advanced</Typography>
      <Box sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
        <Typography variant="body2">
          <Stack>
            <Grid container>
              <Grid md={9} xs={12}>
                <InlineLabel text="Max bonus score" />
              </Grid>
              <Grid md={3} xs={12}>
                <TextField
                  sx={{ marginTop: 1, width: '8ch' }}
                  size="small"
                  type="number"
                  value={maxBonusScore}
                  onChange={(e) => setMaxBonusScore(e.target.value)}
                />
              </Grid>
            </Grid>
            <Grid container>
              <Grid md={9} xs={12}>
              <InlineLabel text="Min parts per bonus" />
              </Grid>
              <Grid md={3} xs={12}>
                <TextField
                  sx={{ marginTop: 1, width: '8ch' }}
                  size="small"
                  type="number"
                  value={minBonusParts}
                  onChange={(e) => setMinBonusParts(e.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </Typography>
      </Box>
    </>
  );
}

function InlineLabel(props: { text: string }) {
  const { text } = props;
  return <div style={{ marginTop: '1.2rem' }}>{text}</div>;
}

export default BonusSettingsCard;
