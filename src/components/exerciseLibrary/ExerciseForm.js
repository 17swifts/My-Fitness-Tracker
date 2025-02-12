import React from "react";
import { TextField, Box, Button } from "@mui/material";

const ExerciseForm = ({
  newExercise,
  setNewExercise,
  handleAddExercise,
  toggleAddExercise,
}) => (
  <Box component="form" onSubmit={handleAddExercise}>
    <TextField
      label="Name"
      value={newExercise.name}
      onChange={(e) => setNewExercise("name", e.target.value)}
      fullWidth
      margin="normal"
      required
    />
    <TextField
      label="Muscle Group"
      value={newExercise.muscleGroup}
      onChange={(e) => setNewExercise("muscleGroup", e.target.value)}
      fullWidth
      margin="normal"
      required
    />
    <TextField
      label="Image URL"
      value={newExercise.imageUrl}
      onChange={(e) => setNewExercise("imageUrl", e.target.value)}
      fullWidth
      margin="normal"
    />
    <TextField
      label="Video URL"
      value={newExercise.videoUrl}
      onChange={(e) => setNewExercise("videoUrl", e.target.value)}
      fullWidth
      margin="normal"
    />
    <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
      Add Exercise
    </Button>
    <Button
      variant="outlined"
      color="secondary"
      onClick={toggleAddExercise}
      sx={{ mt: 2, ml: 2 }}
    >
      Cancel
    </Button>
  </Box>
);

export default ExerciseForm;
