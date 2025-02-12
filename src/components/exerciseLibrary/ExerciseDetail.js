import React, { useEffect, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { firestore, auth } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Reducer for managing state
const exerciseReducer = (state, action) => {
  switch (action.type) {
    case "SET_EXERCISE":
      return { ...state, exerciseData: action.payload, loading: false };
    case "SET_STATS":
      return { ...state, statsData: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const ExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  // Manage state using useReducer
  const [state, dispatch] = useReducer(exerciseReducer, {
    exerciseData: null,
    statsData: [],
    loading: true,
    error: null,
  });

  // Fetch Exercise & Stats Data in Parallel
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const exerciseDocRef = doc(firestore, "exercises", exerciseId);
        const statsQuery = query(
          collection(firestore, "exerciseStats"),
          where("exerciseId", "==", exerciseId),
          where("userId", "==", user.uid)
        );

        const [exerciseDocSnap, statsQuerySnapshot] = await Promise.all([
          getDoc(exerciseDocRef),
          getDocs(statsQuery),
        ]);

        if (exerciseDocSnap.exists()) {
          dispatch({ type: "SET_EXERCISE", payload: exerciseDocSnap.data() });
        } else {
          dispatch({ type: "SET_ERROR", payload: "Exercise not found" });
        }

        const stats = statsQuerySnapshot.docs.map((doc) => doc.data());
        dispatch({ type: "SET_STATS", payload: stats });
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load exercise data",
        });
      }
    };

    fetchExerciseData();
  }, [exerciseId]);

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  const { exerciseData, statsData } = state;

  // Prepare Data for Line Chart
  const prepareChartData = () => {
    const groupedData = statsData.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date] || entry.metric > acc[date].metric) {
        acc[date] = entry;
      }
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedData).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Metric (Weight x Reps)",
          data: sortedDates.map((date) => groupedData[date].metric),
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        },
        {
          label: "Est 1 Rep Max",
          data: sortedDates.map((date) =>
            Math.round(
              groupedData[date].weight * (36 / (37 - groupedData[date].reps))
            )
          ),
          borderColor: "rgb(255, 153, 255, 1)",
          fill: false,
        },
      ],
    };
  };

  // Render Historical Data
  const renderHistoricalData = () => {
    const sortedDates = [
      ...new Set(
        statsData.map((entry) => new Date(entry.date).toLocaleDateString())
      ),
    ].sort((a, b) => new Date(b) - new Date(a));

    return (
      <Box sx={{ maxHeight: 400, overflowY: "auto", mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Historical Data
        </Typography>
        {sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography variant="subtitle1">{date}</Typography>
            {statsData
              .filter(
                (entry) => new Date(entry.date).toLocaleDateString() === date
              )
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((entry, idx) => (
                <Box key={idx} sx={{ pl: 2 }}>
                  <Typography variant="body2">{`Set ${entry.setNumber}: ${entry.reps} x ${entry.weight} kg`}</Typography>
                </Box>
              ))}
            <Divider sx={{ mt: 2, mb: 2 }} />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", padding: 2, position: "relative" }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Box
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 100,
          pb: 2,
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={3}>
            <img
              src={`../${exerciseData.imageUrl}`}
              alt={exerciseData.name}
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </Grid>
          <Grid item xs={9}>
            <Typography variant="h4" gutterBottom>
              {exerciseData.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {exerciseData.muscleGroup}
            </Typography>
            <Typography
              dangerouslySetInnerHTML={{ __html: exerciseData.description }}
            ></Typography>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Progress Over Time
        </Typography>
        <Line data={prepareChartData()} />
      </Box>

      {renderHistoricalData()}
    </Box>
  );
};

export default ExerciseDetail;
