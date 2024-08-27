import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button, TextField, Container, Typography, Grid, IconButton, Modal, Box, Divider, FormControlLabel, Switch } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ExerciseLibrary from './ExerciseLibrary';
import { Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import './styles/CreateWorkoutPlan.css';

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();  // Get the workout plan ID from the URL
  const [planName, setPlanName] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');
  const [setGroups, setSetGroups] = useState([]);
  const [exercises, setExercises] = useState({});
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // Track if we're editing an existing plan
  const [loading, setLoading] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchPlanDetails = async () => {
        try {
          const docRef = doc(firestore, 'workoutPlans', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const planData = docSnap.data();
            setPlanName(planData.name);
            setPlanInstructions(planData.instructions);
            fetchExerciseDetails(planData);
            setSetGroups(planData.setGroups || []);
            setIsEditing(true);
          }
        } catch (error) {
          console.error('Error fetching plan details:', error);
        }
      };

      const fetchExerciseDetails = async (planData) => {
        try {
          const exerciseIds = new Set();
          planData.setGroups.forEach(group => {
            group.sets.forEach(set => {
              exerciseIds.add(set.exerciseId);
            });
          });

          const exercisePromises = Array.from(exerciseIds).map(async (exerciseId) => {
            const exerciseDoc = await getDoc(doc(firestore, 'exercises', exerciseId));
            return { id: exerciseId, data: exerciseDoc.data() };
          });

          const exerciseResults = await Promise.all(exercisePromises);
          const exerciseData = exerciseResults.reduce((acc, { id, data }) => {
            acc[id] = data;
            return acc;
          }, {});

          setExercises(exerciseData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching exercises:', error);
        }
      };

      fetchPlanDetails();
    }
  }, [id]);

  const handleSavePlan = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const planData = {
          userId: user.uid,
          name: planName,
          instructions: planInstructions ? planInstructions : "",
          createdDate: dayjs().format('YYYY-MM-DD'),
          setGroups: setGroups.map((group, index) => ({
            number: group.isSuperSet ? group.number : null,
            isSuperSet: group.isSuperSet,
            sets: group.sets.map(exercise => ({
              number: group.isSuperSet ? null : exercise.number,
              reps: exercise.reps,
              time: exercise.time ? exercise.time: 0,
              exerciseId: exercise.exerciseId,
              notes: exercise.notes ? exercise.notes : ''
            }))
          }))
        };

        if (isEditing) {
          // Update existing plan
          await updateDoc(doc(firestore, 'workoutPlans', id), planData);
        } else {
          // Create new plan
          await addDoc(collection(firestore, 'workoutPlans'), planData);
        }
        setPlanName('');
        setSetGroups([]);
        navigate('/workout-plans');
      }
    } catch (error) {
      console.error('Error creating workout plan:', error);
    }
  };

  const addExercise = async (exercise) => {
    setLoading(true);
    // Add the exercise to the exercises list first
    await new Promise(resolve => {
      setExercises(prevExercises => {
        const newExercises = { ...prevExercises };
        newExercises[exercise.id] = {
          description: exercise.description,
          imageUrl: exercise.imageUrl,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          name: exercise.name
        };
        resolve(newExercises);
        return newExercises;
      });
    });

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

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    setSetGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const [movedSetGroup] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, movedSetGroup);
      return newGroups;
    });
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

    setExercises(prevExercises => {
      const { [exerciseId]: _, ...newExercises } = prevExercises; // Remove the exercise using destructuring
      return newExercises;
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

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="sm" className='create-workout-container'>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Edit Workout Plan' : 'Create Workout Plan'}
      </Typography>
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

      <Modal open={isAddingExercise} onClose={() => setIsAddingExercise(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', bgcolor: 'background.paper', boxShadow: 24, overflowY: 'auto', p: 4 }}>
          <ExerciseLibrary onSelectExercise={addExercise} onClose={() => setIsAddingExercise(false)} />
        </Box>
      </Modal>

      <div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {setGroups.map((group, groupIndex) => (
                  <Draggable key={`${groupIndex}`} draggableId={`${groupIndex}`} index={groupIndex}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
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
                                  {exercises[exercise.exerciseId] && (
                                    <img
                                      src={`../${exercises[exercise.exerciseId].imageUrl}`}
                                      alt={exercises[exercise.exerciseId].name}
                                      style={{ width: '80%' }}
                                    />
                                  )}
                                </Grid>
                                {!group.isSuperSet ? (
                                  <Grid item xs={2}>
                                    <Typography>{exercises[exercise.exerciseId]?.name}</Typography>
                                  </Grid>
                                ) :
                                  <Grid item xs={3}>
                                    <Typography>{exercises[exercise.exerciseId]?.name}</Typography>
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
                                <Grid item xs={2}>
                                  <TextField label="Reps" type="number" value={exercise.reps}
                                    onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'reps', e.target.value)}
                                    fullWidth />
                                </Grid>
                                {!group.isSuperSet ? (
                                  <Grid item xs={3}>
                                    <TextField label="Notes" value={exercise.notes}
                                      onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'notes', e.target.value)}
                                      fullWidth />
                                  </Grid>
                                ) :
                                  <Grid item xs={4}>
                                    <TextField label="Notes" value={exercise.notes}
                                      onChange={(e) => updateExercise(groupIndex, exerciseIndex, 'notes', e.target.value)}
                                      fullWidth />
                                  </Grid>}
                                <Grid item xs={1}>
                                  <IconButton onClick={() => removeExercise(groupIndex, exerciseIndex, exercise.exerciseId)}>
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
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <Box mt={3} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePlan}
          style={{ marginRight: '8px' }}
        >
          Save Workout Plan
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => navigate('/workout-plans')}>
          Cancel
        </Button>
      </Box>
    </Container>
  );
};

export default CreateWorkoutPlan;