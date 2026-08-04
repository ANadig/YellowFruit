import { useContext, useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { TournamentContext } from '../../TournamentManager';
import { TournamentServerContext } from '../../Services/TournamentServerService';
import ServerControlCard from './ServerControlCard';
import ActiveGamesCard from './ActiveGamesCard';
import MatchInboxCard from './MatchInboxCard';

/**
 * The Rooms page: controls the optional local tournament server, shows what each room is doing, and
 * holds the Match Inbox where the statskeeper approves games submitted from rooms.
 */
export default function RoomsPage() {
  const tournManager = useContext(TournamentContext);
  const [service] = useState(tournManager.tournamentServerService);
  const [, setUpdateNeeded] = useState({});

  useEffect(() => {
    // Re-render this page when the server service changes, without coupling it to the tournament's
    // own change notifications.
    service.dataChangedReactCallback = () => setUpdateNeeded({});
    service.refreshStatus();
    return () => {
      service.dataChangedReactCallback = () => {};
    };
  }, [service]);

  return (
    <TournamentServerContext.Provider value={service}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ServerControlCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <ActiveGamesCard />
        </Grid>
        <Grid item xs={12}>
          <MatchInboxCard />
        </Grid>
      </Grid>
    </TournamentServerContext.Provider>
  );
}
