import { Add, ArrowDropDown, CopyAll, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonGroup,
  ClickAwayListener,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useContext, useRef, useState } from 'react';
import Registration from '../DataModel/Registration';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { Team } from '../DataModel/Team';
import { nextAlphabetLetter } from '../Utils/GeneralUtils';
import SeedingView from './TeamsPageSeedingView';
import StandingsView from './TeamsPageStandingsView';
import { YfPageHeader } from '../Utils/GeneralReactUtils';
import YfCard from './YfCard';

// Defines the order the tabs should be in
const viewList = ['Registration', 'Prelim assignments', 'Rebracket / final ranks'];

function TeamsPage() {
  const tournManager = useContext(TournamentContext);
  const [curView] = useSubscription(tournManager.currentTeamsPageView);

  const setView = (whichPage: number) => {
    if (whichPage === 2) {
      tournManager.compileStats();
    }
    tournManager.setTeamsPageView(whichPage);
  };

  return (
    <>
      <YfPageHeader title="Teams" description="Registrations, pool assignments and final ranks." />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={curView} onChange={(e, newValue) => setView(newValue)}>
          {viewList.map((val) => (
            <Tab key={val} label={val} />
          ))}
        </Tabs>
      </Box>
      {curView === 0 && <RegistrationView />}
      {curView === 1 && <SeedingView />}
      {curView === 2 && <StandingsView />}
    </>
  );
}

