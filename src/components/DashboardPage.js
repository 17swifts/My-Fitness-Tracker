import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, Grid, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import dayjs from 'dayjs';
import './styles/DashboardPage.css';
import Statistics from './Statistics';

const DashboardPage = () => {
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

    // Mock data fetching for Fitbit and InBody, replace with actual API calls
    const fetchProgressData = () => {
      setStepCount(7500); // Example step count
      setSleepData(7.5); // Example sleep hours
      setBodyWeight(75); // Example body weight in kg
      setBodyFat(28.7); // Example body fat percentage
      setRestingHR(63); // Example resting heart rate
      setCaloricBurn(2200); // Example caloric burn
    };

    fetchTodayWorkouts();
    fetchProgressData();
  }, []);

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
          <ListItem key={workout.id} button onClick={() => handleWorkoutClick(workout.workoutId)}>
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
          <Button variant="contained" color="secondary" onClick={() => navigate('/generate-workout')}>
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
              <Typography variant="h5">{sleepData} hours</Typography>
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
              <Typography variant="h5">{caloricBurn} kcal</Typography>
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
