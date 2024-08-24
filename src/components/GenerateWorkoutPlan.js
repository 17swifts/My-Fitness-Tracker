import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, Checkbox, FormControlLabel, Grid, Typography, IconButton, Divider } from '@mui/material';
import { SwapHoriz, Delete } from '@mui/icons-material';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import dayjs from 'dayjs';
import './styles/CreateWorkoutPlan.css';

const GenerateWorkoutPlan = () => {
  const [planName, setPlanName] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');
  const [setGroups, setSetGroups] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [category, setCategory] = useState([]);
  const [time, setTime] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [repRange, setRepRange] = useState([]);
  const [workoutGenerated, setWorkoutGenerated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = () => {
      return new Promise(async (resolve, reject) => {
        try {
          const querySnapshot = await getDocs(collection(firestore, 'exercises'));
          const exerciseList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          resolve(exerciseList);
        } catch (error) {
          reject('Error fetching exercises:', error);
        }
      });
    };

    fetchExercises().then(exerciseList => {
      setExercises(exerciseList);
      setLoading(false); // Indicate that loading is complete
    }).catch(error => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const handleSelectionChange = (setter) => (event) => {
    const { value } = event.target;
    setter(value.includes('All') ? ['All'] : value.filter((v) => v !== 'All'));
  };

  const swapExercise = (groupIndex, exerciseIndex) => {
    const newExercise = selectRandomExercise(); // Logic to select a new random exercise based on initial parameters
    const updatedSetGroups = [...setGroups];
    updatedSetGroups[groupIndex].sets[exerciseIndex] = newExercise;
    setSetGroups(updatedSetGroups);
  };

  const generateWorkout = () => {
    try {
      const generatedGroups = generateExerciseGroups(exercises, {
        muscleGroups: muscleGroups,
        category: category,
        time: time,
        equipment: equipment,
        repRange: repRange,
      });

      setSetGroups(generatedGroups);
      setWorkoutGenerated(true);
    } catch (error) {
      console.error('Error generating workout:', error.message);
    }
  };

  const selectRandomExercise = (filters) => {
    const filteredExercises = exercises.filter(exercise => {
      const matchesMuscleGroup = !filters.muscleGroups.length || filters.muscleGroups.includes(exercise.muscleGroup) || filters.muscleGroups.includes('All');
      const matchesCategory = !filters.category.length || filters.category.includes(exercise.category) || filters.category.includes('All');
      const matchesEquipment = !filters.equipment.length || filters.equipment.includes(exercise.equipment) || filters.equipment.includes('All');
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

    const regularSetNumber = getRandomInt(3, 5);
    const supersetExerciseNumber = getRandomInt(2, 3);
    const timePerRegularSet = approxTimePerSet * regularSetNumber; // Time for one regular set
    const timePerSuperset = approxTimePerSet * 3 * supersetExerciseNumber; // Time for one superset

    const totalTime = filters.time ? filters.time : 60;
    const supersetTimeAllocation = 0.6 * totalTime;
    const regularSetTimeAllocation = 0.4 * totalTime;

    const numSuperSets = Math.floor(supersetTimeAllocation / timePerSuperset);
    const numRegularSets = Math.floor(regularSetTimeAllocation / timePerRegularSet);

    for (let i = 0; i < numRegularSets; i++) {
      const exercise = selectRandomExercise(filters);
      groups.push({
        isSuperSet: false,
        sets: [{
          exerciseId: exercise.id,
          number: regularSetNumber,
          reps: filters.repRange,
          notes: '',
        }],
      });
    }

    for (let i = 0; i < numSuperSets; i++) {
      const supersetExercises = [];
      for (let j = 0; j < supersetExerciseNumber; j++) {
        const exercise = selectRandomExercise(filters);
        supersetExercises.push({
          exerciseId: exercise.id,
          number: null,
          reps: filters.repRange,
          notes: '',
        });
      }
      groups.push({
        isSuperSet: true,
        number: 3,
        sets: supersetExercises,
      });
    }

    return groups;
  };

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleSavePlan = async () => {
    const user = auth.currentUser;
    if (user) {
      const planData = {
        userId: user.uid,
        name: planName,
        instructions: planInstructions,
        createdDate: dayjs().format('YYYY-MM-DD'),
        setGroups: setGroups.map(group => ({
          isSuperSet: group.isSuperSet,
          number: group.number ? group.number : 0,
          sets: group.sets.map(exercise => ({
            exerciseId: exercise.exerciseId,
            reps: exercise.reps,
            number: exercise.number ? exercise.number : 0,
          })),
        })),
      };
      await addDoc(collection(firestore, 'workoutPlans'), planData);
    }
  };

  const updateExercise = (groupIndex, exerciseIndex, field, value) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].sets[exerciseIndex][field] = value;
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

  const removeExercise = (groupIndex, exerciseIndex, exerciseId) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];

      // Remove the exercise from the group
      newGroups[groupIndex].sets.splice(exerciseIndex, 1);

      // Remove the group if it's empty after removing the exercise
      if (newGroups[groupIndex].sets.length === 0) {
        newGroups.splice(groupIndex, 1);
      }

      return newGroups;
    });
  };

    if (loading) {
      return <Typography variant="h6">Loading exercises...</Typography>;
    }

    return (
      <div>
        <Typography variant="h4">Generate Workout Plan</Typography>

        {!workoutGenerated ? (
          <>
            <TextField
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Select
              label="Muscle Groups"
              multiple
              value={muscleGroups}
              onChange={handleSelectionChange(setMuscleGroups)}
              fullWidth
              displayEmpty
              renderValue={(selected) => (selected.length === 0 ? "Muscle Groups" : selected.join(", "))}
            >
              {["All", "Full Body", "Back", "Chest", "Biceps", "Shoulders", "Core", "Triceps", "Quads", "Hamstrings", "Calves", "Cardio", "Forearm"].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>

            <Select
              label="Category"
              multiple
              value={category}
              onChange={handleSelectionChange(setCategory)}
              fullWidth
              displayEmpty
              renderValue={(selected) => (selected.length === 0 ? "Category" : selected.join(", "))}
            >
              {["All", "Push", "Pull", "Lunge", "Squat", "Gait", "Hinge", "Twist"].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
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
              onChange={handleSelectionChange(setEquipment)}
              fullWidth
              displayEmpty
              renderValue={(selected) => (selected.length === 0 ? "Equipment" : selected.join(", "))}
            >
              {["All", "Body Weight", "Dumbbell", "Barbell", "Bench", "Met Ball", "AB Wheel", "Machine", "Box"].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>

            <Select
              label="Rep Range"
              multiple
              value={repRange}
              onChange={(e) => setRepRange(e.target.value)}
              fullWidth
              displayEmpty
              renderValue={(selected) => (selected.length === 0 ? "Rep Range" : selected.join(", "))}
            >
              {[...Array(13).keys()].map((i) => (
                <MenuItem key={i + 3} value={i + 3}>
                  {i + 3}
                </MenuItem>
              ))}
            </Select>

            <Button variant="contained" color="primary" onClick={generateWorkout}>
              Generate Workout
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              id="outlined-multiline-static"
              label="Instructions"
              fullWidth
              multiline
              margin="normal"
              rows={5}
              value={planInstructions.toString().replace(new RegExp("<br>", "g"), '\n')}
              onChange={(e) => {
                const formattedText = e.target.value.replace(/\n/g, '<br>');
                setPlanInstructions(formattedText);
              }}
            />
            <div>
              {setGroups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  <Grid container spacing={2} alignItems="center" className='grid-container'>
                    <Grid item xs={3}>
                      {group.isSuperSet ? (
                        <TextField label="Sets" type="number"
                          value={group.number}
                          onChange={(e) => updateGroup(groupIndex, 'number', e.target.value)}
                          fullWidth />
                      ) : null}
                    </Grid>
                    <Grid item xs={9}>
                    </Grid>
                    {group.sets.map((exercise, exerciseIndex) => (
                      <React.Fragment key={exerciseIndex}>
                        <Grid item xs={2}>
                          <img
                            src={`../${exercises.find(e => e.id === exercise.exerciseId)?.imageUrl}`}
                            alt={exercises.find(e => e.id === exercise.exerciseId)?.name}
                            style={{ width: '80%' }}
                          />
                        </Grid>
                        {!group.isSuperSet ? (
                          <Grid item xs={2}>
                            <Typography>{exercises.find(e => e.id === exercise.exerciseId)?.name}</Typography>
                          </Grid>
                        ) :
                          <Grid item xs={3}>
                            <Typography>{exercises.find(e => e.id === exercise.exerciseId)?.name}</Typography>
                          </Grid>
                        }
                        {!group.isSuperSet && (
                          <Grid item xs={2}>
                            <TextField label="Sets" type="number" value={exercise.number}
                              onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'number', e.target.value)}
                              fullWidth />
                          </Grid>
                        )}
                        <Grid item xs={2}>
                          <TextField label="Reps" type="number" value={exercise.reps}
                            onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'reps', e.target.value)}
                            fullWidth />
                        </Grid>
                        {!group.isSuperSet ? (
                          <Grid item xs={2}>
                            <TextField label="Notes" value={exercise.notes}
                              onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'notes', e.target.value)}
                              fullWidth />
                          </Grid>
                        ) :
                          <Grid item xs={3}>
                            <TextField label="Notes" value={exercise.notes}
                              onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'notes', e.target.value)}
                              fullWidth />
                          </Grid>}
                        <Grid item xs={1}>
                          <IconButton onClick={() => removeExercise(groupIndex, exerciseIndex, exercise.exerciseId)}>
                            <Delete />
                          </IconButton>
                        </Grid>
                        <Grid item>
                          <IconButton onClick={() => swapExercise(groupIndex, exerciseIndex)}>
                            <SwapHoriz />
                          </IconButton>
                        </Grid>
                      </React.Fragment>
                    ))}
                  </Grid>
                  <Divider style={{ margin: '20px 0' }} />
                </React.Fragment>
              ))}
            </div>
            {/* {setGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.isSuperSet ? (
                <Typography variant="h6">Superset</Typography>
              ) : (
                <Typography variant="h6">Regular Set</Typography>
              )}
              {group.sets.map((set, setIndex) => (
                <Grid container key={setIndex} alignItems="center" spacing={2}>
                  <Grid item>
                    <Typography>{exercises.find(e => e.id === set.exerciseId)?.name || 'Exercise'}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography>{set.reps} Reps</Typography>
                  </Grid>
                  <Grid item>
                    <IconButton onClick={() => swapExercise(groupIndex, setIndex)}>
                      <SwapHoriz />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </div>
          ))} */}

            <Button variant="contained" color="primary" onClick={handleSavePlan}>
              Save Plan
            </Button>
          </>
        )}
      </div>
    );
  };

export default GenerateWorkoutPlan;
