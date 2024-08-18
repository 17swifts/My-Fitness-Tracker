import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button, TextField, Container, Typography, Grid, IconButton, Modal, Box, Divider, FormControlLabel, Switch } from '@mui/material';
import ExerciseLibrary from './ExerciseLibrary';
import { Delete } from '@mui/icons-material';
import './styles/CreateWorkoutPlan.css';

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('');
  const [setGroups, setSetGroups] = useState([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(null);

  const handleCreatePlan = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(firestore, 'workoutPlans'), {
          userId: user.uid,
          name: planName,
          setGroups: setGroups.map((group, index) => ({
            number: group.isSuperSet ? group.number : null,
            isSuperSet: group.isSuperSet,
            sets: group.exercises.map(exercise => ({
              number: group.isSuperSet ? null : exercise.sets,
              reps: exercise.reps,
              exerciseId: exercise.id,
              notes: exercise.notes
            }))
          }))
        });
        setPlanName('');
        setSetGroups([]);
        navigate('/workout-plans');
      }
    } catch (error) {
      console.error('Error creating workout plan:', error);
    }
  };

  const addExercise = (exercise) => {
    if (currentGroupIndex !== null) {
      setSetGroups(prevGroups => {
        const newGroups = [...prevGroups];
        newGroups[currentGroupIndex].exercises.push({ ...exercise, sets: 0, reps: 0, notes: '' });
        return newGroups;
      });
    } else {
      setSetGroups(prevGroups => {
        const newGroups = [...prevGroups];
        newGroups.push({ isSuperSet: false, number: 1, exercises: [{ ...exercise, sets: 0, reps: 0, notes: '' }] });
        return newGroups;
      });
    }
    setIsAddingExercise(false);
    setCurrentGroupIndex(null);
  };

  const updateExercise = (groupIndex, exerciseIndex, field, value) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].exercises[exerciseIndex][field] = value;
      return newGroups;
    });
  };

  const updateGroup = (groupIndex, field, value) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex][field] = value;
      return newGroups;
    });
  };

  const removeExercise = (groupIndex, exerciseIndex) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].exercises.splice(exerciseIndex, 1);
      if (newGroups[groupIndex].exercises.length === 0) {
        newGroups.splice(groupIndex, 1);
      }
      return newGroups;
    });
  };

  const toggleSuperSet = (groupIndex) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].isSuperSet = !newGroups[groupIndex].isSuperSet;
      newGroups[groupIndex].number = newGroups[groupIndex].isSuperSet ? 1 : null;
      return newGroups;
    });
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
      <Button variant="contained" color="primary" onClick={() => { setIsAddingExercise(true); setCurrentGroupIndex(null); }}>
        Add Exercises
      </Button>

      <Modal open={isAddingExercise} onClose={() => setIsAddingExercise(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', bgcolor: 'background.paper', boxShadow: 24, overflowY: 'auto', p: 4 }}>
          <ExerciseLibrary onSelectExercise={addExercise} onClose={() => setIsAddingExercise(false)} />
        </Box>
      </Modal>

      <div>
        {setGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                {group.isSuperSet ? (
                  <TextField label="Sets" type="number"
                    value={group.number}
                    onChange={(e) => updateGroup(groupIndex, 'number', e.target.value)}
                    fullWidth />
                ) : null}
              </Grid>
              <Grid item xs={9}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={group.isSuperSet}
                      onChange={() => toggleSuperSet(groupIndex)}
                      name="isSuperSet"
                      color="primary"
                    />
                  }
                  label="Make Super Set"
                />
              </Grid>
              {group.exercises.map((exercise, exerciseIndex) => (
                <React.Fragment key={exerciseIndex}>
                  <Grid item xs={3}>
                    <Typography>{exercise.name}</Typography>
                  </Grid>
                  {!group.isSuperSet && (
                    <Grid item xs={2}>
                      <TextField label="Sets" type="number" value={exercise.sets}
                        onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'sets', e.target.value)}
                        fullWidth />
                    </Grid>
                  )}
                  <Grid item xs={2}>
                    <TextField label="Reps" type="number" value={exercise.reps}
                      onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'reps', e.target.value)}
                      fullWidth />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField label="Notes" value={exercise.notes}
                      onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'notes', e.target.value)}
                      fullWidth />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton onClick={() => removeExercise(groupIndex, exerciseIndex)}>
                      <Delete />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}
              {group.isSuperSet && (
                <Grid item xs={12}>
                  <Button variant="outlined" color="primary" onClick={() => { setIsAddingExercise(true); setCurrentGroupIndex(groupIndex); }}>
                    Add Another Exercise to Super Set
                  </Button>
                </Grid>
              )}
            </Grid>
            <Divider style={{ margin: '20px 0' }} />
          </React.Fragment>
        ))}
      </div>
      <div className='bottom-buttons'>
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
