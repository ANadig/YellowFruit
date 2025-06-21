import { Button, Collapse, IconButton, IconButtonProps, styled } from '@mui/material';
import React, { useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { ExpandMore } from '@mui/icons-material';

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

interface ICollapsibleAreaProps {
  title: React.JSX.Element | string;
  secondaryTitle: React.JSX.Element | string | null;
}

/** A section that starts hidden and can be expanded */
export function CollapsibleArea(props: React.PropsWithChildren<ICollapsibleAreaProps>) {
  const { title, secondaryTitle, children } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Grid container sx={{ cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        <Grid xs>
          {title}
          {!isExpanded && secondaryTitle}
        </Grid>
        <Grid xs="auto">
          <ExpandButton expand={isExpanded} sx={{ py: 0 }}>
            <ExpandMore />
          </ExpandButton>
        </Grid>
      </Grid>
      <Collapse in={isExpanded}>{children}</Collapse>
    </>
  );
}
