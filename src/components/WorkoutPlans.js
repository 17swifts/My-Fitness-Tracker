import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';  // Added Edit icon
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

  const handleEditPlan = (planId) => {
    navigate(`/create-workout-plan/${planId}`);  // Navigating to the edit page with the plan ID
  };

  const countSuperSets = (plan) => {
    if (!plan || !Array.isArray(plan.setGroups)) {
      throw new Error("Invalid plan structure");
    }

    let count = 0;
    plan.setGroups.forEach((group) => {
      if (group.sets && group.sets.length > 1) {
        count++;
      }
    });

    return count;
  };

  const countRegularSets = (plan) => {
    if (!plan || !Array.isArray(plan.setGroups)) {
      throw new Error("Invalid plan structure");
    }

    let count = 0;
    plan.setGroups.forEach((group) => {
      if (group.sets && group.sets.length === 1) {
        count++;
      }
    });

    return count;
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
      <Button variant="contained" color="secondary" onClick={() => navigate('/generate-workout')}>
        Generate Workout
      </Button>
      <List>
      {workoutPlans
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)) // Sort by createdDate, most recent first
      .map((plan) => (
        <ListItem key={plan.id} button onClick={() => navigate(`/workout-plans/${plan.id}`)}>
          <ListItemText
            primary={plan.name}
            secondary={plan.setGroups && plan.setGroups.length > 0 
              ? `Includes ${countRegularSets(plan)} exercise(s) and ${countSuperSets(plan)} super set(s)` 
              : 'No exercises added'}
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="edit" onClick={() => handleEditPlan(plan.id)}>
              <Edit />
            </IconButton>
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
