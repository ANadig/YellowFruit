/* eslint-disable react/no-array-index-key */
import Grid from '@mui/material/Unstable_Grid2';
import { useContext } from 'react';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { Team } from '../DataModel/Team';

export default function SeedingView() {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} sm={6} md={4}>
        <SeedList />
      </Grid>
      <Grid xs={12} sm={6} md={8}>
        <YfCard title="Pools">
          <PoolView />
        </YfCard>
      </Grid>
    </Grid>
  );
}

function SeedList() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [seedList] = useSubscription(thisTournament.seeds);
  const [expectedNumTeams] = useSubscription(thisTournament.getExpectedNumberOfTeams());

  const listItems = seedList.map((tm, idx) => (
    <SeedListItem team={tm} seedNo={idx} canMoveUp={idx > 0} canMoveDown={idx < seedList.length - 1} />
  ));
  if (expectedNumTeams !== null) {
    for (let i = seedList.length; i < expectedNumTeams || 0; i++) {
      listItems.push(<SeedListItem team={null} seedNo={i} canMoveUp={false} canMoveDown={false} />);
    }
  }

  return (
    <YfCard title="Seeds">
      {seedList.length > 0 && (
        <Box sx={{ marginTop: 1, border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
          <List dense sx={{ py: 0 }}>
            {listItems.map((itm, idx) => (
              <div key={idx}>
                {idx !== 0 && <Divider />}
                {itm}
              </div>
            ))}
          </List>
        </Box>
      )}
    </YfCard>
  );
}

interface ISeedListItemProps {
  team: Team | null;
  seedNo: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SeedListItem(props: ISeedListItemProps) {
  const { team, seedNo, canMoveUp, canMoveDown } = props;
  const str = team === null ? '' : team.name;
  // const transparentColorStyle = {}

  return (
    <ListItem
      secondaryAction={
        <>
          <IconButton size="small" disabled={!canMoveUp}>
            <ArrowDropUp sx={{ color: !canMoveUp ? 'transparent' : undefined }} />
          </IconButton>
          <IconButton size="small" disabled={!canMoveDown}>
            <ArrowDropDown sx={{ color: !canMoveDown ? 'transparent' : undefined }} />
          </IconButton>
        </>
      }
    >
      <ListItemText>{`${seedNo + 1}. ${str}`}</ListItemText>
    </ListItem>
  );
}

function PoolView() {
  const tournManager = useContext(TournamentContext);
  const thisTournament = tournManager.tournament;
  const [seedList] = useSubscription(thisTournament.seeds);
  const [phase] = useSubscription(thisTournament.getPrelimPhase());

  if (!phase) return null;

  return (
    <Grid container spacing={2}>
      {phase.pools.map((pool) => (
        <Grid xs={12} md={6}>
          <TableContainer key={pool.name} sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '40px' }} />
                  <TableCell>{pool.name}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pool.seeds.map((seedNo) => (
                  <TableRow key={seedNo}>
                    <TableCell>{seedNo}</TableCell>
                    <TableCell>{seedList[seedNo - 1]?.name || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      ))}
    </Grid>
  );
}
