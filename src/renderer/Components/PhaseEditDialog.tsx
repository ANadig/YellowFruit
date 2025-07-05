import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  TextField,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import { PhaseEditModalContext } from '../Modal Managers/TempPhaseManager';
import useSubscription from '../Utils/CustomHooks';
import { YfAcceptButton, YfCancelButton, YfNumericField } from '../Utils/GeneralReactUtils';

export default function PhaseEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.phaseModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <PhaseEditModalContext.Provider value={mgr}>
      <PhaseEditDialogCore />
    </PhaseEditModalContext.Provider>
  );
}

function PhaseEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(PhaseEditModalContext);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [hasErrors] = useSubscription(modalManager.hasAnyErrors());
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.closePhaseModal(true);
  };

  const handleCancel = () => {
    tournManager.closePhaseModal(false);
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen && !hasErrors, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} fullWidth maxWidth="sm" onClose={handleCancel}>
      <DialogTitle>Edit Stage</DialogTitle>
      <DialogContent>
        <PhaseNameField />
        {modalManager.shouldShowRoundFields() && <PhaseRoundFields />}
        <PhaseConvertFields />
      </DialogContent>
      <DialogActions>
        <YfCancelButton onClick={handleCancel} />
        <YfAcceptButton onClick={handleAccept} disabled={hasErrors} ref={acceptButtonRef} />
      </DialogActions>
    </Dialog>
  );
}

function PhaseNameField() {
  const modalManager = useContext(PhaseEditModalContext);
  const [name, setName] = useSubscription(modalManager.phaseName);
  const [error] = useSubscription(modalManager.phaseNameError);

  const onBlur = () => {
    modalManager.setPhaseName(name);
  };

  return (
    <TextField
      sx={{ marginTop: 1 }}
      fullWidth
      spellCheck={false}
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

function PhaseRoundFields() {
  const modalManager = useContext(PhaseEditModalContext);
  const [firstRound, setFirstRound] = useSubscription(modalManager.firstRound?.toString() || '');
  const [lastRound, setLastRound] = useSubscription(modalManager.lastRound?.toString() || '');
  const [error] = useSubscription(modalManager.roundRangeError);

  const handleBlurFirstRound = () => {
    const newRoundNo = modalManager.setFirstRound(firstRound);
    const valToUse = newRoundNo === undefined ? '' : newRoundNo.toString();
    setFirstRound(valToUse);
  };
  const handleBlurLastRound = () => {
    const newRoundNo = modalManager.setLastRound(lastRound);
    const valToUse = newRoundNo === undefined ? '' : newRoundNo.toString();
    setLastRound(valToUse);
  };

  return (
    <>
      <div style={{ paddingLeft: '4px' }}>
        <span style={{ padding: '0 10px' }}>Rounds</span>
        <YfNumericField
          sx={{ verticalAlign: 'baseline', width: '8ch' }}
          inputProps={{ min: 1, max: 999 }}
          variant="outlined"
          size="small"
          value={firstRound}
          onChange={(e) => setFirstRound(e.target.value)}
          onBlur={handleBlurFirstRound}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlurFirstRound();
          }}
        />
        <span style={{ padding: '0 10px' }}>to</span>
        <YfNumericField
          sx={{ verticalAlign: 'baseline', width: '8ch' }}
          inputProps={{ min: 1, max: 999 }}
          variant="outlined"
          size="small"
          value={lastRound}
          onChange={(e) => setLastRound(e.target.value)}
          onBlur={handleBlurLastRound}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlurLastRound();
          }}
        />
      </div>
      {error && (
        <Alert sx={{ marginTop: 2.5 }} variant="outlined" severity="error">
          {error}
        </Alert>
      )}
    </>
  );
}

function PhaseConvertFields() {
  const modalManager = useContext(PhaseEditModalContext);
  const thisPhase = modalManager.originalPhaseOpened;
  const [convertToFinals, setConvertToFinals] = useSubscription(modalManager?.convertToFinals || false);
  const [convertToTB, setConvertToTB] = useSubscription(modalManager?.convertToTiebreaker || false);

  const handleCheckConvToFinals = (checked: boolean) => {
    setConvertToFinals(checked);
    modalManager.setConvertToFinals(checked);
  };
  const handleCheckConvToTB = (checked: boolean) => {
    setConvertToTB(checked);
    modalManager.setConvertToTiebreaker(checked);
  };

  if (!thisPhase) return null;
  if (!modalManager.canConvToFinals && !modalManager.canConvToTB) return null;

  return (
    <Grid container sx={{ my: 1 }}>
      <Grid xs={6}>
        {modalManager.canConvToFinals && (
          <FormGroup>
            <Tooltip
              placement="top"
              title="Designate this stage as containing finals matches rather than standard pool play. This action will delete all pools in this stage."
            >
              <FormControlLabel
                label="Convert to finals"
                control={
                  <Checkbox checked={convertToFinals} onChange={(e) => handleCheckConvToFinals(e.target.checked)} />
                }
              />
            </Tooltip>
          </FormGroup>
        )}
      </Grid>
      <Grid xs={6}>
        {modalManager.canConvToTB && (
          <FormGroup>
            <Tooltip
              placement="top"
              title="Designate this stage as containing tiebreaker matches rather than standard pool play. This action will delete all pools in this stage."
            >
              <FormControlLabel
                label="Convert to tiebreakers"
                control={<Checkbox checked={convertToTB} onChange={(e) => handleCheckConvToTB(e.target.checked)} />}
              />
            </Tooltip>
          </FormGroup>
        )}
      </Grid>
    </Grid>
  );
}
