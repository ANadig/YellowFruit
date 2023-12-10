import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useContext } from 'react';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';

function QuestionSetCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [name] = useSubscription<string>(thisTournament.name, '');

  return (
    <YfCard title="Question Set">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField label="Question Set" fullWidth variant="outlined" size="small" />
      </Box>
      Name: {name}
    </YfCard>
  );
}

export default QuestionSetCard;
