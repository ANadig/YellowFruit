import { useContext, useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
  Box,
  Alert,
  AlertColor,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { MatchEditModalContext } from '../Modal Managers/TempMatchManager';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import { ValidationStatuses } from '../DataModel/Interfaces';

export default function MatchEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.matchModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <MatchEditModalContext.Provider value={mgr}>
      <MatchEditDialogCore />
    </MatchEditModalContext.Provider>
  );
}

function MatchEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(MatchEditModalContext);

  const [isOpen] = useSubscription(modalManager.modalIsOpen);

  const handleCancel = () => {
    tournManager.matchEditModalReset();
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });

  return (
    <>
      <Dialog fullWidth maxWidth="xl" open={isOpen} onClose={handleCancel}>
        <DialogTitle>Edit Game</DialogTitle>
        <Box
          sx={{
            '& .MuiFormHelperText-root': { whiteSpace: 'nowrap' },
          }}
        >
          <DialogContent>
            <Grid container spacing={1} sx={{ marginTop: 1 }}>
              <Grid xs={6} sm={2}>
                <RoundField />
              </Grid>
              <Grid xs={6} sm={3}>
                <MainPhaseField />
              </Grid>
              <Grid xs={6} sm={4}>
                <CarryoverPhaseSelect />
              </Grid>
              <Grid xs={1} />
              <Grid xs={5} sm={2}>
                <TuhTotalField />
              </Grid>
            </Grid>
          </DialogContent>
        </Box>
        <ValidationSection />
        <DialogActions>
          <Button variant="outlined" onClick={handleCancel}>
            {hotkeyFormat('&Cancel')}
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            {hotkeyFormat('&Save {AMP} New')}
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            {hotkeyFormat('&Accept')}
          </Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog />
    </>
  );
}

function RoundField() {
  const modalManager = useContext(MatchEditModalContext);
  const [roundNo, setRoundNo] = useSubscription(modalManager.round?.toString() || '');
  const [err] = useSubscription(modalManager.roundFieldError);

  const handleBlur = () => {
    const newRoundNo = modalManager.setRoundNo(roundNo);
    const valToUse = newRoundNo === undefined ? '' : newRoundNo.toString();
    setRoundNo(valToUse);
  };

  return (
    <TextField
      type="number"
      label="Round"
      fullWidth
      variant="outlined"
      size="small"
      error={!!err}
      helperText={err || ' '}
      value={roundNo}
      onChange={(e) => setRoundNo(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
}

function MainPhaseField() {
  const modalManager = useContext(MatchEditModalContext);
  const [phaseName] = useSubscription(modalManager.getMainPhaseName());

  return (
    <TextField label="Phase" fullWidth variant="outlined" size="small" disabled helperText={' '} value={phaseName} />
  );
}

function CarryoverPhaseSelect() {
  const modalManager = useContext(MatchEditModalContext);
  const [coPhases, setCoPhases] = useSubscription(modalManager.tempMatch.carryoverPhases.map((ph) => ph.name));
  const [availablePhases] = useSubscription(modalManager.getAvailableCarryOverPhases());

  const handleChange = (val: string[] | string) => {
    const phaseNames = typeof val === 'string' ? val.split(',') : val;
    setCoPhases(phaseNames);
    modalManager.setCarryoverPhases(phaseNames);
  };

  return (
    <FormControl sx={{ minWidth: 200 }} size="small">
      <InputLabel>Carryover Phases</InputLabel>
      <Select
        label="Carryover Phases"
        multiple
        fullWidth
        value={coPhases}
        disabled={availablePhases.length === 0}
        onChange={(e) => handleChange(e.target.value)}
        renderValue={(selected) => selected.join(', ')}
      >
        {availablePhases.map((ph) => (
          <MenuItem key={ph.name} value={ph.name}>
            <Checkbox checked={coPhases.indexOf(ph.name) > -1} />
            <ListItemText primary={ph.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function TuhTotalField() {
  const modalManager = useContext(MatchEditModalContext);
  const thisMatch = modalManager.tempMatch;
  const [tuh, setTuh] = useSubscription(thisMatch.tossupsRead.toString() || '');
  const [valStatus] = useSubscription(thisMatch.totalTuhFieldValidation.status);
  const [valMsg] = useSubscription(thisMatch.totalTuhFieldValidation.message);

  const handleBlur = () => {
    const valToUse = modalManager.setTotalTuh(tuh);
    setTuh(valToUse.toString());
  };

  return (
    <TextField
      type="number"
      label="TU Heard (incl. OT)"
      fullWidth
      variant="outlined"
      size="small"
      error={valStatus === ValidationStatuses.Error}
      helperText={valMsg || ' '}
      value={tuh}
      onChange={(e) => setTuh(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
}

function ValidationSection() {
  const modalManager = useContext(MatchEditModalContext);
  const [validators] = useSubscription(modalManager.tempMatch.otherValidation.validators);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [_length] = useSubscription(modalManager.tempMatch.otherValidation.validators.length);

  return validators.map((m, idx) => <ValidationMessage key={m.type} index={idx} />);
}

interface IValidationMessageProps {
  index: number;
}

function ValidationMessage(props: IValidationMessageProps) {
  const { index } = props;
  const modalManager = useContext(MatchEditModalContext);
  const thisValidator = modalManager.tempMatch.otherValidation.validators[index];
  const [type] = useSubscription(thisValidator?.type);
  const [status] = useSubscription(thisValidator?.status);
  const [message] = useSubscription(thisValidator?.message);
  const [suppressable] = useSubscription(thisValidator?.suppressable);
  const [isSuppressed] = useSubscription(thisValidator?.isSuppressed);

  if (!thisValidator) return null;
  if (isSuppressed) return null;

  const suppressSelf = () => {
    if (type === undefined) return;
    modalManager.suppressValidationMessage(type);
  };

  return (
    <Alert
      sx={{ m: 1 }}
      variant="filled"
      severity={getMuiSeverity(status)}
      action={
        suppressable && (
          <Button color="inherit" size="small" onClick={suppressSelf}>
            Ignore
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}

function getMuiSeverity(status: ValidationStatuses): AlertColor | undefined {
  switch (status) {
    case ValidationStatuses.Error:
      return 'error';
    case ValidationStatuses.Warning:
      return 'warning';
    case ValidationStatuses.Info:
      return 'info';
    default:
      return undefined;
  }
}

function ErrorDialog() {
  const modalManager = useContext(MatchEditModalContext);
  const [isOpen] = useSubscription(modalManager.errorDialogIsOpen);
  const [contents] = useSubscription(modalManager.errorDialogContents);

  const handleClose = () => {
    modalManager.closeErrorDialog();
  };

  useHotkeys('alt+g', () => handleClose(), { enabled: isOpen });

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Unable to save match</DialogTitle>
      <DialogContent>
        <List dense>
          {contents.map((str) => (
            <ListItem key={str} disableGutters>
              {str}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{hotkeyFormat('&Go Back')}</Button>
      </DialogActions>
    </Dialog>
  );
}
