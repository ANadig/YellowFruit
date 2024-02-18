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
  Box,
  Tooltip,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useContext } from 'react';
import { AddCircle, Delete, Edit, ExpandMore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { Match } from '../DataModel/Match';

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
                >{`${round.matches.length} games`}</Typography>
                <IconButton size="small" sx={{ p: 0 }} onClick={() => newMatchForRound(round.number)}>
                  <AddCircle />
                </IconButton>
              </AccordionSummary>
              <AccordionDetails>
                {round.matches.length > 0 && (
                  <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
                    {round.matches.map((m, idx) => (
                      <div key={m.id}>
                        {idx !== 0 && <Divider />}
                        <MatchListItem match={m} roundNo={round.number} />
                      </div>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </YfCard>
      ))}
    </Stack>
  );
}

interface IMatchListItemProps {
  match: Match;
  roundNo: number;
}

function MatchListItem(props: IMatchListItemProps) {
  const { match, roundNo } = props;
  const tournManager = useContext(TournamentContext);

  return (
    <Grid container sx={{ p: 1, '&:hover': { backgroundColor: 'ivory' } }}>
      <Grid xs={9}>
        <Box typography="h6">{match.getScoreString()}</Box>
        <Typography variant="body2">
          {match.carryoverPhases.length > 0 && `Carries over to: ${match.listCarryoverPhases()}`}
        </Typography>
      </Grid>
      <Grid xs={3}>
        <Box sx={{ float: 'right' }}>
          <Tooltip title="Edit game">
            <IconButton onClick={() => tournManager.openMatchEditModalExistingMatch(match, roundNo)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete game">
            <IconButton onClick={() => tournManager.tryDeleteMatch(match, roundNo)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
}
