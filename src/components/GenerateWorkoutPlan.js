import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Select, MenuItem, Box, Modal, FormControlLabel, Grid, Typography, IconButton, Divider, Switch, Alert } from '@mui/material';
import { SwapHoriz, Delete } from '@mui/icons-material';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import dayjs from 'dayjs';
import './styles/CreateWorkoutPlan.css';
import ExerciseLibrary from './ExerciseLibrary';

const GenerateWorkoutPlan = () => {
  const navigate = useNavigate();
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
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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
    const newExercise = selectRandomExercise({
      muscleGroups: muscleGroups,
      category: category,
      time: time,
      equipment: equipment,
      repRange: repRange,
    }); // Logic to select a new random exercise based on initial parameters
    const updatedSetGroups = [...setGroups];
    updatedSetGroups[groupIndex].sets[exerciseIndex].exerciseId = newExercise.id;
    setSetGroups(updatedSetGroups);
  };

  const generateWorkout = () => {
    try {
      const generatedGroups = generateExerciseGroups({
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

      // Check if the exercise is already in setGroups
      const isAlreadyInSetGroups = setGroups.some(group =>
        group.sets.some(set => set.exerciseId === exercise.id)
      );

      return matchesMuscleGroup && matchesCategory && matchesEquipment && !isAlreadyInSetGroups;
    });

    if (filteredExercises.length === 0) {
      throw new Error('No exercises match the selected criteria or all matching exercises have already been added.');
    }

    const randomIndex = Math.floor(Math.random() * filteredExercises.length);
    return filteredExercises[randomIndex];
  };


  const generateExerciseGroups = (filters) => {
    const groups = [];
    const approxTimePerSet = 2; // Approximate time in minutes for each set

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
            time: exercise.time ? exercise.time : 0,
          })),
        })),
      };
      await addDoc(collection(firestore, 'workoutPlans'), planData);
      setSuccessMessage(`Successfully saved workout ${planName}`);
      navigate('/workout-plans');
    }
  };

  const toggleSuperSet = (groupIndex) => {
    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].isSuperSet = !newGroups[groupIndex].isSuperSet;
      newGroups[groupIndex].number = newGroups[groupIndex].isSuperSet ? 1 : null;
      return newGroups;
    });
  };

  const addExercise = async (exercise) => {
    setLoading(true);

    // Update the setGroups state next
    await new Promise(resolve => {
      setSetGroups(prevGroups => {
        const newGroups = [...prevGroups];
        if (currentGroupIndex !== null) {
          newGroups[currentGroupIndex].sets.push({
            exerciseId: exercise.id,
            number: 0,
            reps: 0,
            time: 0,
            notes: ''
          });
        } else {
          newGroups.push({
            isSuperSet: false,
            sets: [{
              exerciseId: exercise.id,
              number: 0,
              reps: 0,
              time: 0,
              notes: ''
            }]
          });
        }
        resolve(newGroups); // Resolve the promise after the state is updated
        setLoading(false);
        return newGroups;
      });
    });
    setIsAddingExercise(false);
    setCurrentGroupIndex(null);
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
    <Box p={3}>
      <Typography variant="h4">Generate Workout Plan</Typography>

      <Modal open={isAddingExercise} onClose={() => setIsAddingExercise(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', bgcolor: 'background.paper', boxShadow: 24, overflowY: 'auto', p: 4 }}>
          <ExerciseLibrary onSelectExercise={addExercise} onClose={() => setIsAddingExercise(false)} />
        </Box>
      </Modal>

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
            renderValue={(selected) => (selected.length === 0 ? <span style={{ color: '#aaa' }}>Muscle Groups</span> : selected.join(", "))}
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
            renderValue={(selected) => (selected.length === 0 ? <span style={{ color: '#aaa' }}>Category</span> : selected.join(", "))}
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
            renderValue={(selected) => (selected.length === 0 ? <span style={{ color: '#aaa' }}>Equipment</span> : selected.join(", "))}
          >
            {["All", "Body Weight", "Dumbbell", "Barbell", "Bench", "Met Ball", "AB Wheel", "Machine", "Box"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>

          <Select
            label="Rep Range"
            value={repRange}
            onChange={(e) => setRepRange(e.target.value)}
            fullWidth
            displayEmpty
          >
            {/* Placeholder item */}
            <MenuItem value="" disabled>
            <span style={{ color: '#aaa' }}>Rep Range</span>
            </MenuItem>
            {/* Actual options */}
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
          <Button variant="contained" color="primary" onClick={() => { setIsAddingExercise(true); setCurrentGroupIndex(null); }}>
            Add Exercises
          </Button>
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
                      {!exercises[exercise.exerciseId]?.timed ? (
                        <Grid item xs={2}>
                          <TextField label="Reps" type="number" value={exercise.reps}
                            onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'reps', e.target.value)}
                            fullWidth />
                        </Grid>
                      ) : (
                        <Grid item xs={2}>
                          <TextField label="Time (s)" type="number" value={exercise.time}
                            onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'time', e.target.value)}
                            fullWidth />
                        </Grid>
                      )}
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

          <Button variant="contained" color="primary" onClick={handleSavePlan}>
            Save Plan
          </Button>
          {successMessage && (
            <Alert severity="success" sx={{ marginTop: 2 }}>
              {successMessage}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default GenerateWorkoutPlan;
