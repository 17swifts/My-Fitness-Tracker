import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const ScheduleWorkout = () => {
  const { workoutId } = useParams();
  const [workoutDate, setWorkoutDate] = useState(null);
  const [error, setError] = useState('');
  const [scheduledDates, setScheduledDates] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchScheduledWorkouts = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(collection(firestore, 'scheduledWorkouts'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const dates = querySnapshot.docs.map(doc => doc.data().workoutDate);
          setScheduledDates(dates);
        }
      } catch (error) {
        console.error('Error fetching scheduled workouts:', error);
      }
    };

    fetchScheduledWorkouts();
  }, []);

  const handleScheduleWorkout = async () => {
    if (!workoutDate) {
      setError('Please select a workout date.');
      return;
    }

    const formattedDate = dayjs(workoutDate).format('YYYY-MM-DD');
    if (scheduledDates.includes(formattedDate)) {
      setError('You have already scheduled a workout for this date.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(firestore, 'scheduledWorkouts'), {
          date: formattedDate,
          workoutId,
          isComplete: false,
          userId: user.uid,
        });
        setWorkoutDate(null);
        setError('');
        setSuccessMessage(`Successfully scheduled workout for ${formattedDate}`);
      }
    } catch (error) {
      console.error('Error scheduling workout:', error);
      setError('Failed to schedule workout. Please try again.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Schedule Workout
        </Typography>
        <DatePicker
          label="Workout Date"
          value={workoutDate}
          onChange={(date) => setWorkoutDate(date ? date : null)}
          renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button variant="contained" color="primary" onClick={handleScheduleWorkout}>
          Schedule Workout
        </Button>
        {successMessage && (
          <Alert severity="success" sx={{ marginTop: 2 }}>
            {successMessage}
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ScheduleWorkout;
