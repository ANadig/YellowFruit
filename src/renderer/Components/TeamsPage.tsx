import { AddCircle, CopyAll, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useContext } from 'react';
import Registration from '../DataModel/Registration';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { Team } from '../DataModel/Team';
import { nextAlphabetLetter } from '../Utils/GeneralUtils';
import SeedingView from './TeamsPageSeedingView';
import StandingsView from './TeamsPageStandingsView';

// Defines the order the buttons should be in
const viewList = ['Registration', 'Prelim Seeding', 'Standings / Rebracket'];

function TeamsPage() {
  const tournManager = useContext(TournamentContext);
  const [curView] = useSubscription(tournManager.currentTeamsPageView);

  const setView = (whichPage: number) => {
    if (whichPage === 2) {
      tournManager.generateInAppStatReport();
    }
    tournManager.setTeamsPageView(whichPage);
  };

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
              setView(newValue);
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
    <Card>
      <CardContent>
        <Grid container>
          <Grid xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
            {teamTotDisp}
          </Grid>
          <Grid xs={6}>
            <Button
              variant="contained"
              sx={{ float: 'right' }}
              disabled={cantAddMoreTeams}
              startIcon={<AddCircle />}
              onClick={() => tournManager.openTeamEditModalNewTeam()}
            >
              Add team
            </Button>
          </Grid>
        </Grid>
        {numberOfTeams > 0 && (
          <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
            <Stack>
              {registrations.map((reg, idx) => (
                <div key={reg.name}>
                  {idx !== 0 && <Divider />}
                  <RegistrationList registration={reg} cantAddMoreTeams={cantAddMoreTeams} />
                </div>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
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

  return teams.map((team, idx) => (
    <div key={team.name}>
      {idx !== 0 && <Divider />}
      <TeamListItem
        key={team.name}
        registration={registration}
        team={team}
        isLastForReg={idx === teams.length - 1}
        cantAddMoreTeams={cantAddMoreTeams}
      />
    </div>
  ));
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

  let nextLetter = '';
  if (isLastForReg) nextLetter = team.letter === '' ? 'B' : nextAlphabetLetter(team.letter);

  return (
    <Grid container sx={{ p: 1, '&:hover': { backgroundColor: 'ivory' } }}>
      <Grid xs={9}>
        <Box typography="h5">{team.name}</Box>
        <Typography variant="body2">{teamInfoDisplay(registration, team)}</Typography>
      </Grid>
      <Grid xs={3}>
        <Box sx={{ float: 'right' }}>
          {nextLetter && !cantAddMoreTeams && (
            <Tooltip title={`Add ${nextLetter} team`}>
              <IconButton onClick={() => tournManager.startNextTeamForRegistration(registration, nextLetter)}>
                <CopyAll />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit team">
            <IconButton onClick={() => tournManager.openTeamEditModalExistingTeam(registration, team)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title={hasPlayed ? 'You cannot delete a team for which games have been entered' : 'Delete team'}>
            <span>
              <IconButton disabled={hasPlayed} onClick={() => tournManager.tryDeleteTeam(registration, team)}>
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
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

  return attributes.join(' | ');
}

function numPlayersDisplay(num: number) {
  if (num === 1) return `${num} player`;
  return `${num} players`;
}

export default TeamsPage;
