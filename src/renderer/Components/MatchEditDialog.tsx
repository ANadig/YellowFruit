/* eslint-disable react/require-default-props */
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
  Paper,
  Card,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { DragIndicator, ExpandMore, Restore, VisibilityOff } from '@mui/icons-material';
import { MatchEditModalContext } from '../Modal Managers/TempMatchManager';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import {
  CollapsibleArea,
  ExpandButton,
  YfAcceptButton,
  YfCancelButton,
  YfCssClasses,
  YfNumericField,
  hotkeyFormat,
} from '../Utils/GeneralReactUtils';
import { ValidationStatuses } from '../DataModel/Interfaces';
import { LeftOrRight } from '../Utils/UtilTypes';
import { MatchPlayer } from '../DataModel/MatchPlayer';
import { PlayerAnswerCount } from '../DataModel/PlayerAnswerCount';
import MatchValidationMessage from '../DataModel/MatchValidationMessage';
import { otherTeam } from '../DataModel/Match';
import { trunc } from '../Utils/GeneralUtils';

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
              <Grid xs={12} md={6} sx={{ marginBottom: 3 }}>
                <Paper elevation={4} sx={{ p: 1, marginRight: 1 }}>
                  <PlayerGrid whichTeam="left" />
                </Paper>
              </Grid>
              <Grid xs={12} md={6} sx={{ marginBottom: 3 }}>
                <Paper elevation={4} sx={{ p: 1, marginLeft: 1 }}>
                  <PlayerGrid whichTeam="right" />
                </Paper>
              </Grid>
              {/** fourth row */}
              <Grid xs={6} md={5} sx={{ marginBottom: 3 }}>
                <BonusDisplay whichTeam="left" />
              </Grid>
              <Grid xs={6} md={1}>
                <ForfeitControl whichTeam="left" />
              </Grid>
              <Grid xs={6} md={5} sx={{ marginBottom: 3 }}>
                <BonusDisplay whichTeam="right" />
              </Grid>
              <Grid xs={6} md={1}>
                <ForfeitControl whichTeam="right" />
              </Grid>
              {/** fifth row */}
              <Grid xs={6}>
                <BounceBackRow whichTeam="left" />
              </Grid>
              <Grid xs={6}>
                <BounceBackRow whichTeam="right" />
              </Grid>
              {/** sixth row */}
              <Grid xs={6}>
                <LightningRow whichTeam="left" />
              </Grid>
              <Grid xs={6}>
                <LightningRow whichTeam="right" />
              </Grid>
              {/** seventh row */}
              <Grid xs={12} lg={6}>
                <OvertimeSection />
              </Grid>
              <Grid xs={12} lg={6}>
                <NotesCard />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', minHeight: '72px' }}>
          <Box>
            <SuppressedValInfo />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '150px',
              overflowY: 'auto',
              marginRight: 'auto',
            }}
          >
            <ValidationSection />
          </Box>
          <Box sx={{ '& .MuiButton-root': { marginLeft: 1, whiteSpace: 'nowrap' } }}>
            <YfCancelButton onClick={handleCancel} />
            <Button variant="outlined" onClick={handleAcceptAndStay} ref={saveAndNewButtonRef}>
              {hotkeyFormat('&Save {AMP} New')}
            </Button>
            <YfAcceptButton onClick={handleAccept} ref={acceptButtonRef} />
          </Box>
        </DialogActions>
      </Dialog>
      <ErrorDialog />
    </>
  );
}

