// src/components/Statistics.js
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Box, Container, Typography, CircularProgress, Button } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseData, setExerciseData] = useState({});

  useEffect(() => {
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
          setLoading(false);
        }
      } catch (error) {
        setError('Failed to fetch statistics');
        console.error(error);
      }
    };

    fetchStats();
  }, []);

  // const getExerciseData = (exercise) => {
  //   const filteredData = stats.filter((stat) => stat.exercise === exercise);
  //   setExerciseData(filteredData);
  // };

  const renderGraph = (exercise) => {
    if (!exerciseData.length) {
      return null;
    }

    const data = {
      labels: exerciseData.map((data) => data.date),
      datasets: [
        {
          label: 'Weight',
          data: exerciseData.map((data) => data.weight),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Volume',
          data: exerciseData.map((data) => data.volume),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        },
        {
          label: 'Reps',
          data: exerciseData.map((data) => data.reps),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
        },
      ],
    };

    return <Bar data={data} />;
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
      </Container>);
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Statistics
      </Typography>
      <Typography variant="h6">Select an exercise:</Typography>
      <Button onClick={() => setSelectedExercise('Deadlift')}>Deadlift</Button>
      <Button onClick={() => setSelectedExercise('Bench Press')}>Bench Press</Button>
      <Button onClick={() => setSelectedExercise('Back Squat')}>Back Squat</Button>
      <Button onClick={() => setSelectedExercise('Hip Thrust')}>Hip Thrust</Button>
      {/* Add more buttons for other exercises */}
      {selectedExercise && (
        <div>
          <Typography variant="h5">{selectedExercise}</Typography>
          {renderGraph(selectedExercise)}
        </div>
      )}
    </Box>
  );
};

export default Statistics;
