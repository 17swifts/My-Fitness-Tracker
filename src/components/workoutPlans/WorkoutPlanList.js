import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

const countSuperSets = (plan) => {
  return plan.setGroups?.filter((group) => group.sets.length > 1).length || 0;
};

const countRegularSets = (plan) => {
  return plan.setGroups?.filter((group) => group.sets.length === 1).length || 0;
};

const WorkoutPlanList = ({
  workoutPlans,
  search,
  handleDeletePlan,
  navigate,
}) => {
  const filteredPlans = workoutPlans
    .filter((plan) => plan.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

  if (filteredPlans.length === 0) {
    return <p>No workout plans found.</p>;
  }

  return (
    <List>
      {filteredPlans.map((plan) => (
        <ListItem
          key={plan.id}
          button
          onClick={() => navigate(`/workout-plans/${plan.id}`)}
        >
          <ListItemText
            primary={plan.name}
            secondary={
              plan.setGroups?.length > 0
                ? `Includes ${countRegularSets(
                    plan
                  )} exercise(s) and ${countSuperSets(plan)} super set(s)`
                : "No exercises added"
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => navigate(`/create-workout-plan/${plan.id}`)}
            >
              <Edit />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDeletePlan(plan.id)}
            >
              <Delete />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default WorkoutPlanList;
