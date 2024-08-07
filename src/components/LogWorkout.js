// src/components/LogWorkout.js
import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';

const LogWorkout = () => {
  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const workoutDoc = await firestore.collection('scheduledWorkouts').doc('workoutId').get();
      setWorkout(workoutDoc.data());
    };

    fetchWorkout();
  }, []);

  const handleLog = async (exerciseIndex, reps, weight) => {
    const newExercises = [...workout.exercises];
    newExercises[exerciseIndex].reps = reps;
    newExercises[exerciseIndex].weight = weight;
    await firestore.collection('scheduledWorkouts').doc('workoutId').update({
      exercises: newExercises,
    });
  };

  if (!workout) return <div>Loading...</div>;

  return (
    <div>
      {workout.exercises.map((exercise, index) => (
        <div key={index}>
          <h3>{exercise.name}</h3>
          <input type="number" placeholder="Reps" onChange={(e) => handleLog(index, e.target.value, exercise.weight)} />
          <input type="number" placeholder="Weight" onChange={(e) => handleLog(index, exercise.reps, e.target.value)} />
        </div>
      ))}
    </div>
  );
};

export default LogWorkout;
