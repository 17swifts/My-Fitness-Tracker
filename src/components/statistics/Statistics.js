import React, { useState, useEffect, useReducer } from "react";
import { auth, firestore } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  Modal,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import ExerciseLibrary from "../exerciseLibrary/ExerciseLibrary";
import ExerciseStatsCard from "./ExerciseStatsCard";

// Reducer for handling state
const statsReducer = (state, action) => {
  switch (action.type) {
    case "SET_STATS":
      return { ...state, stats: action.payload, loading: false };
    case "SET_EXERCISES":
      return { ...state, exercises: action.payload };
    case "SET_SELECTED_EXERCISES":
      return { ...state, selectedExercises: action.payload };
    case "SET_EXERCISE_DATA":
      return {
        ...state,
        exerciseData: { ...state.exerciseData, ...action.payload },
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const Statistics = () => {
  const [state, dispatch] = useReducer(statsReducer, {
    stats: [],
    exercises: {},
    selectedExercises: ["Deadlift", "Bench Press", "Back Squat", "Hip Thrust"],
    exerciseData: {},
    loading: true,
    error: null,
  });

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Fetch user stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(firestore, "exerciseStats"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const statsData = querySnapshot.docs.map((doc) => doc.data());

          dispatch({ type: "SET_STATS", payload: statsData });
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to fetch statistics" });
        console.error(error);
      }
    };

    fetchStats();
  }, []);

  // Fetch exercises only once
  useEffect(() => {
    const fetchExercises = async () => {
      const q = query(collection(firestore, "exercises"));
      const querySnapshot = await getDocs(q);
      const exercisesData = querySnapshot.docs.reduce((acc, doc) => {
        acc[doc.data().name] = { id: doc.id, ...doc.data() };
        return acc;
      }, {});

      dispatch({ type: "SET_EXERCISES", payload: exercisesData });
    };

    fetchExercises();
  }, []);

  // Fetch data for selected exercises
  useEffect(() => {
    if (state.stats.length === 0) return;

    const exerciseData = state.selectedExercises.reduce((acc, exerciseName) => {
      const exercise = state.exercises[exerciseName];
      if (!exercise) return acc;

      acc[exerciseName] = state.stats.filter(
        (stat) => stat.exerciseId === exercise.id
      );
      return acc;
    }, {});

    dispatch({ type: "SET_EXERCISE_DATA", payload: exerciseData });
  }, [state.stats, state.selectedExercises, state.exercises]);

  // Add exercise to selected list
  const handleAddExercise = (exercise) => {
    const exerciseName = exercise.name;
    if (!state.selectedExercises.includes(exerciseName)) {
      dispatch({
        type: "SET_SELECTED_EXERCISES",
        payload: [...state.selectedExercises, exerciseName],
      });
    }
    setIsLibraryOpen(false);
  };

  if (state.loading) return <CircularProgress />;
  if (state.error)
    return (
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Statistics
        </Typography>
        <Typography color="error">{state.error}</Typography>
      </Container>
    );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Statistics
      </Typography>
      <Button onClick={() => setIsLibraryOpen(true)}>
        Add Exercise <Add />
      </Button>

      <Modal open={isLibraryOpen} onClose={() => setIsLibraryOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            bgcolor: "background.paper",
            boxShadow: 24,
            overflowY: "auto",
            p: 4,
          }}
        >
          <ExerciseLibrary
            onSelectExercise={handleAddExercise}
            onClose={() => setIsLibraryOpen(false)}
          />
        </Box>
      </Modal>

      {state.selectedExercises.map((exercise) => (
        <ExerciseStatsCard
          key={exercise}
          exerciseName={exercise}
          exerciseData={state.exerciseData[exercise]}
        />
      ))}
    </Box>
  );
};

export default Statistics;
