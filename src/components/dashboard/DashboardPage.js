import React, { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Box, CircularProgress, Button } from "@mui/material";
import { auth, firestore } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import axios from "axios";
import Statistics from "../statistics/Statistics";
import { useFitbit } from "../../context/FitbitContext";
import DashboardWorkoutSchedule from "./DashboardWorkoutSchedule";
import DashboardProgressStats from "./DashboardProgressStats";

// Reducer for managing state
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case "SET_WORKOUTS":
      return { ...state, todayWorkouts: action.payload };
    case "SET_WORKOUT_NAMES":
      return { ...state, workoutNames: action.payload };
    case "SET_FITBIT_DATA":
      return {
        ...state,
        fitbitData: { ...state.fitbitData, ...action.payload },
      };
    case "SET_LOADING_FIREBASE":
      return { ...state, loadingFirebase: action.payload };
    case "SET_LOADING_FITBIT":
      return { ...state, loadingFitbit: action.payload };
    default:
      return state;
  }
};

const DashboardPage = () => {
  const { fitbitToken } = useFitbit();
  const navigate = useNavigate();

  // Manage state using useReducer
  const [state, dispatch] = useReducer(dashboardReducer, {
    todayWorkouts: [],
    workoutNames: {},
    fitbitData: {},
    loadingFirebase: true,
    loadingFitbit: fitbitToken ? true : false,
  });

  // Fetch today's workouts & names
  useEffect(() => {
    const fetchTodayWorkouts = async () => {
      const user = auth.currentUser;
      if (!user) {
        dispatch({ type: "SET_LOADING_FIREBASE", payload: false });
        return;
      }

      const today = dayjs().format("YYYY-MM-DD");
      const q = query(
        collection(firestore, "scheduledWorkouts"),
        where("userId", "==", user.uid),
        where("date", "==", today)
      );
      const querySnapshot = await getDocs(q);
      const workouts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      dispatch({ type: "SET_WORKOUTS", payload: workouts });

      // Fetch all workout names in one go
      const workoutIds = [
        ...new Set(workouts.map((workout) => workout.workoutId)),
      ];
      if (workoutIds.length > 0) {
        const workoutPromises = workoutIds.map((id) =>
          getDocs(
            query(
              collection(firestore, "workoutPlans"),
              where("__name__", "==", id)
            )
          )
        );

        const workoutResults = await Promise.all(workoutPromises);
        const names = workoutResults.reduce((acc, snapshot, i) => {
          if (!snapshot.empty) {
            acc[workoutIds[i]] = snapshot.docs[0].data().name;
          }
          return acc;
        }, {});

        dispatch({ type: "SET_WORKOUT_NAMES", payload: names });
      }

      dispatch({ type: "SET_LOADING_FIREBASE", payload: false });
    };

    fetchTodayWorkouts();
  }, []);

  // Fetch Fitbit data (only if token exists)
  useEffect(() => {
    if (!fitbitToken) {
      dispatch({ type: "SET_LOADING_FITBIT", payload: false }); // ✅ Mark Fitbit loading as complete if no token
      return;
    }

    const fetchFitbitData = async () => {
      try {
        const [stepRes, sleepRes, bodyRes, hrRes, calorieRes] =
          await Promise.all([
            axios.get(
              `https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            ),
            axios.get(
              `https://api.fitbit.com/1.2/user/-/sleep/date/today.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            ),
            axios.get(
              `https://api.fitbit.com/1/user/-/body/log/weight/date/today.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            ),
            axios.get(
              `https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            ),
            axios.get(
              `https://api.fitbit.com/1/user/-/activities/calories/date/today/1d.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            ),
          ]);

        dispatch({
          type: "SET_FITBIT_DATA",
          payload: {
            stepCount: stepRes.data["activities-steps"][0]?.value || "...",
            sleepData: `${Math.floor(
              sleepRes.data.summary.totalMinutesAsleep / 60
            )}hrs ${sleepRes.data.summary.totalMinutesAsleep % 60}min`,
            bodyWeight: bodyRes.data.weight[0]?.weight || "...",
            bodyFat: bodyRes.data.weight[0]?.fat || "...",
            restingHR:
              hrRes.data["activities-heart"][0]?.value.restingHeartRate ||
              "...",
            caloricBurn:
              calorieRes.data["activities-calories"][0]?.value || "...",
          },
        });
      } catch (error) {
        console.error("Error fetching Fitbit data:", error);
      } finally {
        dispatch({ type: "SET_LOADING_FITBIT", payload: false }); // ✅ Mark Fitbit loading as complete
      }
    };

    fetchFitbitData();
  }, [fitbitToken]);

  // ✅ Ensure the page loads even if Fitbit data fails
  if (state.loadingFirebase) return <CircularProgress />;

  return (
    <Box p={3} className="dashboard-container">
      <Typography variant="h4" gutterBottom className="dashboard-heading">
        Dashboard
      </Typography>

      {/* Today's Schedule */}
      <DashboardWorkoutSchedule
        workouts={state.todayWorkouts}
        workoutNames={state.workoutNames}
      />

      {/* Quick Links - Brought Back */}
      <Box mb={4}>
        <Typography variant="h6" className="section-heading">
          Quick Links
        </Typography>
        <Box className="quick-links-container">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/create-workout-plan")}
          >
            Create Workout
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/log-exercise")}
          >
            Log Exercise
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/exercise-library")}
          >
            Exercise Library
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/generate-workout-plan")}
          >
            Generate Workout
          </Button>
        </Box>
      </Box>

      {/* My Progress (Only show if Fitbit is connected) */}
      {!fitbitToken || state.loadingFitbit ? (
        <Typography variant="h6">Fitbit data unavailable</Typography>
      ) : (
        <DashboardProgressStats fitbitData={state.fitbitData} />
      )}

      {/* Statistics */}
      <Statistics />
    </Box>
  );
};

export default DashboardPage;
