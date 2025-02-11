import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  Grid,
  Modal,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { Add } from "@mui/icons-material";
import ExerciseLibrary from "./ExerciseLibrary";
import "./styles/Statistics.css";

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([
    "Deadlift",
    "Bench Press",
    "Back Squat",
    "Hip Thrust",
  ]);
  const [exerciseData, setExerciseData] = useState({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(firestore, "exerciseStats"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push(doc.data());
          });
          setStats(data);
        }
      } catch (error) {
        setError("Failed to fetch statistics");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (stats.length > 0) {
        const exerciseDataPromises = selectedExercises.map(async (exercise) => {
          const exerciseData = await getExerciseData(exercise);
          return { [exercise]: exerciseData };
        });

        const resolvedExerciseData = await Promise.all(exerciseDataPromises);
        const mergedExerciseData = resolvedExerciseData.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {}
        );
        setExerciseData(mergedExerciseData);
      }
    };

    if (!loading && stats.length > 0) {
      fetchExerciseData();
    }
  }, [stats, selectedExercises, loading]);

  const getExerciseData = async (exerciseName) => {
    const exerciseDoc = await getExerciseDocByName(exerciseName);
    if (!exerciseDoc) return;

    const filteredData = stats.filter(
      (stat) => stat.exerciseId === exerciseDoc.id
    );
    return filteredData;
  };

  const getExerciseDocByName = async (name) => {
    const q = query(
      collection(firestore, "exercises"),
      where("name", "==", name)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0];
    }
    return null;
  };

  const calculateStats = (exerciseData) => {
    if (!exerciseData || exerciseData.length === 0) return {};

    const maxWeight = Math.max(...exerciseData.map((data) => data.weight));
    const maxVolume = Math.max(...exerciseData.map((data) => data.volume));

    const mostRecentData = exerciseData[exerciseData.length - 1];
    const estimated1RM = Math.round(
      mostRecentData.weight * (36 / (37 - mostRecentData.reps))
    );

    return { maxWeight, maxVolume, estimated1RM };
  };

  const renderGraph = (exerciseName) => {
    if (
      !exerciseData[exerciseName] ||
      exerciseData[exerciseName].length === 0
    ) {
      return (
        <Typography variant="body2">
          No data available for {exerciseName}
        </Typography>
      );
    }

    const groupedData = exerciseData[exerciseName].reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();

      if (!acc[date] || entry.metric > acc[date].metric) {
        acc[date] = entry;
      }

      return acc;
    }, {});

    const sortedDates = Object.keys(groupedData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    const data = {
      labels: sortedDates,
      datasets: [
        {
          label: "Metric (Weight x reps)",
          data: sortedDates.map((date) => groupedData[date].metric),
          fill: false,
          borderColor: "rgba(75, 192, 192, 1)",
          yAxisID: "y-axis-metric",
          cubicInterpolationMode: "monotone",
        },
        {
          label: "Est 1 Rep Max",
          data: sortedDates.map((date) =>
            Math.round(
              groupedData[date].weight * (36 / (37 - groupedData[date].reps))
            )
          ),
          fill: false,
          borderColor: "rgb(255, 153, 255, 1)",
          yAxisID: "y-axis-weight",
          cubicInterpolationMode: "monotone",
        },
      ],
    };

    const options = {
      scales: {
        yAxes: [
          {
            id: "y-axis-metric",
            type: "linear",
            position: "left",
            ticks: {
              beginAtZero: true,
            },
            scaleLabel: {
              display: true,
              labelString: "Metric (Weight x reps)",
            },
          },
          {
            id: "y-axis-weight",
            type: "linear",
            position: "right",
            ticks: {
              beginAtZero: true,
            },
            scaleLabel: {
              display: true,
              labelString: "Max Weight (kg)",
            },
          },
        ],
      },
    };

    return <Line data={data} options={options} />;
  };

  const handleAddExercise = async (exercise) => {
    const exerciseName = exercise.name;
    if (!selectedExercises.includes(exerciseName)) {
      const exerciseData = await getExerciseData(exerciseName);
      setExerciseData((prevData) => ({
        ...prevData,
        [exerciseName]: exerciseData,
      }));
      setSelectedExercises([...selectedExercises, exerciseName]);
    }
    setIsLibraryOpen(false);
  };

  const renderStatsGrid = (exerciseName) => {
    const stats = calculateStats(exerciseData[exerciseName]);
    if (!stats) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">
              Max Weight: {stats.maxWeight} kg
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">
              Max Volume: {stats.maxVolume}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box alignItems="center" display="flex" className="progress-box">
            <Typography variant="body1">
              Estimated 1RM: {stats.estimated1RM} kg
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Statistics
        </Typography>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Statistics
      </Typography>
      <Typography variant="h6">Select an exercise:</Typography>
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

      <Box>
        {selectedExercises.map((exercise) => (
          <Box className="containing-box" key={exercise}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                {exercise}
              </Typography>
              {renderGraph(exercise)}
              {renderStatsGrid(exercise)}
            </Grid>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Statistics;
