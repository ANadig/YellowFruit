import { useContext, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import { PhaseEditModalContext } from '../Modal Managers/TempPhaseManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';

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
