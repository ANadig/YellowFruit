import { useContext, useState, useEffect, useMemo, forwardRef, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
  Box,
  Alert,
  AlertColor,
  Autocomplete,
  FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { DragIndicator } from '@mui/icons-material';
import { MatchEditModalContext } from '../Modal Managers/TempMatchManager';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { YfCssClasses, hotkeyFormat } from '../Utils/GeneralReactUtils';
import { ValidationStatuses } from '../DataModel/Interfaces';
import { LeftOrRight } from '../Utils/UtilTypes';
import { MatchPlayer } from '../DataModel/MatchPlayer';
import { PlayerAnswerCount } from '../DataModel/PlayerAnswerCount';
import MatchValidationMessage from '../DataModel/MatchValidationMessage';
import { otherTeam } from '../DataModel/Match';

export default function MatchEditDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.matchModalManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <MatchEditModalContext.Provider value={mgr}>
      <MatchEditDialogCore />
    </MatchEditModalContext.Provider>
  );
}

function MatchEditDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(MatchEditModalContext);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const tuhTotFieldRef = useRef<HTMLElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const saveAndNewButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.matchEditModalAttemptToSave();
  };

  const handleAcceptAndStay = () => {
    saveAndNewButtonRef.current?.focus();
    tournManager.matchEditModalAttemptToSave(true);
    tuhTotFieldRef.current?.focus();
  };

  const handleCancel = () => {
    tournManager.matchEditModalReset();
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+s', () => handleAcceptAndStay(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen, enableOnFormTags: true });

  return (
    <>
      <Dialog fullWidth maxWidth="xl" open={isOpen} onClose={handleCancel}>
        <DialogTitle>Edit Game</DialogTitle>
        <DialogContent>
          <Box
            fontSize={14}
            sx={{
              minHeight: 475,
              '& .MuiFormHelperText-root': { whiteSpace: 'nowrap' },
            }}
          >
            <Grid container columnSpacing={1} sx={{ marginTop: 1 }}>
              <Grid xs={6} sm={2}>
                <RoundField />
              </Grid>
              <Grid xs={6} sm={3}>
                <MainPhaseField />
              </Grid>
              <Grid xs={6} sm={4}>
                <CarryoverPhaseSelect />
              </Grid>
              <Grid xs={1} />
              <Grid xs={5} sm={2}>
                <TuhTotalField ref={tuhTotFieldRef} />
              </Grid>
              {/** second row */}
              <Grid xs={9} md={3} lg={4}>
                <TeamSelect whichTeam="left" />
              </Grid>
              <Grid xs={3} md={2} lg={1}>
                <TeamScoreField whichTeam="left" />
              </Grid>
              <Grid md={1} sx={{ display: { xs: 'none', md: 'inherit' } }} />
              <Grid xs={9} md={3} lg={4}>
                <TeamSelect whichTeam="right" />
              </Grid>
              <Grid xs={3} md={2} lg={1}>
                <TeamScoreField whichTeam="right" />
              </Grid>
              {/** third row */}
              <Grid xs={12} md={6}>
                <PlayerGrid whichTeam="left" />
              </Grid>
              <Grid xs={12} md={6}>
                <PlayerGrid whichTeam="right" />
              </Grid>
              {/** fourth row */}
              <Grid xs={6} md={5}>
                <BonusDisplay whichTeam="left" />
              </Grid>
              <Grid xs={6} md={1}>
                <ForfeitControl whichTeam="left" />
              </Grid>
              <Grid xs={6} md={5}>
                <BonusDisplay whichTeam="right" />
              </Grid>
              <Grid xs={6} md={1}>
                <ForfeitControl whichTeam="right" />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', minHeight: '72px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '150px', overflowY: 'auto' }}>
            <ValidationSection />
          </Box>
          <Box sx={{ '& .MuiButton-root': { marginLeft: 1, whiteSpace: 'nowrap' } }}>
            <Button variant="outlined" onClick={handleCancel}>
              {hotkeyFormat('&Cancel')}
            </Button>
            <Button variant="outlined" onClick={handleAcceptAndStay} ref={saveAndNewButtonRef}>
              {hotkeyFormat('&Save {AMP} New')}
            </Button>
            <Button variant="outlined" onClick={handleAccept} ref={acceptButtonRef}>
              {hotkeyFormat('&Accept')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      <ErrorDialog />
    </>
  );
}

