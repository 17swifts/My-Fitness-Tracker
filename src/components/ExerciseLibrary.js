import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, query, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth"; // Custom hook to get current user
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Collapse,
} from "@mui/material";
import { Add, FilterList } from "@mui/icons-material";
import "./styles/ExerciseLibrary.css";

const ExerciseLibrary = ({ onSelectExercise, onClose }) => {
  const [exercises, setExercises] = useState([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [filter2, setFilter2] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "",
    imageUrl: "",
    videoUrl: "",
  });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const q = query(collection(firestore, "exercises"));
    const querySnapshot = await getDocs(q);
    const exercisesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setExercises(exercisesData);
  };

  const handleAddExercise = async () => {
    try {
      await addDoc(collection(firestore, "exercises"), {
        ...newExercise,
        userId: user.uid,
      });
      setNewExercise({ name: "", muscleGroup: "", imageUrl: "", videoUrl: "" });
      fetchExercises(); // Refetch exercises after adding a new one
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };

  const filteredExercises = exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(search.toLowerCase()) &&
      (!filter || exercise.muscleGroup === filter) &&
      (!filter2 || exercise.category === filter2)
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        p: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Exercise Library
        <IconButton
          color="primary"
          onClick={() => setIsAddingExercise(!isAddingExercise)}
        >
          <Add />
        </IconButton>
        <IconButton color="primary" onClick={() => setFilterOpen(!filterOpen)}>
          <FilterList />
        </IconButton>
      </Typography>
      {/* Sticky add button */}
      {selectedExercise && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSelectExercise(selectedExercise)}
          sx={{ position: "sticky", top: 0, right: 0, mb: 2, zIndex: 1000 }}
        >
          Add
        </Button>
      )}

      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Exercises"
        fullWidth
      />

      {/* Filter Section */}
      <Collapse in={filterOpen}>
        <Box sx={{ mb: 2 }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Muscle Group"
            displayEmpty
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            {/* ... Muscle Groups */}
            <MenuItem value="Back">Back</MenuItem>
            <MenuItem value="Shoulders">Shoulders</MenuItem>
            <MenuItem value="Core">Core</MenuItem>
            <MenuItem value="Chest">Chest</MenuItem>
            <MenuItem value="Biceps">Biceps</MenuItem>
            <MenuItem value="Triceps">Triceps</MenuItem>
            <MenuItem value="Glutes">Glutes</MenuItem>
            <MenuItem value="Calves">Calves</MenuItem>
            <MenuItem value="Hamstrings">Hamstrings</MenuItem>
            <MenuItem value="Quads">Quads</MenuItem>
            <MenuItem value="Full Body">Full Body</MenuItem>
            <MenuItem value="Cardio">Cardio</MenuItem>
            <MenuItem value="Forearm">Forearm</MenuItem>
          </Select>
          <Select
            value={filter2}
            onChange={(e) => setFilter2(e.target.value)}
            placeholder="Category"
            displayEmpty
            fullWidth
          >
            <MenuItem value="">All</MenuItem>
            {/* ... Exercise Categories */}
            <MenuItem value="Push">Push</MenuItem>
            <MenuItem value="Pull">Pull</MenuItem>
            <MenuItem value="Squat">Squat</MenuItem>
            <MenuItem value="Lunge">Lunge</MenuItem>
            <MenuItem value="Hinge">Hinge</MenuItem>
            <MenuItem value="Gait">Gait</MenuItem>
            <MenuItem value="Twist">Twist</MenuItem>
          </Select>
        </Box>
      </Collapse>

      {/* List format for exercises */}
      <List sx={{ mt: 2 }}>
        {filteredExercises.map((exercise, index) => (
          <Box
            onClick={() => setSelectedExercise(exercise)}
            sx={{
              border:
                selectedExercise?.id === exercise.id
                  ? "2px solid blue"
                  : "none",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            <ListItem key={index}>
              <ListItemAvatar>
                <Avatar alt={exercise.name} src={`../${exercise.imageUrl}`} />
              </ListItemAvatar>
              <ListItemText
                primary={exercise.name}
                secondary={exercise.muscleGroup}
              />
            </ListItem>
          </Box>
        ))}
      </List>

      {isAddingExercise && (
        <form onSubmit={handleAddExercise}>
          {/* Fields for adding new exercise */}
          <TextField
            label="Name"
            value={newExercise.name}
            onChange={(e) =>
              setNewExercise({ ...newExercise, name: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Muscle Group"
            value={newExercise.muscleGroup}
            onChange={(e) =>
              setNewExercise({ ...newExercise, muscleGroup: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Image URL"
            value={newExercise.imageUrl}
            onChange={(e) =>
              setNewExercise({ ...newExercise, imageUrl: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Video URL"
            value={newExercise.videoUrl}
            onChange={(e) =>
              setNewExercise({ ...newExercise, videoUrl: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            Add Exercise
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsAddingExercise(!isAddingExercise)}
            sx={{ mt: 2 }}
          >
            Cancel
          </Button>
        </form>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={onClose}
        sx={{ mt: 2 }}
      >
        Back
      </Button>
    </Box>
  );
};

export default ExerciseLibrary;
