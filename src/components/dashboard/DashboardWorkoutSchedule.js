import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  FitnessCenter,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const DashboardWorkoutSchedule = ({ workouts, workoutNames }) => {
  const navigate = useNavigate();

  if (workouts.length === 0) {
    return (
      <Typography variant="body1">
        Nothing Scheduled. Take a break or add a workout.
      </Typography>
    );
  }

  return (
    <List>
      {workouts.map((workout) => (
        <ListItem
          key={workout.id}
          button
          onClick={() => navigate(`/workout-plans/${workout.id}`)}
        >
          <ListItemIcon>
            {workout.isComplete ? (
              <CheckCircle color="success" />
            ) : (
              <RadioButtonUnchecked />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              workoutNames[workout.workoutId] || `Workout ${workout.workoutId}`
            }
          />
          <FitnessCenter />
        </ListItem>
      ))}
    </List>
  );
};

export default DashboardWorkoutSchedule;
