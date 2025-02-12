import React from "react";
import { Typography, Box, Grid } from "@mui/material";
import ExerciseStatsGraph from "./ExerciseStatsGraph";

const ExerciseStatsCard = ({ exerciseName, exerciseData }) => {
  if (!exerciseData || exerciseData.length === 0) {
    return (
      <Typography variant="body2">
        No data available for {exerciseName}
      </Typography>
    );
  }

  const maxWeight = Math.max(...exerciseData.map((data) => data.weight));
  const maxVolume = Math.max(...exerciseData.map((data) => data.volume));

  const mostRecentData = exerciseData[exerciseData.length - 1];
  const estimated1RM = Math.round(
    mostRecentData.weight * (36 / (37 - mostRecentData.reps))
  );

  return (
    <Box className="containing-box" key={exerciseName}>
      <Typography variant="h5" gutterBottom>
        {exerciseName}
      </Typography>
      <ExerciseStatsGraph exerciseData={exerciseData} />
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">Max Weight: {maxWeight} kg</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">Max Volume: {maxVolume}</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">
              Estimated 1RM: {estimated1RM} kg
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
export default ExerciseStatsCard;
