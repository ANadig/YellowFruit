import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React, { useContext, useEffect, useState } from 'react';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { MAX_PLAYERS_PER_TEAM } from '../Utils/GeneralUtils';

function TeamEditDialog() {
  const tournManager = useContext(TournamentContext);

  const [isOpen] = useSubscription(tournManager.teamEditModalOpen);
  const [teamBeingModified] = useSubscription(tournManager.teamBeingModified);
  const tempTeamToEdit = tournManager.teamModalManager.tempTeam;
  const tempRegToEdit = tournManager.teamModalManager.tempRegistration;

  const [regName, setRegName] = useState(tempRegToEdit.name);
  useEffect(() => setRegName(tempRegToEdit.name), [tempRegToEdit.name, tempTeamToEdit.name]); // can't use useSubscription due to the extra dependency
  const [teamLetter, setTeamLetter] = useSubscription(tempTeamToEdit.letter);
  const [teamIsSS, setTeamIsSS] = useSubscription(tempRegToEdit.isSmallSchool);
  const [teamIsJV, setTeamIsJV] = useSubscription(tempTeamToEdit.isJV);
  const [teamIsUG, setTeamIsUG] = useSubscription(tempTeamToEdit.isUG);
  const [teamIsD2, setTeamIsD2] = useSubscription(tempTeamToEdit.isD2);
  const [numPlayers] = useSubscription(tournManager.teamModalManager.tempTeam.players.length);

  const handleAccept = () => {
    tournManager.saveTeamModal();
  };

  const handleCancel = () => {
    tournManager.closeTeamEditModal();
  };

  const handleSsChange = (checked: boolean) => {
    setTeamIsSS(checked);
    tournManager.teamModalManager.changeSS(checked);
  };

  const handleJvChange = (checked: boolean) => {
    setTeamIsJV(checked);
    tournManager.teamModalManager.changeJV(checked);
  };

  const handleUgChange = (checked: boolean) => {
    setTeamIsUG(checked);
    tournManager.teamModalManager.changeUG(checked);
  };

  const handleD2Change = (checked: boolean) => {
    setTeamIsD2(checked);
    tournManager.teamModalManager.changeD2(checked);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={isOpen} onClose={handleCancel}>
      <DialogTitle>{teamBeingModified === null ? 'New Team' : `Edit ${teamBeingModified.name}`}</DialogTitle>
      <DialogContent>
        <Box sx={{ height: 375, '& .MuiGrid2-root': { display: 'flex', alignItems: 'end' } }}>
          <Grid container spacing={1}>
            <Grid xs={9} sm={6}>
              <TextField
                sx={{ marginTop: 1 }}
                label="School / Organization"
                fullWidth
                autoFocus
                variant="outlined"
                size="small"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                onBlur={() => tournManager.teamModalManager.changeTeamName(regName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') tournManager.teamModalManager.changeTeamName(regName);
                }}
              />
            </Grid>
            <Grid xs={3} sm={2}>
              <TextField
                sx={{ marginTop: 1, width: '10ch' }}
                placeholder="A, B, etc."
                variant="outlined"
                size="small"
                value={teamLetter}
                onChange={(e) => setTeamLetter(e.target.value)}
                onBlur={() => tournManager.teamModalManager.changeTeamLetter(teamLetter)}
              />
            </Grid>
            <Grid xs={2} md={1} sx={{ display: 'flex', alignItems: 'end' }}>
              <FormGroup>
                <FormControlLabel
                  label="SS"
                  control={<Checkbox checked={teamIsSS} onChange={(e) => handleSsChange(e.target.checked)} />}
                />
              </FormGroup>
            </Grid>
            <Grid xs={2} md={1}>
              <FormGroup>
                <FormControlLabel
                  label="JV"
                  control={<Checkbox checked={teamIsJV} onChange={(e) => handleJvChange(e.target.checked)} />}
                />
              </FormGroup>
            </Grid>
            <Grid xs={2} md={1}>
              <FormGroup>
                <FormControlLabel
                  label="UG"
                  control={<Checkbox checked={teamIsUG} onChange={(e) => handleUgChange(e.target.checked)} />}
                />
              </FormGroup>
            </Grid>
            <Grid xs={2} md={1}>
              <FormGroup>
                <FormControlLabel
                  label="D2"
                  control={<Checkbox checked={teamIsD2} onChange={(e) => handleD2Change(e.target.checked)} />}
                />
              </FormGroup>
            </Grid>
          </Grid>

          <Divider textAlign="left" sx={{ my: 2, '&:before': { width: '0%' } }}>
            <Typography variant="subtitle1">Players</Typography>
          </Divider>
          <PlayersGrid numRows={numPlayers} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleAccept}>Accept</Button>
      </DialogActions>
    </Dialog>
  );
}

