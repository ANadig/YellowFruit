import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import YfCard from './YfCard';

function GeneralInfoCard() {
  return (
    <YfCard title="General">
      <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
        <TextField label="Tournament Name" fullWidth variant="outlined" size="small" />
        <TextField label="Tournament Location" fullWidth variant="outlined" size="small" />
      </Box>
    </YfCard>
  );
}

export default GeneralInfoCard;
