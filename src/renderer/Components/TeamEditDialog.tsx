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
  List,
  ListItem,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React, { useContext, useEffect, useState } from 'react';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { TeamEditModalContext } from '../Modal Managers/TempTeamManager';
import { Team } from '../DataModel/Team';

function TeamEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.teamModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <TeamEditModalContext.Provider value={mgr}>
      <TeamEditDialogCore />
    </TeamEditModalContext.Provider>
  );
}

function TeamEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(TeamEditModalContext);

  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [teamBeingModified] = useSubscription(tournManager.teamBeingModified);
  const tempTeamToEdit = modalManager.tempTeam;
  const tempRegToEdit = modalManager.tempRegistration;

  const [regName, setRegName] = useState(tempRegToEdit.name);
  useEffect(() => setRegName(tempRegToEdit.name), [tempRegToEdit.name, tempTeamToEdit.name]); // can't use useSubscription due to the unusual dependency
  const [teamLetter, setTeamLetter] = useSubscription(tempTeamToEdit.letter);
  const [teamIsSS, setTeamIsSS] = useSubscription(tempRegToEdit.isSmallSchool);
  const [teamIsJV, setTeamIsJV] = useSubscription(tempTeamToEdit.isJV);
  const [teamIsUG, setTeamIsUG] = useSubscription(tempTeamToEdit.isUG);
  const [teamIsD2, setTeamIsD2] = useSubscription(tempTeamToEdit.isD2);
  const [numPlayers] = useSubscription(modalManager.tempTeam.players.length);

  const handleAccept = () => {
    tournManager.teamEditModalAttemptToSave();
  };

  const handleCancel = () => {
    tournManager.teamEditModalClose();
  };

  const handleSsChange = (checked: boolean) => {
    setTeamIsSS(checked);
    modalManager.changeSS(checked);
  };

  const handleJvChange = (checked: boolean) => {
    setTeamIsJV(checked);
    modalManager.changeJV(checked);
  };

  const handleUgChange = (checked: boolean) => {
    setTeamIsUG(checked);
    modalManager.changeUG(checked);
  };

  const handleD2Change = (checked: boolean) => {
    setTeamIsD2(checked);
    modalManager.changeD2(checked);
  };

  return (
    <>
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
                  onBlur={() => modalManager.changeTeamName(regName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') modalManager.changeTeamName(regName);
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
                  onBlur={() => modalManager.changeTeamLetter(teamLetter)}
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
      <ErrorDialog />
    </>
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
  const modalManager = useContext(TeamEditModalContext);
  const player = modalManager.tempTeam.players[rowIdx];

  const [playerName, setPlayerName] = useSubscription(player?.name || '');
  const [playerYear, setPlayerYear] = useSubscription(player?.yearString || '');
  const [playerIsUG, setPlayerIsUG] = useSubscription(player?.isUG || false);
  const [playerIsD2, setPlayerIsD2] = useSubscription(player?.isD2 || false);

  const isLastRow = rowIdx === modalManager.tempTeam.players.length - 1;

  const handlePlayerNameChange = (newName: string) => {
    if (isLastRow && playerName === '' && newName !== null && rowIdx < Team.maxPlayers - 1) {
      modalManager.addEmptyPlayer();
    }
    setPlayerName(newName);
  };

  const handleUgChange = (checked: boolean) => {
    setPlayerIsUG(checked);
    modalManager.changePlayerUG(rowIdx, checked);
  };

  const handleD2Change = (checked: boolean) => {
    setPlayerIsD2(checked);
    modalManager.changePlayerD2(rowIdx, checked);
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
          onBlur={() => modalManager.changePlayerName(rowIdx, playerName)}
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
          onBlur={() => modalManager.changePlayerYear(rowIdx, playerYear)}
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

function ErrorDialog() {
  const modalManager = useContext(TeamEditModalContext);
  const [isOpen] = useSubscription(modalManager.errorDialogIsOpen);
  const [contents] = useSubscription(modalManager.errorDialogContents);

  const handleClose = () => {
    modalManager.closeErrorDialog();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Unable to save team</DialogTitle>
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
        <Button onClick={handleClose}>Go Back</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TeamEditDialog;
