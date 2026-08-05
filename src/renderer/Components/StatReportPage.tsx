import { Box, Button, Paper } from '@mui/material';
import { useContext } from 'react';
import { FileDownload, Launch } from '@mui/icons-material';
import { YfCssClasses, YfPageHeader } from '../Utils/GeneralReactUtils';
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
      <YfPageHeader
        title="Stat report"
        description="A live preview of the standings. Export it or open the full report in a browser."
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<Launch />}
              onClick={() => tournManager.launchStatReportInBrowserWindow()}
            >
              Open in browser
            </Button>
            <Button variant="contained" startIcon={<FileDownload />} onClick={() => tournManager.exportStatReports()}>
              Export report
            </Button>
          </>
        }
      />
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          component="iframe"
          key={updateTime.toISOString()}
          src={path}
          className={YfCssClasses.StatReportIFrame}
          sx={{ border: 'none', p: 1.5, width: '100%' }}
          title="Stat Report"
        />
      </Paper>
    </>
  );
}
