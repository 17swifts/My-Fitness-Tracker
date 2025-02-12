import React, { useReducer, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Modal,
  Box,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ExerciseLibrary from "./exerciseLibrary/ExerciseLibrary";
import { Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import SaveWorkoutModal from "./SaveWorkoutModal";

// Reducer for managing state
const workoutReducer = (state, action) => {
  switch (action.type) {
    case "SET_PLAN":
      return { ...state, ...action.payload };
    case "ADD_EXERCISE":
      return {
        ...state,
        setGroups: action.payload.setGroups,
        exercises: { ...state.exercises, ...action.payload.newExercise },
      };
    case "UPDATE_EXERCISE":
      return {
        ...state,
        setGroups: action.payload,
      };
    case "REMOVE_EXERCISE":
      return {
        ...state,
        setGroups: action.payload.newGroups,
        exercises: action.payload.newExercises,
      };
    case "TOGGLE_SUPERSET":
      return { ...state, setGroups: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(workoutReducer, {
    planName: "",
    planInstructions: "",
    setGroups: [],
    exercises: {},
    loading: false,
    isEditing: !!id,
    showSaveModal: false,
    isAddingExercise: false,
    currentGroupIndex: null,
  });

  useEffect(() => {
    if (id) {
      dispatch({ type: "SET_LOADING", payload: true });
      getDoc(doc(firestore, "workoutPlans", id)).then((docSnap) => {
        if (docSnap.exists()) {
          dispatch({
            type: "SET_PLAN",
            payload: { ...docSnap.data(), isEditing: true, loading: false },
          });
        }
      });
    }
  }, [id]);

  const handleSavePlan = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    const user = auth.currentUser;
    const planData = {
      userId: user.uid,
      name: state.planName,
      instructions: state.planInstructions || "",
      createdDate: dayjs().format("YYYY-MM-DD"),
      setGroups: state.setGroups,
    };

    if (state.isEditing) {
      dispatch({ type: "SHOW_SAVE_MODAL", payload: true });
    } else {
      await addDoc(collection(firestore, "workoutPlans"), planData);
      navigate("/workout-plans");
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4">
        {state.isEditing ? "Edit Workout Plan" : "Create Workout Plan"}
      </Typography>
      <TextField
        label="Plan Name"
        value={state.planName}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Instructions"
        fullWidth
        multiline
        margin="normal"
        rows={5}
        value={state.planInstructions}
      />

      <Button variant="contained" color="primary" onClick={handleSavePlan}>
        Save Workout Plan
      </Button>

      <SaveWorkoutModal
        open={state.showSaveModal}
        onClose={() => dispatch({ type: "SHOW_SAVE_MODAL", payload: false })}
      />
    </Box>
  );
};

export default CreateWorkoutPlan;
