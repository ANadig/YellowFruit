import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { GenericModalContext } from '../Modal Managers/GenericModalManager';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

export default function GenericDialog() {
  const curTournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(curTournManager.genericModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <GenericModalContext.Provider value={mgr}>
      <GenericDialogCore />
    </GenericModalContext.Provider>
  );
}

function GenericDialogCore() {
  const modalManager = useContext(GenericModalContext);
  const [isOpen] = useSubscription(modalManager.isOpen);
  const [title] = useSubscription(modalManager.title);
  const [contents] = useSubscription(modalManager.contents);
  const [cancelButtonCaption] = useSubscription(modalManager.cancelButtonCaption);
  const [acceptButtonCaption] = useSubscription(modalManager.acceptButtonCaption);

  const handleCancel = () => {
    modalManager.close();
  };

  const handleAccept = () => {
    modalManager.close(true);
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{contents}</DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{cancelButtonCaption}</Button>
        {acceptButtonCaption && <Button onClick={handleAccept}>{acceptButtonCaption}</Button>}
      </DialogActions>
    </Dialog>
  );
}