function RegistrationView() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [registrations] = useSubscription(thisTournament.registrations);
  const [numberOfTeams] = useSubscription(thisTournament.getNumberOfTeams());
  const [expectedNumTeams] = useSubscription(thisTournament.getExpectedNumberOfTeams());

  const teamTotDisp = numberOfTeamsDisplay(numberOfTeams, expectedNumTeams);
  const cantAddMoreTeams = expectedNumTeams !== null && numberOfTeams >= expectedNumTeams;

  return (
    <YfCard
      title="Registrations"
      description={teamTotDisp}
      secondaryHeader={<ImportButtons disabled={cantAddMoreTeams} />}
      flush
    >
      {numberOfTeams === 0 ? (
        <EmptyState title="No teams yet" body="Add teams one at a time, or import them from a QBJ or SQBS file." />
      ) : (
        <Box sx={{ '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>
          {registrations.map((reg) => (
            <RegistrationList key={reg.name} registration={reg} cantAddMoreTeams={cantAddMoreTeams} />
          ))}
        </Box>
      )}
    </YfCard>
  );
}

interface IEmptyStateProps {
  title: string;
  body: string;
}

/** Quiet placeholder for a panel with nothing in it yet. */
export function EmptyState(props: IEmptyStateProps) {
  const { title, body } = props;
  return (
    <Box sx={{ px: 2, py: 5, textAlign: 'center' }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {body}
      </Typography>
    </Box>
  );
}

interface IImportButtonsProps {
  disabled: boolean;
}

function ImportButtons(props: IImportButtonsProps) {
  const { disabled } = props;
  const tournManager = useContext(TournamentContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleDropDownClose = (event: Event) => {
    if (anchorRef && anchorRef.current?.contains(event.target as HTMLElement)) {
      return;
    }
    setDropdownOpen(false);
  };

  const runImport = (importTeams: () => void) => {
    setDropdownOpen(false);
    importTeams();
  };

  return (
    <>
      <ButtonGroup ref={anchorRef} size="small" variant="contained">
        <Tooltip placement="top" title="Enter a new team">
          <span>
            <Button startIcon={<Add />} disabled={disabled} onClick={() => tournManager.openTeamEditModalNewTeam()}>
              Add team
            </Button>
          </span>
        </Tooltip>
        <Button
          disabled={disabled}
          aria-label="more ways to add teams"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
          sx={{ px: 0.25 }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <ArrowDropDown fontSize="small" />
        </Button>
      </ButtonGroup>
      <Popper open={dropdownOpen} anchorEl={anchorRef.current} placement="bottom-end" sx={{ zIndex: 'modal' }}>
        <Paper variant="outlined" sx={{ mt: 0.5, boxShadow: 5 }}>
          <ClickAwayListener onClickAway={handleDropDownClose}>
            <MenuList id="split-button-menu">
              <MenuItem onClick={() => runImport(() => tournManager.launchImportQbjTeamsWorkflow())}>
                Import teams from QBJ/JSON (MODAQ) file
              </MenuItem>
              <MenuItem onClick={() => runImport(() => tournManager.launchImportSqbsTeamsWorkflow())}>
                Import teams from SQBS file
              </MenuItem>
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
}

interface IRegistrationListProps {
  registration: Registration;
  cantAddMoreTeams: boolean;
}

/** The list of teams within one Registration object */
function RegistrationList(props: IRegistrationListProps) {
  const { registration, cantAddMoreTeams } = props;
  const [teams] = useSubscription(registration.teams);

  return (
    <Box sx={{ '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>
      {teams.map((team, idx) => (
        <TeamListItem
          key={team.name}
          registration={registration}
          team={team}
          isLastForReg={idx === teams.length - 1}
          cantAddMoreTeams={cantAddMoreTeams}
        />
      ))}
    </Box>
  );
}

interface ITeamListItemProps {
  registration: Registration;
  team: Team;
  /** Is this the last team in the registration? e.g. C team with no D, E, etc teams */
  isLastForReg: boolean;
  cantAddMoreTeams: boolean;
}

function TeamListItem(props: ITeamListItemProps) {
  const { registration, team, isLastForReg, cantAddMoreTeams } = props;
  const tournManager = useContext(TournamentContext);
  const hasPlayed = tournManager.tournament.teamHasPlayedAnyMatch(team);
  const openTeamEditor = () => tournManager.openTeamEditModalExistingTeam(registration, team);

  let nextLetter = '';
  if (isLastForReg) nextLetter = team.letter === '' ? 'B' : nextAlphabetLetter(team.letter);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1,
        '&:hover': { backgroundColor: 'action.hover' },
      }}
      role="group"
      aria-label={`${team.name}, ${teamInfoDisplay(registration, team)}`}
      onDoubleClick={openTeamEditor}
    >
      <Box
        sx={{
          minWidth: 0,
          cursor: 'pointer',
          borderRadius: 1,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${team.name}`}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          openTeamEditor();
        }}
      >
        <Typography variant="subtitle1" noWrap>
          {team.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {teamInfoDisplay(registration, team)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
        {nextLetter && !cantAddMoreTeams && (
          <Tooltip title={`Add ${nextLetter} team`}>
            <IconButton
              size="small"
              aria-label={`Add ${nextLetter} team for ${registration.name}`}
              onClick={() => tournManager.startNextTeamForRegistration(registration, nextLetter)}
            >
              <CopyAll fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Edit team">
          <IconButton size="small" onClick={openTeamEditor} aria-label={`Edit ${team.name}`}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={hasPlayed ? 'You cannot delete a team for which games have been entered' : 'Delete team'}>
          <span>
            <IconButton
              size="small"
              disabled={hasPlayed}
              aria-label={`Delete ${team.name}`}
              onClick={() => tournManager.tryDeleteTeam(registration, team)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

function numberOfTeamsDisplay(numTeams: number, numTeamsForSchedule: number | null) {
  if (numTeamsForSchedule === null) {
    return `${numTeams} team${numTeams !== 1 ? 's' : ''}`;
  }
  return `${numTeams} of ${numTeamsForSchedule} teams registered`;
}

function teamInfoDisplay(reg: Registration, team: Team) {
  const attributes: string[] = [];
  if (reg.isSmallSchool) attributes.push('SS');
  if (team.isJV) attributes.push('JV');
  if (team.isUG) attributes.push('UG');
  if (team.isD2) attributes.push('D2');
  attributes.push(numPlayersDisplay(team.players.length));

  return attributes.join(' · ');
}

function numPlayersDisplay(num: number) {
  if (num === 1) return `${num} player`;
  return `${num} players`;
}

export default TeamsPage;
