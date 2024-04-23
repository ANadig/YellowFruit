import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React from 'react';

interface IYfCardProps {
  title: React.JSX.Element | string;
}

/** Generic card with a title */
function YfCard(props: React.PropsWithChildren<IYfCardProps>) {
  const { title, children } = props;
  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default YfCard;
