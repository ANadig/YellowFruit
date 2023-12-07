import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

function GeneralInfoCard() {
  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          General
        </Typography>
        <Box sx={{ '& .MuiTextField-root': { my: 1 } }}>
          <TextField label="Tournament Name" fullWidth variant="outlined" size="small" />
          <TextField label="Tournament Location" fullWidth variant="outlined" size="small" />
        </Box>
        <Typography variant="body2">Lorem ipsum dolor sit amet,</Typography>
      </CardContent>
    </Card>
  );
}

export default GeneralInfoCard;
