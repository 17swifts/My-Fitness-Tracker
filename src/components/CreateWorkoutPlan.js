// src/components/CreateWorkoutPlan.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { Button, TextField, Container, Typography, Grid, IconButton } from '@mui/material';
import ExerciseLibrary from './ExerciseLibrary';
import { Delete } from '@mui/icons-material';

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const handleCreatePlan = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firestore.collection('workoutPlans').add({
          userId: user.uid,
          planName,
          exercises,
        });
        setPlanName('');
        setExercises([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addExercise = (exercise) => {
    setExercises([...exercises, { ...exercise, sets: 0, reps: 0, notes: '', isSuperset: false }]);
  };

  const updateExercise = (index, field, value) => {
    const updatedExercises = exercises.map((exercise, i) =>
      i === index ? { ...exercise, [field]: value } : exercise
    );
    setExercises(updatedExercises);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
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
      <Button variant="contained" color="primary" onClick={() => setIsAddingExercise(!isAddingExercise)}>
        Add Exercises
      </Button>

      {isAddingExercise && (
        <div>
          <ExerciseLibrary onSelectExercise={addExercise} />
          <div>
            {exercises.map((exercise, index) => (
              <Grid container spacing={2} alignItems="center" key={index}>
                <Grid item xs={3}>
                  <Typography>{exercise.name}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Sets" type="number" value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Reps" type="number" value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField label="Notes" value={exercise.notes}
                    onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    variant={exercise.isSuperset ? 'contained' : 'outlined'}
                    onClick={() => updateExercise(index, 'isSuperset', !exercise.isSuperset)}
                  >
                    Superset
                  </Button>
                </Grid>
                <Grid item xs={1}>
                  <IconButton onClick={() => removeExercise(index)}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </div>
        </div>
      )}
      <div>
        <Button variant="contained" color="primary" onClick={handleCreatePlan}>
          Create Plan
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/workout-plans')}>
          Cancel
        </Button>
      </div>
    </Container>
  );
};

export default CreateWorkoutPlan;
