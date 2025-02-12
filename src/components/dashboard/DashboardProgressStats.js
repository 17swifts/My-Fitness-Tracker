import React from "react";
import { Typography, Box, Grid } from "@mui/material";

const DashboardProgressStats = ({ fitbitData }) => (
  <Grid container spacing={3}>
    {Object.entries(fitbitData).map(([key, value]) => (
      <Grid item xs={6} key={key}>
        <Box className="progress-box">
          <Typography variant="body1">
            {key.replace(/([A-Z])/g, " $1")}
          </Typography>
          <Typography variant="h5">{value}</Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
);

export default DashboardProgressStats;
