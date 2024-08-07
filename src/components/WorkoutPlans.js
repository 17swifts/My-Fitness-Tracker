import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const WorkoutPlans = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(collection(firestore, 'workoutPlans'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWorkoutPlans(plans);
        }
      } catch (error) {
        console.error('Error fetching workout plans:', error);
      }
    };

    fetchWorkoutPlans();
  }, []);

  const handleDeletePlan = async (planId) => {
    try {
      await deleteDoc(doc(firestore, 'workoutPlans', planId));
      setWorkoutPlans(workoutPlans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Workout Plans
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => navigate('/create-workout-plan')}
      >
        Create New Plan
      </Button>
      <List>
        {workoutPlans.map((plan) => (
          <ListItem key={plan.id} button>
            <ListItemText
              primary={plan.planName}
              secondary={plan.exercises && plan.exercises.length > 0 
                ? `Includes ${plan.exercises.length} exercises` 
                : 'No exercises added'}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePlan(plan.id)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default WorkoutPlans;
