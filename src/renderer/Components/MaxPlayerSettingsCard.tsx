import { HelpOutline } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useContext } from 'react';
import YfCard from './YfCard';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import { ScoringRules } from '../DataModel/ScoringRules';
import { YfNumericField } from '../Utils/GeneralReactUtils';

const maxPlayersFieldHelpText = 'The maximum number of players that can be active for one team at once';

function MaxPlayersSettingsCard() {
  const tournManager = useContext(TournamentContext);
  const thisTournamentRules = tournManager.tournament.scoringRules;
  const [numPlayers, setNumPlayers] = useSubscription(thisTournamentRules.maximumPlayersPerTeam.toString());
  const readOnly = tournManager.tournament.hasMatchData;

  const numPlayersIsValid = () => {
    if (numPlayers === '') return false;
    const parsed = parseFloat(numPlayers);
    return ScoringRules.validateMaxPlayerCount(parsed);
  };

  const saveNumPlayersSetting = () => {
    let valueToSave: number;
    if (!numPlayersIsValid()) {
      valueToSave = thisTournamentRules.maximumPlayersPerTeam;
    } else {
      valueToSave = parseInt(numPlayers, 10);
    }
    setNumPlayers(valueToSave.toString());
    tournManager.setMaxPlayers(valueToSave);
  };

  return (
    <YfCard title="Players">
      <YfNumericField
        sx={{ marginTop: 1, width: '14ch' }}
        size="small"
        inputProps={{ min: 1, disabled: readOnly }}
        label="Max Active/Team"
        value={numPlayers}
        error={!numPlayersIsValid()}
        onChange={(e) => setNumPlayers(e.target.value)}
        onBlur={saveNumPlayersSetting}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveNumPlayersSetting();
        }}
      />
      <Tooltip sx={{ marginTop: 2, mx: 1 }} title={maxPlayersFieldHelpText} placement="right">
        <HelpOutline fontSize="small" />
      </Tooltip>
    </YfCard>
  );
}

export default MaxPlayersSettingsCard;
