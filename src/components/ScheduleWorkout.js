import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { Button, TextField, Box, Typography } from '@mui/material';

const ScheduleWorkout = ({ workoutId }) => {
  const [workoutDate, setWorkoutDate] = useState('');

  const handleScheduleWorkout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firestore.collection('scheduledWorkouts').add({
          userId: user.uid,
          workoutDate,
          workoutId,
          isComplete: false,
        });
        setWorkoutDate('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Schedule Workout
      </Typography>
      <TextField
        label="Workout Date"
        type="date"
        value={workoutDate}
        onChange={(e) => setWorkoutDate(e.target.value)}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <Button variant="contained" color="primary" onClick={handleScheduleWorkout}>
        Schedule Workout
      </Button>
    </Box>
  );
};

export default ScheduleWorkout;
