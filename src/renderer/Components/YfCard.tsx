import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React from 'react';

interface IYfCardProps {
  title: React.JSX.Element | string;
  // eslint-disable-next-line react/require-default-props
  secondaryHeader?: React.JSX.Element;
}

/** Generic card with a title */
function YfCard(props: React.PropsWithChildren<IYfCardProps>) {
  const { title, children, secondaryHeader } = props;
  return (
    <Card>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography gutterBottom variant="h5">
            {title}
          </Typography>
          <div>{secondaryHeader}</div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default YfCard;
