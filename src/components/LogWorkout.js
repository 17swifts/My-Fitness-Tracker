import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, List, ListItem, ListItemText, TextField, Divider, IconButton } from '@mui/material';
import { firestore, auth } from '../firebase';
import { doc, getDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TimerIcon from '@mui/icons-material/Timer';

const LogWorkout = () => {
  const { id } = useParams();
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [exercises, setExercises] = useState({});
  const [completedWorkout, setCompletedWorkout] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      try {
        const docRef = doc(firestore, 'workoutPlans', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const planData = { id: docSnap.id, ...docSnap.data() };
          setWorkoutPlan(planData);
          fetchExerciseDetails(planData);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching workout plan:', error);
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
        console.log(exerciseData);
        setExercises(exerciseData);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };

    fetchWorkoutPlan();
  }, [id]);

  const handleInputChange = (exerciseId, setNumber, field, value) => {
    setCompletedWorkout(prevState => ({
      ...prevState,
      [exerciseId]: {
        ...prevState[exerciseId],
        [setNumber]: {
          ...prevState[exerciseId]?.[setNumber],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveWorkout = async () => {
    try {
      const user = auth.currentUser;
      const workoutDate = dayjs().format('YYYY-MM-DD');
      const workoutDuration = 'calculateDuration()';  // Replace with actual calculation

      if (user) {
        // Save to loggedWorkouts
        await addDoc(collection(firestore, 'loggedWorkouts'), {
          workoutId: id,
          date: workoutDate,
          duration: workoutDuration,
          userId: user.uid
        });

        // Update scheduledWorkouts
        const scheduledWorkoutsQuery = query(collection(firestore, 'scheduledWorkouts'), where('userId', '==', user.uid), where('workoutId', '==', id), where('date', '==', workoutDate));
        const scheduledWorkoutSnapshot = await getDocs(scheduledWorkoutsQuery);
        scheduledWorkoutSnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { isComplete: true });
        });

        // Save exercise stats
        workoutPlan.setGroups.forEach(group => {
          group.sets.forEach(async (set) => {
            const exerciseId = set.exerciseId;
            const stats = completedWorkout[exerciseId]?.[set.number];

            if (stats) {
              await addDoc(collection(firestore, 'exerciseStats'), {
                exerciseId,
                setNumber: set.number,
                reps: stats.reps,
                weight: stats.weight,
                date: workoutDate,
                userId: user.uid
              });
            }
          });
        });

        // Navigate back to the workout detail page
        navigate(`/workout-plans/${id}`);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/workout-plans/${id}`);
  };

  if (!workoutPlan) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box p={3}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'white', pb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSaveWorkout}>
          Save
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleCancel} sx={{ ml: 2 }}>
          Cancel
        </Button>
        <IconButton>
          <TimerIcon />
        </IconButton>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        {workoutPlan.name}
      </Typography>

      <List>
        {workoutPlan.setGroups.map((group, index) => (
          <React.Fragment key={index}>
            {group.isSuperSet && (
              <ListItem>
                <ListItemText
                  primary={`Super Set of ${group.number} sets`}
                  secondary={group.sets.map((set, setIndex) => (
                    <Box key={setIndex} mb={2}>
                      {exercises[set.exerciseId] && (
                        <>
                          <Typography>{exercises[set.exerciseId].name}</Typography>
                          <img src={`../${exercises[set.exerciseId].imageUrl}`} alt={exercises[set.exerciseId].name} style={{ width: '7%' }} />
                        </>
                      )}
                      <TextField
                        label="Reps"
                        type="number"
                        value={completedWorkout[set.exerciseId]?.[set.number]?.reps || ''}
                        onChange={(e) => handleInputChange(set.exerciseId, set.number, 'reps', e.target.value)}
                      />
                      <TextField
                        label="Weight (kg)"
                        type="number"
                        value={completedWorkout[set.exerciseId]?.[set.number]?.weight || ''}
                        onChange={(e) => handleInputChange(set.exerciseId, set.number, 'weight', e.target.value)}
                      />
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  ))}
                />
              </ListItem>
            )}
            {!group.isSuperSet && (
              <ListItem>
                <ListItemText
                  primary={''}
                  secondary={group.sets.map((set, setIndex) => (
                    <Box key={setIndex} mb={2}>
                      {exercises[set.exerciseId] && (
                        <>
                          <Typography>{exercises[set.exerciseId].name}</Typography>
                          <img src={`../${exercises[set.exerciseId].imageUrl}`} alt={exercises[set.exerciseId].name} style={{ width: '7%' }} />
                        </>
                      )}
                      <TextField
                        label="Reps"
                        type="number"
                        value={completedWorkout[set.exerciseId]?.[set.number]?.reps || ''}
                        onChange={(e) => handleInputChange(set.exerciseId, set.number, 'reps', e.target.value)}
                      />
                      <TextField
                        label="Weight (kg)"
                        type="number"
                        value={completedWorkout[set.exerciseId]?.[set.number]?.weight || ''}
                        onChange={(e) => handleInputChange(set.exerciseId, set.number, 'weight', e.target.value)}
                      />
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  ))}
                />
              </ListItem>
            )}
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default LogWorkout;
