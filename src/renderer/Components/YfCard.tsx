import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import React from 'react';

interface IYfCardProps {
  title: React.JSX.Element | string;
  // eslint-disable-next-line react/require-default-props
  secondaryHeader?: React.JSX.Element;
  /** Short line of explanatory text under the title. */
  // eslint-disable-next-line react/require-default-props
  description?: string;
  /** Remove the body padding, e.g. when the child is a full-bleed table or list. */
  // eslint-disable-next-line react/require-default-props
  flush?: boolean;
}

/**
 * The standard bordered panel. Low-contrast 1px border, no elevation, compact header — the
 * containment comes from the border rather than from a shadow.
 */
function YfCard(props: React.PropsWithChildren<IYfCardProps>) {
  const { title, children, secondaryHeader, description, flush } = props;
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h2" sx={{ fontSize: '0.875rem' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        {secondaryHeader && <Box sx={{ flexShrink: 0 }}>{secondaryHeader}</Box>}
      </Box>
      <Box sx={flush ? undefined : { px: 2, py: 1.5 }}>{children}</Box>
    </Paper>
  );
}

export default YfCard;