function RoundField() {
  const modalManager = useContext(MatchEditModalContext);
  const [round] = useSubscription(modalManager.round);
  const [roundNo, setRoundNo] = useSubscription(modalManager.roundNumber?.toString() || '');
  const [err] = useSubscription(modalManager.roundFieldError);
  const [disabled] = useSubscription(!!round && !modalManager.phase?.usesNumericRounds());

  const handleBlur = () => {
    const newRoundNo = modalManager.setRoundNo(roundNo);
    const valToUse = newRoundNo === undefined ? '' : newRoundNo.toString();
    setRoundNo(valToUse);
  };

  return (
    <YfNumericField
      inputProps={{ min: 1 }}
      label="Round"
      fullWidth
      variant="outlined"
      size="small"
      autoFocus={roundNo === '' && !disabled}
      disabled={disabled}
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
  const [phaseName] = useSubscription(modalManager.phase?.name || '');

  return (
    <TextField
      label="Stage"
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
      <InputLabel>Carryover Stages</InputLabel>
      <Select
        label="Carryover Stages"
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
  const [roundExists] = useSubscription(!!modalManager.round);

  const handleBlur = () => {
    const valToUse = modalManager.setTotalTuh(tuh);
    setTuh(valToUse?.toString() || '');
  };

  return (
    <YfNumericField
      inputRef={ref}
      inputProps={{ min: 1 }}
      label="TU Read (incl. OT)"
      fullWidth
      variant="outlined"
      size="small"
      autoFocus={thisTournament.scoringRules.timed && roundExists}
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
  const [roundNo] = useSubscription(modalManager.roundNumber?.toString() || '');

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
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          size="small"
          autoFocus={
            whichTeam === 'left' &&
            !thisTournament.scoringRules.timed &&
            roundNo !== '' &&
            !modalManager.originalMatchLoaded
          }
        />
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
    <YfNumericField
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
  const numColumns = gridColumnsForAnswerCountField(thisTournament.scoringRules.answerTypes.length);

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
        <Grid xs={numColumns}>
          <b>TUH</b>
        </Grid>
        {thisTournament.scoringRules.answerTypes.map((at) => (
          <Grid key={at.value} xs={numColumns}>
            <b>{at.shortLabel}</b>
          </Grid>
        ))}
        <Grid xs={numColumns}>
          <b>Pts</b>
        </Grid>
      </Grid>
      {matchTeam.matchPlayers.map((mp, idx) => (
        <Grid
          key={mp.player.name}
          container
          columns={48}
          columnSpacing={1}
          sx={{ '& .MuiInputBase-input': { paddingLeft: 0.5, paddingRight: 0 } }}
        >
          <PlayerRow matchPlayer={mp} whichTeam={whichTeam} rowNumber={idx} />
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
  rowNumber: number;
}

function PlayerRow(props: IPlayerRowProps) {
  const { matchPlayer, whichTeam, rowNumber } = props;
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

  const numColumns = gridColumnsForAnswerCountField(answerCounts.length);
  const dragKey = `${playerRowDragKey}-${whichTeam}`;

  return (
    <>
      <Grid
        xs
        draggable
        onDragStart={(e) => e.dataTransfer.setData(dragKey, rowNumber.toString())}
        onDragEnter={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          modalManager.reorderMatchPlayers(whichTeam, e.dataTransfer.getData(dragKey), rowNumber);
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
      <Grid xs={numColumns}>
        <YfNumericField
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
        <PlayerAnswerCountField key={ac.answerType.value} answerCount={ac} xs={numColumns} />
      ))}
      <Grid xs={numColumns}>
        {/** Don't use the MUI disabled property, which makes the text gray and hard to read */}
        <TextField fullWidth variant="standard" size="small" hiddenLabel inputProps={{ disabled: true }} value={pts} />
      </Grid>
    </>
  );
}

function gridColumnsForAnswerCountField(numAnswerTypes: number) {
  if (numAnswerTypes <= 3) return 7;
  if (numAnswerTypes === 4) return 6;
  return 5;
}

interface IPlayerAnswerCountFieldProps {
  answerCount: PlayerAnswerCount;
  isOvertimeStats?: boolean;
  /** The xs attribute (# columns) for the grid element */
  xs: number;
  outlinedStyle?: boolean;
  disabled?: boolean;
}

function PlayerAnswerCountField(props: IPlayerAnswerCountFieldProps) {
  const { answerCount, xs, outlinedStyle, isOvertimeStats, disabled } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [count, setCount] = useSubscription(answerCount.number?.toString() || '');
  const [invalid] = useSubscription(answerCount.validation.status === ValidationStatuses.Error);

  const handleBlur = () => {
    const valToUse = modalManager.setAnswerCount(answerCount, count, isOvertimeStats);
    setCount(valToUse?.toString() || '');
  };

  return (
    <Grid xs={xs}>
      <YfNumericField
        inputProps={{ min: 0 }}
        fullWidth
        variant={outlinedStyle ? 'outlined' : 'standard'}
        size="small"
        hiddenLabel
        disabled={disabled}
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
  const [bonusPoints, bonusesHeard, ppb] = matchTeam.getBonusStats(modalManager.tournament.scoringRules);
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());

  if (!modalManager.tournament.scoringRules.useBonuses) return null;

  if (matchTeam.team === undefined || forfeit) {
    return <span>&emsp;&nbsp;Bonuses:&emsp;&mdash; pts&emsp;|&emsp;&mdash; heard&emsp;|&emsp;&mdash; ppb</span>;
  }

  return (
    <span>
      &emsp;&nbsp;<b>Bonuses:</b>&emsp;{`${bonusPoints} pts`}&emsp;|&emsp;{`${bonusesHeard} heard`}&emsp;|&emsp;
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

interface IBounceBackRowProps {
  whichTeam: LeftOrRight;
}

function BounceBackRow(props: IBounceBackRowProps) {
  const { whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const rules = modalManager.tournament.scoringRules;
  const [bbPts, setBbPts] = useSubscription(matchTeam.bonusBouncebackPoints?.toString() || '');
  const divisor = rules.bonusDivisor;
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());
  const [partsHrd, conversionPct] = modalManager.tempMatch.getBouncebackStatsString(whichTeam, rules);
  const [invalid] = useSubscription(matchTeam.bouncebackFieldValidation.isError());

  if (!modalManager.tournament.scoringRules.bonusesBounceBack || matchTeam === undefined || forfeit) return null;

  const handleBlur = () => {
    const valToUse = modalManager.setBouncebackPoints(whichTeam, bbPts);
    setBbPts(valToUse?.toString() || '');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        paddingBottom: 2,
        '& .MuiInputBase-input': { paddingLeft: 0.5, paddingRight: 0 },
      }}
    >
      <div>
        &emsp;&nbsp;<b>Bouncebacks:</b>&emsp;
      </div>
      <YfNumericField
        sx={{ width: '6ch' }}
        inputProps={{ min: 0, step: divisor }}
        fullWidth
        variant="standard"
        size="small"
        error={invalid}
        value={bbPts}
        onChange={(e) => setBbPts(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
        }}
      />
      <div>
        pts&emsp;|&emsp;{`${partsHrd} parts heard`}&emsp;|&emsp;{`${conversionPct}% success rate`}
      </div>
    </Box>
  );
}

interface ILightningRowProps {
  whichTeam: LeftOrRight;
}

function LightningRow(props: ILightningRowProps) {
  const { whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const rules = modalManager.tournament.scoringRules;
  const [ltngPts, setLtngPts] = useSubscription(matchTeam.lightningPoints?.toString() || '');
  const divisor = rules.lightningDivisor;
  const [forfeit] = useSubscription(modalManager.tempMatch.isForfeit());

  if (!modalManager.tournament.scoringRules.useLightningRounds() || matchTeam === undefined || forfeit) return null;

  const handleBlur = () => {
    const valToUse = modalManager.setLightningPoints(whichTeam, ltngPts);
    setLtngPts(valToUse?.toString() || '');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        paddingBottom: 2,
        '& .MuiInputBase-input': { paddingLeft: 0.5, paddingRight: 0 },
      }}
    >
      <div>&emsp;&nbsp;Lightning Round:&emsp;</div>
      <YfNumericField
        sx={{ width: '6ch' }}
        inputProps={{ min: 0, step: divisor }}
        fullWidth
        variant="standard"
        size="small"
        value={ltngPts}
        onChange={(e) => setLtngPts(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
        }}
      />
      <div>pts</div>
    </Box>
  );
}

function OvertimeSection() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(MatchEditModalContext);
  const [formExpanded, setFormExpanded] = useState(false);

  return (
    <Card variant="outlined" sx={{ p: 1 }}>
      <Box sx={{ cursor: 'pointer' }}>
        <Grid container onClick={() => setFormExpanded(!formExpanded)}>
          <Grid xs>
            <b>Overtime&emsp;</b>
            {!formExpanded && <span>{modalManager.tempMatch.getOvertimeSummary()}</span>}
          </Grid>
          <Grid xs="auto">
            <ExpandButton expand={formExpanded} sx={{ p: 0 }}>
              <ExpandMore />
            </ExpandButton>
          </Grid>
        </Grid>
      </Box>
      <Collapse in={formExpanded}>
        <Grid container columnSpacing={1} sx={{ marginTop: 1, paddingBottom: 1 }}>
          <Grid xs={3}>
            <OvertimeTuReadField />
          </Grid>
          <Grid xs={1} />
          <Grid xs={8}>
            <Grid container columns={9} columnSpacing={1}>
              <Grid xs md={4} lg />
              {tournManager.tournament.scoringRules.answerTypes.map((at) => (
                <Grid key={at.value} xs={1}>
                  &nbsp;&nbsp;<b>{at.shortLabel}</b>
                </Grid>
              ))}
            </Grid>
            <OvertimeBuzzesRow whichTeam="left" />
            <OvertimeBuzzesRow whichTeam="right" />
          </Grid>
        </Grid>
      </Collapse>
    </Card>
  );
}

function OvertimeTuReadField() {
  const modalManager = useContext(MatchEditModalContext);
  const [otTUH, setOtTUH] = useSubscription(modalManager.tempMatch.overtimeTossupsRead?.toString() || '');

  const handleChange = (val: string) => {
    setOtTUH(val);
    modalManager.enableOtFieldsOverride(val !== '' && parseInt(val, 10) !== 0);
  };

  const handleBlur = () => {
    const valToUse = modalManager.setOtTuhRead(otTUH);
    setOtTUH(valToUse?.toString() || '');
  };

  return (
    <YfNumericField
      sx={{ top: '30px' }}
      inputProps={{ min: 0 }}
      label="TU Read"
      fullWidth
      variant="outlined"
      size="small"
      value={otTUH}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
    />
  );
}

interface IOverTimeRowProps {
  whichTeam: LeftOrRight;
}

function OvertimeBuzzesRow(props: IOverTimeRowProps) {
  const { whichTeam } = props;
  const modalManager = useContext(MatchEditModalContext);
  const [matchTeam] = useSubscription(modalManager.tempMatch.getMatchTeam(whichTeam));
  const [otBuzzes] = useSubscription(matchTeam.overTimeBuzzes);
  const [overrideEnable] = useSubscription(modalManager.otFieldsEnabledOverride);
  const disabled = !overrideEnable;

  return (
    <Grid container columns={9} columnSpacing={1}>
      <Grid xs md={4} lg>
        <span style={{ verticalAlign: 'sub' }}>{matchTeam.team?.getTruncatedName(30) || <span>&nbsp;</span>}</span>
      </Grid>
      {otBuzzes.map((ac) => (
        <PlayerAnswerCountField key={ac.answerType.value} answerCount={ac} xs={1} isOvertimeStats disabled={disabled} />
      ))}
    </Grid>
  );
}

function NotesCard() {
  const modalManager = useContext(MatchEditModalContext);
  const [notes, setNotes] = useSubscription(modalManager.tempMatch.notes || '');

  return (
    <Card variant="outlined" sx={{ p: 1 }}>
      <CollapsibleArea title={<b>Notes&emsp;</b>} secondaryTitle={<span>{trunc(notes, 70)}</span>}>
        <TextField
          multiline
          spellCheck={false}
          rows={4}
          fullWidth
          variant="outlined"
          size="small"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => modalManager.setNotes(notes)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') modalManager.setNotes(notes);
          }}
        />
      </CollapsibleArea>
    </Card>
  );
}

