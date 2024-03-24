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
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Create, Error, Warning } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { PoolTeamStats } from '../DataModel/StatSummaries';
import { Phase } from '../DataModel/Phase';
import { LinkButton } from '../Utils/GeneralReactUtils';

export default function StandingsView() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [phase] = useSubscription(thisTournament.getPrelimPhase());
  const [updateTime] = useSubscription(tournManager.inAppStatReportGenerated);
  const regulationTossupCount = thisTournament.scoringRules.regulationTossupCount;

  if (!phase) return null;

  const phaseStats = thisTournament.stats.find((ps) => ps.phase === phase);
  if (!phaseStats) return null;

  const nextPhase = thisTournament.getNextPhase(phase);

  return (
    <Card key={updateTime.toISOString()}>
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
                        <TableCell>
                          <LinkButton size="small" variant="text">
                            Confirm All
                          </LinkButton>
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
                        {nextPhase && (
                          <TableCell>
                            <LinkButton size="small" variant="text">
                              Confirm
                            </LinkButton>
                          </TableCell>
                        )}
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

interface IAdvanceToCellProps {
  ptStats: PoolTeamStats;
  nextPhase: Phase;
}

function AdvanceToCell(props: IAdvanceToCellProps) {
  const { ptStats, nextPhase } = props;
  if (!ptStats.advanceToTier || !ptStats.currentSeed) return null;

  return (
    <TableCell>
      {`Tier ${ptStats.advanceToTier} - ${nextPhase.findPoolWithSeed(ptStats.currentSeed)?.name}`}
      <IconButton size="small">
        <Create />
      </IconButton>
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
