import { Button, styled } from '@mui/material';

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
  if (splitLoc === -1) return <span>caption</span>;

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

export const LinkButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: 0,
  ...theme.typography.body2,
}));
