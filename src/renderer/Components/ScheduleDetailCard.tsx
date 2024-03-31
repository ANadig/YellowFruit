import { useContext, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { Phase, PhaseTypes } from '../DataModel/Phase';
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
            <AccordionSummary expandIcon={<ExpandMore />}>{phaseHeaderString(phase)}</AccordionSummary>
            <AccordionDetails>
              {phase.isFullPhase() ? <PhaseEditor phase={phase} /> : <MinorPhaseSection phase={phase} />}
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    </YfCard>
  );
}

interface IPhaseEditorProps {
  phase: Phase;
}

function PhaseEditor(props: IPhaseEditorProps) {
  const { phase } = props;
  const [selectedPoolIdx, setSelectedPoolIdx] = useState(0);
  const selectedPool = phase.pools[selectedPoolIdx];
  const showTiers = phase.phaseType === PhaseTypes.Playoff;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const canAddTB = !thisTournament.hasTiebreakerAfter(phase);
  const canAddFinals = thisTournament.isLastFullPhase(phase);

  if (phase.pools === undefined) {
    return <span>Pools object is undefined for this phase</span>;
  }

  return (
    <Grid container spacing={2}>
      <Grid xs={4}>
        <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
          <List dense sx={{ py: 0 }}>
            {phase.pools.map((pool, idx) => (
              <div key={pool.name}>
                {idx !== 0 && <Divider />}
                <ListItemButton selected={idx === selectedPoolIdx} onClick={() => setSelectedPoolIdx(idx)}>
                  <ListItemText
                    primary={pool.name}
                    secondary={`${showTiers ? `Tier ${pool.position} | ` : ''}${pool.size} Teams`}
                  />
                </ListItemButton>
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

function phaseHeaderString(phase: Phase) {
  const code = phase.phaseType === PhaseTypes.Finals ? '' : `${phase.code}. `;
  return `${code}${phase.name} ${phaseRoundDisplay(phase)}`;
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
