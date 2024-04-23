import { Card } from '@mui/material';
import { useContext } from 'react';
import { YfCssClasses } from '../Utils/GeneralReactUtils';
import { statReportProtocol } from '../../SharedUtils';
import { StatReportFileNames, StatReportPages } from '../Enums';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';

export default function StatReportPage() {
  const tournManager = useContext(TournamentContext);
  const [updateTime] = useSubscription(tournManager.inAppStatReportGenerated);
  const path = `${statReportProtocol}://${StatReportFileNames[StatReportPages.Standings]}`;

  return (
    <Card>
      <iframe
        key={updateTime.toISOString()}
        src={path}
        className={YfCssClasses.StatReportIFrame}
        style={{ border: 'none', padding: '12px' }}
        title="Stat Report"
        width="100%"
      />
    </Card>
  );
}
