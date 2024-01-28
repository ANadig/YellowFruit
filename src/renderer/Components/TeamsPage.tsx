import { AddCircle } from '@mui/icons-material';
import { Button, Card, CardContent, List, ListItem, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useContext, useState } from 'react';
import Registration from '../DataModel/Registration';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';

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
        <List>
          {registrations.map((reg) => (
            <RegistrationList key={reg.name} registration={reg} />
          ))}
        </List>
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

  return (
    <>
      {teams.map((team) => (
        <ListItem key={team.name}>
          {team.name}, Players: {team.players.length}
        </ListItem>
      ))}
    </>
  );
}

export default TeamsPage;
