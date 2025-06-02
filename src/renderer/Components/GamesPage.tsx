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
import { useContext, useMemo, useState } from 'react';
import { Add, Delete, Edit, Error, ExpandMore, FileUpload, Warning } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { Match } from '../DataModel/Match';
import { Phase } from '../DataModel/Phase';
import { Round } from '../DataModel/Round';
import GamesViewByPool from './GamesPagePoolView';
import { ValidationStatuses } from '../DataModel/Interfaces';

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
      {curView === 1 && <GamesViewByPool />}
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
        <SingleRound
          key={round.name}
          round={round}
          expanded={false}
          forceNumericDisplay={phase.forceNumericRounds || false}
        />
      ))}
    </YfCard>
  );
}

interface ISingleRoundProps {
  round: Round;
  expanded: boolean;
  forceNumericDisplay: boolean;
}

function SingleRound(props: ISingleRoundProps) {
  const { round, expanded: expandedProp, forceNumericDisplay } = props;
  const tournManager = useContext(TournamentContext);
  const [expanded, setExpanded] = useState(expandedProp);
  const numMatches = round.matches.length;
  const canAddMatch = useMemo(() => tournManager.tournament.readyToAddMatches(), [tournManager]);
  const [numErrs, numWarns] = round.countErrorsAndWarnings();

  const newMatchForRound = () => {
    tournManager.openMatchModalNewMatchForRound(round);
  };
  const importMatches = () => {
    tournManager.launchImportMatchWorkflow(round);
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography sx={{ width: '33%', flexShrink: 0 }}>{round.displayName(forceNumericDisplay)}</Typography>
        <Typography sx={{ width: '34%', color: 'text.secondary' }}>
          {numMatches === 1 ? '1 game' : `${numMatches} games`}
        </Typography>
        <Typography sx={{ width: '28%' }}>
          {numErrs > 0 && (
            <>
              <span>{numErrs}</span>
              <Tooltip title={roundValidationIconTooltip(numErrs, 'e')}>
                <Error color="error" sx={{ verticalAlign: 'text-bottom', marginTop: '-3px' }} />
              </Tooltip>
            </>
          )}
          {numWarns > 0 && (
            <>
              <span>{numWarns}</span>
              <Tooltip title={roundValidationIconTooltip(numWarns, 'w')}>
                <Warning color="warning" sx={{ verticalAlign: 'text-bottom', marginTop: '-3px' }} />
              </Tooltip>
            </>
          )}
        </Typography>
        {canAddMatch && (
          <>
            <Tooltip title="Enter a new game for this round" placement="left">
              <IconButton
                size="small"
                sx={{ p: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  newMatchForRound();
                }}
              >
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip
              placement="top-start"
              title="Import games from other files into this round"
              slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, 6] } }] } }}
            >
              <IconButton
                size="small"
                sx={{ p: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  importMatches();
                }}
              >
                <FileUpload />
              </IconButton>
            </Tooltip>
          </>
        )}
      </AccordionSummary>
      <AccordionDetails>
        {round.matches.length > 0 && (
          <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
            {round.matches.map((m, idx) => (
              <div key={m.id}>
                {idx !== 0 && <Divider />}
                <MatchListItem match={m} round={round} />
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
  round: Round;
}

function MatchListItem(props: IMatchListItemProps) {
  const { match, round } = props;
  const tournManager = useContext(TournamentContext);
  const validationStatus = match.getOverallValidationStatus();

  return (
    <Grid container sx={{ p: 1, '&:hover': { backgroundColor: 'ivory' } }}>
      <Grid xs={8}>
        <Box typography="h6">{match.getScoreString()}</Box>
        <Typography variant="body2">
          {match.carryoverPhases.length > 0 && `Carries over to: ${match.listCarryoverPhases()}`}
        </Typography>
        {match.importedFile && <Typography variant="body2">{`Imported from ${match.importedFile}`}</Typography>}
      </Grid>
      <Grid xs={2}>
        {validationStatus === ValidationStatuses.Error && (
          <Tooltip title="This game has errors that prevent it from counting in the stat report">
            <Error color="error" sx={{ verticalAlign: 'text-bottom', marginTop: 1 }} />
          </Tooltip>
        )}
        {validationStatus === ValidationStatuses.Warning && (
          <Tooltip title="This game has validation warnings">
            <Warning color="warning" sx={{ verticalAlign: 'text-bottom', marginTop: 1 }} />
          </Tooltip>
        )}
      </Grid>
      <Grid xs={2}>
        <Box sx={{ float: 'right' }}>
          <Tooltip title="Edit game">
            <IconButton onClick={() => tournManager.openMatchEditModalExistingMatch(match, round)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete game">
            <IconButton onClick={() => tournManager.tryDeleteMatch(match, round)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
}

function roundValidationIconTooltip(num: number, errOrWarn: 'e' | 'w') {
  const start = num === 1 ? 'game has' : 'games have';
  const noun = errOrWarn === 'e' ? 'errors' : 'warnings';
  const msg = `${num} ${start} ${noun}`;
  if (errOrWarn === 'w') return msg;

  return `${msg}. Games with errors don't count in the stat report until the errors are corrected.`;
}
