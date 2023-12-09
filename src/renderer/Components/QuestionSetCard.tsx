import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import YfCard from './YfCard';

function QuestionSetCard() {
  return (
    <YfCard title="Question Set">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField label="Question Set" fullWidth variant="outlined" size="small" />
      </Box>
    </YfCard>
  );
}

export default QuestionSetCard;
