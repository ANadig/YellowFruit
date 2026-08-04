import { useContext, useState } from 'react';
import { Alert, AlertTitle, Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import YfCard from '../YfCard';
import { TournamentContext } from '../../TournamentManager';
import { TournamentServerContext } from '../../Services/TournamentServerService';
import { defaultServerPort } from '../../../main/server/ServerTypes';

/** Start/stop control for the local tournament server, plus the addresses Chromebooks should use */
export default function ServerControlCard() {
  const tournManager = useContext(TournamentContext);
  const service = useContext(TournamentServerContext);
  const [busy, setBusy] = useState(false);
  const [portText, setPortText] = useState(String(service?.requestedPort ?? defaultServerPort));

  if (!service) return null;

  const { status, lastError } = service;
  const snapshot = service.buildTournamentSnapshot();
  const rulesUnusable = snapshot.gameFormat === null;

  const parsedPort = Number.parseInt(portText, 10);
  const portIsValid = Number.isInteger(parsedPort) && parsedPort >= 1024 && parsedPort <= 65535;

  const handleStart = async () => {
    setBusy(true);
    try {
      await service.startServer(parsedPort);
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    setBusy(true);
    try {
      await service.stopServer();
    } finally {
      setBusy(false);
    }
  };

  const statusChip = status.running ? (
    <Chip color="success" size="small" label="Running" />
  ) : (
    <Chip size="small" label="Offline" />
  );

  return (
    <YfCard title="Tournament Server" secondaryHeader={statusChip}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Runs a scorekeeping page on this computer that other devices on the same network can open in a browser. It is
        off until you start it, and stops when you close YellowFruit.
      </Typography>

      {rulesUnusable && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>These scoring rules can&apos;t be used for room scorekeeping</AlertTitle>
          {snapshot.gameFormatErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}

      {!rulesUnusable && snapshot.gameFormatWarnings.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {snapshot.gameFormatWarnings.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}

      {lastError !== '' && !status.running && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {lastError}
        </Alert>
      )}

      {status.running ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Open one of these addresses on the scorekeeping device:</Typography>
          {status.addresses.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              The server is running, but this computer doesn&apos;t appear to be on a network, so other devices
              can&apos;t reach it. Connect to the same Wi-Fi as your scorekeeping devices.
            </Alert>
          ) : (
            <Stack sx={{ mt: 1 }} spacing={0.5} alignItems="flex-start">
              {status.addresses.map((address) => (
                // A button rather than a link: this opens an external browser window instead of
                // navigating anywhere in the app.
                <Button
                  key={address}
                  size="small"
                  onClick={() => tournManager.launchWebPageInBrowserWindow(address)}
                  sx={{ fontFamily: 'monospace', textTransform: 'none', p: 0.5 }}
                >
                  {address}
                </Button>
              ))}
            </Stack>
          )}
          {status.addresses.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              More than one network was found. Use whichever address your scorekeeping devices can reach.
            </Typography>
          )}
        </Box>
      ) : (
        <TextField
          label="Port"
          size="small"
          value={portText}
          onChange={(e) => {
            setPortText(e.target.value);
            const next = Number.parseInt(e.target.value, 10);
            if (Number.isInteger(next)) service.setRequestedPort(next);
          }}
          error={!portIsValid}
          helperText={portIsValid ? ' ' : 'Enter a port between 1024 and 65535'}
          sx={{ width: 160, mb: 2 }}
        />
      )}

      <div>
        {status.running ? (
          <Button variant="outlined" color="error" startIcon={<Stop />} onClick={handleStop} disabled={busy}>
            Stop Server
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
            onClick={handleStart}
            disabled={busy || !portIsValid || rulesUnusable}
          >
            Start Server
          </Button>
        )}
      </div>
    </YfCard>
  );
}
