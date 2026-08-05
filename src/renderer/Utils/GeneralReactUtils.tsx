/* eslint-disable react/jsx-props-no-spreading */
import {
  Box,
  Button,
  ButtonProps,
  Collapse,
  IconButton,
  IconButtonProps,
  Stack,
  styled,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import React, { forwardRef, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Close, Done, ExpandMore } from '@mui/icons-material';

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

  const toggleExpanded = () => setIsExpanded((current) => !current);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleExpanded();
  };

  return (
    <>
      <Grid
        container
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        sx={{
          cursor: 'pointer',
          borderRadius: 1,
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <Grid size={{ xs: 'grow' }}>
          {title}
          {!isExpanded && secondaryTitle}
        </Grid>
        <Grid size={{ xs: 'auto' }}>
          <ExpandButton component="span" expand={isExpanded} tabIndex={-1} aria-hidden sx={{ py: 0 }}>
            <ExpandMore />
          </ExpandButton>
        </Grid>
      </Grid>
      <Collapse in={isExpanded}>{children}</Collapse>
    </>
  );
}

function numberInputOnWheelPreventChange(e: any) {
  // Prevent the input value change
  e.target.blur();

  // Prevent the page/container scrolling
  e.stopPropagation();

  // Refocus immediately, on the next tick (after the current function is done)
  setTimeout(() => e.target.focus(), 0);
}

/** A numeric field that stops the mouse wheel from changing it */
export function YfNumericField(props: TextFieldProps) {
  const { ...other } = props;
  return <TextField type="number" onWheel={numberInputOnWheelPreventChange} {...other} />;
}

export const YfAcceptButton = forwardRef((props: ButtonProps, buttonRef) => {
  const { ...other } = props;
  return (
    <Button
      variant="outlined"
      color="success"
      startIcon={<Done />}
      {...other}
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
    >
      {hotkeyFormat('&Accept')}
    </Button>
  );
});

export function YfCancelButton(props: ButtonProps) {
  const { ...other } = props;
  return (
    <Button variant="outlined" color="error" startIcon={<Close />} {...other}>
      {hotkeyFormat('&Cancel')}
    </Button>
  );
}

interface IYfPageHeaderProps {
  title: string;
  // eslint-disable-next-line react/require-default-props
  description?: string;
  // eslint-disable-next-line react/require-default-props
  actions?: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  status?: React.ReactNode;
}

/** Consistent title block at the top of a page. */
export function YfPageHeader(props: IYfPageHeaderProps) {
  const { title, description, actions, status } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 3,
        flexWrap: 'wrap',
        mb: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {(actions || status) && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {status}
          {actions}
        </Stack>
      )}
    </Box>
  );
}

/** A run of `SettingRow`s, separated by hairlines. */
export function SettingsList(props: React.PropsWithChildren<unknown>) {
  const { children } = props;
  return <Box sx={{ '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>{children}</Box>;
}

interface ISettingRowProps {
  label: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  description?: React.ReactNode;
  /** The control, rendered right-aligned. */
  // eslint-disable-next-line react/require-default-props
  control?: React.ReactNode;
  /** Stack the control under the label instead of beside it (for wide fields). */
  // eslint-disable-next-line react/require-default-props
  stacked?: boolean;
}

/**
 * One line in a settings panel: label (plus optional helper text) on the left, control on the
 * right. Wrap a run of them in `SettingsList` to get hairlines between rows.
 */
export function SettingRow(props: React.PropsWithChildren<ISettingRowProps>) {
  const { label, description, control, stacked, children } = props;
  const theControl = control ?? children;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: stacked ? 0.75 : 2,
        py: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="div" variant="body1" sx={{ lineHeight: 1.4 }}>
          {label}
        </Typography>
        {description && (
          <Typography component="div" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      {theControl && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: stacked ? 'stretch' : 'flex-end',
            gap: 1,
            flexShrink: 0,
          }}
        >
          {theControl}
        </Box>
      )}
    </Box>
  );
}
