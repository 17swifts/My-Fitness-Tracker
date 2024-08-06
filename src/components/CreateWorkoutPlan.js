import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { Button, TextField, Container, Typography } from '@mui/material';

const CreateWorkoutPlan = () => {
  const [planName, setPlanName] = useState('');

  const handleCreatePlan = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firestore.collection('workoutPlans').add({
          userId: user.uid,
          planName,
        });
        setPlanName('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Create Workout Plan
      </Typography>
      <TextField
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleCreatePlan}>
        Create Plan
      </Button>
    </Container>
  );
};

export default CreateWorkoutPlan;
