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
import { useContext, useState } from 'react';
import { AddCircle, Delete, Edit, ExpandMore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { Match } from '../DataModel/Match';
import { Phase } from '../DataModel/Phase';
import { Round } from '../DataModel/Round';

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
  const [phases] = useSubscription(tournManager.tournament.phases);

  return (
    <Stack spacing={2}>
      {phases.map((phase) => (
        <GamesForPhaseByRound key={phase.name} phase={phase} />
      ))}
    </Stack>
  );
}

interface IGamesForPhaseByRoundProps {
  phase: Phase;
}

function GamesForPhaseByRound(props: IGamesForPhaseByRoundProps) {
  const { phase } = props;

  return (
    <YfCard title={phase.name}>
      {phase.rounds.map((round) => (
        <SingleRound key={round.name} round={round} expanded={false} />
      ))}
    </YfCard>
  );
}

interface ISingleRoundProps {
  round: Round;
  expanded: boolean;
}

function SingleRound(props: ISingleRoundProps) {
  const { round, expanded: expandedProp } = props;
  const tournManager = useContext(TournamentContext);
  const [expanded, setExpanded] = useState(expandedProp);

  const newMatchForRound = (roundNo: number) => {
    tournManager.openMatchModalNewMatchForRound(roundNo);
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography sx={{ width: '33%', flexShrink: 0 }}>{`Round ${round.number}`}</Typography>
        <Typography sx={{ width: '62%', color: 'text.secondary' }}>{`${round.matches.length} games`}</Typography>
        <Tooltip placement="left" title="Add a game to this round">
          <IconButton
            size="small"
            sx={{ p: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              newMatchForRound(round.number);
            }}
          >
            <AddCircle />
          </IconButton>
        </Tooltip>
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
