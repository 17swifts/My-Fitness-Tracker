import React from "react";
import {
  List,
  Box,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";

const ExerciseList = ({ exercises, selectedExercise, setSelectedExercise }) => (
  <List sx={{ mt: 2 }}>
    {exercises.map((exercise, index) => (
      <Box
        key={exercise.id}
        onClick={() => setSelectedExercise(exercise)}
        sx={{
          border:
            selectedExercise?.id === exercise.id ? "2px solid blue" : "none",
          padding: "8px",
          cursor: "pointer",
        }}
      >
        <ListItem>
          <ListItemAvatar>
            <Avatar alt={exercise.name} src={exercise.imageUrl} />
          </ListItemAvatar>
          <ListItemText
            primary={exercise.name}
            secondary={exercise.muscleGroup}
          />
        </ListItem>
      </Box>
    ))}
  </List>
);

export default ExerciseList;
