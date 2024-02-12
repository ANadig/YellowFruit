import { Card, CardContent, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material';
import { useContext } from 'react';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';

// Defines the order the buttons should be in
const viewList = ['By Round', 'By Pool'];

export default function GamesPage() {
  const tournManager = useContext(TournamentContext);
  const [curView] = useSubscription(tournManager.currentGamesPageView);

  return (
    <>
      <Card sx={{ marginBottom: 2, '& .MuiCardContent-root': { paddingBottom: 2.1 } }}>
        <CardContent>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={curView}
            onChange={(e, newValue) => {
              if (newValue === null) return;
              tournManager.setGamesPageView(newValue);
            }}
          >
            {viewList.map((val, idx) => (
              <ToggleButton key={val} value={idx}>
                {val}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>
      {curView === 0 && <GamesViewByRound />}
      {curView === 1 && <span>1</span>}
    </>
  );
}

function GamesViewByRound() {
  const tournManager = useContext(TournamentContext);
  const { phases } = tournManager.tournament;

  return (
    <Stack spacing={2}>
      {phases.map((phase) => (
        <YfCard key={phase.name} title={phase.name}>
          {phase.rounds.map((round) => (
            <div>{round.name}</div>
          ))}
        </YfCard>
      ))}
    </Stack>
  );
}
