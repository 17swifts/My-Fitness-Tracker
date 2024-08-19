import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Box, Container, Typography, CircularProgress, Button, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Add } from '@mui/icons-material';
import Chart from 'chart.js/auto';
import ExerciseLibrary from './ExerciseLibrary';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState(['Deadlift', 'Bench Press', 'Back Squat', 'Hip Thrust']);
  const [exerciseData, setExerciseData] = useState({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [selectedExercises]);

  const fetchStats = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(firestore, 'exerciseStats'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
        setStats(data);
        for (const exercise of selectedExercises) {
          const exerciseData = await getExerciseData(exercise);
          setExerciseData((prevData) => ({ ...prevData, [exercise]: exerciseData }));
        }
        console.log(exerciseData);
        setLoading(false);
      }
    } catch (error) {
      setError('Failed to fetch statistics');
      console.error(error);
    }
  };

  const getExerciseData = async (exerciseName) => {
    const exerciseDoc = await getExerciseDocByName(exerciseName);
    if (!exerciseDoc) return;

    const filteredData = stats.filter((stat) => stat.exerciseId === exerciseDoc.id);
    return filteredData;
  };

  const getExerciseDocByName = async (name) => {
    const q = query(collection(firestore, 'exercises'), where('name', '==', name));
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
    const estimated1RM = mostRecentData.weight * (36 / (37 - mostRecentData.reps));

    return { maxWeight, maxVolume, estimated1RM };
  };

  const renderGraph = (exerciseName) => {
    if (!exerciseData[exerciseName] || exerciseData[exerciseName].length === 0) {
      return null;
    }

    const data = {
      labels: exerciseData[exerciseName].map((data) => new Date(data.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Metric',
          data: exerciseData[exerciseName].map((data) => data.metric),
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
        },
      ],
    };

    return <Line data={data} />;
  };

  const handleAddExercise = async (exercise) => {
    const exerciseName = exercise.name;
    if (!selectedExercises.includes(exerciseName)) {
      const exerciseData = await getExerciseData(exerciseName);
      setExerciseData((prevData) => ({ ...prevData, [exerciseName]: exerciseData }));
      setSelectedExercises([...selectedExercises, exerciseName]);
    }
    setIsLibraryOpen(false);
  };

  const renderStatsGrid = (exerciseName) => {
    const stats = calculateStats(exerciseData[exerciseName]);
    console.log(stats);
    if (!stats) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="body1">Max Weight: {stats.maxWeight} kg</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">Max Volume: {stats.maxVolume}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">Estimated 1RM: {stats.estimated1RM} kg</Typography>
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
      <Grid container spacing={4}>
        {selectedExercises.map((exercise) => (
          <Grid item xs={12} md={6} key={exercise}>
            <Typography variant="h5" gutterBottom>
              {exercise}
            </Typography>
            {renderGraph(exercise)}
            {renderStatsGrid(exercise)}
          </Grid>
        ))}
      </Grid>
      {isLibraryOpen && (
        <ExerciseLibrary onSelectExercise={handleAddExercise} onClose={() => setIsLibraryOpen(false)} />
      )}
    </Box>
  );
};

export default Statistics;
