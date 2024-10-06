/* eslint-disable react/require-default-props */
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
  FormControlLabel,
  Typography,
  Box,
  Checkbox,
} from '@mui/material';
import { Create, Done, Edit, Error, Warning } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { PoolTeamStats } from '../DataModel/StatSummaries';
import { Phase, PhaseTypes } from '../DataModel/Phase';
import { LinkButton } from '../Utils/GeneralReactUtils';
import YfCard from './YfCard';
import { Pool } from '../DataModel/Pool';
import { Match } from '../DataModel/Match';

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
  const nextPhase = thisTournament.getNextFullPhase(phase);
  const tbPhase = thisTournament.getTiebreakerPhaseFor(phase);
  const regulationTossupCount = thisTournament.scoringRules.regulationTossupCount;
  const showPPB = thisTournament.scoringRules.useBonuses;

  const phaseStats =
    !nextPhase && thisTournament.allPrelimGamesCarryOver()
      ? thisTournament.prelimsPlusPlayoffStats
      : thisTournament.stats.find((ps) => ps.phase === phase);
  if (!phaseStats) return null;

  return (
    <YfCard title={phase.name}>
      <CardContent>
        <Grid
          container
          spacing={2}
          sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem' }, '& .MuiIconButton-root': { py: 0 } }}
        >
          {thisTournament.isLastFullPhase(phase) && (
            <>
              <Grid xs={6}>
                {thisTournament.getFinalsPhases().map((ph) => (
                  <TiebreakerOrFinalsInfo key={ph.code} tbOrFinalsPhase={ph} />
                ))}
              </Grid>
              <Grid xs={6} sx={{ textAlign: 'right', '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}>
                <ConfirmFinalRanksCheckbox />
              </Grid>
            </>
          )}
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
                      {showPPB && <TableCell align="right">PPB</TableCell>}
                      {(!nextPhase || thisTournament.usingScheduleTemplate) && (
                        <TableCell align="right">{nextPhase ? 'Seed' : 'Final Rank'}</TableCell>
                      )}

                      {nextPhase && <TableCell width="4%" />}
                      {nextPhase && <TableCell>Advance To</TableCell>}
                      {nextPhase && thisTournament.usingScheduleTemplate && (
                        <TableCell align="center">
                          <Tooltip
                            placement="left"
                            title={`Place all of this pool's teams into the ${nextPhase.name} pools as shown`}
                          >
                            <LinkButton
                              size="small"
                              variant="text"
                              onClick={() => tournManager.rebracketPool(poolStats, nextPhase)}
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
                        {showPPB && <TableCell align="right">{ptStats.getPtsPerBonusString()}</TableCell>}
                        {nextPhase && thisTournament.usingScheduleTemplate ? (
                          <TableCell align="right">{ptStats.currentSeed}</TableCell>
                        ) : (
                          !nextPhase && <FinalRankCell ptStats={ptStats} />
                        )}
                        {nextPhase && <TableCell>{getAdvancementIcon(ptStats)}</TableCell>}
                        {nextPhase && <AdvanceToCell ptStats={ptStats} nextPhase={nextPhase} />}
                        {nextPhase && thisTournament.usingScheduleTemplate && (
                          <ConfirmationCell ptStats={ptStats} nextPhase={nextPhase} />
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {tbPhase && <TiebreakerOrFinalsInfo tbOrFinalsPhase={tbPhase} pool={poolStats.pool} />}
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
  const tournManager = useContext(TournamentContext);

  // if (!ptStats.currentSeed) return null;

  const confirmedPool = nextPhase.findPoolWithTeam(ptStats.team);
  let poolToShow =
    ptStats.currentSeed === undefined
      ? confirmedPool
      : confirmedPool || nextPhase.findPoolWithSeed(ptStats.currentSeed);
  if (ptStats.poolTeam.didNotAdvance) poolToShow = undefined;
  const dispText = poolToShow ? `Tier ${poolToShow.position} - ${poolToShow.name}` : 'None';

  const handleModalAccept = () => {
    tournManager.poolAssignPlayoffSwitch();
  };

  return (
    <TableCell>
      {dispText}
      <Tooltip placement="right" title="Change assignment">
        <IconButton
          size="small"
          onClick={() =>
            tournManager.openPoolAssignmentModal(ptStats.poolTeam.team, nextPhase, handleModalAccept, poolToShow)
          }
        >
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
  const alreadyConfirmed = !!nextPhase.findPoolWithTeam(ptStats.team) || ptStats.poolTeam.didNotAdvance;

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

interface ITiebreakerOrFinalsInfoProps {
  tbOrFinalsPhase: Phase;
  pool?: Pool;
}

function TiebreakerOrFinalsInfo(props: ITiebreakerOrFinalsInfoProps) {
  const { tbOrFinalsPhase, pool } = props;
  const tournManager = useContext(TournamentContext);
  const matches = tbOrFinalsPhase.getMatchesForPool(pool);
  const round = tbOrFinalsPhase.rounds[0]; // Assume tiebreaker phases only have one round
  const isFinals = tbOrFinalsPhase.phaseType === PhaseTypes.Finals;
  const multFinalsPhases = tournManager.tournament.getFinalsPhases().length > 1;

  const newMatchForRound = () => {
    tournManager.openMatchModalNewMatchForRound(round);
  };

  const editExisting = (match: Match) => {
    tournManager.openMatchEditModalExistingMatch(match, tbOrFinalsPhase.rounds[0]);
  };

  const buttonLabel = `Add ${isFinals ? 'finals' : 'tiebreaker'} game${
    isFinals && multFinalsPhases ? ` - ${tbOrFinalsPhase.name}` : ''
  }`;

  if (matches.length === 0) {
    return (
      <LinkButton sx={{ marginTop: 1, mx: 2 }} onClick={newMatchForRound}>
        {buttonLabel}
      </LinkButton>
    );
  }

  return (
    <Box sx={{ marginTop: isFinals ? 0 : 1, mx: 2 }}>
      <Typography variant="subtitle2">{isFinals ? tbOrFinalsPhase.name : 'Tiebreakers'}</Typography>
      <Box typography="body2">
        {matches.map((match) => (
          <div key={match.id}>
            {match.getWinnerLoserString()}{' '}
            <IconButton size="small" onClick={() => editExisting(match)}>
              <Edit />
            </IconButton>
          </div>
        ))}
      </Box>
      <LinkButton onClick={newMatchForRound}>{buttonLabel}</LinkButton>
    </Box>
  );
}

function ConfirmFinalRanksCheckbox() {
  const tournManager = useContext(TournamentContext);
  const [checked, setChecked] = useSubscription(tournManager.tournament.finalRankingsReady);

  const onChanged = (val: boolean) => {
    setChecked(val);
    tournManager.setFinalRankingsReady(val);
  };

  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={(e) => onChanged(e.target.checked)} />}
      label="Final rankings ready to publish"
    />
  );
}

interface IFinalRankCellProps {
  ptStats: PoolTeamStats;
}

function FinalRankCell(props: IFinalRankCellProps) {
  const { ptStats } = props;
  const tournManager = useContext(TournamentContext);
  const [explicitRank] = useSubscription(ptStats.team.getOverallRank());

  if (!explicitRank && !ptStats.finalRankCalculated) return null;

  return (
    <TableCell align="right">
      {explicitRank || ptStats.finalRankCalculated}&emsp;
      <IconButton size="small" onClick={() => tournManager.openRankModal(ptStats.team)}>
        <Edit />
      </IconButton>
    </TableCell>
  );
}
