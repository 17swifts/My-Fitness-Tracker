import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, Grid, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import dayjs from 'dayjs';
import axios from 'axios';
import './styles/DashboardPage.css';
import Statistics from './Statistics';
import { useFitbit } from '../context/FitbitContext.js';

const DashboardPage = () => {
  const { fitbitToken } = useFitbit();
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [workoutNames, setWorkoutNames] = useState({});
  const [stepCount, setStepCount] = useState(0);
  const [sleepData, setSleepData] = useState(0);
  const [bodyWeight, setBodyWeight] = useState(0);
  const [bodyFat, setBodyFat] = useState(0);
  const [restingHR, setRestingHR] = useState(0);
  const [caloricBurn, setCaloricBurn] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodayWorkouts = async () => {
      const user = auth.currentUser;
      if (user) {
        const today = dayjs().format('YYYY-MM-DD');
        const q = query(collection(firestore, 'scheduledWorkouts'), where('userId', '==', user.uid), where('date', '==', today));
        const querySnapshot = await getDocs(q);
        const workouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodayWorkouts(workouts);

        const workoutIds = [...new Set(workouts.map(workout => workout.workoutId))];
        const names = {};
        for (const workoutId of workoutIds) {
          const docRef = doc(firestore, 'workoutPlans', workoutId);
          const workoutDoc = await getDoc(docRef);
          if (workoutDoc.exists()) {
            names[workoutId] = workoutDoc.data().name;
          }
        }
        setWorkoutNames(names);
      }
    };

    const fetchProgressData = async () => {
      if (fitbitToken) {
        try {
          const stepData = await axios.get(`https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json`, {
            headers: { Authorization: `Bearer ${fitbitToken}` },
          });
          setStepCount(stepData.data['activities-steps'][0]?.value || '...');

          const sleepResponse = await axios.get(`https://api.fitbit.com/1.2/user/-/sleep/date/today.json`, {
            headers: { Authorization: `Bearer ${fitbitToken}` },
          });
          var totalMinutes = sleepResponse.data.summary.totalMinutesAsleep;
          var hours = Math.floor(totalMinutes / 60);          
          var minutes = totalMinutes % 60;
          setSleepData(`${hours}hrs ${minutes}min`);

          const bodyResponse = await axios.get(`https://api.fitbit.com/1/user/-/body/log/weight/date/today.json`, {
            headers: { Authorization: `Bearer ${fitbitToken}` },
          });
          const body = bodyResponse.data.weight[0] || {};
          setBodyWeight(body.weight || '...');
          setBodyFat(body.fat || '...');

          const hrResponse = await axios.get(`https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json`, {
            headers: { Authorization: `Bearer ${fitbitToken}` },
          });
          console.log(hrResponse.data['activities-heart']);
          setRestingHR(hrResponse.data['activities-heart'][0]?.value.restingHeartRate || '...');

          const caloricResponse = await axios.get(`https://api.fitbit.com/1/user/-/activities/calories/date/today/1d.json`, {
            headers: { Authorization: `Bearer ${fitbitToken}` },
          });
          setCaloricBurn(caloricResponse.data['activities-calories'][0]?.value || '...');
        } catch (error) {
          console.error('Error fetching Fitbit data:', error);
        }
      }
    };

    fetchTodayWorkouts();
    if (fitbitToken) {
      fetchProgressData();
    }
  }, [fitbitToken]);

  const handleWorkoutClick = (workoutId) => {
    navigate(`/workout-plans/${workoutId}`);
  };

  const renderTodaySchedule = () => {
    if (todayWorkouts.length === 0) {
      return (
        <Typography variant="body1">
          Nothing Scheduled. Take a break or hit the + to add a workout or activity.
        </Typography>
      );
    }

    return (
      <List>
        {todayWorkouts.map((workout) => (
          <ListItem key={workout.id} button onClick={() => handleWorkoutClick(workout.id)}>
            <ListItemIcon>
              {workout.isComplete ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}
            </ListItemIcon>
            <ListItemText
              primary={workoutNames[workout.workoutId] || `Workout ID: ${workout.workoutId}`}
              secondary={workout.isComplete ? 'Completed' : 'Incomplete'}
            />
            <FitnessCenterIcon />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box p={3} className="dashboard-container">
      <Typography variant="h4" gutterBottom className="dashboard-heading">
        Dashboard
      </Typography>

      {/* Today's Schedule */}
      <Box mb={4}>
        <Typography variant="h6" className="section-heading">Today's Schedule</Typography>
        {renderTodaySchedule()}
      </Box>

      {/* Quick Links */}
      <Box mb={4}>
        <Typography variant="h6" className="section-heading">Quick Links</Typography>
        <Box className="quick-links-container">
          <Button variant="contained" color="primary" onClick={() => navigate('/create-workout-plan')}>
            Create Workout
          </Button>
          <Button variant="contained" color="primary" onClick={() => navigate('/log-exercise')}>
            Log Exercise
          </Button>
          <Button variant="contained" color="primary" onClick={() => navigate('/exercise-library')}>
            Exercise Library
          </Button>
          <Button variant="contained" color="secondary" onClick={() => navigate('/generate-workout-plan')}>
            Generate Workout
          </Button>
        </Box>
      </Box>

      {/* My Progress */}
      <Box mb={4}>
        <Typography variant="h6" className="section-heading">My Progress</Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Step Count</Typography>
              <Typography variant="h5">{stepCount} steps</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Sleep</Typography>
              <Typography variant="h5">{sleepData}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Body Weight</Typography>
              <Typography variant="h5">{bodyWeight} kg</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Body Fat</Typography>
              <Typography variant="h5">{bodyFat}%</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Resting HR</Typography>
              <Typography variant="h5">{restingHR} bpm</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="progress-box">
              <Typography variant="body1">Caloric Burn</Typography>
              <Typography variant="h5">{caloricBurn} cal</Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Statistics></Statistics>
          </Grid>
          
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
