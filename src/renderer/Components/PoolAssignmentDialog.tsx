import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  DialogActions,
  Button,
} from '@mui/material';
import { useContext } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import PoolAssignmentModalManager from '../Modal Managers/PoolAssignmentModalManager';

export default function PoolAssignmentDialog() {
  const tournManager = useContext(TournamentContext);
  const modalManager = tournManager.poolAssignmentModalManager;
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [team] = useSubscription(modalManager.teamBeingAssigned);
  const [showNone] = useSubscription(modalManager.showNoneOption);
  const defaultOption = showNone ? PoolAssignmentModalManager.noneOptionKey : '';
  const [selectedPool, setSeletedPool] = useSubscription(modalManager.selectedPool?.name || defaultOption);

  const handleAccept = () => {
    tournManager.closePoolAssignmentModal(true);
  };
  const handleCancel = () => {
    tournManager.closePoolAssignmentModal(false);
  };
  const handleOptionChange = (option: string) => {
    modalManager.setSelectedPool(option);
    setSeletedPool(option);
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen, enableOnFormTags: true });

  if (!modalManager.phase) return null;

  return (
    <Dialog open={isOpen} fullWidth maxWidth="sm" onClose={handleCancel}>
      <DialogTitle>{`Assign ${team?.name || ''}`}</DialogTitle>
      <DialogContent>
        <FormControl>
          <RadioGroup value={selectedPool} onChange={(e) => handleOptionChange(e.target.value)}>
            {modalManager.phase.pools.map((p) => (
              <FormControlLabel key={p.name} value={p.name} label={p.name} control={<Radio />} />
            ))}
            {showNone && (
              <FormControlLabel value={PoolAssignmentModalManager.noneOptionKey} label="None" control={<Radio />} />
            )}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel}>
          {hotkeyFormat('&Cancel')}
        </Button>
        <Button variant="outlined" onClick={handleAccept}>
          {hotkeyFormat('&Accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
