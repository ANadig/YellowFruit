import { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import useSubscription from '../Utils/CustomHooks';
import { TournamentContext } from '../TournamentManager';
import githublogo from '../../../assets/githublogo.svg';
import hsqbbee from '../../../assets/hsqbbee.png';
import { LinkButton } from '../Utils/GeneralReactUtils';

const githubUrl = 'https://github.com/ANadig/YellowFruit';
const forumsUrl = 'https://hsquizbowl.org/forums/viewtopic.php?t=22932';

export default function AboutYfDialog() {
  const tournManager = useContext(TournamentContext);
  const [isOpen] = useSubscription(tournManager.aboutYfDialogOpen);

  const handleClose = () => {
    tournManager.closeAboutYfDialog();
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={isOpen} onClose={handleClose}>
      <DialogTitle>About YellowFruit</DialogTitle>
      <DialogContent>
        <Typography variant="body2">Version {tournManager.appVersion}</Typography>
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          AGPL-3.0 license
        </Typography>
        <p>
          <img width={20} src={githublogo} alt="GitHub logo" />
          &nbsp;
          <LinkButton
            sx={{ verticalAlign: 'top', marginTop: '2px' }}
            onClick={() => tournManager.launchWebPageInBrowserWindow(githubUrl)}
          >
            GitHub repository
          </LinkButton>
        </p>
        <p>
          <img src={hsqbbee} alt="HSQB logo" />
          &nbsp;
          <LinkButton
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
