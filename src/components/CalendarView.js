import React, { useEffect, useState } from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import PoolIcon from '@mui/icons-material/Pool';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import dayjs from 'dayjs';
import './styles/CalendarView.css';

const CalendarView = () => {
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [workoutNames, setWorkoutNames] = useState({});
  const [activities, setActivities] = useState({});
  const [dates, setDates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduledWorkouts = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(collection(firestore, 'scheduledWorkouts'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const workouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setScheduledWorkouts(workouts);

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

          // Mock activities, replace this with your API fetching logic
          setActivities({
            "2024-08-14": [{ type: 'exercise', name: 'Walking', isComplete: true, exerciseType: "Walk" }],
            "2024-08-21": [{ type: 'exercise', name: 'Swimming', isComplete: false, exerciseType: "Swim" }],
            "2024-08-11": [{ type: 'meals', name: '3 Meals Added', isComplete: false }]
          });
        }
      } catch (error) {
        console.error('Error fetching scheduled workouts:', error);
      }
    };

    // Generate past 2 weeks' dates
    const generatePastTwoWeeksDates = () => {
      const today = dayjs();
      const datesArray = [];

      for (let i = 7; i >= 0; i--) {
        datesArray.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
      }
      for (let i = 1; i < 15; i++) {
        datesArray.push(today.add(i, 'day').format('YYYY-MM-DD'));
      }

      setDates(datesArray);
    };

    fetchScheduledWorkouts();
    generatePastTwoWeeksDates();
  }, []);

  const handleWorkoutClick = (workoutId) => {
    navigate(`/workout-plans/${workoutId}`);
  };

  const renderActivities = (date) => {
    const dateActivities = activities[date] || [];
    return dateActivities.map((activity, index) => (
      <ListItem className="list-item" key={index}>
        <ListItemIcon className={`${activity.isComplete ? 'completed-icon' : 'incomplete-icon'}`}>
          {activity.isComplete ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}
        </ListItemIcon>
        <ListItemText
          className="list-item-text"
          primary={activity.name}
          secondary={activity.type === 'exercise' ? '4.26km | 54.55 minutes' : `Calories: 1800`} // Example secondary text
          secondaryTypographyProps={{ className: 'list-item-text-secondary' }}
        />
        {activity.type === 'exercise' && activity.exerciseType === 'Walk' && <DirectionsWalkIcon className="activity-icon"/>}
        {activity.type === 'exercise' && activity.exerciseType === 'Swim' && <PoolIcon className="activity-icon"/>}
        {activity.type === 'exercise' && activity.exerciseType === 'Run' && <DirectionsRunIcon className="activity-icon"/>}
        {activity.type === 'meals' && <RestaurantIcon className="activity-icon"/>}
      </ListItem>
    ));
  };

  const renderWorkoutForDate = (date) => {
    const workoutsForDate = scheduledWorkouts.filter(workout => workout.date === date);
    if (workoutsForDate.length > 0) {
      return workoutsForDate.map((workout) => (
        <ListItem className="list-item" key={`${workout.id}-${date}`} button onClick={() => handleWorkoutClick(workout.workoutId)}>
          <ListItemIcon className={`${workout.isComplete ? 'completed-icon' : 'incomplete-icon'}`}>
            {workout.isComplete ? <CheckCircleIcon color="success"/> : <RadioButtonUncheckedIcon />}
          </ListItemIcon>
          <ListItemText
            primary={workoutNames[workout.workoutId] || `Workout ID: ${workout.workoutId}`}
            secondary={workout.isComplete ? 'Completed' : 'Incomplete'}
            className="list-item-text"
            secondaryTypographyProps={{ className: 'list-item-text-secondary' }}
          />
          <FitnessCenterIcon className="activity-icon" />
        </ListItem>
      ));
    } else {
      return (
        <ListItem className="list-item">
          <ListItemText className="list-item-text-secondary" primary="No workouts scheduled" />
        </ListItem>
      );
    }
  };

  return (
    <Box className="calendar-container">
      <Typography className="calendar-heading" variant="h4" gutterBottom>
        Calendar
      </Typography>
      <List>
        {dates.map((date) => (
          <Box key={date} className="mb-3">
            <Typography className="date-header">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            {renderWorkoutForDate(date)}
            {renderActivities(date)}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default CalendarView;
