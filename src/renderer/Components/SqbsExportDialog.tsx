import { ChangeEvent, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { useHotkeys } from 'react-hotkeys-hook';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { YfAcceptButton, YfCancelButton } from '../Utils/GeneralReactUtils';
import { SqbsExportModalContext } from '../Modal Managers/SqbsExportModalManager';
import { Phase } from '../DataModel/Phase';

const introHelpText =
  "The SQBS file format doesn't support multi-stage tournaments. Choose which stages to export and whether to combine multiple stages into one file. Files containing a single stage will use that stage's pools, if there are at least two pools, as the SQBS file's \"divisions\". If you combine multiple stages into one file, no pools are used.";
const fileSplitHelpText =
  'When you accept this form, you will be prompted for a single file name. YellowFruit will append the name of the stage to each file.';

const radioKeySplitFiles = 'split-files';
const radioKeyCombFiles = 'one-file';

export default function SqbsExportDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.sqbsExportModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <SqbsExportModalContext.Provider value={mgr}>
      <SqbsExportDialogCore />
    </SqbsExportModalContext.Provider>
  );
}

function SqbsExportDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(SqbsExportModalContext);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const { selectedPhases, combineFiles } = modalManager;
  const enableFileOptionRadio = selectedPhases.length > 1;
  const canAccept = selectedPhases.length > 0;

  const handleAccept = () => {
    tournManager.closeSqbsExportModal(true);
  };
  const handleCancel = () => {
    tournManager.closeSqbsExportModal(false);
  };
  const handleSelectedPhaseChange = (event: ChangeEvent<HTMLInputElement>, phase: Phase) => {
    modalManager.handleSelectedPhaseChange(phase, event.target.checked);
  };
  const handleNumFileschange = (event: ChangeEvent<HTMLInputElement>) => {
    modalManager.handleCombineFilesChange(event.target.value === radioKeyCombFiles);
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen && canAccept, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} fullWidth maxWidth="sm" onClose={handleCancel}>
      <DialogTitle>Export SQBS Files</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ marginBottom: 2 }}>
          {introHelpText}
        </Typography>
        <FormControl variant="standard" size="small">
          <FormLabel>Stages to export</FormLabel>
          <FormGroup>
            {modalManager.availablePhases.map((ph) => (
              <FormControlLabel
                key={ph.name}
                control={
                  <Checkbox
                    checked={selectedPhases.includes(ph)}
                    onChange={(e) => handleSelectedPhaseChange(e, ph)}
                    name={ph.name}
                    sx={{ marginLeft: 4 }}
                  />
                }
                label={ph.name}
              />
            ))}
          </FormGroup>
          <FormLabel>Number of files</FormLabel>
          <RadioGroup value={combineFiles ? radioKeyCombFiles : radioKeySplitFiles} onChange={handleNumFileschange}>
            <FormControlLabel
              value={radioKeySplitFiles}
              label="Each stage in its own file"
              control={<Radio />}
              disabled={!enableFileOptionRadio}
              sx={{ marginLeft: 2.5 }}
            />
            <FormControlLabel
              value={radioKeyCombFiles}
              label="Combine stages into one file"
              control={<Radio />}
              disabled={!enableFileOptionRadio}
              sx={{ marginLeft: 2.5 }}
            />
          </RadioGroup>
        </FormControl>
        {enableFileOptionRadio && !combineFiles && <Alert severity="info">{fileSplitHelpText}</Alert>}
      </DialogContent>
      <DialogActions>
        <YfCancelButton onClick={handleCancel} />
        <YfAcceptButton onClick={handleAccept} disabled={!canAccept} />
      </DialogActions>
    </Dialog>
  );
}
