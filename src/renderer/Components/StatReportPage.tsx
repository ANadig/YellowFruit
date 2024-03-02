import { Card } from '@mui/material';
import { YfCssClasses } from '../Utils/GeneralReactUtils';
import { statReportProtocol } from '../../SharedUtils';
import { StatReportFileNames, StatReportPages } from '../Enums';

export default function StatReportPage() {
  // const tournManager = useContext(TournamentContext);
  const path = `${statReportProtocol}://${StatReportFileNames[StatReportPages.Standings]}`;

  return (
    <Card>
      <iframe
        src={path}
        className={YfCssClasses.StatReportIFrame}
        style={{ border: 'none' }}
        title="Stat Report"
        width="100%"
      />
    </Card>
  );
}
