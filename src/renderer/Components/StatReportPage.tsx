import { Button, Card, CardContent } from '@mui/material';
import { useContext } from 'react';
import { FileDownload } from '@mui/icons-material';
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
    <>
      <Card sx={{ marginBottom: 2, '& .MuiCardContent-root': { paddingBottom: 2.1 } }}>
        <CardContent>
          <Button
            variant="contained"
            size="small"
            startIcon={<FileDownload />}
            onClick={() => tournManager.exportStatReports()}
          >
            Export report
          </Button>
        </CardContent>
      </Card>
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
    </>
  );
}
