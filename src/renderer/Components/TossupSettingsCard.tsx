import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useContext, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import AnswerType, { sortAnswerTypes } from '../DataModel/AnswerType';
import { hotkeyFormat, SettingRow, SettingsList } from '../Utils/GeneralReactUtils';
import { ScoringRules } from '../DataModel/ScoringRules';

const commonPointValues = [-5, 10, 15, 20];

function TossupSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [customPtValFormOpen, setCustomPtValFormOpen] = useState(false);
  const [activeAnswerTypes, setAnswerTypes] = useSubscription(thisTournament.scoringRules?.answerTypes);
  const readOnly = tournManager.tournament.hasMatchData;

  if (!activeAnswerTypes) return null;

  const canAddMoreValues = activeAnswerTypes.length < ScoringRules.maximumAnswerTypes;
  const pointValuesForChips: number[] = [];
  for (const v of commonPointValues) {
    if (
      !activeAnswerTypes.find((ansType) => {
        return v === ansType.value;
      })
    ) {
      pointValuesForChips.push(v);
    }
  }

  const deleteAnswerType = (pointValue: number) => {
    const newAnswerTypes = activeAnswerTypes.filter((aType) => {
      return aType.value !== pointValue;
    });
    setAnswerTypes(newAnswerTypes);
    tournManager.setAnswerTypes(newAnswerTypes);
  };

  const addAnswerType = (pointValue: number) => {
    if (findPointValue(activeAnswerTypes, pointValue)) {
      return;
    }
    const newAnswerTypes = activeAnswerTypes.concat([new AnswerType(pointValue)]);
    sortAnswerTypes(newAnswerTypes);
    setAnswerTypes(newAnswerTypes);
    tournManager.setAnswerTypes(newAnswerTypes);
  };

  return (
    <YfCard title="Toss-ups">
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
        Point values
      </Typography>
      <ActivePointValueList answerTypes={activeAnswerTypes} deleteItem={deleteAnswerType} allDisabled={readOnly} />
      {canAddMoreValues && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Add a point value
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
            <AvailableStandardPtValuesList
              pointValues={pointValuesForChips}
              addPointValue={addAnswerType}
              disabled={readOnly}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              disabled={readOnly}
              onClick={() => setCustomPtValFormOpen(true)}
            >
              Custom value
            </Button>
          </Box>
        </>
      )}
      <CustomPtValDialog
        isOpen={customPtValFormOpen}
        answerTypesInUse={activeAnswerTypes}
        handleAccept={(pointVal: number) => {
          setCustomPtValFormOpen(false);
          addAnswerType(pointVal);
        }}
        handleCancel={() => setCustomPtValFormOpen(false)}
      />
    </YfCard>
  );
}

interface IActivePointValueListProps {
  answerTypes: AnswerType[];
  deleteItem: (pointValue: number) => void;
  allDisabled: boolean;
}

function ActivePointValueList(props: IActivePointValueListProps) {
  const { answerTypes, deleteItem, allDisabled } = props;

  const positivePtValues = answerTypes.filter((aType) => {
    return aType.value > 0;
  });
  const cantDeletePositive = positivePtValues.length === 1;

  return (
    <SettingsList>
      {answerTypes.map((answerType) => {
        const disableDelete = cantDeletePositive && answerType.value > 0;
        const tooltip = disableDelete ? 'You must have at least one positive point value' : 'Delete this point value';

        return (
          <SettingRow key={answerType.value} label={`${answerType.value} pts`}>
            <Tooltip title={tooltip} placement="left">
              <span>
                <IconButton
                  size="small"
                  disabled={disableDelete || allDisabled}
                  onClick={() => deleteItem(answerType.value)}
                  aria-label={`Delete ${answerType.value} point value`}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </SettingRow>
        );
      })}
    </SettingsList>
  );
}

interface IAvailableStandardPtValuesListProps {
  pointValues: number[];
  addPointValue: (pointValue: number) => void;
  disabled: boolean;
}

function AvailableStandardPtValuesList(props: IAvailableStandardPtValuesListProps) {
  const { pointValues, addPointValue, disabled } = props;

  return pointValues.map((value) => (
    <Button
      key={value}
      variant="outlined"
      size="small"
      startIcon={<Add />}
      disabled={disabled}
      onClick={() => addPointValue(value)}
    >
      {value} pts
    </Button>
  ));
}

interface ICustomPtValDialogProps {
  isOpen: boolean;
  answerTypesInUse: AnswerType[];
  handleAccept: (pointValue: number) => void;
  handleCancel: () => void;
}

function CustomPtValDialog(props: ICustomPtValDialogProps) {
  const { isOpen, answerTypesInUse, handleAccept, handleCancel } = props;
  const [newPtVal, setNewPtVal] = useState('');
  const [error, setError] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const canSave = isOpen && !error && newPtVal !== '';

  const onPtValChange = (val: string) => {
    setNewPtVal(val);
    if (val === '') {
      setError(false);
      return;
    }
    const parsed = parseFloat(val);
    if (pointValIsInvalid(parsed)) {
      setError(true);
      setErrMsg('Invalid point value');
      return;
    }
    if (findPointValue(answerTypesInUse, parsed)) {
      setError(true);
      setErrMsg('Already exists');
      return;
    }
    setError(false);
    setErrMsg('');
  };

  const closeWindow = (saveData: boolean) => {
    setNewPtVal('');
    setError(false);
    setErrMsg('');
    if (saveData) {
      handleAccept(parseInt(newPtVal, 10));
    } else {
      handleCancel();
    }
  };

  useHotkeys('alt+a', () => closeWindow(true), { enabled: canSave, enableOnFormTags: true });
  useHotkeys('alt+c', () => closeWindow(false), { enabled: isOpen, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} onClose={() => closeWindow(false)}>
      <DialogTitle>Add Point Value</DialogTitle>
      <Box sx={{ '& .MuiDialogContent-root': { paddingRight: 8 } }}>
        <DialogContent>
          <FormControl sx={{ width: '15ch' }} variant="outlined">
            <OutlinedInput
              type="number"
              size="small"
              autoFocus
              error={error}
              value={newPtVal}
              onChange={(e) => onPtValChange(e.target.value)}
              endAdornment={<InputAdornment position="end">pts</InputAdornment>}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) closeWindow(true);
              }}
            />
            <FormHelperText error>{error ? errMsg : ' '}</FormHelperText>
          </FormControl>
        </DialogContent>
      </Box>
      <DialogActions>
        <Button onClick={() => closeWindow(false)}>{hotkeyFormat('&Cancel')}</Button>
        <Button disabled={error || newPtVal === ''} onClick={() => closeWindow(true)}>
          {hotkeyFormat('&Accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Does the list of answer types contain an instance of the given point value? */
function findPointValue(answerTypes: AnswerType[], pointValue: number) {
  return answerTypes.find((aType) => {
    return aType.value === pointValue;
  });
}

function pointValIsInvalid(val: number) {
  if (Number.isNaN(val)) return true;
  if (val % 1) return true;
  return val > 1000 || val < -1000;
}

export default TossupSettingsCard;
