import React from 'react';
import { Typography, Box } from '@mui/material';

const DashboardPage = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box>
        <Typography variant="h6">Today's Schedule</Typography>
        {/* Insert today's schedule here */}
      </Box>
      <Box>
        <Typography variant="h6">Quick Links</Typography>
        <Typography>Create/Schedule Workouts</Typography>
      </Box>
      <Box>
        <Typography variant="h6">Progress</Typography>
        {/* Insert progress highlights here */}
      </Box>
    </Box>
  );
};

export default DashboardPage;
