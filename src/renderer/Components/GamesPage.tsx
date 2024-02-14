import {
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
} from '@mui/material';
import { useContext } from 'react';
import { AddCircle, ExpandMore } from '@mui/icons-material';
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

  const newMatchForRound = (round: number) => {
    tournManager.openMatchModalNewMatchForRound(round);
  };

  return (
    <Stack spacing={2}>
      {phases.map((phase) => (
        <YfCard key={phase.name} title={phase.name}>
          {phase.rounds.map((round) => (
            <Accordion key={round.name}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ width: '33%', flexShrink: 0 }}>{`Round ${round.number}`}</Typography>
                <Typography
                  sx={{ width: '62%', color: 'text.secondary' }}
                >{`${round.matches.length} matches`}</Typography>
                <IconButton size="small" sx={{ p: 0 }} onClick={() => newMatchForRound(round.number)}>
                  <AddCircle />
                </IconButton>
              </AccordionSummary>
              <AccordionDetails>List of matches here</AccordionDetails>
            </Accordion>
          ))}
        </YfCard>
      ))}
    </Stack>
  );
}
