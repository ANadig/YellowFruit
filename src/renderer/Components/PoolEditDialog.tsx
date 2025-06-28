import { useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useHotkeys } from 'react-hotkeys-hook';
import { Delete, HelpOutline } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { YfAcceptButton, YfCancelButton, YfNumericField } from '../Utils/GeneralReactUtils';
import { PoolEditModalContext } from '../Modal Managers/TempPoolManager';

const carryoverFieldTooltip =
  "Include previous rounds' matches in the pool standings where both teams are in this pool?";

export default function PoolEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.poolModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <PoolEditModalContext.Provider value={mgr}>
      <PoolEditDialogCore />
    </PoolEditModalContext.Provider>
  );
}

function PoolEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(PoolEditModalContext);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [hasErrors] = useSubscription(modalManager.hasAnyErrors());
  const [canSetCarryover] = useSubscription(modalManager.canSetCarryover);
  const [deleteionDisabled] = useSubscription(modalManager.deletionDisabled);
  const [allowCustomSched] = useSubscription(modalManager.allowCustomSchedule);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.closePoolModal(true);
  };

  const handleCancel = () => {
    tournManager.closePoolModal(false);
  };

  const handleDelete = () => {
    tournManager.tryDeletePool();
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen && !hasErrors, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} fullWidth maxWidth="sm" onClose={handleCancel}>
      <DialogTitle>Edit Pool</DialogTitle>
      <DialogContent>
        <Box sx={{ '& .MuiFormHelperText-root': { whiteSpace: 'nowrap' } }}>
          <PoolNameField />
          <NumberOfTeamsField />
          <Grid container columnSpacing={1} sx={{ marginTop: 1 }}>
            <Grid xs={3}>
              <Typography sx={{ paddingTop: 1 }}>Round Robin:</Typography>
            </Grid>
            <Grid xs={5}>
              <RoundRobinsField />
            </Grid>
            <Grid xs={4}>{canSetCarryover && <CarryoverField />}</Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <div>
          {allowCustomSched && (
            <Button
              variant="outlined"
              color="warning"
              disabled={deleteionDisabled}
              onClick={handleDelete}
              startIcon={<Delete />}
            >
              Delete
            </Button>
          )}
        </div>
        <Box sx={{ '& .MuiButton-root': { marginLeft: 1 } }}>
          <YfCancelButton onClick={handleCancel} />
          <YfAcceptButton onClick={handleAccept} disabled={hasErrors} ref={acceptButtonRef} />
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function PoolNameField() {
  const modalManager = useContext(PoolEditModalContext);
  const [name, setName] = useSubscription(modalManager.poolName);
  const [error] = useSubscription(modalManager.poolNameError);

  const onBlur = () => {
    modalManager.setPoolName(name);
  };

  return (
    <TextField
      sx={{ marginTop: 1 }}
      fullWidth
      autoFocus
      spellCheck={false}
      variant="outlined"
      size="small"
      label="Name"
      error={error !== ''}
      helperText={error || ' '}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onBlur();
      }}
    />
  );
}

function NumberOfTeamsField() {
  const modalManager = useContext(PoolEditModalContext);
  const [numTeams, setNumTeams] = useSubscription(modalManager.numTeams?.toString() || '');
  const [numTeamsInPool] = useSubscription(modalManager.originalPoolOpened?.poolTeams.length || 0);
  const [error] = useSubscription(modalManager.numTeamsError);
  const [allowCustomSched] = useSubscription(modalManager.allowCustomSchedule);

  const onBlur = () => {
    const newNumTeams = modalManager.setNumTeams(numTeams);
    const valToUse = newNumTeams === undefined ? '' : newNumTeams.toString();
    setNumTeams(valToUse);
  };

  return (
    <YfNumericField
      sx={{ verticalAlign: 'baseline', width: '10ch' }}
      inputProps={{ min: Math.max(1, numTeamsInPool), max: 999 }}
      variant="outlined"
      size="small"
      label="No. Teams"
      disabled={!allowCustomSched}
      value={numTeams}
      error={error !== ''}
      helperText={error || ' '}
      onChange={(e) => setNumTeams(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onBlur();
      }}
    />
  );
}

function RoundRobinsField() {
  const modalManager = useContext(PoolEditModalContext);
  const [numRRs] = useSubscription(modalManager.numRoundRobins || 0);
  const [minRRs] = useSubscription(modalManager.minRRs);

  const allowedOptions = [0, 1, 2, 3, 4];

  return (
    <ToggleButtonGroup
      size="small"
      color="primary"
      exclusive
      value={numRRs}
      onChange={(e, newValue) => {
        if (newValue === null) return;
        modalManager.setNumRoundRobins(newValue);
      }}
    >
      {allowedOptions.map((opt) => (
        <ToggleButton key={opt} value={opt} disabled={opt < minRRs}>
          {opt === 0 ? 'Not RR' : `${opt}x`}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function CarryoverField() {
  const modalManager = useContext(PoolEditModalContext);
  const [hasCO] = useSubscription(modalManager.hasCarryover);
  const [numRRs] = useSubscription(modalManager.numRoundRobins || 0);

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={hasCO}
            disabled={numRRs !== 1}
            onChange={(e) => modalManager.setHasCarryover(e.target.checked)}
          />
        }
        label={
          <>
            Carryover?
            <Tooltip sx={{ mx: 1, verticalAlign: 'text-bottom' }} title={carryoverFieldTooltip} placement="right">
              <HelpOutline fontSize="small" />
            </Tooltip>
          </>
        }
      />
    </FormGroup>
  );
}
