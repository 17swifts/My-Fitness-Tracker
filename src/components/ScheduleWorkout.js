import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { Button, TextField, Container, Typography } from '@mui/material';

const ScheduleWorkout = () => {
  const [workoutDate, setWorkoutDate] = useState('');

  const handleScheduleWorkout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firestore.collection('scheduledWorkouts').add({
          userId: user.uid,
          workoutDate,
        });
        setWorkoutDate('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Schedule Workout
      </Typography>
      <TextField
        label="Workout Date"
        value={workoutDate}
        onChange={(e) => setWorkoutDate(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleScheduleWorkout}>
        Schedule Workout
      </Button>
    </Container>
  );
};

export default ScheduleWorkout;
