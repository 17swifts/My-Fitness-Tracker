import React, { useState } from 'react';
import { Button, TextField, Select, MenuItem, Checkbox, FormControlLabel, Grid, Typography, IconButton } from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import ExerciseLibrary from './ExerciseLibrary'; // Assuming this is already set up
import { collection, addDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import dayjs from 'dayjs';

const GenerateWorkoutPlan = () => {
  const [planName, setPlanName] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');
  const [setGroups, setSetGroups] = useState([]);
  const [exercises, setExercises] = useState({});
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [category, setCategory] = useState([]);
  const [time, setTime] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [repRange, setRepRange] = useState([8, 12]);

//   const generateWorkout = () => {
//     // Logic to generate workout based on the parameters
//     const generatedSetGroups = generateExerciseGroups();
//     setSetGroups(generatedSetGroups);
//   };

  const swapExercise = (groupIndex, exerciseIndex) => {
    // Logic to swap exercise
    const newExercise = selectRandomExercise(); // Logic to select a new random exercise based on initial parameters
    const updatedSetGroups = [...setGroups];
    updatedSetGroups[groupIndex].sets[exerciseIndex] = newExercise;
    setSetGroups(updatedSetGroups);
  };

  const generateWorkout = () => {
    try {
      const generatedGroups = generateExerciseGroups(exercises, {
        muscleGroups: muscleGroups,  // e.g., ['Back', 'Chest']
        category: category,       // e.g., ['Strength']
        time: time,                 // e.g., 30 (minutes)
        equipment: equipment,       // e.g., ['Dumbbells']
        repRange: repRange          // e.g., 10
      });
  
      setSetGroups(generatedGroups);
    } catch (error) {
      console.error('Error generating workout:', error.message);
      // Optionally, handle the error (e.g., show a message to the user)
    }
  };

  const selectRandomExercise = (exercises, filters) => {
    const filteredExercises = exercises.filter(exercise => {
      const matchesMuscleGroup = !filters.muscleGroups.length || filters.muscleGroups.includes(exercise.muscleGroup);
      const matchesCategory = !filters.category.length || filters.category.includes(exercise.category);
      const matchesEquipment = !filters.equipment.length || filters.equipment.includes(exercise.equipment);
  
      return matchesMuscleGroup && matchesCategory && matchesEquipment;
    });
  
    if (filteredExercises.length === 0) {
      throw new Error('No exercises match the selected criteria.');
    }
  
    const randomIndex = Math.floor(Math.random() * filteredExercises.length);
    return filteredExercises[randomIndex];
  };

  const generateExerciseGroups = (exercises, filters) => {
    const groups = [];
    const approxTimePerSet = 2.5; // Approximate time in minutes for each set
    let totalTime = 0;
  
    // Determine the number of regular sets and supersets based on time limitation
    const numRegularSets = Math.min(Math.floor(filters.time / (2 * approxTimePerSet)), 2);
    const numSuperSets = Math.min(Math.floor((filters.time - numRegularSets * 2 * approxTimePerSet) / (3 * approxTimePerSet)), 3);
  
    for (let i = 0; i < numRegularSets; i++) {
      const exercise = selectRandomExercise(exercises, filters);
      groups.push({
        isSuperSet: false,
        sets: [{
          exerciseId: exercise.id,
          number: 3,  // Default set number
          reps: filters.repRange, // Default rep range
          notes: ''
        }]
      });
      totalTime += 2 * approxTimePerSet; // Two sets for regular sets
    }
  
    for (let i = 0; i < numSuperSets; i++) {
      const supersetExercises = [];
      for (let j = 0; j < 2; j++) { // Two exercises per superset
        const exercise = selectRandomExercise(exercises, filters);
        supersetExercises.push({
          exerciseId: exercise.id,
          number: null,  // Supersets don't have a number
          reps: filters.repRange, // Default rep range
          notes: ''
        });
      }
      groups.push({
        isSuperSet: true,
        number: i + 1,  // Supersets are numbered
        sets: supersetExercises
      });
      totalTime += 3 * approxTimePerSet; // Three sets for supersets
    }
  
    return groups;
  };

  const handleSavePlan = async () => {
    // Save logic similar to CreateWorkoutPlan.js
    const user = auth.currentUser;
    if (user) {
      const planData = {
        userId: user.uid,
        name: planName,
        instructions: planInstructions,
        createdDate: dayjs().format('YYYY-MM-DD'),
        setGroups: setGroups.map(group => ({
          isSuperSet: group.isSuperSet,
          sets: group.sets.map(exercise => ({
            exerciseId: exercise.exerciseId,
            reps: exercise.reps,
            number: 3, // Assuming fixed set number
          }))
        }))
      };
      await addDoc(collection(firestore, 'workoutPlans'), planData);
    }
  };

  return (
    <div>
      <Typography variant="h4">Generate Workout Plan</Typography>
      <TextField
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Instructions"
        value={planInstructions}
        onChange={(e) => setPlanInstructions(e.target.value)}
        fullWidth
        multiline
        margin="normal"
      />
      {/* Input fields for parameters */}
      <Select
        label="Muscle Groups"
        multiple
        value={muscleGroups}
        onChange={(e) => setMuscleGroups(e.target.value)}
        fullWidth
      >
        {/* Options for Muscle Groups */}
      </Select>
      <Select
        label="Category"
        multiple
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        fullWidth
      >
        {/* Options for Category */}
      </Select>
      <TextField
        label="Time (Minutes)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Select
        label="Equipment"
        multiple
        value={equipment}
        onChange={(e) => setEquipment(e.target.value)}
        fullWidth
      >
        {/* Options for Equipment */}
      </Select>
      <TextField
        label="Rep Range"
        value={repRange.join('-')}
        onChange={(e) => setRepRange(e.target.value.split('-').map(Number))}
        fullWidth
        margin="normal"
      />

      <Button variant="contained" color="primary" onClick={generateWorkout}>
        Generate Workout
      </Button>

      {/* Display Generated Exercises */}
      {setGroups.map((group, groupIndex) => (
        <Grid container key={groupIndex}>
          {group.sets.map((exercise, exerciseIndex) => (
            <Grid item key={exerciseIndex}>
              <Typography>{exercise.name}</Typography>
              <IconButton onClick={() => swapExercise(groupIndex, exerciseIndex)}>
                <SwapHoriz />
              </IconButton>
            </Grid>
          ))}
        </Grid>
      ))}

      <Button variant="contained" color="primary" onClick={handleSavePlan}>
        Save Workout Plan
      </Button>
    </div>
  );
};

export default GenerateWorkoutPlan;
