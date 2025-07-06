import { useContext, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, Delete, Edit, ExpandMore, LockOpen } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { Phase, PhaseTypes, WildCardRankingMethod } from '../DataModel/Phase';
import { Pool, advOpportunityDisplay } from '../DataModel/Pool';
import { LinkButton } from '../Utils/GeneralReactUtils';

const unlockCustSchedTooltip =
  'Add, remove, or modify stages and pools. Seeding and rebracketing assistance is not available for custom schedules.';
const usingCustSchedTooltip = 'Using a custom schedule. Seeding and rebracketing assistance are not available.';

export default function ScheduleDetailCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [phases] = useSubscription(thisTournament.phases);
  const [usingTemplate] = useSubscription(thisTournament.usingScheduleTemplate);

  const tooltip = usingTemplate ? unlockCustSchedTooltip : usingCustSchedTooltip;

  return (
    <YfCard
      title="Schedule Detail"
      secondaryHeader={
        <Tooltip title={tooltip}>
          <span>
            <Button
              variant="contained"
              disabled={!usingTemplate}
              onClick={() => tournManager.tryUnlockCustomSchedule()}
              startIcon={<LockOpen />}
            >
              {usingTemplate ? 'Customize' : 'Custom'}
            </Button>
          </span>
        </Tooltip>
      }
    >
      <List>
        {phases.map((phase) => (
          <Accordion key={`${phase.code}${phase.name}`} defaultExpanded>
            <PhaseAccordionHeader phase={phase} />
            <AccordionDetails>
              {phase.isFullPhase() ? <PhaseEditor phase={phase} /> : <MinorPhaseSection phase={phase} />}
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
      {!usingTemplate && (
        <Button
          sx={{ marginTop: 1 }}
          variant="contained"
          onClick={() => tournManager.addPlayoffPhase()}
          startIcon={<Add />}
        >
          Add Stage
        </Button>
      )}
    </YfCard>
  );
}

interface PhaseAccordionHeaderProps {
  phase: Phase;
}

function PhaseAccordionHeader(props: PhaseAccordionHeaderProps) {
  const { phase } = props;
  const tournManager = useContext(TournamentContext);
  const thisTourn = tournManager.tournament;
  const matchesExist = phase.anyMatchesExist();
  const [usingTemplate] = useSubscription(thisTourn.usingScheduleTemplate);

  const showDeleteButton = !phase.isFullPhase() || (!usingTemplate && phase.phaseType !== PhaseTypes.Prelim);
  const canMoveUp = thisTourn.canMovePhaseUp(phase);
  const canMoveDown = thisTourn.canMovePhaseDown(phase);

  return (
    <AccordionSummary
      expandIcon={<ExpandMore />}
      sx={{
        '& .MuiAccordionSummary-content': { justifyContent: 'space-between' },
        '& .MuiIconButton-root': { py: 0, px: 0.5, mx: 1 },
      }}
    >
      <div>
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
      </div>
      <div>
        {(canMoveUp || canMoveDown) && (
          <>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  disabled={!canMoveUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    tournManager.movePhaseUp(phase);
                  }}
                >
                  <ArrowUpward />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  disabled={!canMoveDown}
                  onClick={(e) => {
                    e.stopPropagation();
                    tournManager.movePhaseDown(phase);
                  }}
                >
                  <ArrowDownward />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
        {showDeleteButton && (
          <Tooltip title="Delete stage">
            <span>
              <IconButton
                size="small"
                disabled={matchesExist}
                onClick={(e) => {
                  e.stopPropagation();
                  tournManager.tryDeletePhase(phase);
                }}
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </div>
    </AccordionSummary>
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

  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const selectedPool = phase.pools[selectedPoolIdx];
  const wcRules = phase.wildCardAdvancementRules;
  const showTiers = phase.phaseType === PhaseTypes.Playoff && thisTournament.usingScheduleTemplate;
  const canAddTB = !thisTournament.hasTiebreakerAfter(phase);
  const canAddFinals = thisTournament.isLastFullPhase(phase);
  const [usingTemplate] = useSubscription(thisTournament.usingScheduleTemplate);
  const dragKey = `pools-${phase.name}`;

  if (phase.pools === undefined) {
    return <span>Pools object is undefined for this phase</span>;
  }

  const handleWcRankMethodChange = (val: WildCardRankingMethod) => {
    setWcRankValue(val);
    tournManager.setPhaseWCRankMethod(phase, val);
  };
  const thenPPB = thisTournament.scoringRules.useBonuses ? ', then PPB' : '';

  return (
    <Grid container spacing={2}>
      {wcRules.length > 0 && phase.pools.length > 1 && (
        <Grid xs={12} sx={{ '& .MuiFormControlLabel-label': { typography: 'body2' }, '& .MuiRadio-root': { py: 0.5 } }}>
          <FormControl>
            <FormLabel>Cross-Pool (Wild Card) Ranking Method</FormLabel>
            <RadioGroup
              value={wcRankValue}
              onChange={(e) => handleWcRankMethodChange(e.target.value as WildCardRankingMethod)}
            >
              <FormControlLabel
                value={WildCardRankingMethod.RankThenPPB}
                control={<Radio size="small" />}
                label={`Rank within pool${thenPPB}`}
              />
              <FormControlLabel
                value={WildCardRankingMethod.RecordThanPPB}
                control={<Radio size="small" />}
                label={`Record${thenPPB}`}
              />
            </RadioGroup>
          </FormControl>
        </Grid>
      )}
      <Grid xs={5}>
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
        {!usingTemplate && (
          <Button
            sx={{ marginTop: 1 }}
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => tournManager.addPool(phase)}
          >
            Add Pool
          </Button>
        )}
      </Grid>
      <Grid xs={7}>
        <Typography sx={{ marginTop: 1 }} variant="subtitle2">
          {selectedPool?.name}
        </Typography>
        {selectedPool && <PoolDetail selectedPool={selectedPool} hasWildCardAdvancement={wcRules.length > 0} />}
        {canAddTB && (
          <LinkButton onClick={() => tournManager.addTiebreakerAfter(phase)}>Add tiebreaker stage</LinkButton>
        )}
        <br />
        {canAddFinals && <LinkButton onClick={() => tournManager.addFinalsPhase()}>Add finals stage</LinkButton>}
      </Grid>
    </Grid>
  );
}

interface IPoolDetailProps {
  selectedPool: Pool;
  hasWildCardAdvancement: boolean;
}

function PoolDetail(props: IPoolDetailProps) {
  const { selectedPool, hasWildCardAdvancement } = props;

  return (
    <Box typography="body2">
      <List dense>
        <ListItem disableGutters>{roundRobinDisplay(selectedPool)}</ListItem>
        {selectedPool.seeds.length > 0 && <ListItem disableGutters>Seeds {selectedPool.seeds.join(', ')}</ListItem>}
        {selectedPool.autoAdvanceRules.length > 0 && (
          <>
            <ListItem disableGutters>Advancement:</ListItem>
            {selectedPool.autoAdvanceRules.map((ao) => (
              <ListItem key={ao.tier}>{advOpportunityDisplay(ao)}</ListItem>
            ))}
            {hasWildCardAdvancement && <ListItem>Other ranks advance based on cross-pool ranking method</ListItem>}
          </>
        )}
      </List>
    </Box>
  );
}

interface IMinorPhaseSectionProps {
  phase: Phase;
}

/** A minimal section for a tiebreaker or finals phase */
function MinorPhaseSection(props: IMinorPhaseSectionProps) {
  const { phase } = props;
  const tournManager = useContext(TournamentContext);
  const [usesNumeric, setUsesNumeric] = useSubscription(phase.forceNumericRounds || false);

  const handleUsesNumericChange = (checked: boolean) => {
    setUsesNumeric(checked);
    if (checked) {
      tournManager.forcePhaseToBeNumeric(phase);
    } else {
      tournManager.undoForcePhaseToBeNumeric(phase);
    }
  };

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox size="small" checked={usesNumeric} onChange={(e) => handleUsesNumericChange(e.target.checked)} />
        }
        label="Uses numeric round"
        sx={{ width: 'fit-content' }}
      />
    </FormGroup>
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
