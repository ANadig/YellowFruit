/* eslint-disable react/no-array-index-key */
import Grid from '@mui/material/Unstable_Grid2';
import { useContext } from 'react';
import { Box, Divider, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import YfCard from './YfCard';
import { TournamentContext } from '../TournamentManager';
import useSubscription from '../Utils/CustomHooks';
import { Team } from '../DataModel/Team';

export default function SeedingView() {
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
    <Grid container spacing={2}>
      <Grid xs={12} sm={4}>
        <YfCard title="Seeds">
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
        </YfCard>
      </Grid>
      <Grid xs={12} sm={8}>
        <YfCard title="Pools">whatup</YfCard>
      </Grid>
    </Grid>
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
          <IconButton disabled={!canMoveUp}>
            <ArrowDropUp sx={{ color: !canMoveUp ? 'transparent' : undefined }} />
          </IconButton>
          <IconButton disabled={!canMoveDown}>
            <ArrowDropDown sx={{ color: !canMoveDown ? 'transparent' : undefined }} />
          </IconButton>
        </>
      }
    >
      <ListItemText>{`${seedNo + 1}. ${str}`}</ListItemText>
    </ListItem>
  );
}