function SuppressedValInfo() {
  const modalManager = useContext(MatchEditModalContext);
  const thisMatch = modalManager.tempMatch;
  const numSuppressed = thisMatch.getNumSuppressedWarnings();

  if (numSuppressed === 0) return null;

  return (
    <>
      <span>{numSuppressed}</span>
      <VisibilityOff fontSize="small" sx={{ verticalAlign: 'sub' }} />
      <Tooltip title={`Restore ${numSuppressed} ignored warning${numSuppressed > 1 ? 's' : ''}`} placement="top">
        <IconButton sx={{ paddingTop: '4px' }} onClick={() => modalManager.restoreSuppressedMsgs()}>
          <Restore />
        </IconButton>
      </Tooltip>
    </>
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
        <ValidationMessage key={v.type} validator={v} whichTeam={null} />
      ))}
      {!forfeit && leftTeamValidators.map((v) => <ValidationMessage key={v.message} validator={v} whichTeam="left" />)}
      {!forfeit &&
        rightTeamValidators.map((v) => <ValidationMessage key={v.message} validator={v} whichTeam="right" />)}
    </>
  );
}

interface IValidationMessageProps {
  validator: MatchValidationMessage;
  whichTeam: LeftOrRight | null;
}

function ValidationMessage(props: IValidationMessageProps) {
  const { validator, whichTeam } = props;
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
    modalManager.suppressValidationMessage(type, whichTeam || undefined);
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
