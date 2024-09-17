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
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import { PoolEditModalContext } from '../Modal Managers/TempPoolManager';

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
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.closePoolModal(true);
  };

  const handleCancel = () => {
    tournManager.closePoolModal(false);
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
            <Grid xs={3}>Round Robins:</Grid>
            <Grid xs={5}>
              <RoundRobinsField />
            </Grid>
            <Grid xs={4}>{canSetCarryover && <CarryoverField />}</Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel}>
          {hotkeyFormat('&Cancel')}
        </Button>
        <Button variant="outlined" onClick={handleAccept} disabled={hasErrors} ref={acceptButtonRef}>
          {hotkeyFormat('&Accept')}
        </Button>
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
  const [error] = useSubscription(modalManager.numTeamsError);

  const onBlur = () => {
    const newNumTeams = modalManager.setNumTeams(numTeams);
    const valToUse = newNumTeams === undefined ? '' : newNumTeams.toString();
    setNumTeams(valToUse);
  };

  return (
    <TextField
      sx={{ verticalAlign: 'baseline', width: '10ch' }}
      type="number"
      inputProps={{ min: 1, max: 999 }}
      variant="outlined"
      size="small"
      label="No. Teams"
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
        <ToggleButton key={opt} value={opt}>
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
        label="Carryover?"
      />
    </FormGroup>
  );
}
