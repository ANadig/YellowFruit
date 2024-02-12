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
  FormHelperText,
  FormControl,
  ButtonGroup,
  Popper,
  Paper,
  ClickAwayListener,
  MenuItem,
  MenuList,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ArrowDropDown } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { TeamEditModalContext } from '../Modal Managers/TempTeamManager';
import { Team } from '../DataModel/Team';
import { ValidationStatuses } from '../DataModel/Interfaces';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';

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

  const [teamNameValidationStatus] = useSubscription(tempTeamToEdit.nameValidation.status);
  const [teamNameValidationMsg] = useSubscription(tempTeamToEdit.nameValidation.message);
  const warningExists = teamNameValidationStatus !== ValidationStatuses.Ok;

  const autoFocusFirstPlayer = regName !== '' && teamLetter !== '' && numPlayers === 1;

  const handleAccept = () => {
    tournManager.teamEditModalAttemptToSave();
  };

  const handleAcceptAndStay = () => {
    tournManager.teamEditModalAttemptToSave(true);
  };

  const handleAcceptAndNextLetter = () => {
    tournManager.teamEditModalAttemptToSave(true, true);
  };

  const handleCancel = () => {
    tournManager.teamEditModalReset();
  };

  const handleRegNameblur = () => {
    modalManager.changeTeamName(regName);
    tournManager.onTeamRegistrationNameUpdate();
  };

  const handleLetterBlur = () => {
    modalManager.changeTeamLetter(teamLetter);
    tournManager.onTeamLetterUpdate();
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

  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+s', () => handleAcceptAndStay(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+t', () => handleAcceptAndNextLetter(), { enabled: isOpen, enableOnFormTags: true });

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={isOpen} onClose={handleCancel}>
        <DialogTitle>{teamBeingModified === null ? 'New Team' : `Edit ${teamBeingModified.name}`}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              height: 375,
              '& .MuiGrid2-root': { display: 'flex', alignItems: 'end' },
              '& .MuiFormHelperText-root': { whiteSpace: 'nowrap' },
            }}
          >
            <Grid container spacing={1}>
              <Grid xs={9} sm={6}>
                <TextField
                  sx={{ marginTop: 1 }}
                  label="School / Organization"
                  fullWidth
                  autoFocus={!autoFocusFirstPlayer}
                  variant="outlined"
                  size="small"
                  error={teamNameValidationStatus === ValidationStatuses.Error}
                  helperText={warningExists ? teamNameValidationMsg : ' '}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  onBlur={handleRegNameblur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRegNameblur();
                  }}
                />
              </Grid>
              <Grid xs={3} sm={2}>
                <TextField
                  sx={{ marginTop: 1, width: '10ch' }}
                  placeholder="A, B, etc."
                  variant="outlined"
                  size="small"
                  error={teamLetter !== '' && teamNameValidationStatus === ValidationStatuses.Error}
                  helperText={' '}
                  value={teamLetter}
                  onChange={(e) => setTeamLetter(e.target.value)}
                  onBlur={handleLetterBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLetterBlur();
                  }}
                />
              </Grid>
              <Grid xs={2} md={1} sx={{ display: 'flex', alignItems: 'end' }}>
                <TeamFormCheckBox
                  label="SS"
                  extraSpace
                  control={<Checkbox checked={teamIsSS} onChange={(e) => handleSsChange(e.target.checked)} />}
                />
              </Grid>
              <Grid xs={2} md={1}>
                <TeamFormCheckBox
                  label="JV"
                  extraSpace
                  control={<Checkbox checked={teamIsJV} onChange={(e) => handleJvChange(e.target.checked)} />}
                />
              </Grid>
              <Grid xs={2} md={1}>
                <TeamFormCheckBox
                  label="UG"
                  extraSpace
                  control={<Checkbox checked={teamIsUG} onChange={(e) => handleUgChange(e.target.checked)} />}
                />
              </Grid>
              <Grid xs={2} md={1}>
                <TeamFormCheckBox
                  label="D2"
                  extraSpace
                  control={<Checkbox checked={teamIsD2} onChange={(e) => handleD2Change(e.target.checked)} />}
                />
              </Grid>
            </Grid>

            <Divider textAlign="left" sx={{ my: 2, '&:before': { width: '0%' } }}>
              <Typography variant="subtitle1">Players</Typography>
            </Divider>
            <PlayersGrid numRows={numPlayers} autoFocusFirstPlayer={autoFocusFirstPlayer} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCancel}>
            {hotkeyFormat('&Cancel')}
          </Button>
          <SaveAndNewButtons
            onClickSaveAndNew={handleAcceptAndStay}
            onClickSaveAndNextLetter={handleAcceptAndNextLetter}
          />
          <Button variant="outlined" onClick={handleAccept}>
            {hotkeyFormat('&Accept')}
          </Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog />
    </>
  );
}

interface ISaveAndNewButtonsProps {
  onClickSaveAndNew: () => void;
  onClickSaveAndNextLetter: () => void;
}

