import { Button, IconButton, IconButtonProps, styled } from '@mui/material';

export enum YfCssClasses {
  HotkeyUnderline = 'yf-hotkey-underline',
  DropTarget = 'drop-target',
  Draggable = 'yf-draggable',
  StatReportIFrame = 'stat-report-iframe',
}

/** Turn a string with an ampersand into the string with the letter after the ampersand underlined.
 *  Literal ampersands can be specified with {AMP}
 */
export function hotkeyFormat(caption: string) {
  const splitLoc = caption.indexOf('&');
  if (splitLoc === -1) return <span>{caption}</span>;

  const start = caption.substring(0, splitLoc);
  const uLetter = caption.substring(splitLoc + 1, splitLoc + 2);
  const end = caption.substring(splitLoc + 2);

  return (
    <span>
      {start.replaceAll('{AMP}', '&')}
      <span className={YfCssClasses.HotkeyUnderline}>{uLetter}</span>
      {end.replaceAll('{AMP}', '&')}
    </span>
  );
}

/** Styling for a minimal button that looks like a link */
export const LinkButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: 0,
  ...theme.typography.body2,
}));

interface ExpandButtonProps extends IconButtonProps {
  expand: boolean;
}

// from https://mui.com/material-ui/react-card/
export const ExpandButton = styled((props: ExpandButtonProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { expand, ...other } = props;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));
