import { IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip } from '@mui/material';
import { useContext } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Add, Edit, Shuffle } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import YfCard from './YfCard';
import { Phase } from '../DataModel/Phase';
import { Pool } from '../DataModel/Pool';
import { Team } from '../DataModel/Team';

export default function GamesViewByPool() {
  const tournManager = useContext(TournamentContext);
  const phases = tournManager.tournament.getFullPhases();

  return (
    <Stack spacing={2} sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem' } }}>
      {phases.map((phase) => (
        <GamesForPhaseByPool key={phase.name} phase={phase} />
      ))}
    </Stack>
  );
}

interface IGamesForPhaseByPoolProps {
  phase: Phase;
}

function GamesForPhaseByPool(props: IGamesForPhaseByPoolProps) {
  const { phase } = props;

  return (
    <YfCard title={phase.name}>
      <Grid container spacing={2}>
        {phase.pools.map((pool) => (
          <PoolMatrix key={pool.name} pool={pool} phase={phase} />
        ))}
      </Grid>
    </YfCard>
  );
}

interface IPoolMatrixProps {
  phase: Phase;
  pool: Pool;
}

function PoolMatrix(props: IPoolMatrixProps) {
  const { pool, phase } = props;

  if (pool.poolTeams.length === 0) return null;

  return (
    <Grid xs={12}>
      <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{pool.name}</TableCell>
              {pool.poolTeams.map((pt) => (
                <TableCell key={`header-${pt.team.name}`} align="center">
                  {pt.team.name}
                </TableCell>
              ))}
            </TableRow>
            {pool.poolTeams.map((pt) => (
              <TableRow key={`row-${pt.team.name}`}>
                <TableCell>{pt.team.name}</TableCell>
                {pool.poolTeams.map((opponent) => (
                  <MatrixCell
                    key={`versus-${opponent.team.name}`}
                    team={pt.team}
                    opponent={opponent.team}
                    phase={phase}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
}

interface IMatrixCellProps {
  team: Team;
  opponent: Team;
  phase: Phase;
}

function MatrixCell(props: IMatrixCellProps) {
  const { team, opponent, phase } = props;
  const tournManager = useContext(TournamentContext);

  if (team === opponent) {
    return <TableCell sx={{ backgroundColor: 'lightgray' }} />;
  }
  const match = tournManager.tournament.findMatchBetweenTeams(team, opponent, phase);
  if (!match) {
    return (
      <TableCell align="center">
        <IconButton size="small" onClick={() => tournManager.openMatchModalNewMatchForTeams(team, opponent)}>
          <Add />
        </IconButton>
      </TableCell>
    );
  }

  const isCarryover = match.carryoverPhases.includes(phase);

  const editExisting = () => {
    const round = isCarryover ? tournManager.tournament.getRoundOfMatch(match) : phase.getRoundOfMatch(match);
    if (!round) return;
    tournManager.openMatchEditModalExistingMatch(match, round);
  };

  return (
    <TableCell align="center">
      {match.getShortScore(team)}
      <IconButton size="small" onClick={editExisting}>
        <Edit />
      </IconButton>
      &nbsp;
      {isCarryover && (
        <Tooltip title="Crossover" placement="right">
          <Shuffle color="secondary" sx={{ verticalAlign: 'text-bottom' }} />
        </Tooltip>
      )}
    </TableCell>
  );
}
