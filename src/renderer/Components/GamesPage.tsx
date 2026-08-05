import {
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
  Autocomplete,
  TextField,
  Skeleton,
  Button,
} from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { Add, Delete, Edit, Error, ExpandMore, FileUpload, FilterAlt, Warning } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import YfCard from './YfCard';
import { Match } from '../DataModel/Match';
import { Phase } from '../DataModel/Phase';
import { Round } from '../DataModel/Round';
import GamesViewByPool from './GamesPagePoolView';
import { ValidationStatuses } from '../DataModel/Interfaces';
import { Team } from '../DataModel/Team';
import { CtrlOrCmd, trunc } from '../Utils/GeneralUtils';
import { YfPageHeader } from '../Utils/GeneralReactUtils';

// Defines the order the buttons should be in
const viewList = ['By round', 'By pool'];

const teamSelectNullOption = '';

export default function GamesPage() {
  const tournManager = useContext(TournamentContext);
  const [curView] = useSubscription(tournManager.currentGamesPageView);
  const [filterTeam, setFilterTeam] = useState<Team | undefined>(undefined);

  return (
    <>
      <YfPageHeader title="Games" description="Every game entered for this tournament, by round or by pool." />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          pb: 2,
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <ToggleButtonGroup
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
        <Tooltip placement="top" title={`Import games from one file into multiple rounds (${CtrlOrCmd()}+M)`}>
          <span>
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              disabled={tournManager.tournament.phases.length === 0}
              onClick={() => tournManager.launchImportMatchWorkflow()}
            >
              Import
            </Button>
          </span>
        </Tooltip>
        {curView === 0 && (
          <Box sx={{ ml: 'auto', width: { xs: '100%', sm: 320 } }}>
            <TeamFilterField filterByTeam={setFilterTeam} />
          </Box>
        )}
      </Box>
      {curView === 0 && <GamesViewByRound filterTeam={filterTeam} />}
      {curView === 1 && <GamesViewByPool />}
    </>
  );
}

interface ITeamFilterFieldProps {
  filterByTeam: (team: Team | undefined) => void;
}

function TeamFilterField(props: ITeamFilterFieldProps) {
  const { filterByTeam } = props;
  const tournManager = useContext(TournamentContext);
  const thisTourn = tournManager.tournament;
  const [filterTeam, setFilterTeam] = useState<Team | undefined>(undefined);
  const [filterInputValue, setFilterInputValue] = useState('');

  const handleFilterChange = (val: string | null) => {
    const matchingTeam = val === null ? undefined : thisTourn.findTeamByName(val) ?? undefined;
    setFilterTeam(matchingTeam);
    filterByTeam(matchingTeam);
  };

  const isOptionEqualToValue = (option: string, value: string) => {
    if (value === option) return true;
    return value === '' && option === teamSelectNullOption;
  };

  const allTeamNames = useMemo(() => thisTourn.getListOfAllTeams().map((tm) => tm.name), [thisTourn]);
  const filterOptions = [teamSelectNullOption].concat(allTeamNames);

  return (
    <Autocomplete
      autoHighlight
      clearOnEscape
      autoSelect
      value={filterTeam?.name ?? ''}
      onChange={(event: any, newValue: string | null) => handleFilterChange(newValue)}
      inputValue={filterInputValue}
      onInputChange={(event, newVal) => setFilterInputValue(newVal)}
      options={filterOptions}
      isOptionEqualToValue={isOptionEqualToValue}
      // eslint-disable-next-line react/jsx-props-no-spreading
      renderInput={(params) => <TextField {...params} size="small" label="Filter by team" />}
    />
  );
}

interface IGameViewByRoundProps {
  filterTeam: Team | undefined;
}

function GamesViewByRound(props: IGameViewByRoundProps) {
  const { filterTeam } = props;
  const tournManager = useContext(TournamentContext);
  const [phases] = useSubscription(tournManager.tournament.phases);

  return (
    <Stack spacing={2}>
      {phases.map((phase) => (
        <GamesForPhaseByRound key={phase.name} phase={phase} filterTeam={filterTeam} />
      ))}
    </Stack>
  );
}

interface IGamesForPhaseByRoundProps {
  phase: Phase;
  filterTeam: Team | undefined;
}