function RoundField() {
  const modalManager = useContext(MatchEditModalContext);
  const [roundNo, setRoundNo] = useSubscription(modalManager.round?.toString() || '');
  const [err] = useSubscription(modalManager.roundFieldError);

  const handleBlur = () => {
    const newRoundNo = modalManager.setRoundNo(roundNo);
    const valToUse = newRoundNo === undefined ? '' : newRoundNo.toString();
    setRoundNo(valToUse);
  };

  return (
    <TextField
      type="number"
      inputProps={{ min: 1 }}
      label="Round"
      fullWidth
      variant="outlined"
      size="small"
      error={!!err}
      helperText={err || ' '}
      value={roundNo}
      onChange={(e) => setRoundNo(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
}

function MainPhaseField() {
  const modalManager = useContext(MatchEditModalContext);
  const [phaseName] = useSubscription(modalManager.getMainPhaseName());

  return (
    <TextField
      label="Phase"
      fullWidth
      variant="outlined"
      size="small"
      inputProps={{ readOnly: true }}
      helperText={' '}
      value={phaseName}
    />
  );
}

function CarryoverPhaseSelect() {
  const modalManager = useContext(MatchEditModalContext);
  const [coPhases, setCoPhases] = useSubscription(modalManager.tempMatch.carryoverPhases.map((ph) => ph.name));
  const [availablePhases] = useSubscription(modalManager.getAvailableCarryOverPhases());

  const handleChange = (val: string[] | string) => {
    const phaseNames = typeof val === 'string' ? val.split(',') : val;
    setCoPhases(phaseNames);
    modalManager.setCarryoverPhases(phaseNames);
  };

  return (
    <FormControl sx={{ minWidth: 200 }} size="small">
      <InputLabel>Carryover Phases</InputLabel>
      <Select
        label="Carryover Phases"
        multiple
        fullWidth
        value={coPhases}
        disabled={availablePhases.length === 0}
        onChange={(e) => handleChange(e.target.value)}
        renderValue={(selected) => selected.join(', ')}
      >
        {availablePhases.map((ph) => (
          <MenuItem key={ph.name} value={ph.name}>
            <Checkbox checked={coPhases.indexOf(ph.name) > -1} />
            <ListItemText primary={ph.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const TuhTotalField = forwardRef((props: {}, ref) => {
  const modalManager = useContext(MatchEditModalContext);
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const thisMatch = modalManager.tempMatch;
  const [tuh, setTuh] = useSubscription(thisMatch.tossupsRead?.toString() || '');
  const [valStatus] = useSubscription(thisMatch.totalTuhFieldValidation.status);
  const [valMsg] = useSubscription(thisMatch.totalTuhFieldValidation.message);
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());

  const handleBlur = () => {
    const valToUse = modalManager.setTotalTuh(tuh);
    setTuh(valToUse?.toString() || '');
  };

  return (
    <TextField
      inputRef={ref}
      type="number"
      inputProps={{ min: 1 }}
      label="TU Heard (incl. OT)"
      fullWidth
      variant="outlined"
      size="small"
      autoFocus={thisTournament.scoringRules.timed}
      disabled={forfeit}
      error={valStatus === ValidationStatuses.Error}
      helperText={valMsg || ' '}
      value={tuh}
      onChange={(e) => setTuh(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
});

interface ITeamSelectProps {
  whichTeam: LeftOrRight;
}

const teamSelectNullOption = '';

function TeamSelect(props: ITeamSelectProps) {
  const { whichTeam } = props;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const modalManager = useContext(MatchEditModalContext);
  const [team, setTeam] = useSubscription(modalManager.getSelectedTeam(whichTeam)?.name || teamSelectNullOption);
  const [inputValue, setInputValue] = useState('');

  const handleChange = (val: string) => {
    setTeam(val);
    modalManager.teamSelectChangeTeam(whichTeam, val);
  };

  const isOptionEqualToValue = (option: string, value: string) => {
    if (value === option) return true;
    return value === '' && option === teamSelectNullOption;
  };

  const allTeamNames = useMemo(
    () => thisTournament.getListOfAllTeams().map((tm) => tm.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thisTournament, modalManager.modalIsOpen],
  );

  const options = [teamSelectNullOption].concat(allTeamNames);

  return (
    <Autocomplete
      autoHighlight
      clearOnEscape
      autoSelect
      value={team}
      onChange={(event: any, newValue: string | null) => {
        handleChange(newValue || '');
      }}
      inputValue={inputValue}
      onInputChange={(event, newVal) => setInputValue(newVal)}
      options={options}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...params} size="small" autoFocus={whichTeam === 'left' && !thisTournament.scoringRules.timed} />
      )}
    />
  );
}

interface ITeamScoreProps {
  whichTeam: LeftOrRight;
}

function TeamScoreField(props: ITeamScoreProps) {
  const { whichTeam } = props;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const modalManager = useContext(MatchEditModalContext);
  const [pts, setPts] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam).points?.toString() || '');
  const [valStatus] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam).totalScoreFieldValidation.status);
  const [valMsg] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam).totalScoreFieldValidation.message);
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const divisor = useMemo(() => thisTournament.scoringRules.totalDivisor, [modalManager.modalIsOpen]);

  const handleBlur = () => {
    const valToUse = modalManager.setTeamScore(whichTeam, pts);
    setPts(valToUse?.toString() || '');
  };

  return (
    <TextField
      type="number"
      inputProps={{ step: divisor }}
      label="Score"
      fullWidth
      variant="outlined"
      size="small"
      disabled={forfeit}
      error={valStatus === ValidationStatuses.Error}
      helperText={valMsg || ' '}
      value={pts}
      onChange={(e) => setPts(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
}

interface IPlayerGridProps {
  whichTeam: LeftOrRight;
}

function PlayerGrid(props: IPlayerGridProps) {
  const { whichTeam } = props;
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const [thisTeamForfeit] = useSubscription(matchTeam.forfeitLoss);
  const [otherTeamForfeit] = useSubscription(modalManager.tempMatch.getMatchTeam(otherTeam(whichTeam)).forfeitLoss);

  if (thisTeamForfeit || otherTeamForfeit) {
    let text = 'Forfeit';
    if (thisTeamForfeit && !otherTeamForfeit) text = 'Loses by forfeit';
    else if (!thisTeamForfeit && otherTeamForfeit) text = 'Wins by forfeit';
    return <ForfeitBox text={text} />;
  }

  return (
    <Box sx={{ '& .MuiGrid2-container': { my: 2 } }}>
      <Grid container columns={48} columnSpacing={1}>
        <Grid xs />
        <Grid xs={7}>
          <b>TUH</b>
        </Grid>
        {thisTournament.scoringRules.answerTypes.map((at) => (
          <Grid key={at.value} xs={7}>
            <b>{at.shortLabel}</b>
          </Grid>
        ))}
        <Grid xs={7}>
          <b>Pts</b>
        </Grid>
      </Grid>
      {matchTeam.matchPlayers.map((mp) => (
        <Grid
          key={mp.player.name}
          container
          columns={48}
          columnSpacing={1}
          sx={{ '& .MuiInputBase-input': { paddingLeft: 0.5, paddingRight: 0 } }}
        >
          <PlayerRow matchPlayer={mp} whichTeam={whichTeam} />
        </Grid>
      ))}
      {!matchTeam.team && <Box sx={{ py: 13 }} />}
    </Box>
  );
}

interface IForfeitBoxProps {
  text: string;
}

function ForfeitBox(props: IForfeitBoxProps) {
  const { text } = props;

  return (
    <Grid container>
      <Grid xs />
      <Grid xs="auto">
        <Box sx={{ py: 13 }}>{text}</Box>
      </Grid>
      <Grid xs />
    </Grid>
  );
}

const playerRowDragKey = 'MatchPlayerRow';

interface IPlayerRowProps {
  matchPlayer: MatchPlayer;
  whichTeam: LeftOrRight;
}

function PlayerRow(props: IPlayerRowProps) {
  const { matchPlayer, whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [playerName] = useSubscription(matchPlayer?.player.name);
  const [tuh, setTuh] = useSubscription(matchPlayer?.tossupsHeard?.toString() || '');
  const [tuhError] = useSubscription(matchPlayer.tuhValidation.status === ValidationStatuses.Error);
  const [pts] = useSubscription(matchPlayer?.points);
  const [answerCounts] = useSubscription(matchPlayer?.answerCounts);

  if (!matchPlayer) return null;

  const handleTuhBlur = () => {
    const valToUse = modalManager.setPlayerTuh(matchPlayer, tuh);
    setTuh(valToUse?.toString() || '');
  };

  const dragKey = `${playerRowDragKey}-${whichTeam}`;

  return (
    <>
      <Grid
        xs
        draggable
        onDragStart={(e) => e.dataTransfer.setData(dragKey, playerName)}
        onDragEnter={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          modalManager.reorderMatchPlayers(whichTeam, e.dataTransfer.getData(dragKey), matchPlayer);
        }}
        onDragLeave={(e) => e.preventDefault()}
      >
        <DragIndicator
          className={YfCssClasses.Draggable}
          fontSize="small"
          color="action"
          sx={{ verticalAlign: 'text-bottom' }}
        />
        {playerName}
      </Grid>
      <Grid xs={7}>
        <TextField
          type="number"
          inputProps={{ min: 0 }}
          fullWidth
          variant="standard"
          size="small"
          hiddenLabel
          error={tuhError}
          value={tuh}
          onChange={(e) => setTuh(e.target.value)}
          onBlur={handleTuhBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTuhBlur();
          }}
        />
      </Grid>
      {answerCounts.map((ac) => (
        <PlayerAnswerCountField key={ac.answerType.value} answerCount={ac} />
      ))}
      <Grid xs={7}>
        {/** Don't use the MUI disabled property, which makes the text gray and hard to read */}
        <TextField fullWidth variant="standard" size="small" hiddenLabel inputProps={{ disabled: true }} value={pts} />
      </Grid>
    </>
  );
}

interface IPlayerAnswerCountFieldProps {
  answerCount: PlayerAnswerCount;
}

function PlayerAnswerCountField(props: IPlayerAnswerCountFieldProps) {
  const { answerCount } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [count, setCount] = useSubscription(answerCount.number?.toString() || '');
  const [invalid] = useSubscription(answerCount.validation.status === ValidationStatuses.Error);

  const handleBlur = () => {
    const valToUse = modalManager.setPlayerAnswerCount(answerCount, count);
    setCount(valToUse?.toString() || '');
  };

  return (
    <Grid xs={7}>
      <TextField
        type="number"
        inputProps={{ min: 0 }}
        fullWidth
        variant="standard"
        size="small"
        hiddenLabel
        error={invalid}
        value={count}
        onChange={(e) => setCount(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
        }}
      />
    </Grid>
  );
}

interface IBonusDisplayProps {
  whichTeam: LeftOrRight;
}

function BonusDisplay(props: IBonusDisplayProps) {
  const { whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const [bonusPoints, bonusesHeard, ppb] = matchTeam.getBonusStats();
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());

  if (matchTeam.team === undefined || forfeit) {
    return <span>&emsp;&nbsp;Bonuses:&emsp;&mdash; points&emsp;|&emsp;&mdash; heard&emsp;|&emsp;&mdash; ppb</span>;
  }

  return (
    <span>
      &emsp;&nbsp;Bonuses:&emsp;{`${bonusPoints} points`}&emsp;|&emsp;{`${bonusesHeard} heard`}&emsp;|&emsp;
      {`${ppb} ppb`}
    </span>
  );
}

interface IForfeitControlProps {
  whichTeam: LeftOrRight;
}

function ForfeitControl(props: IForfeitControlProps) {
  const { whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const [isForfeit, setIsForfeit] = useSubscription(matchTeam.forfeitLoss);

  const handleChange = (checked: boolean) => {
    setIsForfeit(checked);
    modalManager.setForfeit(whichTeam, checked);
  };

  if (!matchTeam.team) return null;

  return (
    <Box sx={{ '& .MuiTypography-root': { fontSize: '14px' }, '& .MuiCheckbox-root': { py: 0 } }}>
      <FormControlLabel
        label="Forfeit"
        control={<Checkbox size="small" checked={isForfeit} onChange={(e) => handleChange(e.target.checked)} />}
      />
    </Box>
  );
}

function ValidationSection() {
  const modalManager = useContext(MatchEditModalContext);
  const thisMatch = modalManager.tempMatch;
  const [validators] = useSubscription(thisMatch.modalBottomValidation.validators);
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());

  const leftTeamValidators = thisMatch.leftTeam.allValidators.filter((v) => v.status !== ValidationStatuses.Ok);
  const rightTeamValidators = thisMatch.rightTeam.allValidators.filter((v) => v.status !== ValidationStatuses.Ok);

  return (
    <>
      {validators.map((v) => (
        <ValidationMessage key={v.type} validator={v} />
      ))}
      {!forfeit && leftTeamValidators.map((v) => <ValidationMessage key={v.message} validator={v} />)}
      {!forfeit && rightTeamValidators.map((v) => <ValidationMessage key={v.message} validator={v} />)}
    </>
  );
}

interface IValidationMessageProps {
  validator: MatchValidationMessage;
}

function ValidationMessage(props: IValidationMessageProps) {
  const { validator } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [type] = useSubscription(validator?.type);
  const [status] = useSubscription(validator?.status);
  const [message] = useSubscription(validator?.message);
  const [suppressable] = useSubscription(validator?.suppressable);
  const [isSuppressed] = useSubscription(validator?.isSuppressed);

  if (!validator) return null;
  if (status === ValidationStatuses.Ok) return null;
  if (isSuppressed || status === ValidationStatuses.HiddenError) return null;

  const suppressSelf = () => {
    if (type === undefined) return;
    modalManager.suppressValidationMessage(type);
  };

  return (
    <Alert
      sx={{ my: 0.5 }}
      variant="filled"
      severity={getMuiSeverity(status)}
      action={
        suppressable && (
          <Button color="inherit" size="small" onClick={suppressSelf}>
            Ignore
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}

function getMuiSeverity(status: ValidationStatuses): AlertColor | undefined {
  switch (status) {
    case ValidationStatuses.Error:
      return 'error';
    case ValidationStatuses.Warning:
      return 'warning';
    case ValidationStatuses.Info:
      return 'info';
    default:
      return undefined;
  }
}

function ErrorDialog() {
  const modalManager = useContext(MatchEditModalContext);
  const [isOpen] = useSubscription(modalManager.errorDialogIsOpen);
  const [contents] = useSubscription(modalManager.errorDialogContents);

  const handleClose = () => {
    modalManager.closeErrorDialog();
  };

  useHotkeys('alt+g', () => handleClose(), { enabled: isOpen });

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Unable to save match</DialogTitle>
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
