import { useContext, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import { RankEditModalContext } from '../Modal Managers/TempRankManager';

export default function RankEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.rankModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <RankEditModalContext.Provider value={mgr}>
      <RankEditDialogCore />
    </RankEditModalContext.Provider>
  );
}

function RankEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(RankEditModalContext);
  const [team] = useSubscription(modalManager.teamBeingEdited);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [hasErrors] = useSubscription(modalManager.hasAnyErrors());
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.closeRankModal(true);
  };

  const handleCancel = () => {
    tournManager.closeRankModal(false);
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen && !hasErrors, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} fullWidth maxWidth="xs" onClose={handleCancel}>
      <DialogTitle>{team?.name || ''} Final Rank</DialogTitle>
      <DialogContent>
        <RankField />
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

function RankField() {
  const modalManager = useContext(RankEditModalContext);
  const [rank, setRank] = useSubscription(modalManager.rank?.toString() || '');
  const [error] = useSubscription(modalManager.rankError);

  const onBlur = () => {
    const valToSave = modalManager.setRank(rank);
    setRank(valToSave?.toString() || '');
  };

  return (
    <TextField
      sx={{ marginTop: 1, width: '15ch' }}
      type="number"
      inputProps={{ min: 1 }}
      autoFocus
      variant="outlined"
      size="small"
      error={error !== ''}
      helperText={error || ' '}
      value={rank}
      onChange={(e) => setRank(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onBlur();
      }}
    />
  );
}