interface IPlayersGridProps {
  numRows: number;
}

function PlayersGrid(props: IPlayersGridProps) {
  const { numRows } = props;
  const rows: React.JSX.Element[] = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(<PlayerGridRow key={i} rowIdx={i} />);
  }
  return rows;
}

interface IPlayerGridRowProps {
  rowIdx: number;
}

function PlayerGridRow(props: IPlayerGridRowProps) {
  const { rowIdx } = props;
  const tournManager = useContext(TournamentContext);
  const player = tournManager.teamModalManager.tempTeam.players[rowIdx];

  const [playerName, setPlayerName] = useSubscription(player?.name || '');
  const [playerYear, setPlayerYear] = useSubscription(player?.yearString || '');
  const [playerIsUG, setPlayerIsUG] = useSubscription(player?.isUG || false);
  const [playerIsD2, setPlayerIsD2] = useSubscription(player?.isD2 || false);

  const isLastRow = rowIdx === tournManager.teamModalManager.tempTeam.players.length - 1;

  const handlePlayerNameChange = (newName: string) => {
    if (isLastRow && playerName === '' && newName !== null && rowIdx < MAX_PLAYERS_PER_TEAM - 1) {
      tournManager.teamModalManager.addEmptyPlayer();
    }
    setPlayerName(newName);
  };

  const handleUgChange = (checked: boolean) => {
    setPlayerIsUG(checked);
    tournManager.teamModalManager.changePlayerUG(rowIdx, checked);
  };

  const handleD2Change = (checked: boolean) => {
    setPlayerIsD2(checked);
    tournManager.teamModalManager.changePlayerD2(rowIdx, checked);
  };

  return (
    <Grid container spacing={1}>
      <Grid xs={6}>
        <TextField
          placeholder="Player Name"
          fullWidth
          variant="outlined"
          size="small"
          value={playerName}
          onChange={(e) => handlePlayerNameChange(e.target.value)}
          onBlur={() => tournManager.teamModalManager.changePlayerName(rowIdx, playerName)}
        />
      </Grid>
      <Grid xs={2}>
        <TextField
          placeholder="Grade / Yr."
          fullWidth
          variant="outlined"
          size="small"
          value={playerYear}
          onChange={(e) => setPlayerYear(e.target.value)}
          onBlur={() => tournManager.teamModalManager.changePlayerYear(rowIdx, playerYear)}
        />
      </Grid>
      <Grid xs={2} md={1}>
        <FormGroup>
          <FormControlLabel
            label="UG"
            control={<Checkbox checked={playerIsUG} onChange={(e) => handleUgChange(e.target.checked)} />}
          />
        </FormGroup>
      </Grid>
      <Grid xs={2} md={1}>
        <FormGroup>
          <FormControlLabel
            label="D2"
            control={<Checkbox checked={playerIsD2} onChange={(e) => handleD2Change(e.target.checked)} />}
          />
        </FormGroup>
      </Grid>
    </Grid>
  );
}

export default TeamEditDialog;