function GamesForPhaseByRound(props: IGamesForPhaseByRoundProps) {
  const { phase, filterTeam } = props;

  return (
    <YfCard title={phase.name} flush>
      <Box sx={{ '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>
        {phase.rounds.map((round) => (
          <SingleRound
            key={round.name}
            round={round}
            expanded={!!filterTeam}
            forceNumericDisplay={phase.forceNumericRounds || false}
            filterTeam={filterTeam}
          />
        ))}
      </Box>
    </YfCard>
  );
}

interface ISingleRoundProps {
  round: Round;
  expanded: boolean;
  forceNumericDisplay: boolean;
  filterTeam: Team | undefined;
}

function SingleRound(props: ISingleRoundProps) {
  const { round, expanded: expandedProp, forceNumericDisplay, filterTeam } = props;
  const tournManager = useContext(TournamentContext);
  const [expanded, setExpanded] = useState(expandedProp);
  const canAddMatch = useMemo(() => tournManager.tournament.readyToAddMatches(), [tournManager]);
  const [numErrs, numWarns] = filterTeam === undefined ? round.countErrorsAndWarnings() : [0, 0];
  const [prevFilterTeam, setPrevFilterTeam] = useState<Team | undefined>(undefined);

  const matchesToShow = useMemo(
    () => (filterTeam ? round.matches.filter((m) => m.includesTeam(filterTeam)) : round.matches),
    [filterTeam, round.matches],
  );
  const numMatches = matchesToShow.length;

  if (prevFilterTeam !== filterTeam) {
    if (filterTeam && numMatches > 0) setExpanded(true);
    else setExpanded(false);
    setPrevFilterTeam(filterTeam);
  }

  const newMatchForRound = () => {
    tournManager.openMatchModalNewMatchForRound(round);
  };
  const importMatches = () => {
    tournManager.launchImportMatchWorkflow(round);
  };

  return (
    // Borderless inside the phase panel: the panel already provides the containment, and the
    // rounds are separated by the parent's hairlines.
    <Accordion
      expanded={expanded}
      sx={{ border: 0, borderRadius: 0, '& + &': { mt: 0 } }}
      onChange={() => setExpanded(!expanded)}
    >
      <AccordionSummary expandIcon={<ExpandMore fontSize="small" />} sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
          <Typography variant="subtitle2" sx={{ width: 140, flexShrink: 0 }}>
            {round.displayName(forceNumericDisplay)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {numMatches === 1 ? '1 game' : `${numMatches} games`}
            {!!filterTeam && <FilterAlt fontSize="small" />}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
            {numErrs > 0 && (
              <Tooltip title={roundValidationIconTooltip(numErrs, 'e')}>
                <Typography
                  variant="caption"
                  color="error.main"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.375, fontWeight: 600 }}
                >
                  <Error color="error" sx={{ fontSize: 16 }} />
                  {numErrs}
                </Typography>
              </Tooltip>
            )}
            {numWarns > 0 && (
              <Tooltip title={roundValidationIconTooltip(numWarns, 'w')}>
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.375, fontWeight: 600 }}
                >
                  <Warning color="warning" sx={{ fontSize: 16 }} />
                  {numWarns}
                </Typography>
              </Tooltip>
            )}
            {canAddMatch && (
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <Tooltip title="Enter a new game for this round" placement="left">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      newMatchForRound();
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip placement="top" title="Import games from other files into this round">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      importMatches();
                    }}
                  >
                    <FileUpload fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pb: 2 }}>
        {expanded ? (
          <SingleRoundMatchList round={round} matchList={matchesToShow} />
        ) : (
          <PlaceholderMatchList listSize={Math.min(matchesToShow.length, 6)} />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

interface ISingleRoundMatchListProps {
  round: Round;
  matchList: Match[];
}

function SingleRoundMatchList(props: ISingleRoundMatchListProps) {
  const { round, matchList } = props;
  return (
    round.matches.length > 0 && (
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          '& > * + *': { borderTop: 1, borderColor: 'divider' },
        }}
      >
        {matchList.map((m) => (
          <MatchListItem key={m.id} match={m} round={round} />
        ))}
      </Box>
    )
  );
}

interface IPlaceholderMatchListProps {
  listSize: number;
}

function PlaceholderMatchList(props: IPlaceholderMatchListProps) {
  const { listSize } = props;
  if (listSize === 0) return null;

  const placeholders: React.JSX.Element[] = [];
  for (let i = 1; i <= listSize; i++) {
    const widthPct = 15 + 35 * Math.random();
    placeholders.push(
      <Skeleton key={i} variant="text" width={`${widthPct.toPrecision(2)}%`} sx={{ fontSize: '16pt' }} />,
    );
  }

  return <Stack spacing={2}>{placeholders}</Stack>;
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        '&:hover': { backgroundColor: 'action.hover' },
      }}
      onDoubleClick={() => tournManager.openMatchEditModalExistingMatch(match, round)}
    >
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="subtitle1">{match.getScoreString()}</Typography>
        {match.carryoverPhases.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {`Carries over to: ${match.listCarryoverPhases()}`}
          </Typography>
        )}
        {match.importedFile && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {`Imported from ${match.importedFile}`}
          </Typography>
        )}
        {match.notes && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {match.notes}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {validationStatus === ValidationStatuses.Error && (
          <Tooltip
            title={`This game has errors that prevent it from counting in the stat report: ${trunc(
              match.getErrorMessages().join('; '),
              120,
            )}`}
          >
            <Error color="error" sx={{ fontSize: 18 }} />
          </Tooltip>
        )}
        {validationStatus === ValidationStatuses.Warning && (
          <Tooltip title={`This game has validation warnings: ${trunc(match.getWarningMessages().join('; '), 120)}`}>
            <Warning color="warning" sx={{ fontSize: 18 }} />
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
        <Tooltip title="Edit game">
          <IconButton size="small" onClick={() => tournManager.openMatchEditModalExistingMatch(match, round)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete game">
          <IconButton size="small" onClick={() => tournManager.tryDeleteMatch(match, round)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

function roundValidationIconTooltip(num: number, errOrWarn: 'e' | 'w') {
  const start = num === 1 ? 'game has' : 'games have';
  const noun = errOrWarn === 'e' ? 'errors' : 'warnings';
  const msg = `${num} ${start} ${noun}`;
  if (errOrWarn === 'w') return msg;

  return `${msg}. Games with errors don't count in the stat report until the errors are corrected.`;
}
