import { IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip } from '@mui/material';
import { useContext, useMemo } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { Add, Edit, JoinRight } from '@mui/icons-material';
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
        {phase.pools.map((pool) => poolMatrixSeries(phase, pool))}
      </Grid>
    </YfCard>
  );
}

function poolMatrixSeries(phase: Phase, pool: Pool) {
  const matrices = [];

  if (pool.roundRobins < 1) {
    return <NullMatrix key={`${phase.name}%${pool.name}`} message={`${pool.name}: Not a round robin pool`} />;
  }
  if (pool.poolTeams.length === 0) {
    return <NullMatrix key={`${phase.name}%${pool.name}`} message={`${pool.name}: No teams are assigned`} />;
  }

  for (let i = 1; i <= pool.roundRobins; i++) {
    matrices.push(<PoolMatrix key={`${pool.name}_${i}`} phase={phase} pool={pool} nthRoundRobin={i} />);
  }
  return matrices;
}

interface INullMatrixProps {
  message: string;
}

function NullMatrix(props: INullMatrixProps) {
  const { message } = props;

  return (
    <Grid xs={12}>
      <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{message}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
}

interface IPoolMatrixProps {
  phase: Phase;
  pool: Pool;
  nthRoundRobin: number;
}

function PoolMatrix(props: IPoolMatrixProps) {
  const { pool, phase, nthRoundRobin } = props;

  if (pool.poolTeams.length === 0) return null;

  return (
    <Grid xs={12}>
      <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{getMatrixTitle(pool, nthRoundRobin)}</TableCell>
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
                    nthRoundRobin={nthRoundRobin}
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

function getMatrixTitle(pool: Pool, nthRoundRobin: number) {
  if (nthRoundRobin === 1) return pool.name;
  if (pool.name.toLocaleLowerCase().includes('round robin')) return `Round Robin ${nthRoundRobin}`;
  return `${pool.name}: Round Robin ${nthRoundRobin}`;
}

interface IMatrixCellProps {
  team: Team;
  opponent: Team;
  phase: Phase;
  nthRoundRobin: number;
}

function MatrixCell(props: IMatrixCellProps) {
  const { team, opponent, phase, nthRoundRobin } = props;
  const tournManager = useContext(TournamentContext);
  const canAddMatch = useMemo(() => tournManager.tournament.readyToAddMatches(), [tournManager]);

  if (team === opponent) {
    return <TableCell sx={{ backgroundColor: 'lightgray' }} />;
  }
  const match = tournManager.tournament.findMatchBetweenTeams(team, opponent, phase, nthRoundRobin);
  if (!match) {
    return (
      <TableCell align="center">
        {canAddMatch && (
          <IconButton size="small" onClick={() => tournManager.openMatchModalNewMatchForTeams(team, opponent)}>
            <Add />
          </IconButton>
        )}
      </TableCell>
    );
  }

  const isCarryover = match.carryoverPhases.length > 0;

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
        <Tooltip title="Carryover" placement="right">
          <JoinRight color="secondary" sx={{ verticalAlign: 'text-bottom' }} />
        </Tooltip>
      )}
    </TableCell>
  );
}
