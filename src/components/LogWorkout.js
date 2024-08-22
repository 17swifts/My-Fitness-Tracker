import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, List, TextField, Divider, IconButton, Grid, Link } from '@mui/material';
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
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [timeSpentOnPage, setTimeSpentOnPage] = useState(0); // in milliseconds
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      try {
        const docRef = doc(firestore, 'workoutPlans', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const planData = { id: docSnap.id, ...docSnap.data() };
          setWorkoutPlan(planData);
          await fetchExerciseDetails(planData);
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
        setExercises(exerciseData);

        await fetchExerciseHistory(exerciseIds);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };

    const fetchExerciseHistory = async (exerciseIds) => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const historyPromises = Array.from(exerciseIds).map(async (exerciseId) => {
          const historyQuery = query(
            collection(firestore, 'exerciseStats'),
            where('exerciseId', '==', exerciseId),
            where('userId', '==', user.uid)
          );
          const historySnapshot = await getDocs(historyQuery);
          const historyData = historySnapshot.docs.map(doc => doc.data());

          return { id: exerciseId, data: historyData };
        });

        const historyResults = await Promise.all(historyPromises);
        const historyData = historyResults.reduce((acc, { id, data }) => {
          acc[id] = data;
          return acc;
        }, {});

        setExerciseHistory(historyData);
      } catch (error) {
        console.error('Error fetching exercise history:', error);
      }
    };

    fetchWorkoutPlan();
  }, [id]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeSpentOnPage(prevTime => prevTime + 1000); // increment by 1 second
    }, 1000); // every 1 second
    return () => clearInterval(intervalId); // cleanup
  }, []); // run only once on mount

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
      const workoutDuration = timeSpentOnPage;  // Replace with actual calculation

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
            if(group.isSuperSet) {
              Array.from(Array(parseInt(group.number)).keys()).forEach(async i => {
                const stats = completedWorkout[exerciseId]?.[i+1];
                if (stats) {
                  await addDoc(collection(firestore, 'exerciseStats'), {
                    exerciseId,
                    setNumber: i+1,
                    reps: stats.reps,
                    weight: stats.weight,
                    volume: parseInt(stats.reps) * parseInt(stats.weight) * parseInt(group.number),
                    metric: parseInt(stats.reps) * parseInt(stats.weight),
                    date: workoutDate,
                    userId: user.uid
                  });
                }
              });
            }
            else {
              Array.from(Array(parseInt(group.sets[0].number)).keys()).forEach(async i => {
                const stats = completedWorkout[exerciseId]?.[i+1];
                if (stats) {
                  await addDoc(collection(firestore, 'exerciseStats'), {
                    exerciseId,
                    setNumber: i+1,
                    reps: stats.reps,
                    weight: stats.weight,
                    volume: parseInt(stats.reps) * parseInt(stats.weight) * parseInt(group.sets[0].number),
                    metric: parseInt(stats.reps) * parseInt(stats.weight),
                    date: workoutDate,
                    userId: user.uid
                  });
                }
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

  const renderHistoricalData = (exerciseId, reps, setNo) => {
    const history = exerciseHistory[exerciseId];
    if (!history || history.length === 0) return null;

    const lastMatch = history.find(h => parseInt(h.reps) === parseInt(reps) && parseInt(h.setNumber) === parseInt(setNo));
    if (!lastMatch) return null;

    return (
      <Typography variant="body2" color="textSecondary">
        {lastMatch.reps} x {lastMatch.weight} kg
      </Typography>
    );
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

      {workoutPlan.instructions && (
        <Box mb={2}>
          <Typography variant="h6">Instructions:</Typography>
          <Typography dangerouslySetInnerHTML={{ __html: workoutPlan.instructions }}></Typography>
        </Box>
      )}

      <List>
        {workoutPlan.setGroups.map((group, index) => (
          <React.Fragment key={index}>
            {group.isSuperSet ? (
            <Box mb={2}>
              <Typography variant="h5" gutterBottom>{`Super Set ${group.number}`}</Typography>
              {Array.apply(null, { length: group.number }).map((_e, i) => (
                <React.Fragment key={i}>
                  <Typography variant="h6">{`Set ${i + 1}`}</Typography> 
                  {group.sets.map((set) => (
                    <Box key={`${set.exerciseId}-${i}`} mb={2}>
                      <Typography>{exercises[set.exerciseId]?.name}</Typography>
                      <Typography>{set.reps}{set.notes ? ` - ${set.notes}` : ''}</Typography>
                      <Grid container spacing={1} alignItems="center" justifyContent="left">
                        <Grid item xs={1}>
                          <Link href={`/exercise/${set.exerciseId}`}>
                            <img 
                              src={`../${exercises[set.exerciseId]?.imageUrl}`} 
                              alt={exercises[set.exerciseId]?.name} 
                              style={{ width: '100%' }} 
                            />
                          </Link>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label="Reps"
                            type="number"
                            value={completedWorkout[set.exerciseId]?.[i+1]?.reps || ''}
                            onChange={(e) => handleInputChange(set.exerciseId, i+1, 'reps', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label="Weight (kg)"
                            type="number"
                            value={completedWorkout[set.exerciseId]?.[i+1]?.weight || ''}
                            onChange={(e) => handleInputChange(set.exerciseId, i+1, 'weight', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={5}></Grid>
                        <Grid item xs={1}>{renderHistoricalData(set.exerciseId, set.reps, i+1)}</Grid>
                        <Grid item xs={1}>
                          <IconButton>
                            <MoreVertIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                      <Divider />
                    </Box>
                  ))}
                  <Box key={`rest-${i}`} mb={3}>
                    <Grid container spacing={2} alignItems="center" justifyContent="left">
                      <Grid item xs={1}>
                        <img src='../assets/rest.png' alt='rest' style={{ width: '70%' }} />
                      </Grid>
                      <Grid item xs={9}>
                        <Typography>Rest for 90s</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </React.Fragment>
              ))}
            </Box>
            ) : (
              <Box key={index} mb={2}>
                <Grid container spacing={3} alignItems="center" justifyContent="left">
                  <Grid item xs={1}>
                    <Link href={`/exercise/${group.sets[0].exerciseId}`}>
                      <img 
                        src={`../${exercises[group.sets[0].exerciseId]?.imageUrl}`} 
                        alt={exercises[group.sets[0].exerciseId]?.name} 
                        style={{ width: '100%' }} 
                      />
                    </Link>
                  </Grid>
                  <Grid item xs={9}>
                    <Typography variant="h7" gutterBottom>{exercises[group.sets[0].exerciseId]?.name}</Typography>
                    <Typography variant="subtitle1">{group.sets[0].number} sets x {group.sets[0].reps}{group.sets[0].notes ? ` - ${group.sets[0].notes}` : ''}</Typography>
                  </Grid>
                </Grid>
                {Array.apply(null, { length: group.sets[0].number }).map((_e,i) => (
                  <Box key={`${group.sets[0].exerciseId}-${i}`} mb={2}>
                    <Grid container spacing={1} alignItems="center" justifyContent="left">
                      <Grid item xs={1}>
                        <Typography variant="subtitle1">{`Set ${i + 1}`}</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Reps"
                          type="number"
                          value={completedWorkout[group.sets[0].exerciseId]?.[i+1]?.reps || ''}
                          onChange={(e) => handleInputChange(group.sets[0].exerciseId, i+1, 'reps', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Weight (kg)"
                          type="number"
                          value={completedWorkout[group.sets[0].exerciseId]?.[i+1]?.weight || ''}
                          onChange={(e) => handleInputChange(group.sets[0].exerciseId, i+1, 'weight', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={5}></Grid>
                      <Grid item xs={1}>{renderHistoricalData(group.sets[0].exerciseId, group.sets[0].reps, i+1)}</Grid>
                      <Grid item xs={1}>
                          <IconButton>
                            <MoreVertIcon />
                          </IconButton>
                        </Grid>
                    </Grid>
                    <Divider />
                  </Box>
                ))}
                
              </Box>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default LogWorkout;
