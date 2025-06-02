import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useHotkeys } from 'react-hotkeys-hook';
import { Cancel, Close, Upload } from '@mui/icons-material';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { hotkeyFormat } from '../Utils/GeneralReactUtils';
import { MatchImportResultsModalContext } from '../Modal Managers/MatchImportResultsManager';
import MatchImportResult, { ImportResultStatus } from '../DataModel/MatchImportResult';
import { getFileNameFromPath } from '../Utils/GeneralUtils';

export default function MatchImportResultDialog() {
  const tournManager = useContext(TournamentContext);
  const [, setUpdateNeeded] = useState({}); // set this object to a new object whenever we want to force a re-render
  const [mgr] = useState(tournManager.matchImportResultsManager);
  useEffect(() => {
    mgr.dataChangedReactCallback = () => {
      setUpdateNeeded({});
    };
  }, [mgr]);

  return (
    <MatchImportResultsModalContext.Provider value={mgr}>
      <MatchImportResultDialogCore />
    </MatchImportResultsModalContext.Provider>
  );
}

enum ResultTableColumns {
  FileName,
  MatchTitle,
  Message,
  ImportOrSkip,
}

const sectionHelpText = {
  [ImportResultStatus.Success]: 'These games can be imported with no issues',
  [ImportResultStatus.Warning]: 'These games are valid, but might be inaccurate',
  [ImportResultStatus.ErrNonFatal]:
    "These gamese can be imported, but they won't count toward the standings until you correct the errors shown",
  [ImportResultStatus.FatalErr]: "YellowFruit can't use the contents of these files. Fix the issues and try again.",
};

function MatchImportResultDialogCore() {
  const tournManager = useContext(TournamentContext);
  const modalManager = useContext(MatchImportResultsModalContext);
  const [isOpen] = useSubscription(modalManager.modalIsOpen);
  const [round] = useSubscription(modalManager.round);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  const allResults = modalManager.resultsList || [];
  const successes = allResults.filter((r) => r.status === ImportResultStatus.Success);
  const warnings = allResults.filter((r) => r.status === ImportResultStatus.Warning);
  const errs = allResults.filter((r) => r.status === ImportResultStatus.ErrNonFatal);
  const fatals = allResults.filter((r) => r.status === ImportResultStatus.FatalErr);
  const couldImportAnything = successes.length > 0 || warnings.length > 0 || errs.length > 0;

  const handleAccept = () => {
    acceptButtonRef.current?.focus();
    tournManager.closeMatchImportModal(true);
  };

  const handleCancel = () => {
    tournManager.closeMatchImportModal(false);
  };

  useHotkeys('alt+c', () => handleCancel(), { enabled: isOpen, enableOnFormTags: true });
  useHotkeys('alt+a', () => handleAccept(), { enabled: isOpen && couldImportAnything, enableOnFormTags: true });

  return (
    <Dialog open={isOpen} fullWidth maxWidth="xl" onClose={handleCancel}>
      <DialogTitle>{`Round ${round?.name} Import Preview`}</DialogTitle>
      <DialogContent>
        {successes.length > 0 && (
          <>
            <Typography variant="h6">Success</Typography>
            <Box paddingLeft={2}>
              <Alert severity="success" sx={{ marginBottom: 1 }}>
                {sectionHelpText[ImportResultStatus.Success]}
              </Alert>
              <ResultTable resultList={successes} />
            </Box>
          </>
        )}
        {warnings.length > 0 && (
          <>
            <Typography variant="h6" marginTop={2}>
              Games with Warnings
            </Typography>
            <Box paddingLeft={2}>
              <Alert severity="warning" sx={{ marginBottom: 1 }}>
                {sectionHelpText[ImportResultStatus.Warning]}
              </Alert>
              <ResultTable resultList={warnings} />
            </Box>
          </>
        )}
        {errs.length > 0 && (
          <>
            <Typography variant="h6" marginTop={2}>
              Games with Errors
            </Typography>
            <Box paddingLeft={2}>
              <Alert severity="error" sx={{ marginBottom: 1 }}>
                {sectionHelpText[ImportResultStatus.ErrNonFatal]}
              </Alert>
              <ResultTable resultList={errs} />
            </Box>
          </>
        )}
        {fatals.length > 0 && (
          <>
            <Typography variant="h6" marginTop={2}>
              Cannot be Imported
            </Typography>
            <Box paddingLeft={2}>
              <Alert severity="error" icon={<Cancel />} sx={{ marginBottom: 1 }}>
                {sectionHelpText[ImportResultStatus.FatalErr]}
              </Alert>
              <ResultTable resultList={fatals} />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel}>
          {hotkeyFormat('&Cancel')}
        </Button>
        <Button variant="outlined" onClick={handleAccept} disabled={!couldImportAnything} ref={acceptButtonRef}>
          {hotkeyFormat('&Accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface IResultTableProps {
  resultList: MatchImportResult[];
}

function ResultTable(props: IResultTableProps) {
  const { resultList } = props;

  if (resultList.length === 0) {
    return <Box sx={{ px: 2 }}>None</Box>;
  }

  return (
    <TableContainer sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
      <Table size="small">
        <TableBody>
          {resultList.map((rslt, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <ResultTableRow key={idx} result={rslt} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface IResultTableRowProps {
  result: MatchImportResult;
}

const toggleOptions = {
  keep: 'Import',
  discard: 'Discard',
};

function ResultTableRow(props: IResultTableRowProps) {
  const { result } = props;
  const modalManager = useContext(MatchImportResultsModalContext);
  const [keepResult, setKeepResult] = useSubscription(result.proceedWithImport);
  if (result.status === undefined) return null;

  const cols = getColumnList(result.status);

  return (
    <TableRow>
      {cols.includes(ResultTableColumns.FileName) && (
        <TableCell width="20%">{getFileNameFromPath(result.filePath)}</TableCell>
      )}
      {cols.includes(ResultTableColumns.MatchTitle) && <TableCell>{result.match?.getScoreString()}</TableCell>}
      {cols.includes(ResultTableColumns.Message) && (
        <TableCell>
          <MessageList messages={result.messages} />
        </TableCell>
      )}
      {cols.includes(ResultTableColumns.ImportOrSkip) && (
        <TableCell width="10%">
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={keepResult ? toggleOptions.keep : toggleOptions.discard}
            onChange={(e, newValue) => {
              if (newValue === null) return;
              setKeepResult(newValue === toggleOptions.keep);
              modalManager.setProceedWithImport(result, newValue === toggleOptions.keep);
            }}
          >
            <ToggleButton value={toggleOptions.keep}>
              <Upload />
              {toggleOptions.keep}
            </ToggleButton>
            <ToggleButton value={toggleOptions.discard}>
              <Close /> {toggleOptions.discard}
            </ToggleButton>
          </ToggleButtonGroup>
        </TableCell>
      )}
    </TableRow>
  );
}

interface IMessageListProps {
  messages: string[];
}

function MessageList(props: IMessageListProps) {
  const { messages } = props;

  return messages.map((msg, idx) => (
    <>
      {msg}
      {idx < messages.length - 1 && <br />}
    </>
  ));
}

function getColumnList(status: ImportResultStatus) {
  const cols: ResultTableColumns[] = [ResultTableColumns.FileName];
  if (status !== ImportResultStatus.FatalErr) {
    cols.push(ResultTableColumns.MatchTitle);
  }
  if (status !== ImportResultStatus.Success) {
    cols.push(ResultTableColumns.Message);
  }
  if (status !== ImportResultStatus.FatalErr) {
    cols.push(ResultTableColumns.ImportOrSkip);
  }
  return cols;
}
