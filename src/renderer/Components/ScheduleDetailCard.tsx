import { useContext, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { Edit, ExpandMore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { Phase, PhaseTypes, WildCardRankingRules } from '../DataModel/Phase';
import { Pool, advOpportunityDisplay } from '../DataModel/Pool';
import { LinkButton } from '../Utils/GeneralReactUtils';

export default function ScheduleDetailCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [phases] = useSubscription(thisTournament.phases);

  return (
    <YfCard title="Schedule Detail">
      <List>
        {phases.map((phase) => (
          <Accordion key={phase.code} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ '& .MuiIconButton-root': { py: 0, px: 0.5, mx: 1 } }}>
              <PhaseTitle phase={phase} />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  tournManager.openPhaseModal(phase);
                }}
              >
                <Edit />
              </IconButton>
            </AccordionSummary>
            <AccordionDetails>
              {phase.isFullPhase() ? <PhaseEditor phase={phase} /> : <MinorPhaseSection phase={phase} />}
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    </YfCard>
  );
}

interface IPhaseTitleProps {
  phase: Phase;
}

function PhaseTitle(props: IPhaseTitleProps) {
  const { phase } = props;
  const [phaseName] = useSubscription(phase.name);

  return (
    <>
      {phase.phaseType === PhaseTypes.Finals ? '' : `${phase.code}. `}
      {phaseName}&nbsp;
      {phaseRoundDisplay(phase)}
    </>
  );
}

interface IPhaseEditorProps {
  phase: Phase;
}

function PhaseEditor(props: IPhaseEditorProps) {
  const { phase } = props;
  const [selectedPoolIdx, setSelectedPoolIdx] = useState(0);
  const [wcRankValue, setWcRankValue] = useSubscription(phase.wildCardRankingMethod);

  const selectedPool = phase.pools[selectedPoolIdx];
  const wcRules = phase.wildCardAdvancementRules;
  const showTiers = phase.phaseType === PhaseTypes.Playoff;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const canAddTB = !thisTournament.hasTiebreakerAfter(phase);
  const canAddFinals = thisTournament.isLastFullPhase(phase);
  const dragKey = `pools-${phase.name}`;

  if (phase.pools === undefined) {
    return <span>Pools object is undefined for this phase</span>;
  }

  const handleWcRankMethodChange = (val: WildCardRankingRules) => {
    setWcRankValue(val);
  };
  const thenPPB = thisTournament.scoringRules.useBonuses ? ', then PPB' : '';

  return (
    <Grid container spacing={2}>
      {wcRules.length > 0 && (
        <Grid xs={12} typography="body2">
          <FormControl>
            <FormLabel>Cross-Pool Ranking Method</FormLabel>
            <RadioGroup
              value={wcRankValue}
              onChange={(e) => handleWcRankMethodChange(e.target.value as WildCardRankingRules)}
            >
              <FormControlLabel
                value={WildCardRankingRules.RankThenPPB}
                control={<Radio size="small" />}
                label={`Rank within pool${thenPPB}`}
              />
              <FormControlLabel
                value={WildCardRankingRules.RecordThanPPB}
                control={<Radio size="small" />}
                label={`Record${thenPPB}`}
              />
            </RadioGroup>
          </FormControl>
        </Grid>
      )}
      <Grid xs={4}>
        <Box
          sx={{
            marginTop: 1,
            border: 1,
            borderRadius: 1,
            borderColor: 'lightgray',
            '& .MuiListItem-root': { p: 0 },
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
          }}
        >
          <List dense sx={{ py: 0 }}>
            {phase.pools.map((pool, idx) => (
              <div key={pool.name}>
                {idx !== 0 && <Divider />}
                <ListItem
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData(dragKey, idx.toString())}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    tournManager.reorderPools(phase, e.dataTransfer.getData(dragKey), idx);
                  }}
                  onDragLeave={(e) => e.preventDefault()}
                  disableGutters
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        tournManager.openPoolModal(phase, pool);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  }
                >
                  <ListItemButton selected={idx === selectedPoolIdx} onClick={() => setSelectedPoolIdx(idx)}>
                    <ListItemText
                      primary={pool.name}
                      secondary={`${showTiers ? `Tier ${pool.position} | ` : ''}${pool.size} Teams`}
                    />
                  </ListItemButton>
                </ListItem>
              </div>
            ))}
          </List>
        </Box>
      </Grid>
      <Grid xs={8}>
        <Typography sx={{ marginTop: 1 }} variant="subtitle2">
          {selectedPool.name}
        </Typography>
        <Box typography="body2">
          <List dense>
            <ListItem disableGutters>{roundRobinDisplay(selectedPool)}</ListItem>
            <ListItem disableGutters>Seeds {selectedPool.seeds.join(', ')}</ListItem>
            {selectedPool.autoAdvanceRules.length > 0 && (
              <>
                <ListItem disableGutters>Advancement:</ListItem>
                {selectedPool.autoAdvanceRules.map((ao) => (
                  <ListItem key={ao.tier}>{advOpportunityDisplay(ao)}</ListItem>
                ))}
                {wcRules.length > 0 && <ListItem>Other ranks advance based on cross-pool ranking method</ListItem>}
              </>
            )}
          </List>
        </Box>
        {canAddTB && (
          <LinkButton onClick={() => tournManager.addTiebreakerAfter(phase)}>Add tiebreaker stage</LinkButton>
        )}
        <br />
        {canAddFinals && <LinkButton onClick={() => tournManager.addFinalsPhase()}>Add finals stage</LinkButton>}
      </Grid>
    </Grid>
  );
}

interface IMinoPhaseSectionProps {
  phase: Phase;
}

/** A minimal section for a tiebreaker or finals phase */
function MinorPhaseSection(props: IMinoPhaseSectionProps) {
  const { phase } = props;
  const tournManager = useContext(TournamentContext);
  const [usesNumeric, setUsesNumeric] = useSubscription(phase.forceNumericRounds || false);
  const matchesExist = phase.anyMatchesExist();

  const handleUsesNumericChange = (checked: boolean) => {
    setUsesNumeric(checked);
    if (checked) {
      tournManager.forcePhaseToBeNumeric(phase);
    } else {
      tournManager.undoForcePhaseToBeNumeric(phase);
    }
  };

  return (
    <>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox size="small" checked={usesNumeric} onChange={(e) => handleUsesNumericChange(e.target.checked)} />
          }
          label="Uses numeric round"
          sx={{ width: 'fit-content' }}
        />
      </FormGroup>
      <LinkButton disabled={matchesExist} onClick={() => tournManager.deletePhase(phase)}>
        Delete stage
      </LinkButton>
    </>
  );
}

function phaseRoundDisplay(phase: Phase) {
  const { rounds } = phase;
  if (rounds.length === 0) return '';
  if (!phase.usesNumericRounds()) return '';
  if (rounds.length === 1) return `(Round ${rounds[0].number})`;

  return `(Rounds ${rounds[0].number} to ${rounds[rounds.length - 1].number})`;
}

function roundRobinDisplay(pool: Pool) {
  if (pool.roundRobins < 1) return 'Not a full round robin';
  return `${pool.roundRobins}x round robin${pool.hasCarryover ? ' with carryover' : ''}`;
}