function SaveAndNewButtons(props: ISaveAndNewButtonsProps) {
  const { onClickSaveAndNew, onClickSaveAndNextLetter } = props;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setDropdownOpen(false);
  };

  return (
    <>
      <ButtonGroup ref={anchorRef}>
        <Button onClick={onClickSaveAndNew}>{hotkeyFormat('&Save {AMP} New')}</Button>
        <Button size="small" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Popper open={dropdownOpen} anchorEl={anchorRef.current} disablePortal>
        <Paper>
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList id="split-button-menu" autoFocusItem>
              <MenuItem selected={dropdownOpen} onClick={() => onClickSaveAndNextLetter()}>
                {hotkeyFormat('Save {AMP} Next &Team for This Organization')}
              </MenuItem>
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
}

interface IPlayersGridProps {
  numRows: number;
  autoFocusFirstPlayer: boolean;
}

function PlayersGrid(props: IPlayersGridProps) {
  const { numRows, autoFocusFirstPlayer } = props;
  const rows: React.JSX.Element[] = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(<PlayerGridRow key={i} rowIdx={i} autoFocus={autoFocusFirstPlayer && i === 0} />);
  }
  return rows;
}

interface IPlayerGridRowProps {
  rowIdx: number;
  autoFocus: boolean;
}

function PlayerGridRow(props: IPlayerGridRowProps) {
  const { rowIdx, autoFocus } = props;
  const modalManager = useContext(TeamEditModalContext);
  const player = modalManager.tempTeam.players[rowIdx];

  const [playerName, setPlayerName] = useSubscription(player?.name || '');
  const [playerYear, setPlayerYear] = useSubscription(player?.yearString || '');
  const [playerIsUG, setPlayerIsUG] = useSubscription(player?.isUG || false);
  const [playerIsD2, setPlayerIsD2] = useSubscription(player?.isD2 || false);

  const [nameValidationStatus] = useSubscription(player?.nameValidation.status);
  const [nameValidationMsg] = useSubscription(player?.nameValidation.message);
  const [yearValidationStatus] = useSubscription(player?.yearStringValidation.status);
  const [yearValidationMsg] = useSubscription(player?.yearStringValidation.message);
  const warningExists =
    yearValidationStatus !== ValidationStatuses.Ok || nameValidationStatus !== ValidationStatuses.Ok;

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
          autoFocus={autoFocus}
          variant="outlined"
          size="small"
          error={nameValidationStatus === ValidationStatuses.Error}
          helperText={getHelperText(nameValidationMsg, warningExists)}
          value={playerName}
          onChange={(e) => handlePlayerNameChange(e.target.value)}
          onBlur={() => modalManager.changePlayerName(rowIdx, playerName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') modalManager.changePlayerName(rowIdx, playerName);
          }}
        />
      </Grid>
      <Grid xs={2}>
        <TextField
          placeholder="Grade / Yr."
          fullWidth
          variant="outlined"
          size="small"
          error={yearValidationStatus === ValidationStatuses.Error}
          helperText={getHelperText(yearValidationMsg, warningExists)}
          value={playerYear}
          onChange={(e) => setPlayerYear(e.target.value)}
          onBlur={() => modalManager.changePlayerYear(rowIdx, playerYear)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') modalManager.changePlayerYear(rowIdx, playerYear);
          }}
        />
      </Grid>
      <Grid xs={2} md={1}>
        <TeamFormCheckBox
          label="UG"
          extraSpace={warningExists}
          control={<Checkbox checked={playerIsUG} onChange={(e) => handleUgChange(e.target.checked)} />}
        />
      </Grid>
      <Grid xs={2} md={1}>
        <TeamFormCheckBox
          label="D2"
          extraSpace={warningExists}
          control={<Checkbox checked={playerIsD2} onChange={(e) => handleD2Change(e.target.checked)} />}
        />
      </Grid>
    </Grid>
  );
}

interface ITeamFormCheckBoxProps {
  label: string;
  control: ReactElement<any, any>;
  extraSpace: boolean;
}

/** Checkbox wrapper that stays aligned with text fields when they have warnings under them */
function TeamFormCheckBox(props: ITeamFormCheckBoxProps) {
  const { label, control, extraSpace } = props;

  return (
    <FormControl>
      <FormGroup>
        <FormControlLabel label={label} control={control} />
      </FormGroup>
      <FormHelperText>{getHelperText('', extraSpace)}</FormHelperText>
    </FormControl>
  );
}

function getHelperText(warning: string, extraSpace: boolean) {
  if (warning !== '') return warning;
  if (extraSpace) return ' ';
  return '';
}

function ErrorDialog() {
  const modalManager = useContext(TeamEditModalContext);
  const [isOpen] = useSubscription(modalManager.errorDialogIsOpen);
  const [contents] = useSubscription(modalManager.errorDialogContents);

  const handleClose = () => {
    modalManager.closeErrorDialog();
  };

  useHotkeys('alt+g', () => handleClose(), { enabled: isOpen });

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
        <Button onClick={handleClose}>{hotkeyFormat('&Go Back')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TeamEditDialog;
