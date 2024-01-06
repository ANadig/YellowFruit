import { Box, Chip, IconButton, List, ListItem, Tooltip, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import AnswerType from '../DataModel/AnswerType';
import { sortAnswerTypes } from '../Utils/GeneralUtils';

const commonPointValues = [-5, 10, 15, 20];

function TossupSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
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
    if (
      activeAnswerTypes.find((aType) => {
        return aType.value === pointValue;
      })
    ) {
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
        <Chip key="custom" sx={{ marginBottom: 1 }} label="Custom..." onDelete={() => {}} deleteIcon={<Add />} />
      </Box>
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

interface IAvailableStandardPtValuesList {
  pointValues: number[];
  addPointValue: (pointValue: number) => void;
}

function AvailableStandardPtValuesList(props: IAvailableStandardPtValuesList) {
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

export default TossupSettingsCard;
