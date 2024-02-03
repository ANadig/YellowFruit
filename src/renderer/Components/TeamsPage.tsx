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
import { useContext, useState } from 'react';
import Registration from '../DataModel/Registration';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { Team } from '../DataModel/Team';
import { nextAlphabetLetter } from '../Utils/GeneralUtils';

// Defines the order the buttons should be in
const viewList = ['Registration', 'Seeding', 'Standings'];

function TeamsPage() {
  const [curView, setCurView] = useState(0);

  return (
    <>
      <Card sx={{ marginBottom: 2 }}>
        <CardContent>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={curView}
            onChange={(e, newValue) => {
              if (newValue === null) return;
              setCurView(newValue);
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
    </>
  );
}

function RegistrationView() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [registrations] = useSubscription(thisTournament.registrations);

  // console.log(thisTournament.registrations);

  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
            Number of teams
          </Grid>
          <Grid xs={6}>
            <Button
              variant="contained"
              sx={{ float: 'right' }}
              startIcon={<AddCircle />}
              onClick={() => tournManager.openTeamEditModalNewTeam()}
            >
              Add team
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
          <Stack>
            {registrations.map((reg, idx) => (
              <div key={reg.name}>
                {idx !== 0 && <Divider />}
                <RegistrationList registration={reg} />
              </div>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

interface IRegistrationListProps {
  registration: Registration;
}

/** The list of teams within one Registration object */
function RegistrationList(props: IRegistrationListProps) {
  const { registration } = props;
  const [teams] = useSubscription(registration.teams);

  return teams.map((team) => <TeamListItem key={team.name} registration={registration} team={team} />);
}

interface ITeamListItemProps {
  registration: Registration;
  team: Team;
}

function TeamListItem(props: ITeamListItemProps) {
  const { registration, team } = props;
  const tournManager = useContext(TournamentContext);

  const nextLetter = nextAlphabetLetter(team.letter);

  return (
    <Grid container sx={{ p: 1, '&:hover': { backgroundColor: 'ivory' } }}>
      <Grid xs={9}>
        <Box typography="h5">{team.name}</Box>
        <Typography variant="body2">{teamInfoDisplay(registration, team)}</Typography>
      </Grid>
      <Grid xs={3}>
        <Box sx={{ float: 'right' }}>
          {nextLetter !== '' && (
            <Tooltip title={`Add ${nextLetter} team`}>
              <IconButton>
                <CopyAll />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit team">
            <IconButton onClick={() => tournManager.openTeamEditModalExistingTeam(registration, team)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete team">
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
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
