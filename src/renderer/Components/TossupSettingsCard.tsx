import { Box, Chip, IconButton, List, ListItem, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';

const commonPointValues = [-5, 10, 15, 20];

function TossupSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const answerTypesInUse = thisTournament.scoringRules?.answerTypes;
  if (!answerTypesInUse) return null;

  const pointValuesForChips: number[] = [];
  for (const v of commonPointValues) {
    if (
      !answerTypesInUse.find((ansType) => {
        return v === ansType.value;
      })
    ) {
      pointValuesForChips.push(v);
    }
  }

  return (
    <YfCard title="Toss-Ups">
      <Typography variant="subtitle2">Point values</Typography>
      <List sx={{ width: '75%' }}>
        {thisTournament.scoringRules?.answerTypes.map((answerType) => (
          <ListItem
            key={answerType.value}
            sx={{ '&:hover': { backgroundColor: '#f0f0f0' } }}
            secondaryAction={
              <IconButton>
                <Delete />
              </IconButton>
            }
          >{`${answerType.value} pts`}</ListItem>
        ))}
      </List>
      <Typography variant="subtitle2">Add more point values</Typography>
      <Box sx={{ py: 1 }}>
        {pointValuesForChips.map((value) => (
          <Chip key={value} sx={{ marginRight: 1 }} label={`${value} pts`} onDelete={() => {}} deleteIcon={<Add />} />
        ))}
        <Chip key="custom" label="Custom..." onDelete={() => {}} deleteIcon={<Add />} />
      </Box>
    </YfCard>
  );
}

export default TossupSettingsCard;
