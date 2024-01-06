import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  OutlinedInput,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useContext, useState } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import AnswerType from '../DataModel/AnswerType';
import { sortAnswerTypes } from '../Utils/GeneralUtils';

const commonPointValues = [-5, 10, 15, 20];

function TossupSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [customPtValFormOpen, setCustomPtValFormOpen] = useState(false);
  const [activeAnswerTypes, setAnswerTypes] = useSubscription(thisTournament.scoringRules?.answerTypes);
  if (!activeAnswerTypes) return null;

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
    <YfCard title="Toss-Ups">
      <Typography variant="subtitle2">Point values</Typography>
      <ActivePointValueList answerTypes={activeAnswerTypes} deleteItem={deleteAnswerType} />
      <Typography variant="subtitle2">Add more point values</Typography>
      <Box sx={{ py: 1 }}>
        <AvailableStandardPtValuesList pointValues={pointValuesForChips} addPointValue={addAnswerType} />
        <Chip
          key="custom"
          sx={{ marginBottom: 1 }}
          label="Custom..."
          onDelete={() => setCustomPtValFormOpen(true)}
          deleteIcon={<Add />}
        />
      </Box>
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
}

function ActivePointValueList(props: IActivePointValueListProps) {
  const { answerTypes, deleteItem } = props;

  const positivePtValues = answerTypes.filter((aType) => {
    return aType.value > 0;
  });
  const cantDeletePositive = positivePtValues.length === 1;

  return (
    <List sx={{ width: '75%' }}>
      {answerTypes.map((answerType) => {
        const disableDelete = cantDeletePositive && answerType.value > 0;
        const tooltip = disableDelete ? 'You must have at least one positive point value' : 'Delete this point value';

        return (
          <ListItem
            key={answerType.value}
            sx={{ '&:hover': { backgroundColor: '#f0f0f0' } }}
            secondaryAction={
              <Tooltip title={tooltip} placement="right">
                <span>
                  <IconButton
                    sx={{ '&:hover': { backgroundColor: 'transparent' } }}
                    disabled={disableDelete}
                    onClick={() => deleteItem(answerType.value)}
                  >
                    <Delete />
                  </IconButton>
                </span>
              </Tooltip>
            }
          >{`${answerType.value} pts`}</ListItem>
        );
      })}
    </List>
  );
}

interface IAvailableStandardPtValuesListProps {
  pointValues: number[];
  addPointValue: (pointValue: number) => void;
}

function AvailableStandardPtValuesList(props: IAvailableStandardPtValuesListProps) {
  const { pointValues, addPointValue } = props;

  return pointValues.map((value) => (
    <Chip
      key={value}
      sx={{ marginRight: 1, marginBottom: 1 }}
      label={`${value} pts`}
      onDelete={() => addPointValue(value)}
      deleteIcon={<Add />}
    />
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

  return (
    <Dialog open={isOpen} onClose={() => closeWindow(false)}>
      <DialogTitle>Add Point Value</DialogTitle>
      <Box sx={{ '& .MuiDialogContent-root': { paddingRight: 8 } }}>
        <DialogContent>
          <FormControl sx={{ width: '15ch' }} variant="outlined">
            <OutlinedInput
              type="number"
              size="small"
              error={error}
              value={newPtVal}
              onChange={(e) => onPtValChange(e.target.value)}
              endAdornment={<InputAdornment position="end">pts</InputAdornment>}
            />
            <FormHelperText error>{error ? errMsg : ' '}</FormHelperText>
          </FormControl>
        </DialogContent>
      </Box>
      <DialogActions>
        <Button onClick={() => closeWindow(false)}>Cancel</Button>
        <Button disabled={error || newPtVal === ''} onClick={() => closeWindow(true)}>
          Accept
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
