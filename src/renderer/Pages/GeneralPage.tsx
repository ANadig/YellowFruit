import * as React from 'react';
import Container from '@mui/material/Container';
import { Button } from '@mui/material';
import { AddComment } from '@mui/icons-material';

function GeneralPage() {
  return (
    <Container>
      <h1>electron-react-boilerplate xxxyz</h1>
      <div className="Hello">
        <Button variant="contained">
          <AddComment>star</AddComment> Hello World
        </Button>
      </div>
    </Container>
  );
}

export default GeneralPage;
