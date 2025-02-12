import React, { useEffect, useReducer } from "react";
import { auth, firestore } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

// Reducer for managing state
const scheduleReducer = (state, action) => {
  switch (action.type) {
    case "SET_SCHEDULED_DATES":
      return { ...state, scheduledDates: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SUCCESS":
      return { ...state, successMessage: action.payload };
    case "SET_WORKOUT_DATE":
      return { ...state, workoutDate: action.payload };
    default:
      return state;
  }
};

const ScheduleWorkout = ({ workoutId }) => {
  // Manage state using useReducer
  const [state, dispatch] = useReducer(scheduleReducer, {
    workoutDate: null,
    scheduledDates: [],
    loading: true,
    error: "",
    successMessage: "",
  });

  // Fetch Scheduled Workouts
  useEffect(() => {
    const fetchScheduledWorkouts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          dispatch({ type: "SET_ERROR", payload: "User not logged in" });
          return;
        }

        const q = query(
          collection(firestore, "scheduledWorkouts"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const dates = querySnapshot.docs.map((doc) => doc.data().date);

        dispatch({ type: "SET_SCHEDULED_DATES", payload: dates });
      } catch (error) {
        console.error("Error fetching scheduled workouts:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load scheduled workouts",
        });
      }
    };

    fetchScheduledWorkouts();
  }, []);

  // Handle Workout Scheduling
  const handleScheduleWorkout = async () => {
    if (!state.workoutDate) {
      dispatch({ type: "SET_ERROR", payload: "Please select a workout date." });
      return;
    }

    const formattedDate = dayjs(state.workoutDate).format("YYYY-MM-DD");
    if (state.scheduledDates.includes(formattedDate)) {
      dispatch({
        type: "SET_ERROR",
        payload: "You have already scheduled a workout for this date.",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(firestore, "scheduledWorkouts"), {
        date: formattedDate,
        workoutId,
        isComplete: false,
        userId: user.uid,
      });

      dispatch({ type: "SET_WORKOUT_DATE", payload: null });
      dispatch({
        type: "SET_SUCCESS",
        payload: `Successfully scheduled workout for ${formattedDate}`,
      });

      // Auto-clear success message after 3 seconds
      setTimeout(() => dispatch({ type: "SET_SUCCESS", payload: "" }), 3000);
    } catch (error) {
      console.error("Error scheduling workout:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to schedule workout. Please try again.",
      });
    }
  };

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Schedule Workout
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Workout Date"
          value={state.workoutDate}
          onChange={(date) =>
            dispatch({ type: "SET_WORKOUT_DATE", payload: date })
          }
          renderInput={(params) => (
            <TextField {...params} fullWidth margin="normal" />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleScheduleWorkout}
          sx={{ marginTop: 2 }}
        >
          Schedule Workout
        </Button>
      </LocalizationProvider>

      {state.successMessage && (
        <Alert severity="success" sx={{ marginTop: 2 }}>
          {state.successMessage}
        </Alert>
      )}
    </Box>
  );
};

export default ScheduleWorkout;
