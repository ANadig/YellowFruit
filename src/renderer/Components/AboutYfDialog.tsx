import { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip, Typography } from '@mui/material';
import { InfoOutlined, TaskAlt } from '@mui/icons-material';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import githublogo from '../../../assets/githublogo.svg';
import hsqbbee from '../../../assets/hsqbbee.png';
import { LinkButton } from '../Utils/GeneralReactUtils';
import { versionLt } from '../Utils/GeneralUtils';

const githubUrl = 'https://github.com/ANadig/YellowFruit';
const githubLatestRelUrl = 'https://github.com/ANadig/YellowFruit/releases/latest';
const forumsUrl = 'https://hsquizbowl.org/forums/viewtopic.php?t=22932';

export default function AboutYfDialog() {
  const tournManager = useContext(TournamentContext);
  const [isOpen] = useSubscription(tournManager.aboutYfDialogOpen);
  const curVersion = tournManager.appVersion;
  const newestVersion = tournManager.latestAvailVersion;
  const promptToUpdate = versionLt(curVersion, newestVersion);

  const handleClose = () => {
    tournManager.closeAboutYfDialog();
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={isOpen} onClose={handleClose}>
      <DialogTitle>About YellowFruit</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Version {tournManager.appVersion} &nbsp;
          {promptToUpdate ? <NotCurrentIcon newestVersion={newestVersion} /> : <UpToDateIcon />}
        </Typography>
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          AGPL-3.0 license
        </Typography>
        <p>
          <img width={20} src={githublogo} alt="GitHub logo" />
          &nbsp;
          <span style={{ verticalAlign: 'top', marginTop: '2px' }}>
            <LinkButton title={githubUrl} onClick={() => tournManager.launchWebPageInBrowserWindow(githubUrl)}>
              GitHub repository
            </LinkButton>
            {promptToUpdate && (
              <>
                <span>&ensp;|&ensp;</span>
                <LinkButton
                  title={githubLatestRelUrl}
                  onClick={() => tournManager.launchWebPageInBrowserWindow(githubLatestRelUrl)}
                >
                  {`Download the latest version (${newestVersion})`}
                </LinkButton>{' '}
              </>
            )}
          </span>
        </p>
        <p>
          <img src={hsqbbee} alt="HSQB logo" />
          &nbsp;
          <LinkButton
            title={forumsUrl}
            sx={{ verticalAlign: 'top', marginTop: '2px' }}
            onClick={() => tournManager.launchWebPageInBrowserWindow(forumsUrl)}
          >
            HSQB forum discussion
          </LinkButton>
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function UpToDateIcon() {
  return (
    <Tooltip title="You are running the latest version of YellowFruit">
      <TaskAlt fontSize="small" color="success" sx={{ verticalAlign: 'sub' }} />
    </Tooltip>
  );
}

interface INotCurrentIconProps {
  newestVersion: string;
}

function NotCurrentIcon(props: INotCurrentIconProps) {
  const { newestVersion } = props;
  return (
    <Tooltip title={`A newer version of YellowFruit is available (${newestVersion})`}>
      <InfoOutlined fontSize="small" color="info" sx={{ verticalAlign: 'sub' }} />
    </Tooltip>
  );
}
