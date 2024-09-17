import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
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
      sx={{ marginTop: 1, verticalAlign: 'baseline', width: '10ch' }}
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
