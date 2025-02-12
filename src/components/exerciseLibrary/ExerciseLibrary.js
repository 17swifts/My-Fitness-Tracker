import React, { useEffect, useReducer, useCallback } from "react";
import { firestore } from "../../firebase";
import { collection, query, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { Button, Typography, IconButton, Box, Collapse } from "@mui/material";
import { Add, FilterList } from "@mui/icons-material";
import ExerciseFilters from "./ExerciseFilters";
import ExerciseForm from "./ExerciseForm";
import ExerciseList from "./ExerciseList";

// Reducer function for managing exercise state
const exerciseReducer = (state, action) => {
  switch (action.type) {
    case "SET_EXERCISES":
      return { ...state, exercises: action.payload };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "SET_SELECTED":
      return { ...state, selectedExercise: action.payload };
    case "TOGGLE_ADD_EXERCISE":
      return { ...state, isAddingExercise: !state.isAddingExercise };
    case "TOGGLE_FILTER":
      return { ...state, filterOpen: !state.filterOpen };
    case "RESET_NEW_EXERCISE":
      return {
        ...state,
        newExercise: { name: "", muscleGroup: "", imageUrl: "", videoUrl: "" },
      };
    case "SET_NEW_EXERCISE":
      return {
        ...state,
        newExercise: { ...state.newExercise, [action.field]: action.value },
      };
    default:
      return state;
  }
};

const ExerciseLibrary = ({ onSelectExercise, onClose }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(exerciseReducer, {
    exercises: [],
    isAddingExercise: false,
    search: "",
    filter: "",
    category: "",
    selectedExercise: null,
    filterOpen: false,
    newExercise: { name: "", muscleGroup: "", imageUrl: "", videoUrl: "" },
  });

  const fetchExercises = useCallback(async () => {
    const q = query(collection(firestore, "exercises"));
    const querySnapshot = await getDocs(q);
    const exercisesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    dispatch({ type: "SET_EXERCISES", payload: exercisesData });
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleAddExercise = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestore, "exercises"), {
        ...state.newExercise,
        userId: user.uid,
      });
      dispatch({ type: "RESET_NEW_EXERCISE" });
      dispatch({ type: "TOGGLE_ADD_EXERCISE" });
      fetchExercises();
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };

  // Filter the exercise list dynamically based on the state**
  const filteredExercises = state.exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(state.search.toLowerCase()) &&
      (!state.filter || exercise.muscleGroup === state.filter) &&
      (!state.category || exercise.category === state.category)
  );

  // **Handle selecting an exercise and return it to the parent**
  const handleSelectExercise = (exercise) => {
    dispatch({ type: "SET_SELECTED", payload: exercise });
    onSelectExercise(exercise);
    onClose();
  };

  return (
    <Box p={2}>
      <Typography variant="h4">
        Exercise Library
        <IconButton
          color="primary"
          onClick={() => dispatch({ type: "TOGGLE_ADD_EXERCISE" })}
        >
          <Add />
        </IconButton>
        <IconButton
          color="primary"
          onClick={() => dispatch({ type: "TOGGLE_FILTER" })}
        >
          <FilterList />
        </IconButton>
      </Typography>

      <Collapse in={state.filterOpen}>
        <ExerciseFilters
          search={state.search}
          setSearch={(value) =>
            dispatch({ type: "SET_SEARCH", payload: value })
          }
          filter={state.filter}
          setFilter={(value) =>
            dispatch({ type: "SET_FILTER", payload: value })
          }
          category={state.category}
          setCategory={(value) =>
            dispatch({ type: "SET_CATEGORY", payload: value })
          }
        />
      </Collapse>

      {state.isAddingExercise && (
        <ExerciseForm
          newExercise={state.newExercise}
          setNewExercise={(field, value) =>
            dispatch({ type: "SET_NEW_EXERCISE", field, value })
          }
          handleAddExercise={handleAddExercise}
          toggleAddExercise={() => dispatch({ type: "TOGGLE_ADD_EXERCISE" })}
        />
      )}

      <ExerciseList
        exercises={filteredExercises}
        selectedExercise={state.selectedExercise}
        setSelectedExercise={handleSelectExercise}
      />

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
