import { useContext } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent } from '@mui/material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

export default function StandingsView() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [phase] = useSubscription(thisTournament.getPrelimPhase());

  if (!phase) return null;

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          {phase.pools.map((pool) => (
            <Grid key={pool.name} xs={12} md={6}>
              <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{pool.name}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pool.poolTeams.map((pt) => (
                      <TableRow key={pt.team.name}>
                        <TableCell>{pt.team.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
