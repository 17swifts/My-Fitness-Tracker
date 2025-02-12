import React, { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { auth, firestore } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import WorkoutPlanList from "./WorkoutPlanList";

const workoutPlansReducer = (state, action) => {
  switch (action.type) {
    case "SET_PLANS":
      return { ...state, workoutPlans: action.payload, loading: false };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "REMOVE_PLAN":
      return {
        ...state,
        workoutPlans: state.workoutPlans.filter(
          (plan) => plan.id !== action.payload
        ),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const WorkoutPlans = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(workoutPlansReducer, {
    workoutPlans: [],
    search: "",
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          dispatch({ type: "SET_ERROR", payload: "User not logged in" });
          return;
        }

        const q = query(
          collection(firestore, "workoutPlans"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        dispatch({ type: "SET_PLANS", payload: plans });
      } catch (error) {
        console.error("Error fetching workout plans:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to fetch workout plans",
        });
      }
    };

    fetchWorkoutPlans();
  }, []);

  const handleDeletePlan = async (planId) => {
    try {
      await deleteDoc(doc(firestore, "workoutPlans", planId));
      dispatch({ type: "REMOVE_PLAN", payload: planId });
    } catch (error) {
      console.error("Error deleting workout plan:", error);
    }
  };

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Workout Plans
      </Typography>

      {/* Quick Actions */}
      <Box mb={2} display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate("/create-workout-plan")}
        >
          Create New Plan
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/generate-workout-plan")}
        >
          Generate Workout
        </Button>
      </Box>

      {/* Search Input */}
      <TextField
        label="Search Plans"
        value={state.search}
        onChange={(e) =>
          dispatch({ type: "SET_SEARCH", payload: e.target.value })
        }
        fullWidth
        margin="normal"
      />

      {/* Workout Plans List */}
      <WorkoutPlanList
        workoutPlans={state.workoutPlans}
        search={state.search}
        handleDeletePlan={handleDeletePlan}
        navigate={navigate}
      />
    </Box>
  );
};

export default WorkoutPlans;
