/* eslint-disable prefer-destructuring */
import { useContext } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CardContent,
  Tooltip,
  IconButton,
  Stack,
} from '@mui/material';
import { Create, Done, Error, Warning } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { PoolTeamStats } from '../DataModel/StatSummaries';
import { Phase } from '../DataModel/Phase';
import { LinkButton } from '../Utils/GeneralReactUtils';
import YfCard from './YfCard';

export default function StandingsView() {
  const tournManager = useContext(TournamentContext);
  const phases = tournManager.tournament.getFullPhases();
  const [updateTime] = useSubscription(tournManager.inAppStatReportGenerated);

  if (phases.length === 0) return null;

  return (
    <div key={updateTime.toISOString()}>
      <Stack spacing={2}>
        {phases.map((ph) => (
          <PhaseStandings key={ph.name} phase={ph} />
        ))}
      </Stack>
    </div>
  );
}

interface IPhaseStandingsProps {
  phase: Phase;
}

function PhaseStandings(props: IPhaseStandingsProps) {
  const { phase } = props;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const nextPhase = thisTournament.getNextPhase(phase);
  const regulationTossupCount = thisTournament.scoringRules.regulationTossupCount;

  if (!nextPhase) return null; // no rebracketing to do!

  const phaseStats = thisTournament.stats.find((ps) => ps.phase === phase);
  if (!phaseStats) return null;

  return (
    <YfCard title={phase.name}>
      <CardContent>
        <Grid
          container
          spacing={2}
          sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem' }, '& .MuiIconButton-root': { py: 0 } }}
        >
          {phaseStats.pools.map((poolStats) => (
            <Grid key={poolStats.pool.name} xs={12}>
              <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="5%" />
                      <TableCell width="20%">{poolStats.pool.name}</TableCell>
                      <TableCell align="right" width="5%">
                        W
                      </TableCell>
                      <TableCell align="right" width="5%">
                        L
                      </TableCell>
                      {phaseStats.anyTiesExist && (
                        <TableCell align="right" width="5%">
                          T
                        </TableCell>
                      )}
                      <TableCell align="right" width="8%">
                        Pct
                      </TableCell>
                      <TableCell align="right">{`PP${regulationTossupCount}`}</TableCell>
                      <TableCell align="right">PPB</TableCell>
                      <TableCell align="right">Seed</TableCell>
                      {nextPhase && <TableCell width="4%" />}
                      {nextPhase && <TableCell>Advance To</TableCell>}
                      {nextPhase && (
                        <TableCell align="center">
                          <Tooltip
                            placement="left"
                            title={`Place all of this pool's teams into the ${nextPhase.name} pools as shown`}
                          >
                            <LinkButton
                              size="small"
                              variant="text"
                              onClick={() => tournManager.rebracketPool(poolStats, phaseStats.phase, nextPhase)}
                            >
                              Confirm All
                            </LinkButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {poolStats.poolTeams.map((ptStats) => (
                      <TableRow key={ptStats.team.name}>
                        <TableCell>{ptStats.rank}</TableCell>
                        <TableCell>{ptStats.team.name}</TableCell>
                        <TableCell align="right">{ptStats.wins}</TableCell>
                        <TableCell align="right">{ptStats.losses}</TableCell>
                        {phaseStats.anyTiesExist && <TableCell align="right">{ptStats.ties}</TableCell>}
                        <TableCell align="right">{ptStats.getWinPctString()}</TableCell>
                        <TableCell align="right">{ptStats.getPtsPerRegTuhString(regulationTossupCount)}</TableCell>
                        <TableCell align="right">{ptStats.getPtsPerBonusString()}</TableCell>
                        <TableCell align="right">{ptStats.currentSeed}</TableCell>
                        {nextPhase && <TableCell>{getAdvancementIcon(ptStats)}</TableCell>}
                        {nextPhase && <AdvanceToCell ptStats={ptStats} nextPhase={nextPhase} />}
                        {nextPhase && <ConfirmationCell ptStats={ptStats} nextPhase={nextPhase} />}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </YfCard>
  );
}

interface IAdvanceToCellProps {
  ptStats: PoolTeamStats;
  nextPhase: Phase;
}

function AdvanceToCell(props: IAdvanceToCellProps) {
  const { ptStats, nextPhase } = props;
  if (!ptStats.advanceToTier || !ptStats.currentSeed) return null;

  const confirmedPool = nextPhase.findPoolWithTeam(ptStats.team);
  const poolToShow = confirmedPool || nextPhase.findPoolWithSeed(ptStats.currentSeed);
  if (!poolToShow) return null;

  const tier = poolToShow.position;

  return (
    <TableCell>
      {`Tier ${tier} - ${poolToShow.name}`}
      <Tooltip placement="right" title="Change assignment">
        <IconButton size="small">
          <Create />
        </IconButton>
      </Tooltip>
    </TableCell>
  );
}

interface IConfirmationCellProps {
  ptStats: PoolTeamStats;
  nextPhase: Phase;
}

function ConfirmationCell(props: IConfirmationCellProps) {
  const { ptStats, nextPhase } = props;
  const tournManager = useContext(TournamentContext);
  const alreadyConfirmed = !!nextPhase.findPoolWithTeam(ptStats.team);

  if (alreadyConfirmed) {
    return (
      <TableCell align="center">
        <Done color="success" />
      </TableCell>
    );
  }

  if (!ptStats.currentSeed) return null;

  const confirm = () => {
    if (!ptStats.currentSeed) return;
    const pool = nextPhase.findPoolWithSeed(ptStats.currentSeed);
    if (!pool) return;
    tournManager.addTeamtoPlayoffPool(ptStats.team, pool, nextPhase);
  };

  return (
    <TableCell align="center">
      <LinkButton size="small" variant="text" onClick={confirm}>
        Confirm
      </LinkButton>
    </TableCell>
  );
}

function getAdvancementIcon(ptStats: PoolTeamStats) {
  if (ptStats.ppgTieForAdvancement)
    return (
      <Tooltip title="This team has the same record and points per game as another team. You must run a tiebreaker or devise another way of breaking the tie.">
        <Error color="error" sx={{ fontSize: '1rem' }} />
      </Tooltip>
    );
  if (ptStats.recordTieForAdvancement)
    return (
      <Tooltip title="This team has the same record as another team. You might need to run a tiebreaker, depending on your tournament's tiebreaking procedures.">
        <Warning color="warning" sx={{ fontSize: '1rem' }} />
      </Tooltip>
    );
  return null;
}
